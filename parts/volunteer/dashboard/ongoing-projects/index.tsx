import React from "react";
import { useFetchOngoingProjects } from "@/services/volunteer/dashboard";
import { Project } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { BlueCircleSmaall } from "@/public/icon";
import OngoingProjectItem from "./ongoingProject-item";
import { Skeleton } from "@/components/ui/skeleton";

const OngoingProjects = () => {
  const { ongoingProjectdata, ongoingProjectError, ongoingProjectIsLoading } =
    useFetchOngoingProjects();

  if (ongoingProjectIsLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {Array(3)
          .fill(0)
          .map((_, index) => (
            <Skeleton className="h-20 w-full" key={index} />
          ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 shadow-sm border rounded-lg p-4 bg-white">
      <h2 className="text-gray-600 font-bold mb-6">Ongoing Projects</h2>
      {ongoingProjectdata?.length === 0 && (
        <p className="text-gray-500 text-center font-semibold">
          No ongoing projects found.
        </p>
      )}
      {ongoingProjectdata?.slice(0, 3).map((project: Project) => (
        <OngoingProjectItem
          key={project.id}
          projectId={project.id}
          icon={<BlueCircleSmaall />}//@ts-ignore
          organization_name={project.organization_name || "Unknown Organization"}
          title={project.title || "Untitled Project"}
          location={project.location || ""}//@ts-ignore
          startDate={project.start_date || ""}
        />
      ))}
    </div>
  );
};

export default OngoingProjects;
