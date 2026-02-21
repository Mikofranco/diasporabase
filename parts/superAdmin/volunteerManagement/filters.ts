export const VOLUNTEER_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_VOLUNTEER_PAGE_SIZE = 10;

export type VolunteerStatusFilter = "all" | "active" | "inactive";

export interface VolunteerFilters {
  search: string;
  status: VolunteerStatusFilter;
  skill: string;
}

export const DEFAULT_VOLUNTEER_FILTERS: VolunteerFilters = {
  search: "",
  status: "all",
  skill: "",
};
