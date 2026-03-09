"use client";

import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateProjectForm from "../create-project";
import { routes } from "@/lib/routes";
import { ProjectCard, type AgencyProject } from "./ProjectCard";
import {
  LoadingSkeleton,
  EmptyState,
  ErrorState,
} from "./ProjectListStates";
import { ProjectsFilters } from "./ProjectsFilters";
import { PaginationBar } from "./PaginationBar";
import {
  DEFAULT_FILTERS,
  DEFAULT_PAGE_SIZE,
  type ProjectFilters,
} from "./filters";

const supabase = createClient();

export default function OrganizationsProjects() {
  const [projects, setProjects] = useState<AgencyProject[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState<ProjectFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ProjectFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const router = useRouter();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to view projects.");

      const { error: profileError } = await supabase
        .from("profiles")
        .select("id, role, organization_name")
        .eq("id", userId)
        .single();

      if (profileError)
        throw new Error("Error fetching profile: " + profileError.message);

      const f = appliedFilters;
      let query = supabase
        .from("projects")
        .select("*", { count: "exact" })
        .eq("organization_id", userId)
        .order("created_at", { ascending: false });

      if (f.status) query = query.eq("status", f.status);
      if (f.category) query = query.eq("category", f.category);
      if (f.title.trim()) query = query.ilike("title", `%${f.title.trim()}%`);
      if (f.startDate) query = query.gte("start_date", f.startDate);
      if (f.endDate) query = query.lte("end_date", f.endDate);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data: projectsData, error: projectsError, count } = await query.range(from, to);

      if (projectsError)
        throw new Error("Error fetching projects: " + projectsError.message);

      setProjects(projectsData ?? []);
      setTotalCount(count ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize]);

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

  const handleCreateProjectClick = () => setShowCreateForm(true);
  const handleFormClose = () => setShowCreateForm(false);

  const handleProjectCreated = (newProject: AgencyProject) => {
    setProjects((prev) => [newProject, ...prev]);
    setTotalCount((c) => c + 1);
    setShowCreateForm(false);
  };

  const handleProjectSelect = (project: AgencyProject) => {
    router.push(routes.agencyViewProject(project.id));
  };

  const showFilters = true;
  const showPagination = !loading && !error && totalCount > 0;

  return (
    <div
      className={`container mx-auto p-6 space-y-6 ${
        showCreateForm ? "blur-sm" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          My Organization&apos;s Projects
        </h1>
        <Button
          onClick={handleCreateProjectClick}
          variant="outline"
          className="rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>

      {showCreateForm && (
        <CreateProjectForm
          onClose={handleFormClose}
          onProjectCreated={handleProjectCreated}
        />
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

      {!loading && error && (
        <ErrorState message={error} onRetry={fetchProjects} />
      )}

      {!loading && !error && projects.length === 0 && (
        <EmptyState onCreateClick={handleCreateProjectClick} />
      )}

      {!loading && !error && projects.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onViewDetails={handleProjectSelect}
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
}
