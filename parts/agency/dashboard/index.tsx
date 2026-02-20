"use client";

import { supabase } from "@/lib/supabase/client";
import { Project } from "@/lib/types";
import { getUserId } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  LayoutGrid,
  PlayCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import SmallCard from "./small-card";
import RecentProjects from "./recent-projects";
import AgencyRequestFromVolunteer from "./requests";
import { routes } from "@/lib/routes";

const AgencyDashboard = () => {
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [ongoingProjects, setOngoingProjects] = useState<Project[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [rejectedProjects, setRejectedProjects] = useState<Project[]>([]);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectIsLoading, setProjectIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch projects by status
  const fetchProjects = async (
    orgId: string,
    status: string,
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

  // Fetch all projects by status
  const fetchAllProjects = async (orgId: string) => {
    if (!orgId) return;

    setProjectIsLoading(true);
    setProjectError(null);

    try {
      const [ongoing, completed, pending, rejected] = await Promise.all([
        fetchProjects(orgId, "active"),
        fetchProjects(orgId, "completed"),
        fetchProjects(orgId, "pending"),
        fetchProjects(orgId, "rejected"),
      ]);

      setOngoingProjects(ongoing);
      setCompletedProjects(completed);
      setPendingProjects(pending);
      setRejectedProjects(rejected);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to load projects";
      setProjectError(msg);
      toast.error(msg);
    } finally {
      setProjectIsLoading(false);
    }
  };

  // Main initialization effect – fetch user, profile and all dependent data once
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
          .select("is_active, tax_id")
          .eq("id", currentUserId)
          .single();

        if (profileError || profile === null) {
          throw new Error(profileError?.message || "Failed to fetch profile");
        }

        if (!isMounted) return;

        setUserId(currentUserId);
        setIsActive(profile.is_active);

        if (!profile.tax_id) {
          router.replace(routes.agencyOnboarding);
          return;
        }

        if (!profile.is_active) {
          toast.error("Your agency is pending approval.");
          router.replace(routes.approvalPending);
          return;
        }

        // Now we have the real userId → fetch projects with it
        await fetchAllProjects(currentUserId);
      } catch (error) {
        if (!isMounted) return;
        toast.error(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        );
        setIsActive(false); // Or handle appropriately
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white w-full">
      <div className="w-full">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-600 mt-1.5">
            Welcome back! Here&apos;s what&apos;s happening with your projects.
          </p>
        </header>

        {projectIsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-10">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="min-h-[100px] bg-white border border-slate-200 rounded-xl p-5 sm:p-6 animate-pulse shadow-sm"
              >
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4" />
                <div className="h-8 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-10">
              <SmallCard
                count={
                  ongoingProjects.length +
                  completedProjects.length +
                  pendingProjects.length +
                  rejectedProjects.length
                }
                title="Total Projects"
                icon={<LayoutGrid className="w-6 h-6" />}
              />
              <SmallCard
                count={ongoingProjects.length}
                title="Ongoing Projects"
                icon={<PlayCircle className="w-6 h-6 text-emerald-600" />}
              />
              <SmallCard
                count={pendingProjects.length}
                title="Pending Projects"
                icon={<Clock className="w-6 h-6 text-amber-600" />}
              />
              <SmallCard
                count={completedProjects.length}
                title="Completed Projects"
                icon={<CheckCircle2 className="w-6 h-6 text-slate-600" />}
              />
              <SmallCard
                count={rejectedProjects.length}
                title="Rejected Projects"
                icon={<XCircle className="w-6 h-6 text-red-600" />}
              />
            </div>

            <div className="space-y-8 md:space-y-10">
              <RecentProjects userId={userId || ""} />
              <AgencyRequestFromVolunteer userId={userId || ""} />
            </div>
          </>
        )}

        {projectError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {projectError}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyDashboard;
