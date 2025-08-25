import AdminSettings from "@/parts/superAdmin/settings";

// app/admin/settings/page.tsx
export default function AdminSettingsPage() {
  return (
    <div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">Admin Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure application settings.
          </p>
        </div>
      </div>
      <AdminSettings />
    </div>
  );
}
