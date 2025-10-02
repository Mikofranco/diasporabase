// components/VolunteerDashBoard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SmallCard, { SmallCardProps } from "./small-card";
import RecentActivity from "./recent-activity";
import OngoingProjects from "./ongoing-projects";
import MatchingProjects from "./matching-projects";

// Initialize Supabase client
const supabase = createClient();

// Define props for VolunteerDashBoard
interface VolunteerDashBoardProps {
  name?: string;
  email?: string;
  phone?: string;
  id?: string;
}

// Sample SmallCard data (can be fetched dynamically if needed)
const smallCardItems: SmallCardProps[] = [
  {
    title: "Hours Volunteered",
    count: 120,
    image: "/svg/time.svg",
  },
  {
    title: "Project Attched",
    count: 8,
    image: "/svg/completed.svg", // Updated to a different image for variety
  },
  {
    title: "Upcoming Events",
    count: 2,
    image: "/svg/star.svg", // Updated to a different image for variety
  },
  {
    title: "Completed Project",
    count: 2,
    image: "/svg/completed-project.svg", // Updated to a different image for variety
  },
];

const VolunteerDashBoard = () => {
  const [userInformation, setUserInformation] =
    useState<VolunteerDashBoardProps>({
      name: "",
      email: "",
      phone: "",
      id: "",
    });

  useEffect(() => {
    const storedFullName = localStorage.getItem("disporabase_fullName");
    setUserInformation({ name: storedFullName || "" });
  }, []);

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