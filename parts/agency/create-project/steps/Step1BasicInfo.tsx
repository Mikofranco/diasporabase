"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { countWords } from "../schema";
import { MIN_DESCRIPTION_WORDS } from "../types";

interface Step1BasicInfoProps {
  title: string;
  description: string;
  errors: Record<string, string[] | undefined>;
  loading: boolean;
  onFieldChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function Step1BasicInfo({
  title,
  description,
  errors,
  loading,
  onFieldChange,
}: Step1BasicInfoProps) {
  const wordCount = countWords(description);
  const remaining = Math.max(MIN_DESCRIPTION_WORDS - wordCount, 0);
  const progress = Math.min((wordCount / MIN_DESCRIPTION_WORDS) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900">
          Basic project information
        </h3>
        <p className="text-sm text-gray-600">
          Give your project a clear title and a detailed description so
          volunteers immediately understand what you want to achieve.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">
          Project Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={onFieldChange}
          placeholder="e.g. Community Health Outreach in Lagos"
          disabled={loading}
          className="mt-1 h-11"
        />
        {errors.title?.[0] && (
          <p className="text-red-500 text-xs mt-1">{errors.title[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="description" className="text-base font-semibold">
            Project Description <span className="text-red-500">*</span>
          </Label>
          <div className="flex flex-col items-end">
            <span
              className={`text-xs font-medium ${
                wordCount >= MIN_DESCRIPTION_WORDS ? "text-green-600" : "text-gray-600"
              }`}
            >
              {wordCount} word{wordCount === 1 ? "" : "s"}
            </span>
            <span className="text-[11px] text-gray-500">
              {remaining > 0
                ? `${remaining} more word${remaining === 1 ? "" : "s"} to reach the minimum`
                : "Minimum reached – add more detail if you like"}
            </span>
          </div>
        </div>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={onFieldChange}
          placeholder="Describe the problem you are addressing, your goals, target beneficiaries, key activities, expected outcomes, and how volunteers will be involved. Aim for at least 150 words."
          disabled={loading}
          className="mt-1 min-h-[220px] resize-y"
        />
        <div className="mt-2 space-y-1">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-gray-500">
            A rich, detailed description helps attract the right volunteers and
            improves the success of your project.
          </p>
        </div>
        {errors.description?.[0] && (
          <p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>
        )}
      </div>
    </div>
  );
}
