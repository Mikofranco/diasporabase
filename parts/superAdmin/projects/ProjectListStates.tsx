"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FolderOpen, AlertCircle, RefreshCw } from "lucide-react";

export function LoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse"
        >
          <div className="h-6 bg-gray-100 mx-5 mt-5 rounded w-16" />
          <div className="px-5 pt-4 space-y-2">
            <div className="h-5 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
          <div className="px-5 pb-4 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
          </div>
          <div className="px-5 pb-5">
            <div className="h-10 bg-gray-100 rounded-xl w-full" />
          </div>
        </div>
      ))}
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
