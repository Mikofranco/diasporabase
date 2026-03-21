import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { GreenTickBoxed, PlusBoxed, StarBoxed } from "@/public/icon";
import RecentActivityItems, {
  RecentActivityItemsProps,
} from "./recent-activity-items";
import { formatDistanceToNow } from "date-fns";
import { VolunteerRequest } from "@/lib/types";
import { Send } from "lucide-react";

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
          .select(
            `
            id,
            created_at,
            project_id,
            projects!project_id (
              title,
              organization_name
            )
          `,
          )
          .eq("volunteer_id", profileId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5);

        // Fetch completed projects (via project_volunteers + projects with status 'completed')
        const { data: volunteers } = await supabase
          .from("project_volunteers")
          .select("project_id")
          .eq("volunteer_id", profileId);

        const projectIds = volunteers?.map((v: any) => v.project_id) || [];
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
          .select(
            `
            id,
            created_at,
            project_id,
            rating,
            comment,
            projects!project_id (
              title,
              organization_name
            )
          `,
          )
          .eq("user_id", profileId)
          .order("created_at", { ascending: false })
          .limit(5);

        // Fetch pending agency requests (invitations to volunteer) – only pending; accepted/rejected are excluded
        const { data: agencyRequests } = await supabase
          .from("agency_requests")
          .select(
            `
            id,
            created_at,
            project_id,
            projects!project_id (
              title,
              organization_name
            )
          `,
          )
          .eq("volunteer_id", profileId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5);

        // Fetch pending PM role requests (Project Manager invitation – already on project)
        const { data: pmRequestsData } = await supabase
          .from("project_manager_requests")
          .select(
            "id, created_at, project_id, projects(title, organization_name)",
          )
          .eq("volunteer_id", profileId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5);
        const pmRequests = Array.isArray(pmRequestsData) ? pmRequestsData : [];

        // Map to activity items (with sort date for merging)
        type ActivityWithDate = RecentActivityItemsProps & { sortAt: string };
        const activityItems: ActivityWithDate[] = [];

        // Applied (volunteer applied to project)
        requests?.forEach((req: VolunteerRequest) => {
          activityItems.push({
            icon: <PlusBoxed />,
            period: formatDistanceToNow(new Date(req.created_at), {
              addSuffix: true,
            }),
            // @ts-ignore – projects from join
            title: `Applied for "${req.projects?.title ?? "project"}"`,
            sortAt: req.created_at,
          });
        });

        // Pending request from agency (invitation to join project – only pending; disappears when accepted/rejected)
        agencyRequests?.forEach(
          (ar: {
            created_at: string;
            projects?: { title?: string; organization_name?: string };
          }) => {
            const title = ar.projects?.title ?? "a project";
            const org = ar.projects?.organization_name ?? "An agency";
            activityItems.push({
              icon: (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#DBEAFE] border border-[#E5E7EB]">
                  <Send className="h-5 w-5 text-[#2563EB]" aria-hidden />
                </span>
              ),
              period: formatDistanceToNow(new Date(ar.created_at), {
                addSuffix: true,
              }),
              title: `Pending request from ${org} for "${title}"`,
              sortAt: ar.created_at,
            });
          },
        );

        // Pending PM role requests (Project Manager invitation for a project you're already on)
        pmRequests?.forEach(
          (pm: {
            created_at: string;
            projects?: { title?: string; organization_name?: string };
          }) => {
            const title = pm.projects?.title ?? "a project";
            const org = pm.projects?.organization_name ?? "An agency";
            activityItems.push({
              icon: (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 border border-amber-200">
                  <Send className="h-5 w-5 text-amber-700" aria-hidden />
                </span>
              ),
              period: formatDistanceToNow(new Date(pm.created_at), {
                addSuffix: true,
              }),
              title: `Project Manager role: ${org} invited you to manage "${title}"`,
              sortAt: pm.created_at,
            });
          },
        );

        // Completed
        completedProjects?.forEach((proj: any) => {
          activityItems.push({
            icon: <GreenTickBoxed />,
            period: formatDistanceToNow(new Date(proj.updated_at), {
              addSuffix: true,
            }),
            title: `Completed "${proj.title}" project`,
            sortAt: proj.updated_at,
          });
        });

        // Ratings
        ratings?.forEach((rating: any) => {
          activityItems.push({
            icon: <StarBoxed />,
            period: formatDistanceToNow(new Date(rating.created_at), {
              addSuffix: true,
            }),
            title: `Received ${rating.rating}-star rating from ${rating.projects.organization_name}`,
            sortAt: rating.created_at,
          });
        });

        // Sort by date descending (most recent first), then limit to 5
        activityItems.sort(
          (a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime(),
        );
        const displayItems = activityItems
          .slice(0, 5)
          .map(({ sortAt: _, ...item }) => item);

        setActivities(displayItems);
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
          <div className="text-sm text-gray-500">
            Loading recent activity...
          </div>
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
      <div className="flex flex-col gap-1.5 sm:gap-2 shadow-sm border rounded-lg p-3 sm:p-4 bg-white max-w-full overflow-hidden h-[250px]">
        <h2 className="text-sm sm:text-base font-bold text-gray-600 mb-6">
          Recent Activity
        </h2>
        {activities.length === 0 ? (
          <p className="text-xs sm:text-sm text-gray-500">No recent activity</p>
        ) : (
          <div className="space-y-1.5 sm:space-y-2  overflow-y-auto">
            {activities.map((item, index) => (
              <RecentActivityItems
                key={index}
                icon={item.icon}
                period={item.period}
                title={item.title}
                className="max-w-md"
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
