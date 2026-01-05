// app/api/auth/direct-login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerActionClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createServerActionClient(cookieStore);

  try {
    // Step 1: Generate a temporary recovery/magic link (admin only)
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: "", // We don't need email — we have userId
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
    });

    if (error || !data.properties?.action_link) {
      console.error("Generate link failed:", error);
      return NextResponse.json({ error: "Failed to generate session" }, { status: 500 });
    }

    // Step 2: Extract token_hash from the generated link
    const url = new URL(data.properties.action_link);
    const token_hash = url.searchParams.get("token_hash");
    if (!token_hash) throw new Error("No token_hash in link");

    // Step 3: Immediately verify the OTP (logs user in)
    const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: "magiclink",
    });

    if (verifyError || !sessionData.session) {
      console.error("Verify OTP failed:", verifyError);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    // Step 4: Set session cookies — user is now logged in!
    const response = NextResponse.json({ success: true });

    response.cookies.set("sb-access-token", sessionData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionData.session.expires_in,
    });

    response.cookies.set("sb-refresh-token", sessionData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionData.session.expires_in,
    });

    return response;
  } catch (err) {
    console.error("Direct login error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}