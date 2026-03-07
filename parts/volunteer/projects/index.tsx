// app/dashboard/volunteer-projects/page.tsx
"use client";

import { supabase } from "@/lib/supabase/client";
import { cn, formatLocation, getUserId } from "@/lib/utils";
import { useEffect, useMemo, useState, useRef } from "react";
import { format, parse } from "date-fns";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  Tag,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CalendarIcon,
} from "lucide-react";
import { Project, ProjectStatus } from "@/lib/types";
import { getProjectStatusStyle } from "@/parts/agency/projects/filters";

type VolunteerFilters = {
  title: string;
  status: ProjectStatus | "";
  category: string;
  startDate: string;
  endDate: string;
};

const DEFAULT_FILTERS: VolunteerFilters = {
  title: "",
  status: "",
  category: "",
  startDate: "",
  endDate: "",
};

const PAGE_SIZE_OPTIONS = [6, 12, 24];

function NativeDateTrigger({
  value,
  placeholder,
  onChange,
  className,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayText = value
    ? format(parse(value, "yyyy-MM-dd", new Date()), "MMM d, yyyy")
    : placeholder;

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full opacity-0 pointer-events-none [color-scheme:light]"
        aria-hidden
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={() =>
          inputRef.current?.showPicker?.() ?? inputRef.current?.focus()
        }
        className={cn(
          "flex h-9 w-full cursor-pointer items-center rounded-lg border border-gray-200 bg-white px-3 text-left text-sm font-normal shadow-none hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
          !value && "text-muted-foreground",
          className,
        )}
        aria-label={placeholder}
        title={placeholder}
      >
        <CalendarIcon
          className="mr-2 h-4 w-4 shrink-0 text-gray-500"
          aria-hidden
        />
        <span className="truncate">{displayText}</span>
      </button>
    </div>
  );
}

