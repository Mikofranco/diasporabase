// middleware.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  // Get the user from the session
  const { data: { user }, error: sessionError } = await supabase.auth.getUser();

  if (sessionError) {
    console.error('Middleware auth error:', sessionError.message);
  }

  const path = req.nextUrl.pathname;

  // Allow public routes
  if (
    path === '/' ||
    path === '/projects' ||
    path.startsWith('/auth/callback')
  ) {
    return NextResponse.next();
  }

  // Define protected paths and their allowed roles
  const protectedPaths = {
    '/dashboard/admin': ['admin', 'super_admin'], // Include super_admin if applicable
    '/dashboard/volunteer': ['volunteer'],
    '/dashboard/agency': ['agency'],
  };

  // Check if the path is a protected dashboard route
  const isProtectedDashboardRoute = Object.keys(protectedPaths).some((prefix) =>
    path.startsWith(prefix)
  );

  // If no user, redirect to login for protected routes
  if (!user && isProtectedDashboardRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // If no user, allow access to non-protected routes
  if (!user) {
    return NextResponse.next();
  }

  // Fetch user role
  let userRole = null;
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData?.role) {
      console.error('Profile fetch error in middleware:', profileError?.message);
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/login';
      return NextResponse.redirect(redirectUrl);
    }
    userRole = profileData.role;
  } catch (error) {
    console.error('Middleware profile fetch error:', error);
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // If logged in and accessing auth pages, redirect to their dashboard
  if (
    path === '/login' ||
    path === '/register-agency' ||
    path === '/register-volunteer'
  ) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `/dashboard/${userRole}`;
    return NextResponse.redirect(redirectUrl);
  }

  // Handle generic /dashboard redirect
  if (path === '/dashboard') {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `/dashboard/${userRole}`;
    return NextResponse.redirect(redirectUrl);
  }

  // Check role-based access for protected routes
  for (const prefix in protectedPaths) {
    if (path.startsWith(prefix)) {
      if (!protectedPaths[prefix].includes(userRole)) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = `/dashboard/${userRole}`;
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};