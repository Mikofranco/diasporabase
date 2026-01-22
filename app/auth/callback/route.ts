import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerActionClient } from "@/lib/supabase/server"; // assuming this is your correct helper

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=no_auth_code`,
    );
  }

  const cookieStore = cookies();
  const supabase = createServerActionClient(cookieStore);

  try {
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) throw exchangeError;

    if (!data.session?.user) {
      throw new Error("No user after exchange");
    }

    // Fetch role & tax_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, tax_id")
      .eq("id", data.session.user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = profile.role;

    if (role === "super_admin" || role === "admin") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    }

    if (role === "agency") {
      if (!profile.tax_id || profile.tax_id === "") {
        return NextResponse.redirect(
          new URL("/onboarding/agency", request.url),
        );
      }
      return NextResponse.redirect(new URL("/dashboard/agency", request.url));
    }

    if (role === "volunteer") {
      return NextResponse.redirect(
        new URL("/dashboard/volunteer", request.url),
      );
    }

    // Fallback for unknown role
    return NextResponse.redirect(new URL("/login", request.url));
  } catch (err) {
    console.error("Callback processing error:", err);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=callback_failed`,
    );
  }
}
