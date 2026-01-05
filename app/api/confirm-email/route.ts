// app/api/confirm-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptJWT, encryptUserToJWT } from "@/lib/jwt";
import { createServerActionClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    console.log("Confirm email request received");
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/confirm?status=invalid", request.url));
  }

  try {
    const payload = await decryptJWT(token);

    if (payload.purpose !== "email_confirmation") {
      return NextResponse.redirect(new URL("/confirm?status=invalid", request.url));
    }

    const userId = payload.userId;
    const email = payload.email;

    const cookieStore = cookies();
    const supabase = createServerActionClient(cookieStore);

    // Validate link in DB
    const { data: links } = await supabase
      .from("confirmation_links")
      .select("id, used, expires_at")
      .eq("token_hash", token);

    if (!links || links.length === 0) {
      return NextResponse.redirect(new URL("/confirm?status=invalid", request.url));
    }

    const link = links[0];

    if (link.used || new Date() > new Date(link.expires_at)) {
      return NextResponse.redirect(new URL("/confirm?status=expired", request.url));
    }

    // Mark as used
    await supabase
      .from("confirmation_links")
      .update({ used: true, clicked_at: new Date().toISOString() })
      .eq("id", link.id);

    // Confirm email
    const { data: profile } = await supabase
      .from("profiles")
      .update({ email_confirmed: true })
      .eq("id", userId)
      .select("role")
      .single();

    // Generate a short-lived login token (5 minutes)
    const loginToken = await encryptUserToJWT({
      userId,
      email,
      purpose: "direct_login",
    }, "5m");

    // Redirect to confirm page with login token
    const redirectUrl = new URL("/confirm", request.url);
    redirectUrl.searchParams.set("status", "success");
    redirectUrl.searchParams.set("loginToken", loginToken);

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("Confirmation error:", err);
    return NextResponse.redirect(new URL("/confirm?status=error", request.url));
  }
}