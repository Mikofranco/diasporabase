// components/VolunteerDashBoard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
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
    title: "Events Attended",
    count: 8,
    image: "/svg/completed.svg", // Updated to a different image for variety
  },
  {
    title: "Upcoming Events",
    count: 2,
    image: "/svg/star.svg", // Updated to a different image for variety
  },
];

const VolunteerDashBoard = () => {
  const [userInformation, setUserInformation] = useState<VolunteerDashBoardProps>({
    name: "",
    email: "",
    phone: "",
    id: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const storedFullName=localStorage.getItem("disporabase_fullName")
    setUserInformation({name: storedFullName || ""})
   
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">
        Welcome Back <span className="font-semibold text-gray-600 ml-2">{userInformation.name || "User"}</span>
      </h1>
      <p>Ready to make a difference today?</p>
      <div className="space-y-6">
        <div className="flex items-center gap-5">
        {smallCardItems.map((item, index) => (
          <SmallCard
            key={index}
            image={item.image}
            title={item.title}
            count={item.count}
          />
        ))}
      </div>
      <RecentActivity/>
      <OngoingProjects/>
      <MatchingProjects/>
      </div>
    </div>
  );
};

export default VolunteerDashBoard;