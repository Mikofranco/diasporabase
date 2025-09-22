"use client";
import { handleEmailConfirmationRedirect } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";

const OnboardingPage = () => {
  useEffect(() => {
    handleEmailConfirmationRedirect();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center  p-4">
      <div className="flex flex-col items-center gap-4 text-center rounded-lg border border-dashed shadow-sm bg-white p-8 max-w-md w-full">
        <Loader2 className="h-10 w-10 animate-spin text-blue-300" />
        <h3 className="text-2xl font-bold tracking-tight text-gray-900">
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
