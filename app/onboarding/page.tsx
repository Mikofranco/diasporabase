"use client";

import { handleEmailConfirmationRedirect } from "@/lib/utils";
import { Loader2, CheckCircle } from "lucide-react";
import React, { useEffect, useState } from "react";

const OnboardingPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const performRedirect = async () => {
      try {
        await handleEmailConfirmationRedirect();
      } catch (err) {
        setError("Failed to confirm email. Please try again later.");
        console.error("Email confirmation error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    performRedirect();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <div
        className="flex flex-col items-center gap-6 text-center rounded-lg border border-dashed shadow-sm bg-white p-8 max-w-md w-full"
        role="region"
        aria-live="polite"
      >
        {error ? (
          <div className="text-red-600 font-medium">{error}</div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <CheckCircle className="h-6 w-6 text-green-500" aria-hidden="true" />
              Email Confirmed
            </div>
            {isLoading && (
              <>
                <Loader2
                  className="h-10 w-10 animate-spin text-blue-500"
                  aria-label="Loading"
                />
                <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                  Loading Profile...
                </h3>
                <p className="text-sm text-gray-500">
                  Please wait while we fetch your data.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;