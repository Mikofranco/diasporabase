import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "./lib/supabase/middleware";
import { routes } from "./lib/routes";

/** Dashboard path prefixes that require an authenticated session */
const DASHBOARD_PREFIXES = [
  "/super-admin/",
  "/admin/",
  "/agency/",
  "/volunteer/",
];

function isDashboardRoute(path: string): boolean {
  return DASHBOARD_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export async function middleware(req: NextRequest) {
  const { supabase, response } = await createMiddlewareClient(req);

  // Use getUser() to validate the session (getSession() can return stale data)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;

  // Allow public routes
  if (
    path === routes.home ||
    path === routes.generalProjectsView ||
    path.startsWith("/auth/") ||
    path.startsWith("/api/")
  ) {
    return response;
  }

  // Allow other public pages (login, register, confirm, etc.)
  const publicPaths = [
    routes.login,
    routes.registerAgency,
    routes.registerVolunteer,
    routes.forgotPassword,
    routes.confirmation,
    routes.confirmEmail,
    "/confirm",
    "/confirm-email",
    "/reset-password",
    "/forgot-password",
    "/register-super-admin",
    "/approval-pending",
    "/onboarding",
    "/opportunities",
    "/post-projects",
    "/about-us",
    "/contact",
    "/help",
    "/learn-more",
    "/privacy",
    "/terms",
    "/cookies",
    "/report",
    "/accessibility",
    "/safety",
    "/success-stories",
  ];
  const isPublicPath =
    publicPaths.includes(path) ||
    path.startsWith("/projects") ||
    path.startsWith("/auth/");

  if (isPublicPath && !isDashboardRoute(path)) {
    return response;
  }

  // Require session for dashboard routes
  if (isDashboardRoute(path) && !user) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = routes.login;
    return NextResponse.redirect(redirectUrl);
  }

  if (!user) {
    return response;
  }

  // Fetch user role for redirects
  let userRole: string | null = null;
  try {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData?.role) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = routes.login;
      return NextResponse.redirect(redirectUrl);
    }
    userRole = profileData.role;
  } catch {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = routes.login;
    return NextResponse.redirect(redirectUrl);
  }

  const roleToPath: Record<string, string> = {
    super_admin: "super-admin",
    admin: "admin",
    agency: "agency",
    volunteer: "volunteer",
  };
  const rolePath = roleToPath[userRole] || userRole;

  // If logged in and accessing auth pages, redirect to their dashboard
  if (
    path === routes.login ||
    path === routes.registerAgency ||
    path === routes.registerVolunteer
  ) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `/${rolePath}/dashboard`;
    return NextResponse.redirect(redirectUrl);
  }

  if (path === routes.dashboard) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `/${rolePath}/dashboard`;
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
