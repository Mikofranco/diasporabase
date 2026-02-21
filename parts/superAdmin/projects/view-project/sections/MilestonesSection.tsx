"use client";

import React from "react";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { MilestoneWithDeliverables } from "../types";

interface MilestonesSectionProps {
  milestones: MilestoneWithDeliverables[];
}

export function MilestonesSection({ milestones }: MilestonesSectionProps) {
  if (milestones.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Flag className="h-5 w-5 text-diaspora-blue" />
        <h3 className="font-semibold text-gray-900">Milestones</h3>
      </div>
      <div className="p-5 space-y-6">
        {milestones.map((m) => (
          <div
            key={m.id}
            className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-gray-900">{m.title}</span>
              {m.status && (
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    m.status?.toLowerCase() === "completed"
                      ? "bg-green-100 text-green-800"
                      : m.status?.toLowerCase() === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-700"
                  )}
                >
                  {m.status}
                </span>
              )}
              {m.due_date && (
                <span className="text-xs text-gray-500">
                  Due: {new Date(m.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
            {m.description?.trim() && (
              <p className="text-sm text-gray-600">{m.description}</p>
            )}
            {m.deliverables?.length > 0 && (
              <ul className="ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                {m.deliverables.map((d) => (
                  <li key={d.id} className="text-sm">
                    <span className="font-medium text-gray-800">{d.title}</span>
                    {d.due_date && (
                      <span className="text-gray-500 ml-2 text-xs">
                        Due: {new Date(d.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {d.status && (
                      <span
                        className={cn(
                          "ml-2 text-xs px-1.5 py-0.5 rounded",
                          d.status?.toLowerCase() === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {d.status}
                      </span>
                    )}
                    {d.description?.trim() && (
                      <p className="text-gray-600 mt-0.5">{d.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
