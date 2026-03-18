"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { MilestonesPageContent } from "@/parts/agency/projects/view-projects.tsx/MilestonesPageContent";
import { checkIfUserIsInProject, checkIfUserIsProjectManager } from "@/services/projects";
import type { Volunteer } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const supabase = createClient();

export default function VolunteerProjectMilestonesPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [projectTitle, setProjectTitle] = useState<string>("");
  const [projectStatus, setProjectStatus] = useState<string>("");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isProjectManager, setIsProjectManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserInProject, setIsUserInProject] = useState(false);
  


  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: userId } = await getUserId();
      setCurrentUserId(userId ?? null);

      await checkIfUserIsProjectManager(userId, projectId);
      const isUserInProject = await checkIfUserIsInProject(userId, projectId);
      setIsUserInProject(isUserInProject);

      const { data: project, error: projErr } = await supabase
        .from("projects")
        .select("id, title, status")
        .eq("id", projectId)
        .single();

      if (projErr || !project) {
        if (!cancelled) setError("Project not found.");
        return;
      }

      const { data: vols } = await supabase
        .from("project_volunteers")
        .select("volunteer_id, profiles!volunteer_id(full_name, email)")
        .eq("project_id", projectId);

      const volList: Volunteer[] = (vols || []).map((v: any) => ({
        volunteer_id: v.volunteer_id,
        full_name: v.profiles?.full_name ?? "",
        email: v.profiles?.email ?? "",
        skills: [],
        availability: "",
        residence_country: "",
        volunteer_states: [],
        volunteer_countries: [],
        volunteer_lgas: [],
        average_rating: 0,
        joined_at: "",
      }));

      let pm = false;
      if (userId) {
        const { isManager } = await checkIfUserIsProjectManager(userId, projectId);
        pm = !!isManager;
      }
      if (!cancelled) {
        setProjectTitle((project as { title: string }).title ?? "Project");
        setProjectStatus((project as { status: string }).status ?? "");
        setVolunteers(volList);
        setIsProjectManager(pm);
      }
    }

    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6 text-center py-20 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <MilestonesPageContent
      projectId={projectId}
      projectTitle={projectTitle}
      role="volunteer"
      isUserInProject={isUserInProject}
      projectStatus={projectStatus}
      volunteers={volunteers}
      currentUserId={currentUserId}
      backHref={routes.volunteerViewProject(projectId)}
      isAgency={false}
      isProjectManager={isProjectManager}
    />
  );
}
