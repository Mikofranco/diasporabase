import { NextRequest, NextResponse } from "next/server";
import { createServerActionClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CLOSING_REMARKS_LENGTH = 10000;

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
  const closing_remarks =
    typeof (body as { closing_remarks?: unknown }).closing_remarks === "string"
      ? (body as { closing_remarks: string }).closing_remarks.trim()
      : "";
  if (closing_remarks.length > MAX_CLOSING_REMARKS_LENGTH) {
    return NextResponse.json(
      { error: "Closing remarks must be under " + MAX_CLOSING_REMARKS_LENGTH + " characters" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerActionClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("projects")
    .update({ closing_remarks })
    .eq("id", projectId)
    .eq("pm_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}