"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SmallCard, { SmallCardProps } from "./small-card";
import RecentActivity from "./recent-activity";
import OngoingProjects from "./ongoing-projects";
import MatchingProjects from "./matching-projects";
import { getUserId } from "@/lib/utils";

// Initialize Supabase client
const supabase = createClient();

// Define props for VolunteerDashBoard
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
  const [attachedProjectsCount, setAttachedProjectsCount] = useState<number>(0); // New state for attached projects
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state

  // Fetch completed projects count
  async function getCompletedProjectsCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("project_volunteers")
        .select("project_id, projects!inner(status)")
        .eq("volunteer_id", userId)
        .eq("projects.status", "completed");

      if (error) {
        console.error("Error fetching completed projects count:", error.message);
        return 0;
      }

      return data?.length || 0;
    } catch (err) {
      console.error("Unexpected error:", err);
      return 0;
    }
  }

  // Fetch attached projects count
  async function getAttachedProjectsCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("project_volunteers")
        .select("project_id", { count: "exact" })
        .eq("volunteer_id", userId);

      if (error) {
        console.error("Error fetching attached projects count:", error.message);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error("Unexpected error:", err);
      return 0;
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Fetch user ID from Supabase auth
        const userId = await getUserId();
        if (!userId) {
          console.error("No user ID found");
          return;
        }

        // Fetch user profile from Supabase
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError.message);
        }

        // Fetch both counts concurrently for efficiency
        const [completedCount, attachedCount] = await Promise.all([//@ts-ignore
          getCompletedProjectsCount(userId),//@ts-ignore
          getAttachedProjectsCount(userId),
        ]);

        // Update state
        setUserInformation({
          name: profile?.full_name || localStorage.getItem("disporabase_fullName") || "",//@ts-ignore
          id: userId,
        });
        setCompletedProjectsCount(completedCount);
        setAttachedProjectsCount(attachedCount);
      } catch (err) {
        console.error("Error in fetchUserData:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // SmallCard items with dynamic counts
  const smallCardItems: SmallCardProps[] = [
    {
      title: "Hours Volunteered",
      count: 120, // Consider fetching dynamically if API exists
      image: "/svg/time.svg",
    },
    {
      title: "Projects Attached", // Corrected typo
      count: attachedProjectsCount, // Dynamic count
      image: "/svg/completed.svg",
    },
    {
      title: "Upcoming Events",
      count: 2, // Consider fetching dynamically if API exists
      image: "/svg/star.svg",
    },
    {
      title: "Completed Projects", // Updated title for consistency
      count: completedProjectsCount, // Dynamic count
      image: "/svg/completed-project.svg",
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">
          Welcome Back{" "}
          <span className="font-semibold text-gray-600">
            {userInformation.name || "User"}
          </span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Ready to make a difference today?
        </p>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {smallCardItems.map((item, index) => (
            <SmallCard
              key={index}
              image={item.image}
              title={item.title}
              count={item.count}
            />
          ))}
        </div>
        <RecentActivity />
        <OngoingProjects />
        <MatchingProjects />
      </div>
    </div>
  );
};

export default VolunteerDashBoard;