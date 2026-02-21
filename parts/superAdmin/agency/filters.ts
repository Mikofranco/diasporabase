export const AGENCY_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_AGENCY_PAGE_SIZE = 10;

export type AgencyStatusFilter = "all" | "active" | "inactive";

export interface AgencyFilters {
  search: string;
  status: AgencyStatusFilter;
}

export const DEFAULT_AGENCY_FILTERS: AgencyFilters = {
  search: "",
  status: "all",
};
