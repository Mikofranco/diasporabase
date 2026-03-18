import { Profile } from "@/lib/types";

export interface Project {
  id: string;
  title: string;
  description: string;
  organization_id: string;
  organization_name: string;
  location: { country: string; state: string; lga: string } | null;
  start_date: string;
  end_date: string;
  volunteers_registered: number;
  volunteers_needed: number;
  status: string;
  category: string;
  required_skills: string[];
  country: string;
  state: string;
  lga: string;
  created_at: string;
  updated_at: string;
  cancelled_reason?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  approved_by?: string | null;
  documents?: Array<{ title: string; url: string }>;
  organization?: Profile | null;
  closing_remarks?: string | null;
  completed_project_link?: string | null;
}

export interface RejectionReasonRow {
  id: string;
  reason_text: string;
  internal_note?: string | null;
  created_at: string;
  rejected_by?: string | null;
  rejected_by_name?: string | null;
}

export interface VolunteerRow {
  id: string;
  full_name: string;
  email: string;
  joined_at: string;
}

export interface MilestoneDeliverableRow {
  id: string;
  title: string;
  description?: string | null;
  due_date: string;
  status?: string;
  milestone_id: string;
}

export interface MilestoneRow {
  id: string;
  title: string;
  description?: string | null;
  due_date: string;
  status?: string;
  project_id: string;
}

export interface MilestoneWithDeliverables extends MilestoneRow {
  deliverables: MilestoneDeliverableRow[];
}
