import VolunteerOnboardingEmail from "@/components/emails/volunteer-onboarding-email";
import NavBar from "@/components/navbar";
import PublicProjectView from "@/components/public-project-view";

export default function ProjectsPage() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <NavBar />
      <main className="flex-1">
        <section className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <PublicProjectView />
          </div>
        </section>
      </main>
    </div>
  );
}
