import AgencyRegistrationForm from "@/components/agency-registration-form";
import Logo from "@/components/logo";

export default function RegisterAgencyPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 p-4 flex-col">
      <Logo />
      <AgencyRegistrationForm />
    </div>
  );
}
