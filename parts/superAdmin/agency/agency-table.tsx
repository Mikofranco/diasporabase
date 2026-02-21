"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { AgencyFilters } from "./AgencyFilters";
import { AgencyPaginationBar } from "./PaginationBar";
import { AgencyLoadingSkeleton, AgencyTableSkeleton } from "./AgencyLoadingSkeleton";
import {
  DEFAULT_AGENCY_FILTERS,
  DEFAULT_AGENCY_PAGE_SIZE,
  type AgencyFilters as AgencyFiltersType,
} from "./filters";

const supabase = createClient();

interface AgencyProfile {
  id: string;
  organization_name: string | null;
  contact_person_email: string | null;
  website: string | null;
  focus_areas: string[] | null;
  role: "agency";
  is_active: boolean;
}

const AgencyList: React.FC = () => {
  const router = useRouter();
  const [agencies, setAgencies] = useState<AgencyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<AgencyFiltersType>(DEFAULT_AGENCY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AgencyFiltersType>(DEFAULT_AGENCY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_AGENCY_PAGE_SIZE);

  const fetchAgencies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(routes.login);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !["admin", "super_admin"].includes(profile?.role)) {
        router.push("/unauthorized");
        setLoading(false);
        return;
      }

      setUserRole(profile.role);

      const f = appliedFilters;
      let query = supabase
        .from("profiles")
        .select("id, organization_name, contact_person_email, website, focus_areas, role, is_active", {
          count: "exact",
        })
        .eq("role", "agency")
        .order("organization_name", { ascending: true });

      if (f.status === "active") query = query.eq("is_active", true);
      if (f.status === "inactive") query = query.eq("is_active", false);
      if (f.search?.trim()) {
        const term = `%${f.search.trim()}%`;
        query = query.or(`organization_name.ilike.${term},contact_person_email.ilike.${term}`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error: fetchError, count } = await query.range(from, to);

      if (fetchError) throw fetchError;
      setAgencies((data as AgencyProfile[]) ?? []);
      setTotalCount(count ?? 0);
    } catch (err) {
      setError("Failed to fetch agencies");
      toast.error("Failed to fetch agencies");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize, router]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  useEffect(() => {
    const channel = supabase
      .channel("profiles_agency")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: "role=eq.agency" },
        () => fetchAgencies()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAgencies]);

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_AGENCY_FILTERS);
    setAppliedFilters(DEFAULT_AGENCY_FILTERS);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleRowClick = (agencyId: string) => {
    const base = userRole === "super_admin" ? "super-admin" : userRole;
    router.push(`/${base}/agencies/${agencyId}`);
  };

  const showPagination = !loading && totalCount > 0;

  if (loading && agencies.length === 0) {
    return <AgencyLoadingSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Agencies</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage agency profiles, filter by status, and open details
        </p>
      </div>

      <AgencyFilters
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        resultCount={agencies.length}
        totalCount={totalCount}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Card className="shadow-sm border border-gray-200 overflow-hidden">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-diaspora-blue" />
              Agencies List
            </CardTitle>
            {totalCount > 0 && (
              <span className="text-sm text-gray-500">
                {totalCount} agenc{totalCount !== 1 ? "ies" : "y"} total
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <AgencyTableSkeleton />
          ) : agencies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Building2 className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-muted-foreground font-medium">No agencies found</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {appliedFilters.search || appliedFilters.status !== "all"
                  ? "Try adjusting your filters or clear them to see all agencies."
                  : "There are no agencies on the platform yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100/80 border-b hover:bg-gray-100/80">
                      <TableHead className="font-semibold text-gray-700">Organization Name</TableHead>
                      <TableHead className="font-semibold text-gray-700">Contact Email</TableHead>
                      <TableHead className="font-semibold text-gray-700">Website</TableHead>
                      <TableHead className="font-semibold text-gray-700">Focus Areas</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agencies.map((agency) => (
                      <TableRow
                        key={agency.id}
                        className="cursor-pointer hover:bg-gray-50/80 transition-colors border-b last:border-0"
                        onClick={() => handleRowClick(agency.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRowClick(agency.id);
                          }
                        }}
                      >
                        <TableCell className="font-medium text-gray-900">
                          {agency.organization_name || "—"}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {agency.contact_person_email || "—"}
                        </TableCell>
                        <TableCell>
                          {agency.website ? (
                            <a
                              href={agency.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-diaspora-blue hover:underline truncate max-w-[180px] inline-block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {agency.website}
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            {agency.focus_areas?.length ? (
                              <span className="text-sm text-gray-600 line-clamp-2">
                                {agency.focus_areas.join(", ")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "gap-1",
                              agency.is_active
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            )}
                          >
                            {agency.is_active ? (
                              <UserCheck className="h-3.5 w-3.5" />
                            ) : (
                              <UserX className="h-3.5 w-3.5" />
                            )}
                            {agency.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {showPagination && (
                <div className="border-t px-4 sm:px-6">
                  <AgencyPaginationBar
                    page={page}
                    pageSize={pageSize}
                    totalCount={totalCount}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyList;
