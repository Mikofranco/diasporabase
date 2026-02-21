"use client";

import React from "react";
import { Calendar, MapPin } from "lucide-react";
import { Project } from "../types";

interface TimelineLocationSectionProps {
  project: Project;
}

export function TimelineLocationSection({ project }: TimelineLocationSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Timeline & Location</h3>
      </div>
      <div className="p-5 space-y-4 text-sm">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-gray-500" />
          <div>
            <p className="font-medium">
              {new Date(project.start_date).toLocaleDateString()} —{" "}
              {new Date(project.end_date).toLocaleDateString()}
            </p>
            <p className="text-gray-500 text-xs">
              {new Date(project.end_date) < new Date() ? "Ended" : "Ongoing"}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
          <div>
            <p className="font-medium">
              {project.country}
              {project.state && `, ${project.state}`}
              {project.lga && `, ${project.lga}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
