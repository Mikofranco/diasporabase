"use client";

import React from "react";
import { Ban } from "lucide-react";
import { Project } from "../types";

interface CancellationSectionProps {
  project: Project;
  cancelledByName: string | null;
}

export function CancellationSection({
  project,
  cancelledByName,
}: CancellationSectionProps) {
  const hasCancellation =
    project.cancelled_reason?.trim() || project.cancelled_at;
  if (!hasCancellation) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-amber-100 flex items-center gap-2">
        <Ban className="h-5 w-5 text-amber-600" />
        <h3 className="font-semibold text-gray-900">Cancellation details</h3>
      </div>
      <div className="p-5 space-y-2 text-sm">
        <p className="text-gray-700">
          {project.cancelled_reason?.trim() || "No reason provided."}
        </p>
        {project.cancelled_at && (
          <p className="text-xs text-gray-500">
            Cancelled on{" "}
            {new Date(project.cancelled_at).toLocaleString()}
          </p>
        )}
        {cancelledByName && (
          <p className="text-xs text-gray-600">
            Cancelled by:{" "}
            <span className="font-medium">{cancelledByName}</span>
          </p>
        )}
      </div>
    </div>
  );
}
