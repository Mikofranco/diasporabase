"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Project } from "../types";

interface BasicInfoSectionProps {
  project: Project;
  statusStyle: { label: string; className: string };
  approvedByName: string | null;
}

export function BasicInfoSection({
  project,
  statusStyle,
  approvedByName,
}: BasicInfoSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Basic Information</h3>
      </div>
      <div className="p-5 space-y-4 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Status</span>
          <span
            className={cn(
              "font-medium px-2.5 py-1 rounded-lg text-xs border",
              statusStyle.className
            )}
          >
            {statusStyle.label}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Category</span>
          <span className="font-medium">{project.category}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Created</span>
          <span className="font-medium">
            {new Date(project.created_at).toLocaleDateString()}
          </span>
        </div>
        {project.updated_at && (
          <div className="flex justify-between">
            <span className="text-gray-600">Last updated</span>
            <span className="font-medium">
              {new Date(project.updated_at).toLocaleDateString()}
            </span>
          </div>
        )}
        {["active", "approved"].includes((project.status || "").toLowerCase()) &&
          approvedByName && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Approved by</span>
              <span className="font-medium">{approvedByName}</span>
            </div>
          )}
      </div>
    </div>
  );
}
