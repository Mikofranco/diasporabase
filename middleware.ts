import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.log("No session found, user is not authenticated.");
  } else {
    console.log("Session found:", session);
  }

  const path = req.nextUrl.pathname;

  // Allow public routes
  if (
    path === "/" ||
    path === "/projects" ||
    path.startsWith("/auth/callback")
  ) {
    return res;
  }

  // Define protected paths and their allowed roles
  const protectedPaths = {
    "/dashboard/admin": ["admin"],
    // "/dashboard/volunteer": ["volunteer"],
    // "/dashboard/agency": ["agency"],
  };

  // Check if the path is a protected dashboard route
  const isProtectedDashboardRoute = Object.keys(protectedPaths).some((prefix) =>
    path.startsWith(prefix)
  );

  // If no session, redirect to login for protected routes
  if (!session && isProtectedDashboardRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // If no session, allow access to non-protected routes
  if (!session) {
    return res;
  }

  // Fetch user role
  let userRole = null;
  try {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profileData?.role) {
      console.error(
        "Profile fetch error in middleware:",
        profileError?.message
      );
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/login";
      return NextResponse.redirect(redirectUrl); // Redirect to login if profile fetch fails
    }
    userRole = profileData.role;
  } catch (error) {
    console.error("Middleware profile fetch error:", error);
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // If logged in and accessing auth pages, redirect to their dashboard
  if (
    path === "/login" ||
    path === "/register-agency" ||
    path === "/register-volunteer"
  ) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `/dashboard/${userRole}`;
    return NextResponse.redirect(redirectUrl);
  }

  // Handle generic /dashboard redirect
  if (path === "/dashboard") {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `/dashboard/${userRole}`;
    return NextResponse.redirect(redirectUrl);
  }

  // Check role-based access for protected routes
  for (const prefix in protectedPaths) {
    if (path.startsWith(prefix)) {
      //@ts-ignore
      if (!protectedPaths[prefix].includes(userRole)) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = `/dashboard/${userRole}`;
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
