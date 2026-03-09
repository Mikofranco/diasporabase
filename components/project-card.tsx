import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Calendar, Users, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { getProjectStatusStyle } from "@/parts/agency/projects/filters";

export interface Project {
  id: string;
  title: string;
  organization_name?: string;
  description: string;
  start_date: string;
  end_date: string;
  category: string;
  volunteers_registered: number;
  volunteers_needed: number;
  status: string;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

interface ProjectCardProps {
  project: Project;
  handleProjectSelect: (project: Project) => void;
  className?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  handleProjectSelect,
  className,
}) => {
  const statusConfig = getProjectStatusStyle(project.status);
  const volunteersNeeded = project.volunteers_needed ?? 0;

  return (
    <Card
      className={cn(
        "group flex flex-col border border-gray-200/80 bg-white rounded-xl overflow-hidden",
        "hover:shadow-lg hover:border-sky-200/60 transition-all duration-200",
        "cursor-pointer",
        className,
      )}
      onClick={() => handleProjectSelect(project)}
    >
      <div className="px-5 pt-4 pb-1 flex items-start justify-between gap-2">
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-xs font-medium border",
            statusConfig.className,
          )}
        >
          {statusConfig.label}
        </Badge>
        <Badge variant="secondary" className="text-xs font-normal">
          {project.category}
        </Badge>
      </div>

      <CardHeader className="pt-2 pb-1 px-5">
        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
          {project.title}
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          {project.organization_name}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 px-5 pt-2 pb-4 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {project.description}
        </p>

        <div className="space-y-2.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-sky-600" />
            <span>
              {formatDate(project.start_date)} – {formatDate(project.end_date)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-sky-600" />
            <span>
              {project.volunteers_registered}
              {volunteersNeeded > 0 ? ` / ${volunteersNeeded}` : ""} volunteers
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0">
        <Button
          type="button"
          className="w-full rounded-xl bg-diaspora-blue hover:bg-diaspora-blue/90 text-white font-medium shadow-sm group-hover:shadow-md transition-shadow"
          onClick={(e) => {
            e.stopPropagation();
            handleProjectSelect(project);
          }}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
