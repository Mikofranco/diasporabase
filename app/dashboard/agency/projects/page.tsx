import OrganizationsProjects from "@/parts/agency/projects/index";

// app/agency/projects/page.tsx
export default function AgencyProjectsPage() {
  return (
    <div>
      {/* <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Agency Projects Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Create and manage your organization's projects.
          </p>
        </div>
      </div> */}
      <OrganizationsProjects />
    </div>
  );
}
