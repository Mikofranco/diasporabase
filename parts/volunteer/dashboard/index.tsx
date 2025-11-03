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
  const [userInformation, setUserInformation] =
    useState<VolunteerDashBoardProps>({
      name: "",
      email: "",
      phone: "",
      id: "",
    });
  const [completedProjectsCount, setCompletedProjectsCount] =
    useState<number>(0);
  const [attachedProjectsCount, setAttachedProjectsCount] = useState<number>(0); // New state for attached projects
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state
  const [showModal, setShowModal] = useState<boolean>(false); // State for modal visibility

  // Fetch completed projects count
  async function getCompletedProjectsCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("project_volunteers")
        .select("project_id, projects!inner(status)")
        .eq("volunteer_id", userId)
        .eq("projects.status", "completed");

      if (error) {
        console.error(
          "Error fetching completed projects count:",
          error.message
        );
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

        // Fetch both counts concurrently for efficiency
        const [completedCount, attachedCount] = await Promise.all([
          //@ts-ignore
          getCompletedProjectsCount(userId), //@ts-ignore
          getAttachedProjectsCount(userId),
        ]);

        setCompletedProjectsCount(completedCount);
        setAttachedProjectsCount(attachedCount);
      } catch (err) {
        console.error("Error in fetchUserData:", err);
      } finally {
        setIsLoading(false);
      }
    };

     fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "ogbechiemicheal6@gmail.com",
        subject: "Welcome!",
        html: "<p>Thanks for signing up!</p>",
      }),
    });

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

  // Modal component
  const CompleteRegistrationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Complete Your Registration</h2>
        <p className="text-gray-600 mb-6">
          To get started, please add your skills to match with relevant projects
          and opportunities.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 text-gray-500 hover:text-gray-700"
          >
            Remind Later
          </button>
          <button
            onClick={() => {
              // Navigate to skills update page or handle completion
              // For example: window.location.href = '/profile/skills';
              setShowModal(false);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Skills
          </button>
        </div>
      </div>
    </div>
  );

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
    <>
      <div className="container mx-auto p-2">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">
            Welcome Back{" "}
            <span className="font-semibold text-gray-600">
              {userInformation.name || ""}
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
          {/* <OngoingProjects /> */}
          <MatchingProjects />
        </div>
      </div>
      {showModal && <CompleteRegistrationModal />}
    </>
  );
};

export default VolunteerDashBoard;
