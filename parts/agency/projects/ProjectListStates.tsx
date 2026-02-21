"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FolderPlus, AlertCircle, RefreshCw } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading projects..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Loader2 className="h-10 w-10 animate-spin text-sky-600 mb-4" />
      <p className="text-sm font-medium text-gray-600">{message}</p>
      <p className="text-xs text-gray-500 mt-1">This may take a moment</p>
    </div>
  );
}

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

interface EmptyStateProps {
  onCreateClick?: () => void;
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-sky-50 p-6 mb-4">
        <FolderPlus className="h-12 w-12 text-sky-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">No projects yet</h3>
      <p className="text-sm text-gray-600 mt-2 max-w-sm">
        Create your first project to start attracting volunteers and growing your impact.
      </p>
      {onCreateClick && (
        <Button
          onClick={onCreateClick}
          className="mt-6 rounded-xl bg-diaspora-blue hover:bg-diaspora-blue/90"
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          Create your first project
        </Button>
      )}
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
