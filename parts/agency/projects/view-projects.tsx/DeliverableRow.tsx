"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { MilestoneSectionDeliverable } from "./milestone-types";
import { milestoneStatusLabel } from "./milestone-types";

function getStatusColor(status: string) {
  switch (status) {
    case "Done":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "In Progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "Pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "Cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
}

interface DeliverableRowProps {
  deliverable: MilestoneSectionDeliverable;
  assignedToName: string | null;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  /** Use card layout on small screens when true. */
  useCardOnMobile?: boolean;
}

export function DeliverableRow({
  deliverable,
  assignedToName,
  canEdit,
  onEdit,
  onDelete,
  useCardOnMobile = true,
}: DeliverableRowProps) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground truncate">{deliverable.title}</p>
        <p className="text-sm text-muted-foreground truncate">
          {assignedToName ?? "Unassigned"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
        {deliverable.due_date && (
          <span>{format(new Date(deliverable.due_date), "MMM d, yyyy")}</span>
        )}
        <Badge className={getStatusColor(deliverable.status)} variant="secondary">
          {milestoneStatusLabel(deliverable.status)}
        </Badge>
      </div>
      {canEdit && (
        <div className="flex shrink-0 gap-1">
          <Button type="button" size="icon" variant="ghost" onClick={onEdit} aria-label="Edit">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={onDelete} aria-label="Delete" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );

  if (useCardOnMobile) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:gap-4">
        {content}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b py-3 last:border-0 sm:gap-4">
      {content}
    </div>
  );
}
