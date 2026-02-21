import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerActionClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/projects/[projectId]/volunteers
 * Returns the list of volunteers for a project by reading project_volunteers
 * then profiles. Uses service role server-side so RLS does not block.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

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

    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: pvRows, error: pvError } = await admin
      .from("project_volunteers")
      .select("volunteer_id, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (pvError) {
      console.error("[admin project volunteers] project_volunteers error:", pvError);
      return NextResponse.json(
        { error: "Failed to fetch project volunteers" },
        { status: 500 }
      );
    }

    if (!pvRows?.length) {
      return NextResponse.json({ volunteers: [] });
    }

    const volunteerIds = pvRows.map((r) => r.volunteer_id);
    const { data: profileRows, error: profileError } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", volunteerIds);

    if (profileError) {
      console.error("[admin project volunteers] profiles error:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch volunteer profiles" },
        { status: 500 }
      );
    }

    const profileById = new Map(
      (profileRows || []).map((p: { id: string; full_name?: string; email?: string }) => [p.id, p])
    );

    const volunteers = pvRows.map((r) => {
      const profile = profileById.get(r.volunteer_id);
      return {
        id: r.volunteer_id,
        full_name: profile?.full_name ?? "Anonymous",
        email: profile?.email ?? "",
        joined_at: r.created_at,
      };
    });

    return NextResponse.json({ volunteers });
  } catch (err) {
    console.error("[admin project volunteers]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
