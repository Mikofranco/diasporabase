"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SkillsSelector, { type SelectedSkillsData } from "@/components/skill-selector";
import type { SkillsSelectorHandle } from "@/components/skill-selector";
import { CATEGORIES } from "../types";

interface Step3CategorySkillsProps {
  category: string;
  requiredSkills: string[];
  errors: Record<string, string[] | undefined>;
  loading: boolean;
  skillsSelectorRef: React.RefObject<SkillsSelectorHandle>;
  onCategoryChange: (v: string) => void;
  onSkillsChange: (data: SelectedSkillsData) => void;
}

export function Step3CategorySkills({
  category,
  requiredSkills,
  errors,
  loading,
  skillsSelectorRef,
  onCategoryChange,
  onSkillsChange,
}: Step3CategorySkillsProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Category & Needed Skills
          </h3>
          <p className="text-sm text-gray-600">
            Help volunteers quickly understand the type of work and the skills
            required to contribute effectively.
          </p>
        </div>
        <Label htmlFor="category" className="text-base font-semibold">
          Project Category <span className="text-red-500">*</span>
        </Label>
        <Select
          value={category}
          onValueChange={onCategoryChange}
          disabled={loading}
        >
          <SelectTrigger className="mt-1 h-11">
            <SelectValue placeholder="Select a category for your project" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c, idx) => (
              <SelectItem key={`${c}-${idx}`} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category?.[0] && (
          <p className="text-red-500 text-xs mt-1">{errors.category[0]}</p>
        )}
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label className="text-base font-semibold">
          Needed Skills <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-600 mb-2">
          Select the skills and expertise needed for this project. This helps
          match your project with qualified volunteers who are best suited to
          support your work.
        </p>
        <SkillsSelector
          ref={skillsSelectorRef as React.Ref<SkillsSelectorHandle>}
          onSelectionChange={onSkillsChange}
        />
        {errors.required_skills?.[0] && (
          <p className="text-red-500 text-xs mt-2">
            {errors.required_skills[0]}
          </p>
        )}
        {requiredSkills.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 font-medium">
              {requiredSkills.length} skill
              {requiredSkills.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
