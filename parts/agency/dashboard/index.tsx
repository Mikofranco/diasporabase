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
  CircleSlash,
} from "lucide-react";
import SmallCard from "./small-card";
import RecentProjects from "./recent-projects";
import AgencyRequestFromVolunteer from "./requests";
import { ProjectStatusChart } from "./project-status-chart";
import { TopProjectsByVolunteerInterest } from "./top-projects-by-interest";
import { routes } from "@/lib/routes";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectStatus = "active" | "completed" | "pending" | "rejected" | "cancelled";

interface GroupedProjects {
  active: Project[];
  completed: Project[];
  pending: Project[];
  rejected: Project[];
  cancelled: Project[];
}

// ─── Data fetching ────────────────────────────────────────────────────────────

/**
 * Fetches all projects for an org in a single query and groups them by status.
 * Returns null if the request was aborted.
 */
const fetchGroupedProjects = async (
  orgId: string,
  signal: AbortSignal,
): Promise<GroupedProjects | null> => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", orgId)
    .abortSignal(signal);

  if (signal.aborted) return null;

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  const empty: GroupedProjects = {
    active: [],
    completed: [],
    pending: [],
    rejected: [],
    cancelled: [],
  };

  return (data as Project[]).reduce((acc, project) => {
    const status = project.status as ProjectStatus;
    if (status in acc) acc[status].push(project);
    return acc;
  }, empty);
};

// ─── Component ────────────────────────────────────────────────────────────────

const AgencyDashboard = () => {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<GroupedProjects>({
    active: [],
    completed: [],
    pending: [],
    rejected: [],
    cancelled: [],
  });
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const initialize = async () => {
      try {
        // 1. Resolve user
        const { data: currentUserId, error: userError } = await getUserId();
        if (userError || !currentUserId) {
          throw new Error(userError?.message ?? "Failed to fetch user ID");
        }

        // 2. Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_active, tax_id")
          .eq("id", currentUserId)
          .abortSignal(signal)
          .single();

        if (signal.aborted) return;

        if (profileError || !profile) {
          throw new Error(profileError?.message ?? "Failed to fetch profile");
        }

        // 3. Guard: onboarding incomplete
        if (!profile.tax_id) {
          router.replace(routes.agencyOnboarding);
          return;
        }

        // 4. Guard: pending approval
        if (!profile.is_active) {
          toast.error("Your agency is pending approval.");
          router.replace(routes.approvalPending);
          return;
        }

        setUserId(currentUserId);

        // 5. Fetch projects
        const grouped = await fetchGroupedProjects(currentUserId, signal);
        if (!grouped) return; // aborted

        setProjects(grouped);
      } catch (error) {
        if (signal.aborted) return;
        const message =
          error instanceof Error ? error.message : "An unexpected error occurred";
        setProjectsError(message);
        toast.error(message);
      } finally {
        if (!signal.aborted) setProjectsLoading(false);
      }
    };

    initialize();

    return () => controller.abort();
  }, [router]);



  const totalProjects =
    projects.active.length +
    projects.completed.length +
    projects.pending.length +
    projects.rejected.length +
    projects.cancelled.length;

  // ─── Main render ─────────────────────────────────────────────────────────

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

        {projectsLoading ? (
          <SkeletonCards count={6} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6 mb-10">
              <SmallCard
                count={totalProjects}
                title="Total Projects"
                icon={<LayoutGrid className="w-6 h-6" />}
              />
              <SmallCard
                count={projects.active.length}
                title="Ongoing Projects"
                icon={<PlayCircle className="w-6 h-6 text-diaspora-blue" />}
              />
              <SmallCard
                count={projects.pending.length}
                title="Pending Projects"
                icon={<Clock className="w-6 h-6 text-amber-600" />}
              />
              <SmallCard
                count={projects.completed.length}
                title="Completed Projects"
                icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
              />
              <SmallCard
                count={projects.rejected.length}
                title="Rejected Projects"
                icon={<XCircle className="w-6 h-6 text-red-600" />}
              />
              <SmallCard
                count={projects.cancelled.length}
                title="Cancelled Projects"
                icon={<CircleSlash className="w-6 h-6 text-orange-600" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 mb-8">
              <ProjectStatusChart
                statusCounts={{
                  pending: projects.pending.length,
                  active: projects.active.length,
                  completed: projects.completed.length,
                  rejected: projects.rejected.length,
                  cancelled: projects.cancelled.length,
                }}
              />
              <TopProjectsByVolunteerInterest />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
              <RecentProjects
                userId={userId ?? ""}
                limitRows={5}
                viewAllHref={routes.agencyProjects}
              />
              <AgencyRequestFromVolunteer
                userId={userId ?? ""}
                limitRows={5}
                viewAllHref={routes.agencyRequests}
              />
            </div>
          </>
        )}

        {projectsError && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            {projectsError}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────

const SkeletonCards = ({ count }: { count: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6 mb-10">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="min-h-[100px] bg-white border border-slate-200 rounded-xl p-5 sm:p-6 animate-pulse shadow-sm"
      >
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-4" />
        <div className="h-8 bg-slate-200 rounded w-1/2" />
      </div>
    ))}
  </div>
);

export default AgencyDashboard;

