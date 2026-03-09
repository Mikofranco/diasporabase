"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, AlertCircle, RefreshCw } from "lucide-react";

export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Status count cards (6 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 flex-1 max-w-[80px]" />
            </div>
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Filters section */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <Skeleton className="h-10 flex-1 min-w-[200px] max-w-xs rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20 rounded-lg" />
            <Skeleton className="h-10 w-20 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Project cards grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden"
          >
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <div className="flex gap-4 pt-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-sky-50 p-6 mb-4">
        <FolderOpen className="h-12 w-12 text-sky-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">No projects found</h3>
      <p className="text-sm text-gray-600 mt-2 max-w-sm">
        No projects match your filters. Try adjusting or clearing filters to see more results.
      </p>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-red-50 p-6 mb-4">
        <AlertCircle className="h-12 w-12 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">Something went wrong</h3>
      <p className="text-sm text-gray-600 mt-2 max-w-md">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="mt-6 rounded-xl border-gray-300"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
