"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import { X, Sparkles, Target, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

const DISMISS_KEY = "volunteer_onboarding_reminder_dismissed";

export default function VolunteerOnboardingReminder() {
  const router = useRouter();
  const [onboardingRequired, setOnboardingRequired] = useState<boolean | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const check = async () => {
      const dismissed = sessionStorage.getItem(DISMISS_KEY);
      if (dismissed === "true") {
        setIsDismissed(true);
        return;
      }

      const { data: userId, error } = await getUserId();
      if (error || !userId) {
        setOnboardingRequired(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, skills")
        .eq("id", userId)
        .single();

      if (!profile || profile.role !== "volunteer") {
        setOnboardingRequired(false);
        return;
      }

      const skills = profile.skills ?? [];
      setOnboardingRequired(!skills.length);
    };
    check();
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setIsDismissed(true);
  };

  const handleComplete = () => {
    sessionStorage.removeItem(DISMISS_KEY);
    router.push(routes.volunteerOnboarding);
  };

  if (onboardingRequired !== true || isDismissed) return null;

  return (
    <div
      role="banner"
      className="relative mx-4 mb-4 overflow-hidden rounded-xl border border-sky-200/80 bg-gradient-to-r from-sky-50 via-white to-indigo-50/80 shadow-sm animate-in slide-in-from-top-4 fade-in duration-300"
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-3 pr-8 sm:pr-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
                <Sparkles className="h-4 w-4 text-sky-600" />
              </span>
              <h3 className="font-semibold text-sky-900">
                Complete your profile to unlock opportunities
              </h3>
            </div>
            <p className="text-sm text-sky-800/90 max-w-2xl">
              Add your skills and preferences to discover projects that match your expertise,
              apply to contribute, and make a meaningful impact.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-sky-700/80">
              <span className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                Get personalized project matches
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Apply and contribute to projects
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              onClick={handleComplete}
              size="sm"
              className="bg-sky-600 hover:bg-sky-700 text-white shrink-0"
            >
              Complete profile
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              aria-label="Dismiss reminder"
              className="text-sky-600 hover:bg-sky-100 hover:text-sky-700 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