export default function VolunteerProjectsManagement() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VolunteerFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<VolunteerFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const fetchMyRegisteredProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = await getUserId();
      if (!userId) throw new Error("You must be logged in");

      // Step 1: Get all project IDs the user is registered for
      const { data: registrations, error: regError } = await supabase
        .from("project_volunteers")
        .select("project_id")
        .eq("volunteer_id", userId.data);

      if (regError) throw regError;
      if (!registrations || registrations.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }
      //@ts-ignore
      const projectIds = registrations.map((r) => r.project_id);

      // Step 2: Fetch full project details
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(
          `
          id, created_at, title, description,
          organization_id, organization_name,
          location, start_date, end_date,
          volunteers_registered, status, category,
          required_skills, volunteers_needed
        `,
        )
        .in("id", projectIds)
        .order("start_date", { ascending: true });

      if (projectError) throw projectError;

      const typedProjects: Project[] = (projectData || []).map((p: any) => ({
        id: p.id,
        createdAt: p.created_at,
        title: p.title || "Untitled Project",
        description: p.description,
        organizationId: p.organization_id,
        organizationName: p.organization_name,
        location: formatLocation(p.location),
        startDate: p.start_date,
        endDate: p.end_date,
        volunteersRegistered: p.volunteers_registered ?? 0,
        status: p.status ?? "pending",
        category: p.category,
        requiredSkills: p.required_skills || [],
        volunteersNeeded: p.volunteers_needed ?? 0,
      }));

      setProjects(typedProjects);
    } catch (err: any) {
      console.error("Error fetching volunteer projects:", err);
      setError(err.message || "Failed to load your registered projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRegisteredProjects();
  }, []);

  useEffect(() => {
    // Reset pagination when filters or page size change
    setCurrentPage(1);
  }, [appliedFilters, pageSize]);

  const spotsLeft = (p: Project) =>
    Math.max(0, (p.volunteersNeeded || 0) - (p.volunteersRegistered || 0));

  const formatDate = (date?: string) =>
    date ? format(new Date(date), "MMM d, yyyy") : "TBD";

  const goToProjectDetails = (projectId: string) => {
    router.push(
      `/volunteer/projects/${projectId}?from=my-projects`
    );
  };

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((p) => p.category)
            .filter((category): category is string => !!category),
        ),
      ),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    const { title, status, category, startDate, endDate } = appliedFilters;
    const normalizedSearch = title.trim().toLowerCase();

    const hasStartDate = !!startDate;
    const hasEndDate = !!endDate;

    return projects.filter((project) => {
      const haystack = [
        project.title,
        project.organizationName,
        project.location as any,
        project.category,
        ...(project.requiredSkills || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (normalizedSearch && !haystack.includes(normalizedSearch)) {
        return false;
      }

      if (status && project.status !== status) {
        return false;
      }

      if (category && project.category !== category) {
        return false;
      }

      if (hasStartDate) {
        const projectStart = project.startDate
          ? new Date(project.startDate)
          : null;
        const filterStart = new Date(startDate);
        if (!projectStart || projectStart < filterStart) {
          return false;
        }
      }

      if (hasEndDate) {
        const projectEnd = project.endDate ? new Date(project.endDate) : null;
        const filterEnd = new Date(endDate);
        if (!projectEnd || projectEnd > filterEnd) {
          return false;
        }
      }

      return true;
    });
  }, [projects, appliedFilters]);

  const totalPages =
    filteredProjects.length === 0
      ? 1
      : Math.ceil(filteredProjects.length / pageSize);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    return filteredProjects.slice(start, end);
  }, [currentPage, filteredProjects]);

  const startIndex = (currentPage - 1) * pageSize;

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  // Loading State
  if (loading) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <Skeleton className="h-10 w-full md:w-64" />
            <Skeleton className="h-10 w-full md:w-40" />
            <Skeleton className="h-10 w-full md:w-40" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, idx) => (
                    <Skeleton key={idx} className="h-6 w-16 rounded-full" />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchMyRegisteredProjects}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            My Volunteer Projects
          </h1>
          <p className="text-muted-foreground">
            Projects you've signed up for and are participating in
          </p>
          {projects.length > 0 && (
            <p className="text-sm text-muted-foreground">
              You&apos;re registered for{" "}
              <span className="font-medium">{projects.length}</span>{" "}
              project{projects.length === 1 ? "" : "s"}.
            </p>
          )}
        </div>
      </div>

      {/* Filters - aligned with Agency/Admin style */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_140px_1fr_160px_160px_auto] lg:gap-3">
          <div className="flex min-w-0 flex-col space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">
              Search projects
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Title, organization, skills..."
                value={filters.title}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, title: e.target.value }))
                }
                onKeyDown={(e) =>
                  e.key === "Enter" && handleApplyFilters()
                }
                className="h-9 rounded-lg border border-gray-200 bg-white pl-9"
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">
              Status
            </Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status: value === "all" ? "" : (value as ProjectStatus),
                }))
              }
            >
              <SelectTrigger className="h-9 rounded-lg border border-gray-200 bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-0 flex-col space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">
              Category
            </Label>
            <Select
              value={filters.category || "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  category: value === "all" ? "" : value,
                }))
              }
              disabled={categories.length === 0}
            >
              <SelectTrigger className="h-9 rounded-lg border border-gray-200 bg-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-0 flex-col space-y-1.5">
            <Label
              className="text-xs font-medium text-gray-600"
              title="Projects starting on or after this date"
            >
              Start date
            </Label>
            <NativeDateTrigger
              value={filters.startDate}
              placeholder="Pick start date"
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, startDate: value }))
              }
              className="h-9"
            />
          </div>

          <div className="flex min-w-0 flex-col space-y-1.5">
            <Label
              className="text-xs font-medium text-gray-600"
              title="Projects ending on or before this date"
            >
              End date
            </Label>
            <NativeDateTrigger
              value={filters.endDate}
              placeholder="Pick end date"
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, endDate: value }))
              }
              className="h-9"
            />
          </div>

          <div className="col-span-1 flex flex-wrap items-center gap-2 sm:col-span-2 sm:flex-nowrap lg:ml-1 lg:flex-shrink-0">
            {(filters.title ||
              filters.status ||
              filters.category ||
              filters.startDate ||
              filters.endDate) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-9 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Clear
              </Button>
            )}
            <Button
              type="button"
              onClick={handleApplyFilters}
              className="h-9 flex-1 rounded-lg bg-diaspora-blue hover:bg-diaspora-blue/90 sm:flex-none"
            >
              Apply filters
            </Button>
          </div>
        </div>

        <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
          Showing {filteredProjects.length} of {projects.length} project
          {projects.length === 1 ? "" : "s"}
        </p>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 rounded-full bg-muted p-6">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              No registered projects
            </h3>
            <p className="mb-6 max-w-md text-muted-foreground">
              You haven&apos;t signed up for any volunteer projects yet. Browse
              available opportunities to get started.
            </p>
            <Button
              className="action-btn"
              onClick={() => router.push("/volunteer/find-opportunity")}
            >
              Browse Projects
            </Button>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                No projects match your filters
              </h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Try adjusting your search or clearing some filters to see more
                of your registered projects.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleClearFilters}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedProjects.map((project) => {
              const remainingSpots = spotsLeft(project);

              return (
                <Card
                  key={project.id}
                  className="flex h-full flex-col border-border/60 bg-card/80 shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="line-clamp-2 text-lg md:text-xl">
                        {project.title}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`font-medium capitalize ${getProjectStatusStyle(project.status ?? "").className}`}
                      >
                        {getProjectStatusStyle(project.status ?? "").label}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 text-sm">
                      {project.organizationName}
                    </CardDescription>
                    {project.category && (
                      <Badge variant="outline" className="w-fit text-xs">
                        {project.category}
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4 text-sm">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {project.location
                            ? String(project.location)
                            : "Location not set"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(project.startDate)} →{" "}
                          {formatDate(project.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {project.volunteersRegistered ?? 0} of{" "}
                          {project.volunteersNeeded ?? 0} volunteers
                        </span>
                        {project.volunteersNeeded ? (
                          <span
                            className={
                              remainingSpots === 0
                                ? "text-xs font-semibold text-destructive"
                                : "text-xs font-semibold text-emerald-600"
                            }
                          >
                            {remainingSpots === 0
                              ? "Full"
                              : `${remainingSpots} spot${
                                  remainingSpots === 1 ? "" : "s"
                                } left`}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {project.requiredSkills &&
                      project.requiredSkills.length > 0 && (
                        <>
                          <Separator />
                          <div className="flex flex-wrap gap-2">
                            {project.requiredSkills.slice(0, 4).map((skill) => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="flex items-center gap-1 rounded-full text-xs"
                              >
                                <Tag className="h-3 w-3" />
                                <span>{skill}</span>
                              </Badge>
                            ))}
                            {project.requiredSkills.length > 4 && (
                              <Badge
                                variant="outline"
                                className="rounded-full text-xs"
                              >
                                +{project.requiredSkills.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </>
                      )}
                  </CardContent>

                  <CardFooter className="mt-auto pt-2">
                    <Button
                      className="action-btn mt-4 w-full"
                      onClick={() => goToProjectDetails(project.id)}
                    >
                      View Project Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium">
                    {filteredProjects.length === 0
                      ? 0
                      : startIndex + 1}
                    -
                    {Math.min(
                      startIndex + pageSize,
                      filteredProjects.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {filteredProjects.length}
                  </span>{" "}
                  projects
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Per page
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) =>
                      setPageSize(Number(value))
                    }
                  >
                    <SelectTrigger className="h-8 w-[80px] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((option) => (
                        <SelectItem
                          key={option}
                          value={String(option)}
                        >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <span className="px-2 text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(totalPages, prev + 1),
                    )
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
