import { NextRequest, NextResponse } from "next/server";
import { createServerActionClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_COMMENT_LENGTH = 5000;
const MAX_TAGGED_USERS = 20;

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("id");
  if (!projectId || !UUID_REGEX.test(projectId)) {
    return NextResponse.json({ error: "Valid project id required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const comment_text =
    typeof (body as { comment_text?: unknown }).comment_text === "string"
      ? (body as { comment_text: string }).comment_text.trim()
      : "";
  const rawTagged = (body as { tagged_users?: unknown }).tagged_users;
  const tagged_users = Array.isArray(rawTagged)
    ? rawTagged
        .filter((id): id is string => typeof id === "string" && UUID_REGEX.test(id))
        .slice(0, MAX_TAGGED_USERS)
    : [];

  if (!comment_text || comment_text.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: "Comment text required and must be under " + MAX_COMMENT_LENGTH + " characters" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerActionClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("project_comments")
    .insert({
      project_id: projectId,
      user_id: user.id,
      comment_text,
      tagged_users,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("id");
  if (!projectId || !UUID_REGEX.test(projectId)) {
    return NextResponse.json({ error: "Valid project id required" }, { status: 400 });
  }

  const cookieStore = await cookies();
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