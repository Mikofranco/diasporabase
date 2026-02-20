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
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

const RecentProjects = ({ userId }: { userId: string }) => {
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
    router.push(routes.agencyViewProject(project.id));
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
              onRefresh={fetchProjects} // Pass refresh callback
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
              <Button
                variant="outline"
                className="mt-4"
                onClick={redirectToCreateProject}
                aria-label="Create a new project"
              >
                Create New Project
              </Button>
            </div>
          )
        )}
      </div>
      {projectToEdit && (
        <CreateProjectForm
          initialProject={projectToEdit}
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