import { NextRequest, NextResponse } from "next/server";
import { createServerActionClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("id");

  const { comment_text, tagged_users } = await request.json();

  const cookieStore = cookies();
  const supabase = createServerActionClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("project_comments")
    .insert({
      project_id: projectId,
      user_id: user.id,
      comment_text,
      tagged_users, // array of user IDs
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Optional: Notify tagged users (e.g., via email or realtime)
  if (tagged_users.length > 0) {
    // Use your useSendMail or Supabase realtime
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("id");

  const cookieStore = cookies();
  const supabase = createServerActionClient(cookieStore);

  const { data: comments, error } = await supabase
    .from("project_comments")
    .select(`
      id,
      comment_text,
      created_at,
      user:profiles (id, full_name, role),
      tagged_users:profiles (id, full_name)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(comments);
}