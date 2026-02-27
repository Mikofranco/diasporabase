"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight, ListTodo } from "lucide-react";
import { format } from "date-fns";
import type { MilestoneSectionMilestone } from "./milestone-types";
import { milestoneStatusLabel } from "./milestone-types";

const DESCRIPTION_TRUNCATE = 100;

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

interface MilestoneCardProps {
  milestone: MilestoneSectionMilestone;
  viewDetailsHref: string;
  className?: string;
}

export function MilestoneCard({
  milestone,
  viewDetailsHref,
  className,
}: MilestoneCardProps) {
  const count = milestone.deliverables?.length ?? 0;
  const truncatedDescription = milestone.description
    ? milestone.description.length > DESCRIPTION_TRUNCATE
      ? milestone.description.slice(0, DESCRIPTION_TRUNCATE) + "…"
      : milestone.description
    : null;

  return (
    <Card
      className={`overflow-hidden transition-shadow hover:shadow-md ${className ?? ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {milestone.title}
            </h3>
            {truncatedDescription && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {truncatedDescription}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <ListTodo className="h-4 w-4 shrink-0" />
                {count} Deliverable{count !== 1 ? "s" : ""}
              </span>
              {milestone.due_date && (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {format(new Date(milestone.due_date), "MMM d, yyyy")}
                </span>
              )}
              <Badge className={getStatusColor(milestone.status)} variant="secondary">
                {milestoneStatusLabel(milestone.status)}
              </Badge>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 w-full sm:w-auto border-diaspora-darkBlue text-diaspora-darkBlue hover:bg-diaspora-darkBlue/10"
          >
            <Link href={viewDetailsHref} className="inline-flex items-center gap-1">
              View Details
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0" />
    </Card>
  );
}
