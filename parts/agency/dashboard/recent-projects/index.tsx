"use client";
import React, { useEffect, useState, useCallback } from "react";
import { RecentProjectsTable } from "./table";
import { supabase } from "@/lib/supabase/client";
import { Project } from "@/lib/types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditProjectDialogue from "@/components/dialogues/edit-project";
import ViewProjectDialogue from "@/components/dialogues/view-project";


const RecentProjects = ({ userId }: { userId: string }) => {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);

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
      toast.success("Projects loaded successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
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
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setIsViewModalOpen(true);
  };

  return (
    <section className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
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
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <Button
                variant="link"
                onClick={fetchProjects}
                className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                aria-label="Retry loading projects"
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
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
                onClick={() => {
                  toast.info("Redirecting to create a new project...");
                }}
                aria-label="Create a new project"
              >
                Create New Project
              </Button>
            </div>
          )
        )}
      </div>
      {isEditModalOpen && (
        <EditProjectDialogue
          project={selectedProject}
          isOpen={isEditModalOpen}
          setIsOpen={setIsEditModalOpen}
        />
      )}
      {isViewModalOpen && (
        <ViewProjectDialogue
          project={selectedProject}
          isOpen={isViewModalOpen}
          setIsOpen={setIsViewModalOpen}
        />
      )}
    </section>
  );
};

export default React.memo(RecentProjects);