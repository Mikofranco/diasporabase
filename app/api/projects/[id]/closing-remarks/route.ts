import { NextRequest, NextResponse } from "next/server";
import { createServerActionClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("id");

  const { closing_remarks } = await request.json();

  const cookieStore = cookies();
  const supabase = createServerActionClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("projects")
    .update({ closing_remarks })
    .eq("id", projectId)
    .eq("pm_id", user.id); // Only PM can update

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}