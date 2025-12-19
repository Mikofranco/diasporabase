import ProjectCard from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Project } from "@/lib/types";
import { useFetchSkillMatchedProjects } from "@/services/volunteer/dashboard";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const MatchingProjects = () => {
  const {
    skillMatchedProjectError,
    skillMatchedProjectIsLoading,
    skillMatchedProjectdata,
  } = useFetchSkillMatchedProjects();
  const router = useRouter();

  const handleProjectSelect = (projectId: string) => {
    router.push(`/dashboard/volunteer/projects/${projectId}`);
  };

  const handleViewAll = () => {
    router.push(`/dashboard/volunteer/matching-projects`);
  };

  return (
    <div className="flex flex-col gap-2 shadow-sm border rounded-lg p-4 bg-white">
      <div className=" items-center justify-between flex mb-4">
        <h2 className="text-gray-600 font-bold mb-6">Matching Projects</h2>
        {
          //@ts-ignore
          skillMatchedProjectdata?.length > 3 && (
            <Button
              variant={"link"}
              className="text-[#0ea5e9]"
              onClick={handleViewAll}
            >
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          )
        }
      </div>

      {skillMatchedProjectIsLoading && (
        <div
          className="flex justify-center items-center py-4"
          aria-live="polite"
        >
          <div
            className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"
            role="status"
          >
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}

      {skillMatchedProjectError && (
        <div
          className="text-gray-500 text-center py-4 h-[250px]"
          aria-live="polite"
        >
          No matching projects found
        </div>
      )}

      {!skillMatchedProjectIsLoading &&
        !skillMatchedProjectError &&
        (!skillMatchedProjectdata || skillMatchedProjectdata.length === 0) && (
          <div
            className="text-gray-500 text-center py-4 h-[250px]"
            aria-live="polite"
          >
            No matching projects found
          </div>
        )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skillMatchedProjectdata?.slice(0, 3).map((project: Project) => (
          <ProjectCard
            key={project.id}
            handleProjectSelect={() => handleProjectSelect(project.id)} //@ts-ignore
            project={project}
            className="transition-transform duration-200 hover:scale-105"
          />
        ))}
      </div>
    </div>
  );
};

export default MatchingProjects;
