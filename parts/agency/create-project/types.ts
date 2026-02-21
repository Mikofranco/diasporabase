export const CATEGORIES = [
  "Media & Communication",
  "Art & Design",
  "Information Technology",
  "Engineering",
  "Education",
  "Business & Finance",
  "Legal & Law Services",
  "Medicine & Healthcare",
  "Others",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Project {
  id: string;
  title: string;
  description: string;
  organization_id: string;
  organization_name: string;
  country: string;
  state: string;
  lga: string;
  start_date: string;
  end_date: string;
  volunteers_registered: number;
  status: string;
  category: string;
  required_skills: string[];
  created_at: string;
  documents: Array<{ title: string; url: string }>;
}

/** Project shape when opening the form in edit/appeal mode (e.g. from view project). */
export interface ProjectForEdit {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  category: string;
  required_skills: string[];
  documents?: Array<{ title: string; url: string }>;
  status?: string;
  country?: string | null;
  state?: string | null;
  lga?: string | null;
  location?:
    | { country?: string; state?: string; lga?: string }
    | string
    | null;
}

export interface CreateProjectFormProps {
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
  /** When set, form opens in edit mode with fields pre-filled. Submit updates project or submits appeal if rejected. */
  initialProject?: ProjectForEdit | null;
}

export type MilestoneItem = {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: "Done" | "Pending" | "In Progress" | "Cancelled";
};

export type DeliverableItem = {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: "Done" | "Pending" | "In Progress" | "Cancelled";
  milestone_id?: string;
};

export interface CreateProjectFormData {
  title: string;
  description: string;
  country: string;
  state: string;
  lga: string;
  start_date: string;
  end_date: string;
  category: Category;
  required_skills: string[];
  milestones: MilestoneItem[];
  deliverables: DeliverableItem[];
  documents: Array<{ title: string; url: string }>;
}

export const INITIAL_FORM_DATA: CreateProjectFormData = {
  title: "",
  description: "",
  country: "NG",
  state: "",
  lga: "",
  start_date: "",
  end_date: "",
  category: "" as Category,
  required_skills: [],
  milestones: [],
  deliverables: [],
  documents: [],
};

export const STEP_LABELS = [
  "Basic Info",
  "Location & Dates",
  "Category & Skills",
  "Supporting Documents",
] as const;

export const TOTAL_STEPS = 4;
export const MIN_DESCRIPTION_WORDS = 150;
