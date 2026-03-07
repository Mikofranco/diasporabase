"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { VolunteerFilters } from "./VolunteerFilters";
import { VolunteerPaginationBar } from "./PaginationBar";
import { useSkillLabels } from "@/hooks/useSkillLabels";
import { useSkillLabels } from "@/hooks/useSkillLabels";
import { VolunteerLoadingSkeleton, VolunteerTableSkeleton } from "./VolunteerLoadingSkeleton";
import {
  DEFAULT_VOLUNTEER_FILTERS,
  DEFAULT_VOLUNTEER_PAGE_SIZE,
  type VolunteerFilters as VolunteerFiltersType,
} from "./filters";

interface Volunteer {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  skills: string[];
  projects: { id: string; title: string }[];
}

const VolunteersManagement: React.FC = () => {
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<VolunteerFiltersType>(DEFAULT_VOLUNTEER_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<VolunteerFiltersType>(DEFAULT_VOLUNTEER_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_VOLUNTEER_PAGE_SIZE);
  const { getLabel } = useSkillLabels();

  const fetchVolunteers = useCallback(async () => {
    setLoading(true);
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

      if (profileError) throw profileError;

      if (!["admin", "super_admin"].includes(profile.role)) {
        toast.error("You do not have permission to manage volunteers.");
        setLoading(false);
        return;
      }

      setUserRole(profile.role);

      const f = appliedFilters;
      let query = supabase
        .from("profiles")
        .select("id, full_name, email, is_active, skills", { count: "exact" })
        .eq("role", "volunteer")
        .order("full_name", { ascending: true });

      if (f.status === "active") query = query.eq("is_active", true);
      if (f.status === "inactive") query = query.eq("is_active", false);
      if (f.skill?.trim()) query = query.overlaps("skills", [f.skill.trim()]);
      if (f.search?.trim()) {
        const term = `%${f.search.trim()}%`;
        query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data: volunteersData, error: volunteersError, count } = await query.range(from, to);

      if (volunteersError) throw volunteersError;

      const list = volunteersData ?? [];

      const volunteersWithProjects = await Promise.all(
        list.map(async (volunteer: { id: string; full_name: string | null; email: string; is_active: boolean; skills: string[] | null }) => {
          const { data: projectsData, error: projectsError } = await supabase
            .from("project_volunteers")
            .select("project:projects(id, title)")
            .eq("volunteer_id", volunteer.id);

          if (projectsError) throw projectsError;

          const projects = (projectsData ?? []).map((req: { project: { id: string; title: string } }) => req.project);

          return {
            ...volunteer,
            projects,
          };
        })
      );

      setVolunteers(volunteersWithProjects);
      setTotalCount(count ?? 0);
    } catch (err) {
      toast.error("Error fetching data: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize, router]);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_VOLUNTEER_FILTERS);
    setAppliedFilters(DEFAULT_VOLUNTEER_FILTERS);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleRowClick = (volunteerId: string) => {
    const base = userRole === "super_admin" ? "super-admin" : userRole;
    router.push(`/${base}/volunteers/${volunteerId}`);
  };

  const showPagination = !loading && totalCount > 0;

  if (loading && volunteers.length === 0) {
    return <VolunteerLoadingSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Volunteers</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage all volunteers, filter by status or skill, and open profiles
        </p>
      </div>

      <VolunteerFilters
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        resultCount={volunteers.length}
        totalCount={totalCount}
      />

      <Card className="shadow-sm border border-gray-200 overflow-hidden">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-diaspora-blue" />
              Volunteers List
            </CardTitle>
            {totalCount > 0 && (
              <span className="text-sm text-gray-500">
                {totalCount} volunteer{totalCount !== 1 ? "s" : ""} total
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <VolunteerTableSkeleton />
          ) : volunteers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Users className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-muted-foreground font-medium">
                No volunteers found
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {appliedFilters.search || appliedFilters.status !== "all" || appliedFilters.skill
                  ? "Try adjusting your filters or clear them to see all volunteers."
                  : "There are no volunteers on the platform yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100/80 hover:bg-gray-100/80 border-b">
                      <TableHead className="font-semibold text-gray-700">Name</TableHead>
                      <TableHead className="font-semibold text-gray-700">Email</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Skills</TableHead>
                      <TableHead className="font-semibold text-gray-700">Projects</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {volunteers.map((volunteer) => (
                      <TableRow
                        key={volunteer.id}
                        className="cursor-pointer hover:bg-gray-50/80 transition-colors border-b last:border-0"
                        onClick={() => handleRowClick(volunteer.id)}
                      >
                        <TableCell className="font-medium text-gray-900">
                          {volunteer.full_name || "—"}
                        </TableCell>
                        <TableCell className="text-gray-600">{volunteer.email}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "gap-1",
                              volunteer.is_active
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            )}
                          >
                            {volunteer.is_active ? (
                              <UserCheck className="h-3.5 w-3.5" />
                            ) : (
                              <UserX className="h-3.5 w-3.5" />
                            )}
                            {volunteer.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {volunteer.skills?.length ? (
                              volunteer.skills.slice(0, 3).map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs font-normal">
                                  {getLabel(skill)}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                            {volunteer.skills?.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{volunteer.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {volunteer.projects?.length ? (
                              volunteer.projects.slice(0, 2).map((project) => (
                                <Badge
                                  key={project.id}
                                  variant="secondary"
                                  className="text-xs font-normal truncate max-w-[100px]"
                                  title={project.title}
                                >
                                  {project.title}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                            {volunteer.projects?.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{volunteer.projects.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {showPagination && (
                <div className="border-t px-4 sm:px-6">
                  <VolunteerPaginationBar
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

export default VolunteersManagement;
