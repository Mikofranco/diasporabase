import VolunteersManagement from "@/parts/superAdmin/volunteerManagement";

// app/admin/volunteers/page.tsx
export default function AdminVolunteersPage() {
  return (
    <div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Admin Volunteers Management
          </h3>
          <p className="text-sm text-muted-foreground">
            View and manage all volunteers.
          </p>
        </div>
      </div>
      <VolunteersManagement />
    </div>
  );
}
