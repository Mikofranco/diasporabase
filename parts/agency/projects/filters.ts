import { CATEGORIES } from "../create-project/types";

export const PROJECT_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  ...CATEGORIES.map((c) => ({ value: c, label: c })),
];

export const PAGE_SIZE_OPTIONS = [6, 9, 12, 24] as const;
export const DEFAULT_PAGE_SIZE = 9;

export interface ProjectFilters {
  status: string;
  category: string;
  title: string;
  startDate: string;
  endDate: string;
}

export const DEFAULT_FILTERS: ProjectFilters = {
  status: "",
  category: "",
  title: "",
  startDate: "",
  endDate: "",
};
