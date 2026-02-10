import AdminProjectsScreen from "@/parts/superAdmin/projects";

// app/admin/projects/page.tsx
export default function AdminProjectsPage() {
  return (
    <div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Admin Projects Management
          </h3>
          <p className="text-sm text-muted-foreground">
            View and manage all projects.
          </p>
        </div>
      </div>
      <AdminProjectsScreen />
    </div>
  );
}
