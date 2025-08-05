import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createServerActionClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error)
    return NextResponse.redirect(requestUrl.origin + "/login?error=" + error)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerActionClient(cookieStore)

    try {
      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("Auth exchange error:", exchangeError)
        return NextResponse.redirect(requestUrl.origin + "/login?error=auth_exchange_failed")
      }

      if (data.session?.user) {
        // Wait a moment for the session to be fully established
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Get the user's profile to determine their role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single()

        if (profileError) {
          console.error("Profile fetch error:", profileError)
          // If profile doesn't exist yet, redirect to login to try again
          return NextResponse.redirect(requestUrl.origin + "/login?error=profile_not_found")
        }

        if (profile?.role) {
          // Redirect to the appropriate dashboard based on role
          return NextResponse.redirect(requestUrl.origin + `/dashboard/${profile.role}`)
        } else {
          // Profile exists but no role set
          return NextResponse.redirect(requestUrl.origin + "/login?error=no_role_assigned")
        }
      }
    } catch (error) {
      console.error("Callback processing error:", error)
      return NextResponse.redirect(requestUrl.origin + "/login?error=callback_failed")
    }
  }

  // No code parameter - redirect to login
  return NextResponse.redirect(requestUrl.origin + "/login?error=no_auth_code")
}
