"use client";

import React from "react";
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
import type { AgencyFilters as AgencyFiltersType, AgencyStatusFilter } from "./filters";

interface AgencyFiltersProps {
  filters: AgencyFiltersType;
  onFiltersChange: (f: AgencyFiltersType) => void;
  onApply: () => void;
  onClear: () => void;
  resultCount?: number;
  totalCount?: number;
}

export function AgencyFilters({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  resultCount,
  totalCount,
}: AgencyFiltersProps) {
  const update = (key: keyof AgencyFiltersType, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = filters.search.trim() || filters.status !== "all";

  const fieldClass = "space-y-1.5 w-full min-w-0 flex flex-col";
  const labelClass = "text-xs font-medium text-gray-600";
  const inputClass = "h-9 rounded-lg bg-white border border-gray-200";

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_140px_auto] gap-4 lg:gap-3 items-end">
        <div className={fieldClass}>
          <Label className={labelClass}>Search by organization or email</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Organization name or email..."
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
            onValueChange={(v) => update("status", v as AgencyStatusFilter)}
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
          Showing {resultCount} of {totalCount} agenc
          {totalCount !== 1 ? "ies" : "y"}
        </p>
      )}
    </div>
  );
}
