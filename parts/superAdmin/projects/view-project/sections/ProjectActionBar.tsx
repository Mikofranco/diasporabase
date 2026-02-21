"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectActionBarProps {
  status: string;
  isApprovingProject: boolean;
  isCancellingProject: boolean;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
}

export function ProjectActionBar({
  status,
  isApprovingProject,
  isCancellingProject,
  onApprove,
  onReject,
  onCancel,
}: ProjectActionBarProps) {
  const s = (status || "").toLowerCase();
  const isPending = s === "pending";
  const isRejectedOrCancelled = s === "rejected" || s === "cancelled";
  const isActiveOrApproved = s === "active" || s === "approved";

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {(isPending || isRejectedOrCancelled) && (
        <>
          <Button
            disabled={isApprovingProject || isRejectedOrCancelled}
            onClick={onApprove}
            size="sm"
            className={cn(
              "rounded-xl gap-2 font-medium h-10 px-5",
              "bg-emerald-600 text-white hover:bg-emerald-700",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            {isApprovingProject ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            {isApprovingProject ? "Approving…" : "Approve Project"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isRejectedOrCancelled}
            onClick={onReject}
            className={cn(
              "rounded-xl gap-2 font-medium h-10 px-5",
              "border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            <XCircle className="h-4 w-4 shrink-0" />
            Reject Project
          </Button>
        </>
      )}
      {isActiveOrApproved && (
        <Button
          variant="outline"
          size="sm"
          disabled={isCancellingProject}
          onClick={onCancel}
          className={cn(
            "rounded-xl gap-2 font-medium h-10 px-5",
            "border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-400",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {isCancellingProject ? (
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          ) : (
            <Ban className="h-4 w-4 shrink-0" />
          )}
          {isCancellingProject ? "Cancelling…" : "Cancel Project"}
        </Button>
      )}
    </div>
  );
}
