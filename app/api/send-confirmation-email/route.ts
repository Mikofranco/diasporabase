import { NextRequest, NextResponse } from "next/server";
import { createServerActionClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email";
import { welcomeHtml, welcomeHtmlAgency } from "@/lib/email-templates/welcome";
import { SUPABASE_URL } from "@/lib/supabase/constants";

export const dynamic = "force-dynamic";

const RESEND_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(String(email).trim()) && email.length <= 255;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createServerActionClient(cookieStore);

    // Resolve user and latest confirmation link by email
    const { data: links, error: linksError } = await supabase
      .from("confirmation_links")
      .select("id, user_id, email, confirmation_url, expires_at, used")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (linksError) {
      console.error("[send-confirmation-email] links error:", linksError);
      return NextResponse.json(
        { error: "Failed to look up confirmation" },
        { status: 500 }
      );
    }

    const link = links?.[0];
    if (!link) {
      return NextResponse.json(
        { error: "No pending confirmation found for this email" },
        { status: 404 }
      );
    }

    if (link.used) {
      return NextResponse.json(
        { error: "This email has already been confirmed" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (new Date(link.expires_at) < now) {
      return NextResponse.json(
        { error: "Confirmation link has expired" },
        { status: 400 }
      );
    }

    // Rate limit: check profile last_resend_at (use service role if available so we can read/update any profile)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = serviceKey
      ? createClient(SUPABASE_URL, serviceKey)
      : supabase;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("last_resend_at, email_resend_count")
      .eq("id", link.user_id)
      .single();

    const lastResend = profile?.last_resend_at
      ? new Date(profile.last_resend_at).getTime()
      : 0;
    if (Date.now() - lastResend < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - lastResend)) / 1000);
      return NextResponse.json(
        {
          error: "rate_limit",
          message: `Please wait ${waitSec} seconds before requesting another email`,
          retryAfter: waitSec,
        },
        { status: 429 }
      );
    }

    // Resolve display name and role for email body
    let displayName = "there";
    let role: "volunteer" | "agency" = "volunteer";
    const { data: profileRow } = await supabaseAdmin
      .from("profiles")
      .select("full_name, role")
      .eq("id", link.user_id)
      .single();
    if (profileRow?.full_name) {
      const parts = String(profileRow.full_name).trim().split(/\s+/);
      displayName = parts[0] ?? "there";
    }
    if (profileRow?.role && String(profileRow.role).toLowerCase() === "agency") {
      role = "agency";
    }

    const confirmationUrl = link.confirmation_url;
    const subject =
      role === "agency"
        ? "Confirm Your DiasporaBase Agency Account (Resent)"
        : "Confirm your DiasporaBase account (Resent)";
    const html =
      role === "agency"
        ? welcomeHtmlAgency(displayName, confirmationUrl, { serverEscape: true })
        : welcomeHtml(displayName, confirmationUrl, { serverEscape: true });

    let sendStatus: "sent" | "failed" = "sent";
    let errorMessage: string | null = null;

    try {
      await sendEmail({ to: email, subject, html });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errorMessage = msg;
      sendStatus = "failed";
      console.error("[send-confirmation-email] SMTP error:", err);

      // Log to email_confirmation_logs
      await supabaseAdmin.from("email_confirmation_logs").insert({
        user_id: link.user_id,
        email,
        attempt_count: (profile?.email_resend_count ?? 0) + 1,
        last_attempt_at: now.toISOString(),
        status: "failed",
        error_message: errorMessage,
        updated_at: now.toISOString(),
      });

      return NextResponse.json(
        { error: "Failed to send email", details: msg },
        { status: 500 }
      );
    }

    // Update profile: last_resend_at, email_resend_count
    const newCount = (profile?.email_resend_count ?? 0) + 1;
    await supabaseAdmin
      .from("profiles")
      .update({
        last_resend_at: now.toISOString(),
        email_resend_count: newCount,
      })
      .eq("id", link.user_id);

    // Mark as resent in confirmation_links
    await supabaseAdmin
      .from("confirmation_links")
      .update({ is_resent: true })
      .eq("id", link.id);

    // Log success to email_confirmation_logs
    await supabaseAdmin.from("email_confirmation_logs").insert({
      user_id: link.user_id,
      email,
      attempt_count: newCount,
      last_attempt_at: now.toISOString(),
      status: sendStatus,
      error_message: null,
      updated_at: now.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Confirmation email sent successfully",
    });
  } catch (err) {
    console.error("[send-confirmation-email] unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
