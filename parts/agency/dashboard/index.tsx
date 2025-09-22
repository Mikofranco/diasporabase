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
  const [ongoingProjects, setOngoingProjects] = useState<Project[] | null>(
    null
  );
  const [completedProjects, setCompletedProjects] = useState<Project[] | null>(
    null
  );
  const [pendingProjects, setPendingProjects] = useState<Project[] | null>(
    null
  );
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectIsLoading, setProjectIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null)

  async function fetchUserStatus() {
    try {
      const { data: userData, error: userError } = await getUserId();
      if (userError || !userData) {
        throw new Error(userError?.message || "Failed to fetch user ID");
      }

      const { data: fetchedData, error: fetchedDataError } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", userData)
        .single();

      if (fetchedDataError) {
        throw new Error(
          fetchedDataError.message || "Failed to fetch user status"
        );
      }
      setUserId(userData)
      return fetchedData.is_active;
    } catch (error) {
      //@ts-ignore
      toast.error(error.message || "An unexpected error occurred");
      return null;
    }
  }

  async function fetchProjects(userId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("organization_id", userId)

      if (error) {
        throw new Error(`Failed to fetch ${status} projects: ${error.message}`);
      }

      return data as Project[];
    } catch (error) {
      throw error; // Let caller handle the error
    }
  }

  async function fetchAllProjects() {
    setProjectIsLoading(true);
    setProjectError(null); // Clear previous errors

    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError || !userId) {
        throw new Error(userIdError?.message || "Failed to fetch user ID");
      }

      // Fetch all project types concurrently
      const [ongoing, completed, pending] = await Promise.all([
        fetchProjects(userId, "active"),
        fetchProjects(userId, "completed"),
        fetchProjects(userId, "pending"),
      ]);

      setOngoingProjects(ongoing);
      setCompletedProjects(completed);
      setPendingProjects(pending);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setProjectError(errorMessage);
      toast.error(errorMessage);
      setOngoingProjects(null);
      setCompletedProjects(null);
      setPendingProjects(null);
    } finally {
      setProjectIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const status = await fetchUserStatus();
        if (isMounted && status !== null) {
          setIsActive(status);
          if (!status) {
            toast.error("Agency is not active");
            router.push("/approval-pending");
            return;
          }
          // Fetch projects only if agency is active
          await fetchAllProjects();
        }
      } catch (error) {
        if (isMounted) {
          toast.error("Failed to load data");
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-4  rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <p className="text-gray-500">
        Welcome back! Here's what's happening with your projects.
      </p>
      <div className="space-y-6 mt-4">
        <div className="flex gap-6">
          <SmallCard
            count={ongoingProjects?.length}
            title="Ongoing Projects"
            image="/svg/active-project.svg"
          />
          <SmallCard
            count={ongoingProjects?.length}
            title="Total Volunteers"
            image="/svg/total-volunteers.svg"
          />

          <SmallCard
            count={pendingProjects?.length}
            title="Pending Projects"
            image="/svg/pending-projects.svg"
          />
          <SmallCard
            count={completedProjects?.length}
            title="completed Projects"
            image="/svg/dashboard-completed-project.svg"
          />
        </div>
        <RecentProjects userId={"05c9a218-693e-4e68-9964-260bca03c0aa"}/>

        <AgencyRequestFromVolunteer/>
      </div>
      {/* <Notifications /> */}
    </div>
  );
};

export default AgencyDashboard;
