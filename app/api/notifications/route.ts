import { NextRequest, NextResponse } from "next/server";
import { createServerActionClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerActionClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isAdmin = searchParams.get("isAdmin") === "true";

  try {
    let query = supabase
      .from("notifications")
      .select("id, message, type, related_id, created_at, is_read")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (isAdmin) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role === "admin" || profile?.role === "super_admin") {
        query = query.in("type", ["new_agency", "new_project"]);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
