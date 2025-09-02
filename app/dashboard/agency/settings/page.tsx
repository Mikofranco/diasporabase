import AgencySettings from "@/parts/agency/settings";

// app/agency/settings/page.tsx
export default function AgencySettingsPage() {
  return (
    <div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">Agency Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure your organization's settings.
          </p>
        </div>
      </div>
      <AgencySettings />
    </div>
  );
}
