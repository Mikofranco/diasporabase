"use client"
import { handleEmailConfirmationRedirect } from "@/lib/utils";
import { VolunteerOnboardingForm } from "@/parts/volunteerOnboarding";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";

const OnboardingPage = () => {
  useEffect(() => {
    handleEmailConfirmationRedirect();
  }, []);
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h3 className="text-2xl font-bold tracking-tight">
          Loading Profile...
        </h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we fetch your data.
        </p>
      </div>
    </div>
  );
};

export default OnboardingPage;
