"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SmallCard, { SmallCardProps } from "./small-card";
import RecentActivity from "./recent-activity";
import RecommendedProjects from "./recommended-projects";
import { getFirstWordShort, getUserId } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

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
          router.push(routes.login);
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

        // Onboarding reminder (when skills empty) is shown by layout
        // ---- load dashboard ----
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
  // if (isChecking) {
  //   return (
  //     <div className="container mx-auto flex items-center justify-center h-64">
  //       <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  //         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
  //         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  //       </svg>
  //     </div>
  //   );
  // }

  return (
    <div className="container mx-auto p-2">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-2 text-xl font-bold sm:text-2xl">
            Welcome Back{" "}
            <span className="">
              {getFirstWordShort(userInformation.name || "Volunteer")}
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
          <RecommendedProjects />
        </div>
    </div>
  );
};

export default VolunteerDashBoard;