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
  const [ongoingProjects, setOngoingProjects] = useState<Project[] | null>(null);
  const [completedProjects, setCompletedProjects] = useState<Project[] | null>(null);
  const [pendingProjects, setPendingProjects] = useState<Project[] | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectIsLoading, setProjectIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user status and determine if active
  async function fetchUserStatus() {
    try {
      const { data: userData, error: userError } = await getUserId();
      if (userError || !userData) {
        throw new Error(userError?.message || "Failed to fetch user ID");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", userData)
        .single();

      if (profileError || profile === null) {
        throw new Error(profileError?.message || "Failed to fetch profile");
      }

      setUserId(userData);
      return profile.is_active;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
      return null;
    }
  }

  // Fetch projects by status
  async function fetchProjects(userId: string, status: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", userId)
      .eq("status", status);

    if (error) throw new Error(`Failed to fetch ${status} projects: ${error.message}`);
    return data as Project[];
  }

  // Fetch all project counts
  async function fetchAllProjects() {
    if (!userId) return;

    setProjectIsLoading(true);
    setProjectError(null);

    try {
      const [ongoing, completed, pending] = await Promise.all([
        fetchProjects(userId, "active"),
        fetchProjects(userId, "completed"),
        fetchProjects(userId, "pending"),
      ]);

      setOngoingProjects(ongoing);
      setCompletedProjects(completed);
      setPendingProjects(pending);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to load projects";
      setProjectError(msg);
      toast.error(msg);
    } finally {
      setProjectIsLoading(false);
    }
  }

  // Main effect: check activation → redirect or load data
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      const active = await fetchUserStatus();

      if (!isMounted) return;

      if (active === null) {
        // Error case – could redirect to login or show error
        return;
      }

      setIsActive(active);

      if (!active) {
        toast.error("Your agency is pending approval.");
        router.replace("/approval-pending");
        return;
      }
      await fetchAllProjects();
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isActive === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isActive) {
    return null;
  }

  return (
    <div className="p-4 rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <p className="text-gray-500 mb-6">
        Welcome back! Here's what's happening with your projects.
      </p>

      {projectIsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <SmallCard
              count={ongoingProjects?.length ?? 0}
              title="Ongoing Projects"
              image="/svg/active-project.svg"
            />
            <SmallCard
              count={ongoingProjects?.length ?? 0}
              title="Total Volunteers"
              image="/svg/total-volunteers.svg"
            />
            <SmallCard
              count={pendingProjects?.length ?? 0}
              title="Pending Projects"
              image="/svg/pending-projects.svg"
            />
            <SmallCard
              count={completedProjects?.length ?? 0}
              title="Completed Projects"
              image="/svg/dashboard-completed-project.svg"
            />
          </div>

          <RecentProjects userId={userId || ""} />
          <AgencyRequestFromVolunteer />
        </div>
      )}

      {projectError && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {projectError}
        </div>
      )}

      {/* <Notifications /> */}
    </div>
  );
};

export default AgencyDashboard;