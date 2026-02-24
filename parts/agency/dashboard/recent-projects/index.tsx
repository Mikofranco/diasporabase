"use client";
import React, { useEffect, useState, useCallback } from "react";
import { RecentProjectsTable } from "./table";
import { supabase } from "@/lib/supabase/client";
import { Project } from "@/lib/types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateProjectForm from "@/parts/agency/create-project";
import type { ProjectForEdit } from "@/parts/agency/create-project/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { routes } from "@/lib/routes";

/** Map lib Project (optional fields) to CreateProjectForm's ProjectForEdit (required fields). */
function toProjectForEdit(p: Project): ProjectForEdit {
  return {
    id: p.id,
    title: p.title ?? "",
    description: p.description ?? "",
    start_date: p.start_date ?? p.startDate ?? "",
    end_date: p.end_date ?? p.endDate ?? "",
    category: p.category ?? "",
    required_skills: p.required_skills ?? p.requiredSkills ?? [],
    documents: p.documents ?? undefined,
    status: p.status,
    country: p.country ?? null,
    state: p.state ?? null,
    lga: p.lga ?? null,
    location: p.location ?? null,
  };
}

interface RecentProjectsProps {
  userId: string;
  /** When set, show only this many rows with "View all" link; no pagination or Add button. */
  limitRows?: number;
  viewAllHref?: string;
}

const RecentProjects = ({ userId, limitRows, viewAllHref }: RecentProjectsProps) => {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const router = useRouter();

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("projects")
        .select("*, milestones(*), deliverables(*)")
        .eq("organization_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch projects: ${error.message}`);
      }

      setProjects(data as Project[]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      fetchProjects();
    }

    return () => {
      isMounted = false;
    };
  }, [fetchProjects]);

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
  };

  const handleViewProject = (project: Project) => {
    window.location.href = routes.agencyViewProject(project.id);
  };

  const redirectToCreateProject = () => {
     toast.info("Redirecting to create a new project...");
    router.replace(routes.agencyProjects)
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6">
      <div aria-live="polite">
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <Skeleton
                key={index}
                className="h-12 w-full rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
        )}
        {error && (
          <div className="text-center py-8 rounded-lg bg-red-50 border border-red-100">
            <p className="text-red-700 mb-3">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProjects}
              className="border-red-200 text-red-700 hover:bg-red-100"
              aria-label="Retry loading projects"
            >
              Try Again
            </Button>
          </div>
        )}
        {!isLoading && projects && projects.length > 0 ? (
          <div className="overflow-x-auto">
            <RecentProjectsTable
              data={projects}
              onEdit={handleEditProject}
              onView={handleViewProject}
              onRefresh={fetchProjects}
              limitRows={limitRows}
              viewAllHref={viewAllHref}
              aria-label="Recent projects table"
            />
          </div>
        ) : (
          !isLoading &&
          !error && (
            <div className="text-center py-8">
              <PlusCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                No projects found.
              </p>
              {!limitRows && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={redirectToCreateProject}
                  aria-label="Create a new project"
                >
                  Create New Project
                </Button>
              )}
              {limitRows && viewAllHref && (
                <Link
                  href={viewAllHref}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground mt-4"
                >
                  View all projects
                </Link>
              )}
            </div>
          )
        )}
      </div>
      {projectToEdit && (
        <CreateProjectForm
          initialProject={toProjectForEdit(projectToEdit)}
          onClose={() => setProjectToEdit(null)}
          onProjectCreated={() => {
            fetchProjects();
            setProjectToEdit(null);
          }}
        />
      )}
    </section>
  );
};

export default React.memo(RecentProjects);