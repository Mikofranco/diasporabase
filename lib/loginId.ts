import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminSupabase } from "./supabase/client";

/**
 * Logs in a user by their Supabase user ID (UUID)
 * Only for server-side use (e.g., admin tools, support)
 *
 * @param userId - Supabase auth.users ID (UUID string)
 * @returns success status and message
 */
export async function loginUserById(userId: string) {
  if (!userId || typeof userId !== "string") {
    return { success: false, error: "Invalid user ID" };
  }

  const supabase = adminSupabase();

  try {
    // Use Supabase service role to bypass RLS and get user
    const { data: authUser, error: fetchError } = await supabase.auth.admin.getUserById(userId);

    if (fetchError || !authUser?.user) {
      console.error("User not found:", fetchError);
      return { success: false, error: "User not found or invalid ID" };
    }

    // Create a session for this user (logs them in)
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      user_id: userId,
      expires_in: 60 * 60 * 24 * 7, // 7 days (adjust as needed)
    });

    if (sessionError || !sessionData.session) {
      console.error("Failed to create session:", sessionError);
      return { success: false, error: "Failed to create login session" };
    }

    // Set the session cookie so Next.js middleware recognizes the user
    const cookieStore = cookies();
    cookieStore.set("sb-access-token", sessionData.session.access_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionData.session.expires_in,
    });

    cookieStore.set("sb-refresh-token", sessionData.session.refresh_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionData.session.expires_in,
    });

    return { success: true, user: authUser.user };
  } catch (err) {
    console.error("Unexpected error during login by ID:", err);
    return { success: false, error: "Internal server error" };
  }
}