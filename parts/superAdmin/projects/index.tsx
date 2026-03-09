"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ProjectCard, { Project } from "@/components/project-card";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";
import { ProjectsFilters } from "./ProjectsFilters";
import { PaginationBar } from "./PaginationBar";
import {
  LoadingSkeleton,
  EmptyState,
  ErrorState,
} from "./ProjectListStates";
import {
  DEFAULT_FILTERS,
  DEFAULT_PAGE_SIZE,
  type ProjectFilters,
} from "./filters";
import { PROJECT_STATUS_STYLES } from "./filters";
import { Loader2, FolderOpen, Clock, CheckCircle2, CheckCircle, XCircle, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

const supabase = createClient();

const STATUS_KEYS = ["pending", "active", "approved", "completed", "rejected", "cancelled"] as const;
const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  active: CheckCircle2,
  approved: CheckCircle,
  completed: FolderOpen,
  rejected: XCircle,
  cancelled: Ban,
};

type StatusCounts = Record<string, number>;

const AdminProjectsScreen: React.FC = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ProjectFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(routes.login);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (!["admin", "super_admin"].includes(profile.role)) {
        setError("You do not have permission to view this page.");
        setLoading(false);
        return;
      }

      setUserRole(profile.role);

      const f = appliedFilters;
      let query = supabase
        .from("projects")
        .select("id, title, organization_name, description, start_date, end_date, category, volunteers_registered, volunteers_needed, status", { count: "exact" })
        .order("created_at", { ascending: false });

      if (f.status) query = query.eq("status", f.status);
      if (f.category) query = query.eq("category", f.category);
      if (f.title.trim()) query = query.ilike("title", `%${f.title.trim()}%`);
      if (f.startDate) query = query.gte("start_date", f.startDate);
      if (f.endDate) query = query.lte("end_date", f.endDate);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data: projectsData, error: projectsError, count } = await query.range(from, to);

      if (projectsError) throw projectsError;

      setProjects(projectsData ?? []);
      setTotalCount(count ?? 0);

      // Fetch status counts in parallel (unfiltered totals)
      const countPromises = STATUS_KEYS.map(async (status) => {
        const { count: c } = await supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("status", status);
        return { status, count: c ?? 0 };
      });
      const countResults = await Promise.all(countPromises);
      const counts: StatusCounts = {};
      countResults.forEach(({ status, count }) => { counts[status] = count; });
      setStatusCounts(counts);
    } catch (err) {
      setError("Error fetching data: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize, router]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleProjectSelect = (project: Project) => {
    const base = userRole === "super_admin" ? "super-admin" : userRole;
    router.push(`/${base}/projects/${project.id}`);
  };

  const showFilters = !!userRole;
  const showPagination = !loading && !error && totalCount > 0;

  if (loading && !projects.length) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error && !userRole) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState message={error} onRetry={fetchProjects} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Manage Projects
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage all projects across the platform
        </p>
      </div>

      {showFilters && Object.keys(statusCounts).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STATUS_KEYS.map((status) => {
            const style = PROJECT_STATUS_STYLES[status] ?? PROJECT_STATUS_STYLES.pending;
            const Icon = STATUS_ICONS[status] ?? Clock;
            const count = statusCounts[status] ?? 0;
            return (
              <div
                key={status}
                className={cn(
                  "rounded-xl border p-4 transition-shadow hover:shadow-md",
                  style.className
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 shrink-0 opacity-80" />
                  <span className="font-semibold text-sm">{style.label}</span>
                </div>
                <p className="text-2xl font-bold mt-2">{count}</p>
              </div>
            );
          })}
        </div>
      )}

      {showFilters && (
        <ProjectsFilters
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          resultCount={projects.length}
          totalCount={totalCount}
        />
      )}

      {loading && <LoadingSkeleton />}

      {!loading && error && userRole && (
        <ErrorState message={error} onRetry={fetchProjects} />
      )}

      {!loading && !error && projects.length === 0 && (
        <EmptyState />
      )}

      {!loading && !error && projects.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                handleProjectSelect={handleProjectSelect}
              />
            ))}
          </div>
          {showPagination && (
            <PaginationBar
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AdminProjectsScreen;
