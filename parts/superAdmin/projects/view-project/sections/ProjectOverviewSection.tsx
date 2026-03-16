"use client";

import React from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Project } from "../types";

interface ProjectOverviewSectionProps {
  project: Project;
}

export function ProjectOverviewSection({ project }: ProjectOverviewSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <FileText className="h-5 w-5 text-diaspora-blue" />
        <h2 className="text-lg font-semibold text-gray-900">Project Overview</h2>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
          {project.description || "No description provided."}
        </p>

        {project.status === "completed" &&
          (project.closing_remarks || project.completed_project_link) && (
            <div className="mt-2 rounded-lg border border-diaspora-blue/20 bg-blue-50/70 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-diaspora-blue">
                Project Outcome
              </h3>

              {project.closing_remarks && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700">
                    Closing Remarks
                  </p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                    {project.closing_remarks}
                  </p>
                </div>
              )}

              {project.completed_project_link && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700">
                    Outcome Link
                  </p>
                  <a
                    href={project.completed_project_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-diaspora-darkBlue hover:underline break-all"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Project Outcome
                  </a>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
