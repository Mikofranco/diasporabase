"use client";

import React, { useRef } from "react";
import { format, parse } from "date-fns";
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
import { Search, RotateCcw, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectFilters } from "./filters";
import {
  PROJECT_STATUSES,
  CATEGORY_OPTIONS,
} from "./filters";

function NativeDateTrigger({
  value,
  placeholder,
  onChange,
  className,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayText = value
    ? format(parse(value, "yyyy-MM-dd", new Date()), "MMM d, yyyy")
    : placeholder;

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full opacity-0 pointer-events-none [color-scheme:light]"
        aria-hidden
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.showPicker?.() ?? inputRef.current?.focus()}
        className={cn(
          "flex h-9 w-full cursor-pointer items-center rounded-lg border border-gray-200 bg-white px-3 text-left text-sm font-normal shadow-none hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
          !value && "text-muted-foreground",
          className
        )}
        aria-label={placeholder}
        title={placeholder}
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-gray-500" aria-hidden />
        <span className="truncate">{displayText}</span>
      </button>
    </div>
  );
}

interface ProjectsFiltersProps {
  filters: ProjectFilters;
  onFiltersChange: (f: ProjectFilters) => void;
  onApply: () => void;
  onClear: () => void;
  resultCount?: number;
  totalCount?: number;
}

export function ProjectsFilters({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  resultCount,
  totalCount,
}: ProjectsFiltersProps) {
  const update = (key: keyof ProjectFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.status ||
    filters.category ||
    filters.title ||
    filters.startDate ||
    filters.endDate;

  const fieldClass = "space-y-1.5 w-full min-w-0 flex flex-col";
  const labelClass = "text-xs font-medium text-gray-600";
  const inputClass = "h-9 rounded-lg bg-white border border-gray-200";
  const dateButtonClass =
    "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-left text-sm font-normal shadow-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0";

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_140px_1fr_160px_160px_auto] gap-4 lg:gap-3 items-end">
        <div className={fieldClass}>
          <Label className={labelClass}>Search by title</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Project title..."
              value={filters.title}
              onChange={(e) => update("title", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onApply()}
              className={`pl-9 ${inputClass}`}
            />
          </div>
        </div>

        <div className={fieldClass}>
          <Label className={labelClass}>Status</Label>
          <Select
            value={filters.status || "all"}
            onValueChange={(v) => update("status", v === "all" ? "" : v)}
          >
            <SelectTrigger className={inputClass}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {PROJECT_STATUSES.filter((s) => s.value).map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={fieldClass}>
          <Label className={labelClass}>Category</Label>
          <Select
            value={filters.category || "all"}
            onValueChange={(v) => update("category", v === "all" ? "" : v)}
          >
            <SelectTrigger className={inputClass}>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORY_OPTIONS.filter((c) => c.value).map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={fieldClass}>
          <Label className={labelClass} title="Projects starting on or after this date">
            Start date
          </Label>
          <NativeDateTrigger
            value={filters.startDate}
            placeholder="Pick start date"
            onChange={(v) => update("startDate", v)}
            className={dateButtonClass}
          />
        </div>

        <div className={fieldClass}>
          <Label className={labelClass} title="Projects ending on or before this date">
            End date
          </Label>
          <NativeDateTrigger
            value={filters.endDate}
            placeholder="Pick end date"
            onChange={(v) => update("endDate", v)}
            className={dateButtonClass}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap lg:flex-shrink-0 lg:ml-1 col-span-1 sm:col-span-2 lg:col-span-1">
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
          Showing {resultCount} of {totalCount} project
          {totalCount !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
