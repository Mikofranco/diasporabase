"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { MilestoneCard } from "./MilestoneCard";
import type { MilestoneSectionMilestone } from "./milestone-types";
import type { Volunteer } from "@/lib/types";
import Link from "next/link";

const supabase = createClient();

interface MilestonesSectionProps {
  projectId: string;
  /** When true, user can add/edit milestones (agency/PM). */
  canEdit?: boolean;
  volunteers: Volunteer[];
  /** When false, Add Milestone button is disabled. */
  canAddMilestone?: boolean;
  /** Full URL to the dedicated milestones page (e.g. agency or volunteer route). */
  milestonesPageHref: string;
}

export function MilestonesSection({
  projectId,
  canEdit = true,
  canAddMilestone = true,
  milestonesPageHref,
}: MilestonesSectionProps) {
  const [milestones, setMilestones] = useState<MilestoneSectionMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    setLoading(true);
    const { data: milestonesData } = await supabase
      .from("milestones")
      .select("*")
      .eq("project_id", projectId)
      .order("due_date");

    if (milestonesData?.length) {
      const milestoneIds = milestonesData.map((m: { id: string }) => m.id);
      const { data: deliverablesData } = await supabase
        .from("deliverables")
        .select("*")
        .in("milestone_id", milestoneIds);

      const deliverablesMap = (deliverablesData || []).reduce(
        (acc: Record<string, MilestoneSectionMilestone["deliverables"]>, d: any) => {
          if (!acc[d.milestone_id]) acc[d.milestone_id] = [];
          acc[d.milestone_id].push(d);
          return acc;
        },
        {},
      );

      const fullMilestones: MilestoneSectionMilestone[] = milestonesData.map((m: any) => ({
        ...m,
        deliverables: deliverablesMap[m.id] || [],
      }));
      setMilestones(fullMilestones);
    } else {
      setMilestones([]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-9 w-24" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Milestones Defined
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add milestones and deliverables to track progress.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {canEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      asChild
                      disabled={!canAddMilestone}
                      variant="outline"
                      className="border-diaspora-darkBlue text-diaspora-darkBlue hover:bg-diaspora-darkBlue/10"
                    >
                      <Link href={milestonesPageHref}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Milestone
                      </Link>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {!canAddMilestone
                    ? "Milestones can be added when the project is Pending, Approved, or Active."
                    : "Go to milestones page to add one"}
                </TooltipContent>
              </Tooltip>
            )}
            <Button asChild variant="default" size="sm" className="bg-diaspora-darkBlue hover:bg-diaspora-darkBlue/90">
              <Link href={milestonesPageHref}>View milestones</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-foreground">
          Project Milestones &amp; Deliverables
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button
                    asChild
                    disabled={!canAddMilestone}
                    variant="outline"
                    size="sm"
                    className="border-diaspora-darkBlue text-diaspora-darkBlue hover:bg-diaspora-darkBlue/10"
                  >
                    <Link href={milestonesPageHref}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Milestone
                    </Link>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {!canAddMilestone
                  ? "Milestones can be added when the project is Pending, Approved, or Active."
                  : "Add a new milestone"}
              </TooltipContent>
            </Tooltip>
          )}
          <Button asChild variant="default" size="sm" className="bg-diaspora-darkBlue hover:bg-diaspora-darkBlue/90">
            <Link href={milestonesPageHref}>View all</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {milestones.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            viewDetailsHref={`${milestonesPageHref}?milestone=${milestone.id}`}
          />
        ))}
      </div>
    </div>
  );
}
