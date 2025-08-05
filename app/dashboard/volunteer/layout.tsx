import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClientComponentClient } from "@/lib/supabase/server"
import type React from "react"

export default async function VolunteerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const supabase = createServerClientComponentClient(cookieStore)

  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session

  // if (!session) {
  //   redirect("/login")
  // }

  // const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

  // if (error || profile?.role !== "volunteer") {
  //   // Redirect to their actual dashboard or login if not volunteer
  //   if (profile?.role) {
  //     redirect(`/dashboard/${profile.role}`)
  //   } else {
  //     redirect("/login")
  //   }
  // }

  return <>{children}</>
}
