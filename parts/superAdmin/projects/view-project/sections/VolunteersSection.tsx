"use client";

import React from "react";
import Link from "next/link";
import { Mail, User, ChevronRight } from "lucide-react";
import { Project, VolunteerRow } from "../types";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface VolunteersSectionProps {
  project: Project;
  volunteers: VolunteerRow[];
  userRole?: string | null;
}

export function VolunteersSection({ project, volunteers, userRole }: VolunteersSectionProps) {
  const viewVolunteerHref = (volunteerId: string) => {
    const base =
      userRole === "super_admin"
        ? routes.superAdminViewVolunteer(volunteerId)
        : routes.adminViewVolunteer(volunteerId);
    const params = new URLSearchParams({
      from_project: project.id,
      from_project_title: project.title || "Project",
    });
    return `${base}?${params.toString()}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Volunteers</h3>
        <span className="text-sm font-medium text-gray-600">
          {project.volunteers_registered} / {project.volunteers_needed}
        </span>
      </div>
      <div className="p-5">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-diaspora-blue transition-all duration-300 rounded-full"
            style={{
              width: `${Math.min(
                project.volunteers_needed
                  ? (project.volunteers_registered / project.volunteers_needed) * 100
                  : 0,
                100
              )}%`,
            }}
          />
        </div>
        {volunteers.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No volunteers joined yet</p>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {volunteers.map((vol) => (
              <li key={vol.id}>
                <Link
                  href={viewVolunteerHref(vol.id)}
                  className={cn(
                    "flex items-center gap-3 py-2 px-3 rounded-lg border border-gray-100",
                    "bg-gray-50/80 hover:bg-diaspora-blue/5 hover:border-diaspora-blue/20",
                    "transition-colors cursor-pointer group"
                  )}
                  aria-label={`View ${vol.full_name} details`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-diaspora-blue/10 text-diaspora-blue group-hover:bg-diaspora-blue/20">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-diaspora-blue">
                      {vol.full_name}
                    </p>
                    {vol.email && (
                      <p className="flex items-center gap-1 text-xs text-gray-500 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        {vol.email}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(vol.joined_at).toLocaleDateString()}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 group-hover:text-diaspora-blue" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
