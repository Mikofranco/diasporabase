"use client";

import VolunteerOnboardingReminder from "@/components/volunteer-onboarding-reminder";

export default function VolunteerLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <VolunteerOnboardingReminder />
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
