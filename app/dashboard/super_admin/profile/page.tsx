import Profile from "@/parts/agency/profile";

// app/agency/profile/page.tsx
export default function AgencyProfilePage() {
  return (
    <div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight">Agency Profile</h3>
        <p className="text-sm text-muted-foreground">Manage your organization's profile.</p>
      </div>
    </div>
    <Profile />
    </div>
  )
}
