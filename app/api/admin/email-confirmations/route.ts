import { NextRequest, NextResponse } from "next/server";
import { createServerActionClient } from "@/lib/supabase/server";
import { getServerAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email";
import { welcomeHtml, welcomeHtmlAgency } from "@/lib/email-templates/welcome";

export const dynamic = "force-dynamic";

async function ensureAdmin(supabase: ReturnType<typeof createServerActionClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") return null;
  return user;
}

type StatusFilter = "all" | "pending" | "failed";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerActionClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin" && profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let admin;
    try {
      admin = getServerAdminClient();
    } catch {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }
    const { searchParams } = new URL(request.url);
    const statusFilter = (searchParams.get("status") as StatusFilter) || "all";
    const sortBy = searchParams.get("sort") || "registration_date";
    const sortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";

    // Unconfirmed: confirmation_links where used = false
    const { data: links, error: linksError } = await admin
      .from("confirmation_links")
      .select("id, user_id, email, confirmation_url, expires_at, created_at")
      .eq("used", false)
      .order("created_at", { ascending: sortOrder === "asc" });

    if (linksError) {
      console.error("[admin email-confirmations] links error:", linksError);
      return NextResponse.json(
        { error: "Failed to fetch confirmation links" },
        { status: 500 }
      );
    }

    if (!links?.length) {
      return NextResponse.json({ rows: [] });
    }

    const userIds = [...new Set(links.map((l) => l.user_id))];

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email, full_name, email_resend_count, last_resend_at")
      .in("id", userIds);

    const { data: logs } = await admin
      .from("email_confirmation_logs")
      .select("user_id, attempt_count, last_attempt_at, status, error_message")
      .in("user_id", userIds)
      .order("last_attempt_at", { ascending: false });

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);
    const latestLogByUser = new Map<string | null, (typeof logs)[0]>();
    logs?.forEach((log) => {
      if (log.user_id && !latestLogByUser.has(log.user_id)) {
        latestLogByUser.set(log.user_id, log);
      }
    });

    const rows = links.map((link) => {
      const profileRow = profileMap.get(link.user_id);
      const logRow = latestLogByUser.get(link.user_id);
      const status =
        logRow?.status ?? (link.expires_at && new Date(link.expires_at) < new Date() ? "expired" : "pending");
      return {
        user_id: link.user_id,
        email: link.email ?? profileRow?.email ?? "",
        registration_date: link.created_at,
        attempt_count: profileRow?.email_resend_count ?? logRow?.attempt_count ?? 0,
        last_attempt_at: profileRow?.last_resend_at ?? logRow?.last_attempt_at ?? null,
        status,
        error_message: logRow?.error_message ?? null,
        link_id: link.id,
        expires_at: link.expires_at,
      };
    });

    let filtered = rows;
    if (statusFilter === "pending") {
      filtered = rows.filter((r) => r.status === "pending" || r.status === "sent");
    } else if (statusFilter === "failed") {
      filtered = rows.filter((r) => r.status === "failed");
    }

    if (sortBy === "registration_date") {
      filtered.sort((a, b) => {
        const da = new Date(a.registration_date).getTime();
        const db = new Date(b.registration_date).getTime();
        return sortOrder === "asc" ? da - db : db - da;
      });
    }

    return NextResponse.json({ rows: filtered });
  } catch (err) {
    console.error("[admin email-confirmations] error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerActionClient(cookieStore);
    const adminUser = await ensureAdmin(supabase);
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let admin;
    try {
      admin = getServerAdminClient();
    } catch {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const action = body?.action;

    if (action === "resend") {
      const userIds = Array.isArray(body.userIds) ? body.userIds : body.userId ? [body.userId] : [];
      if (!userIds.length) {
        return NextResponse.json(
          { error: "userIds or userId required" },
          { status: 400 }
        );
      }

      const results: { userId: string; success: boolean; error?: string }[] = [];

      for (const userId of userIds) {
        const { data: link } = await admin
          .from("confirmation_links")
          .select("id, user_id, email, confirmation_url")
          .eq("user_id", userId)
          .eq("used", false)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!link) {
          results.push({ userId, success: false, error: "No pending link" });
          continue;
        }

        const { data: profileRow } = await admin
          .from("profiles")
          .select("full_name, role, email_resend_count")
          .eq("id", userId)
          .single();

        const displayName =
          profileRow?.full_name?.trim().split(/\s+/)[0] ?? "there";
        const role =
          profileRow?.role?.toLowerCase() === "agency" ? "agency" : "volunteer";
        const subject =
          role === "agency"
            ? "Confirm Your DiasporaBase Agency Account (Resent by Admin)"
            : "Confirm your DiasporaBase account (Resent by Admin)";
        const html =
          role === "agency"
            ? welcomeHtmlAgency(displayName, link.confirmation_url, { serverEscape: true })
            : welcomeHtml(displayName, link.confirmation_url, { serverEscape: true });

        try {
          await sendEmail({
            to: link.email,
            subject,
            html,
          });
          const now = new Date().toISOString();
          const currentCount = Number((profileRow as { email_resend_count?: number })?.email_resend_count) || 0;
          await admin.from("profiles").update({
            last_resend_at: now,
            email_resend_count: currentCount + 1,
          }).eq("id", userId);
          await admin.from("email_confirmation_logs").insert({
            user_id: userId,
            email: link.email,
            last_attempt_at: now,
            status: "sent",
            updated_at: now,
          });
          results.push({ userId, success: true });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Send failed";
          const now = new Date().toISOString();
          await admin.from("email_confirmation_logs").insert({
            user_id: userId,
            email: link.email,
            status: "failed",
            error_message: msg,
            last_attempt_at: now,
            updated_at: now,
          });
          results.push({ userId, success: false, error: msg });
        }
      }

      return NextResponse.json({ results });
    }

    if (action === "mark_invalid") {
      const userId = body.userId;
      if (!userId) {
        return NextResponse.json(
          { error: "userId required" },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();
      await admin.from("email_confirmation_logs").insert({
        user_id: userId,
        email: body.email ?? null,
        status: "invalid_email",
        last_attempt_at: now,
        updated_at: now,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "action must be resend or mark_invalid" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[admin email-confirmations] POST error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
