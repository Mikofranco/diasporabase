"use client";

import React from "react";
import { FileText } from "lucide-react";
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
      <div className="p-5">
        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
          {project.description || "No description provided."}
        </p>
      </div>
    </div>
  );
}
