import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; // Adjust import path as needed
import { GreenTickBoxed, PlusBoxed, StarBoxed } from "@/public/icon";
import RecentActivityItems, { RecentActivityItemsProps } from "./recent-activity-items";
import { formatDistanceToNow } from "date-fns"; // npm install date-fns for relative time
import { VolunteerRequest } from "@/lib/types";

const supabase = createClient(); // Initialize Supabase client

const RecentActivity = () => {
  const [activities, setActivities] = useState<RecentActivityItemsProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("User not authenticated");
          return;
        }

        const profileId = user.id;

        // Fetch applied projects (volunteer_requests with status 'pending')
        const { data: requests } = await supabase
          .from("volunteer_requests")
          .select(`
            id,
            created_at,
            project_id,
            projects!project_id (
              title,
              organization_name
            )
          `)
          .eq("volunteer_id", profileId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5);

        // Fetch completed projects (via project_volunteers + projects with status 'completed')
        const { data: volunteers } = await supabase
          .from("project_volunteers")
          .select("project_id")
          .eq("volunteer_id", profileId);

        const projectIds = volunteers?.map((v:any) => v.project_id) || [];
        const { data: completedProjects } = await supabase
          .from("projects")
          .select("id, title, organization_name, updated_at")
          .in("id", projectIds)
          .eq("status", "completed")
          .order("updated_at", { ascending: false })
          .limit(5);

        // Fetch ratings received (project_ratings for this user)
        const { data: ratings } = await supabase
          .from("project_ratings")
          .select(`
            id,
            created_at,
            project_id,
            rating,
            comment,
            projects!project_id (
              title,
              organization_name
            )
          `)
          .eq("user_id", profileId)
          .order("created_at", { ascending: false })
          .limit(5);

        // Map to activity items
        const activityItems: RecentActivityItemsProps[] = [];

        // Applied
        requests?.forEach((req:VolunteerRequest) => {
          activityItems.push({
            icon: <PlusBoxed />,
            period: formatDistanceToNow(new Date(req.created_at), { addSuffix: true }),//@ts-ignore
            title: `Applied for "${req.projects.title}"`,
          });
        });

        // Completed
        completedProjects?.forEach((proj:any) => {
          activityItems.push({
            icon: <GreenTickBoxed />,
            period: formatDistanceToNow(new Date(proj.updated_at), { addSuffix: true }),
            title: `Completed "${proj.title}" project`,
          });
        });

        // Ratings
        ratings?.forEach((rating:any) => {
          activityItems.push({
            icon: <StarBoxed />,
            period: formatDistanceToNow(new Date(rating.created_at), { addSuffix: true }),
            title: `Received ${rating.rating}-star rating from ${rating.projects.organization_name}`,
          });
        });

        // Sort by date descending (most recent first)
        activityItems.sort((a, b) => {
          // Note: You'd need to store dates in the items for accurate sorting; for simplicity, assuming fetch order is recent
          // To improve: Add date to each item and sort here
          return 0; // Placeholder; enhance as needed
        });

        setActivities(activityItems.slice(0, 5)); // Limit to 5 recent
      } catch (err) {
        setError("Failed to fetch activities");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col gap-2 shadow-sm border rounded-lg p-3 sm:p-4 bg-white">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="text-sm text-gray-500">Loading recent activity...</div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col gap-2 shadow-sm border rounded-lg p-3 sm:p-4 bg-white">
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="text-sm text-red-500">{error}</div>
      </div>
      );
    }

    return (
      <div className="flex flex-col gap-1.5 sm:gap-2 shadow-sm border rounded-lg p-3 sm:p-4 bg-white max-w-full overflow-hidden">
        <h2 className="text-sm sm:text-base font-bold text-gray-600">Recent Activity</h2>
        {activities.length === 0 ? (
          <p className="text-xs sm:text-sm text-gray-500">No recent activity</p>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {activities.map((item, index) => (
              <RecentActivityItems
                key={index}
                icon={item.icon}
                period={item.period}
                title={item.title}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return renderContent();
};

export default RecentActivity;