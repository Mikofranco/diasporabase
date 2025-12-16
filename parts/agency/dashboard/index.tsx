"use client";

import Notifications from "@/components/NotificationPanel";
import { supabase } from "@/lib/supabase/client";
import { Project } from "@/lib/types";
import { getUserId } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import SmallCard from "./small-card";
import RecentProjects from "./recent-projects";
import AgencyRequestFromVolunteer from "./requests";

const AgencyDashboard = () => {
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [ongoingProjects, setOngoingProjects] = useState<Project[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectIsLoading, setProjectIsLoading] = useState<boolean>(true); // Start as true
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [totalVolunteers, setTotalVolunteers] = useState<number>(0);

  // Fetch projects by status
  const fetchProjects = async (
    orgId: string,
    status: string
  ): Promise<Project[]> => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", orgId)
      .eq("status", status);

    if (error) {
      throw new Error(`Failed to fetch ${status} projects: ${error.message}`);
    }
    return (data as Project[]) ?? [];
  };

async function getTotalVolunteersForOrganization(organizationId: string): Promise<number> {
  if (!organizationId) return 0;

  try {
    // First get all project IDs for this organization
    const { data: projects, error: projError } = await supabase
      .from("projects")
      .select("id")
      .eq("organization_id", organizationId)
      // Optional: only active/completed projects
      .in("status", ["active", "completed"]);

    if (projError || !projects || projects.length === 0) {
      return 0;
    }
    //@ts-ignore
    const projectIds = projects.map(p=> p.id);
    console.log("Project IDs for organization:", projectIds);

    // Now call the Supabase function
    const { data, error } = await supabase
      .rpc("get_total_volunteers_for_projects", {
        project_ids: projectIds
      });

    if (error) {
      console.error("Error calling RPC:", error);
      return 0;
    }

    return data ?? 0;
  } catch (err) {
    console.error("Unexpected error:", err);
    return 0;
  }
}
  // Fetch all projects – now takes userId as parameter
  const fetchAllProjects = async (orgId: string) => {
    if (!orgId) return;

    setProjectIsLoading(true);
    setProjectError(null);

    try {
      const [ongoing, completed, pending] = await Promise.all([
        fetchProjects(orgId, "active"),
        fetchProjects(orgId, "completed"),
        fetchProjects(orgId, "pending"),
      ]);

      setOngoingProjects(ongoing);
      setCompletedProjects(completed);
      setPendingProjects(pending);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to load projects";
      setProjectError(msg);
      toast.error(msg);
    } finally {
      setProjectIsLoading(false);
    }
  };

  // Main initialization effect
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const { data: currentUserId, error: userError } = await getUserId();
        if (userError || !currentUserId) {
          throw new Error(userError?.message || "Failed to fetch user ID");
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_active")
          .eq("id", currentUserId)
          .single();

        if (profileError || profile === null) {
          throw new Error(profileError?.message || "Failed to fetch profile");
        }

        if (!isMounted) return;

        setUserId(currentUserId);
        setIsActive(profile.is_active);

        if (!profile.is_active) {
          toast.error("Your agency is pending approval.");
          router.replace("/approval-pending");
          return;
        }

        // Now we have the real userId → fetch projects with it
        await fetchAllProjects(currentUserId);
      } catch (error) {
        if (!isMounted) return;
        toast.error(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
        setIsActive(false); // Or handle appropriately
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Optional: Refetch when userId changes (extra safety)
  useEffect(() => {
    if (userId && isActive) {
      fetchAllProjects(userId);
      getTotalVolunteersForOrganization(userId).then(setTotalVolunteers);
    }
  }, [userId, isActive]);

  if (isActive === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!isActive) {
    return null; // Redirect handled above
  }

  return (
    <div className="p-4 md:p-6 rounded-lg">
      <h1 className="text-3xl font-bold mb-4">Dashboard Overview</h1>
      <p className="text-muted-foreground mb-8">
        Welcome back! Here's what's happening with your projects.
      </p>

      {projectIsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-10 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <SmallCard
              count={ongoingProjects.length}
              title="Ongoing Projects"
              image="/svg/active-project.svg"
            />
            <SmallCard
              count={totalVolunteers}
              title="Total Volunteers"
              image="/svg/total-volunteers.svg"
            />
            <SmallCard
              count={pendingProjects.length}
              title="Pending Projects"
              image="/svg/pending-projects.svg"
            />
            <SmallCard
              count={completedProjects.length}
              title="Completed Projects"
              image="/svg/dashboard-completed-project.svg"
            />
          </div>

          <div className="space-y-10">
            <RecentProjects userId={userId || ""} />
            <AgencyRequestFromVolunteer />
          </div>
        </>
      )}

      {projectError && (
        <div className="mt-8 p-6 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive">
          {projectError}
        </div>
      )}
    </div>
  );
};

export default AgencyDashboard;
