"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Project } from "../types";
import { Badge } from "@/components/ui/badge";
import { useSkillLabels } from "@/hooks/useSkillLabels";

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
  const { getLabel } = useSkillLabels();
  const displayedSkills = project.required_skills || [];

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
        {displayedSkills.length ? (
          <div className="flex flex-wrap gap-2">
            {displayedSkills.map((id, index) => (
              <Badge
                key={`${id}-${index}`}
                variant="secondary"
                className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full border border-gray-200"
              >
                {getLabel(id)}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No specific skills required</p>
        )}
      </div>
    </div>
  );
}
