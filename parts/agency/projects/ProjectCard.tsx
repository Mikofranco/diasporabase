"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AgencyProject {
  id: string;
  title: string;
  description: string;
  organization_id: string;
  organization_name: string;
  location?: string | Record<string, unknown>;
  start_date: string;
  end_date: string;
  volunteers_needed?: number;
  volunteers_registered: number;
  status: string;
  category: string;
  created_at: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  approved: {
    label: "Approved",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  completed: {
    label: "Completed",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

function getStatusConfig(status: string) {
  const key = (status || "pending").toLowerCase();
  return (
    STATUS_CONFIG[key] ?? {
      label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending",
      className: "bg-gray-100 text-gray-700 border-gray-200",
    }
  );
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
  project: AgencyProject;
  onViewDetails: (project: AgencyProject) => void;
  className?: string;
}

export function ProjectCard({
  project,
  onViewDetails,
  className,
}: ProjectCardProps) {
  const statusConfig = getStatusConfig(project.status);
  const volunteersNeeded = project.volunteers_needed ?? 0;

  return (
    <Card
      className={cn(
        "group flex flex-col border border-gray-200/80 bg-white rounded-xl overflow-hidden",
        "hover:shadow-lg hover:border-sky-200/60 transition-all duration-200",
        "cursor-pointer",
        className,
      )}
      onClick={() => onViewDetails(project)}
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
            onViewDetails(project);
          }}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
