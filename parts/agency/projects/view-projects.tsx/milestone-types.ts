/** Status values stored in DB (milestones/deliverables). */
export type MilestoneStatusDb = "Pending" | "In Progress" | "Done" | "Cancelled";

/** Display label for status (e.g. "Completed" instead of "Done"). */
export function milestoneStatusLabel(status: string): string {
  return status === "Done" ? "Completed" : status;
}

export interface MilestoneSectionDeliverable {
  id?: string;
  title: string;
  description?: string | null;
  due_date: string;
  status: MilestoneStatusDb;
  milestone_id?: string;
  assigned_to?: string | null;
}

export interface MilestoneSectionMilestone {
  id?: string;
  title: string;
  description?: string | null;
  due_date: string;
  status: MilestoneStatusDb;
  project_id?: string;
  deliverables: MilestoneSectionDeliverable[];
}

export type MilestoneRole = "agency" | "volunteer";
