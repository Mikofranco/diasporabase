"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";
import SkillsetManagementPage from "./skillSetManagent";

export function SkillsetsSection() {
  return (
    <Card className="shadow-lg border border-gray-200/80 overflow-hidden animate-in fade-in-50 duration-200 rounded-xl bg-white">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/30 px-6 py-5">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0284C7] ring-1 ring-[#0EA5E9]/20">
            <Layers className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">
              Manage Skillsets
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Add, edit or remove skills and categories used across the platform.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <SkillsetManagementPage />
      </CardContent>
    </Card>
  );
}
