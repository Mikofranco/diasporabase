import VolunteerOnboardingEmail from "@/components/emails/volunteer-onboarding-email";
import NavBar from "@/components/navbar";
import PublicProjectView from "@/components/public-project-view";

export default function ProjectsPage() {
  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-12">
        <PublicProjectView />
      </div>
    </>
  );
}
