import ProjectCard from "@/components/project-card";
import { Project } from "@/lib/types";
import { useFetchSkillMatchedProjects } from "@/services/volunteer/dashboard";
import React from "react";

const MatchingProjects = () => {
  const { skillMatchedProjectError, skillMatchedProjectIsLoading, skillMatchedProjectdata } = useFetchSkillMatchedProjects();

  const handleProjectSelect = (projectId: string) => {
    // Implement project selection logic (e.g., navigate to project details or trigger action)
    console.log(`Selected project: ${projectId}`);
  };

  return (
    <div className="flex flex-col gap-2 shadow-sm border rounded-lg p-4 bg-white">
      <h2 className="text-gray-600 font-bold">Matching Projects</h2>
      {skillMatchedProjectIsLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}

      {skillMatchedProjectError && (
        <div className="text-red-600 text-center py-4" role="alert">
          Error: {skillMatchedProjectError || "Failed to load projects"}
        </div>
      )}

      {!skillMatchedProjectIsLoading && !skillMatchedProjectError && (!skillMatchedProjectdata || skillMatchedProjectdata.length === 0) && (
        <div className="text-gray-500 text-center py-4">
          No matching projects found
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {skillMatchedProjectdata?.map((project: Project) => (
          <ProjectCard
            key={project.id}
            handleProjectSelect={() => handleProjectSelect(project.id)}//@ts-ignore
            project={project}
            className="transition-transform duration-200 hover:scale-105"
          />
        ))}
      </div>
    </div>
  );
};

export default MatchingProjects;