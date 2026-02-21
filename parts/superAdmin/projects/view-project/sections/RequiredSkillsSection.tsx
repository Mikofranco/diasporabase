"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Project } from "../types";

interface RequiredSkillsSectionProps {
  project: Project;
  isAdmin: boolean;
  onEditClick: () => void;
}

export function RequiredSkillsSection({
  project,
  isAdmin,
  onEditClick,
}: RequiredSkillsSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Required Skills</h3>
        {isAdmin && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-gray-500 hover:text-diaspora-blue hover:bg-diaspora-blue/5"
            onClick={onEditClick}
            aria-label="Edit required skills"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="p-5">
        {project.required_skills?.length ? (
          <div className="flex flex-wrap gap-2">
            {project.required_skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full border border-gray-200"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No specific skills required</p>
        )}
      </div>
    </div>
  );
}
