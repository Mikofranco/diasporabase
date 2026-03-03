import { CATEGORIES } from "@/parts/agency/create-project/types";

export const PROJECT_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const PROJECT_STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 border-amber-200 border",
  },
  active: {
    label: "Active",
    className: "bg-diaspora-blue/10 text-diaspora-darkBlue border-diaspora-blue/30 border",
  },
  approved: {
    label: "Approved",
    className: "bg-blue-100 text-blue-800 border-blue-200 border",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-200 border",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200 border",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-orange-100 text-orange-800 border-orange-200 border",
  },
};

export function getProjectStatusStyle(status: string): {
  label: string;
  className: string;
} {
  const key = (status || "pending").toLowerCase();
  return (
    PROJECT_STATUS_STYLES[key] ?? {
      label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending",
      className: "bg-gray-100 text-gray-700 border-gray-200 border",
    }
  );
}

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
