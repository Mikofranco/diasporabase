"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SmallCard, { SmallCardProps } from "./small-card";
import RecentActivity from "./recent-activity";
import MatchingProjects from "./matching-projects";
import { getUserId } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const supabase = createClient();

interface VolunteerDashBoardProps {
  name?: string;
  email?: string;
  phone?: string;
  id?: string;
}

const VolunteerDashBoard = () => {
  const [userInformation, setUserInformation] = useState<VolunteerDashBoardProps>({
    name: "",
    email: "",
    phone: "",
    id: "",
  });
  const [completedProjectsCount, setCompletedProjectsCount] = useState<number>(0);
  const [attachedProjectsCount, setAttachedProjectsCount] = useState<number>(0);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [onboardingRequired, setOnboardingRequired] = useState<boolean>(false);
  const router = useRouter();

  /* --------------------------------------------------------------- */
  async function getCompletedProjectsCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("project_volunteers")
        .select("project_id, projects!inner(status)")
        .eq("volunteer_id", userId)
        .eq("projects.status", "completed");
      if (error) throw error;
      return data?.length ?? 0;
    } catch (e) {
      console.error(e);
      return 0;
    }
  }

  async function getAttachedProjectsCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("project_volunteers")
        .select("project_id", { count: "exact" })
        .eq("volunteer_id", userId);
      if (error) throw error;
      return count ?? 0;
    } catch (e) {
      console.error(e);
      return 0;
    }
  }

  /* --------------------------------------------------------------- */
  useEffect(() => {
    const checkAndLoad = async () => {
      setIsChecking(true);
      try {
        const { data: userId, error: uidErr } = await getUserId();
        if (uidErr || !userId) {
          toast.error("Please log in to continue.");
          router.push("/login");
          return;
        }

        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("full_name, email, phone, skills")
          .eq("id", userId)
          .single();

        if (profErr) {
          toast.error("Failed to load profile.");
          return;
        }

        const skills = profile.skills ?? [];
        if (!skills.length) {
          setOnboardingRequired(true);
          setIsChecking(false);
          return; // stop loading the dashboard
        }

        // ---- profile is complete → load dashboard ----
        setUserInformation({
          name: profile.full_name ?? "",
          email: profile.email ?? "",
          phone: profile.phone ?? "",
          id: userId,
        });

        const [comp, att] = await Promise.all([
          getCompletedProjectsCount(userId),
          getAttachedProjectsCount(userId),
        ]);

        setCompletedProjectsCount(comp);
        setAttachedProjectsCount(att);
      } catch (e) {
        console.error(e);
        toast.error("Something went wrong.");
      } finally {
        setIsChecking(false);
      }
    };

    checkAndLoad();
  }, [router]);

  /* --------------------------------------------------------------- */
  const smallCardItems: SmallCardProps[] = [
    // { title: "Hours Volunteered", count: 120, image: "/svg/time.svg" },
    { title: "Projects Attached", count: attachedProjectsCount, image: "/svg/completed.svg" },
    // { title: "Average Rating", count: 2, image: "/svg/star.svg" },
    { title: "Completed Projects", count: completedProjectsCount, image: "/svg/completed-project.svg" },
  ];

  /* --------------------------------------------------------------- */
  if (isChecking) {
    return (
      <div className="container mx-auto flex items-center justify-center h-64">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      {/* ---------- NON-DISMISSIBLE ONBOARDING MODAL ---------- */}
      {onboardingRequired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl animate-in fade-in duration-300">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-9 w-9 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
              <p className="mt-2 text-gray-600">
                Please add your skills to unlock personalized project matches.
              </p>
            </div>

            <button
              onClick={() => router.push("/onboarding/volunteer")}
              className="w-full rounded-lg action-btn py-3 font-medium text-white shadow-sm transition-colors "
            >
              Complete Onboarding
            </button>
          </div>
        </div>
      )}

      {/* ---------- DASHBOARD (blurred while modal is open) ---------- */}
      <div className={`container mx-auto p-2 ${onboardingRequired ? "pointer-events-none blur-sm" : ""} `}>
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-xl font-bold sm:text-2xl">
            Welcome Back{" "}
            <span className="font-semibold text-gray-600">
              {userInformation.name || "Volunteer"}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Ready to make a difference today?
          </p>
        </div>

        <div className="space-y-8">
          <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
            {smallCardItems.map((item, i) => (
              <SmallCard key={i} image={item.image} title={item.title} count={item.count} />
            ))}
          </div>

          <RecentActivity />
          <MatchingProjects />
        </div>
      </div>
    </>
  );
};

export default VolunteerDashBoard;