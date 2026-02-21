"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { VolunteerFilters as VolunteerFiltersType, VolunteerStatusFilter } from "./filters";

interface VolunteerFiltersProps {
  filters: VolunteerFiltersType;
  onFiltersChange: (f: VolunteerFiltersType) => void;
  onApply: () => void;
  onClear: () => void;
  resultCount?: number;
  totalCount?: number;
}

interface SkillOption {
  id: string;
  label: string;
}

export function VolunteerFilters({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  resultCount,
  totalCount,
}: VolunteerFiltersProps) {
  const [skillOptions, setSkillOptions] = useState<SkillOption[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("skillsets")
        .select("id, label")
        .order("label");
      if (data) {
        setSkillOptions(data.map((r) => ({ id: r.id, label: r.label })));
      }
    };
    load();
  }, []);

  const update = (key: keyof VolunteerFiltersType, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.search.trim() ||
    filters.status !== "all" ||
    filters.skill !== "";

  const fieldClass = "space-y-1.5 w-full min-w-0 flex flex-col";
  const labelClass = "text-xs font-medium text-gray-600";
  const inputClass = "h-9 rounded-lg bg-white border border-gray-200";

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_140px_1fr_auto] gap-4 lg:gap-3 items-end">
        <div className={fieldClass}>
          <Label className={labelClass}>Search by name or email</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Name or email..."
              value={filters.search}
              onChange={(e) => update("search", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onApply()}
              className={`pl-9 ${inputClass}`}
            />
          </div>
        </div>

        <div className={fieldClass}>
          <Label className={labelClass}>Status</Label>
          <Select
            value={filters.status}
            onValueChange={(v) => update("status", v as VolunteerStatusFilter)}
          >
            <SelectTrigger className={inputClass}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={fieldClass}>
          <Label className={labelClass}>Skill</Label>
          <Select
            value={filters.skill || "all"}
            onValueChange={(v) => update("skill", v === "all" ? "" : v)}
          >
            <SelectTrigger className={inputClass}>
              <SelectValue placeholder="All skills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All skills</SelectItem>
              {skillOptions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap lg:flex-shrink-0 col-span-1 sm:col-span-2 lg:col-span-1">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-9 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Clear
            </Button>
          )}
          <Button
            type="button"
            onClick={onApply}
            className="h-9 rounded-lg bg-diaspora-blue hover:bg-diaspora-blue/90 flex-1 sm:flex-none min-w-0"
          >
            Apply filters
          </Button>
        </div>
      </div>

      {typeof resultCount === "number" && typeof totalCount === "number" && (
        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
          Showing {resultCount} of {totalCount} volunteer
          {totalCount !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
