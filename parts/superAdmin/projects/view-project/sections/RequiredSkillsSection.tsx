"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Project } from "../types";
import { expertiseData } from "@/data/expertise";
import { Badge } from "@/components/ui/badge";

interface RequiredSkillsSectionProps {
  project: Project;
  isAdmin: boolean;
  onEditClick: () => void;
}

// Resolve id (category, subcategory, or skill) to label from expertiseData
function getLabelForSkillId(id: string): string {
  for (const cat of expertiseData) {
    if (cat.id === id) return cat.label;
    for (const sub of cat.children) {
      if (sub.id === id) return sub.label;
      for (const skill of sub.subChildren) {
        if (skill.id === id) return skill.label;
      }
    }
  }
  return id;
}

// True if id is a leaf skill (appears in some sub.subChildren)
function isLeafSkillId(id: string): boolean {
  for (const cat of expertiseData) {
    for (const sub of cat.children) {
      if (sub.subChildren.some((s) => s.id === id)) return true;
    }
  }
  return false;
}

export function RequiredSkillsSection({
  project,
  isAdmin,
  onEditClick,
}: RequiredSkillsSectionProps) {
  const rawSkills = project.required_skills || [];
  const leafSkills = rawSkills.filter(isLeafSkillId);
  // For new data (from the SkillsSelector), we'll have leaf IDs; for older
  // projects that stored plain labels, fall back to raw values.
  const displayedSkills = leafSkills.length > 0 ? leafSkills : rawSkills;

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
                {getLabelForSkillId(id)}
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
