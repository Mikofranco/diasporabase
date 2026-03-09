import type React from "react"
import VolunteerLayoutClient from "./volunteer-layout-client"

export default async function VolunteerLayout({ children }: { children: React.ReactNode }) {
  return (
    <VolunteerLayoutClient>
      {children}
    </VolunteerLayoutClient>
  )
}
