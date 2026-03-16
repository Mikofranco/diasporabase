"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/lib/routes";

interface Project {
  id: string;
  title: string;
  description: string;
  organization_name: string;
  location: string;
  start_date: string;
  end_date: string;
  volunteers_needed: number;
  volunteers_registered: number;
  status: string;
  category: string;
}

type StatusFilter =
  | "all"
  | "Pending"
  | "Active"
  | "Rejected"
  | "Cancelled"
  | "Completed";

interface Filters {
  query: string;
  organization: string;
  location: string;
  status: StatusFilter;
  category: string;
  skill: string;
  minRating: number;
  startDate?: string;
  endDate?: string;
}

interface RatingMeta {
  average: number;
  count: number;
}

const PAGE_SIZE = 9;

const DEFAULT_FILTERS: Filters = {
  query: "",
  organization: "",
  location: "",
  status: "all",
  category: "",
  skill: "",
  minRating: 0,
  startDate: undefined,
  endDate: undefined,
};

export default function PublicProjectView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterDraft, setFilterDraft] = useState<Filters>(DEFAULT_FILTERS);
  const [ratingsMeta, setRatingsMeta] = useState<Record<string, RatingMeta>>(
    {}
  );

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Reset to first page whenever filters change
    fetchProjects(1, { append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchProjects = async (
    pageNumber: number,
    options: { append: boolean }
  ) => {
    const { append } = options;
    const from = (pageNumber - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    if (pageNumber === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    let query = supabase.from("projects").select("*", { count: "exact" });

    // Text search across title, description, organization, and skills
    if (filters.query.trim()) {
      const term = `%${filters.query.trim()}%`;
      query = query.or(
        `title.ilike.${term},description.ilike.${term},organization_name.ilike.${term}`
      );
    }

    if (filters.organization.trim()) {
      const orgTerm = `%${filters.organization.trim()}%`;
      query = query.ilike("organization_name", orgTerm);
    }

    if (filters.location.trim()) {
      const locTerm = `%${filters.location.trim()}%`;
      query = query.ilike("location", locTerm);
    }

    if (filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.category.trim()) {
      query = query.ilike("category", `%${filters.category.trim()}%`);
    }

    if (filters.skill.trim()) {
      // Assumes a "skills" text field/array exists; falls back gracefully if not
      query = query.ilike("skills", `%${filters.skill.trim()}%`);
    }

    if (filters.startDate) {
      query = query.gte("start_date", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("end_date", filters.endDate);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching projects:", error);
    } else {
      const fetched = data || [];
      setProjects((prev) => (append ? [...prev, ...fetched] : fetched));
      setPage(pageNumber);
      if (typeof count === "number") {
        setHasMore(to + 1 < count);
      } else {
        setHasMore(fetched.length === PAGE_SIZE);
      }

      // Fetch rating meta for this batch
      const ids = fetched.map((p: Project) => p.id);
      if (ids.length > 0) {
        const { data: ratingsData, error: ratingsError } = await supabase
          .from("project_ratings")
          .select("project_id,rating")
          .in("project_id", ids);

        if (!ratingsError && ratingsData) {
          const nextMeta: Record<string, RatingMeta> = {};
          for (const row of ratingsData as {
            project_id: string;
            rating: number;
          }[]) {
            const existing = nextMeta[row.project_id] || { average: 0, count: 0 };
            const total = existing.average * existing.count + row.rating;
            const count = existing.count + 1;
            nextMeta[row.project_id] = {
              average: total / count,
              count,
            };
          }

          setRatingsMeta((prev) =>
            append ? { ...prev, ...nextMeta } : nextMeta
          );
        } else if (!append) {
          setRatingsMeta({});
        }
      } else if (!append) {
        setRatingsMeta({});
      }
    }

    if (pageNumber === 1) {
      setLoading(false);
    } else {
      setLoadingMore(false);
    }
  };

  const handleProjectSelect = (project: Project) => {
    router.push(routes.generalProjectDetails(project.id));
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchProjects(page + 1, { append: true });
  };

  const handleClearFilters = () => {
    setFilterDraft(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
  };

  const handleApplyFilters = () => {
    setFilters(filterDraft);
  };

  const getStatusBadgeClasses = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "active") {
      return "bg-diaspora-blue/10 text-diaspora-darkBlue border-diaspora-blue/30 border";
    }
    if (normalized === "pending") {
      return "bg-amber-100 text-amber-800 border-amber-200 border";
    }
    if (normalized === "completed") {
      return "bg-slate-50 text-slate-700 border-slate-200";
    }
    if (normalized === "rejected") {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (normalized === "cancelled") {
      return "bg-orange-100 text-orange-800 border-orange-200 border";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const displayedProjects = useMemo(() => {
    if (filters.minRating <= 0) return projects;
    return projects.filter((project) => {
      const meta = ratingsMeta[project.id];
      const avg = meta?.average ?? 0;
      return avg >= filters.minRating;
    });
  }, [projects, ratingsMeta, filters.minRating]);


  if (loading) {
    return (
      <div>
        <div className="mb-8 space-y-4">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded-md animate-pulse" />
          </div>

          <div className="rounded-xl border bg-white/80 p-4 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="h-10 w-full bg-gray-100 rounded-md animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-20 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-9 w-20 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-full bg-gray-50 rounded-md border border-gray-100 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-full flex flex-col shadow-sm">
              <CardHeader className="space-y-2 animate-pulse">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-4/5" />
                    <div className="h-3 bg-gray-200 rounded w-2/5" />
                  </div>
                  <div className="h-5 w-16 bg-gray-200 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 animate-pulse flex-1 flex flex-col">
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-2/5" />
                </div>
                <div className="h-9 w-full bg-gray-200 rounded-md mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 space-y-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground">
            Discover verified opportunities, explore impact stories, and share
            your experience with the community.
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-xl border bg-white/80 p-4 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search by project title, organization, or skills"
                value={filterDraft.query}
                onChange={(e) =>
                  setFilterDraft((prev) => ({ ...prev, query: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="px-4 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90 text-white shadow-sm"
                onClick={handleApplyFilters}
              >
                Search
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-sm font-medium text-gray-700 border border-gray-300 hover:border-[#0ea5e9] hover:text-[#0ea5e9] rounded-lg px-4 py-2 transition-colors duration-200"
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Organization"
              value={filterDraft.organization}
              onChange={(e) =>
                setFilterDraft((prev) => ({
                  ...prev,
                  organization: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Location (city, country, or region)"
              value={filterDraft.location}
              onChange={(e) =>
                setFilterDraft((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Skill (e.g. design, data, policy)"
              value={filterDraft.skill}
              onChange={(e) =>
                setFilterDraft((prev) => ({
                  ...prev,
                  skill: e.target.value,
                }))
              }
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filterDraft.status}
              onChange={(e) =>
                setFilterDraft((prev) => ({
                  ...prev,
                  status: e.target.value as StatusFilter,
                }))
              }
            >
              <option value="all">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground whitespace-nowrap">
                Start date
              </span>
              <input
                type="date"
                className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                value={filterDraft.startDate ?? ""}
                onChange={(e) =>
                  setFilterDraft((prev) => ({
                    ...prev,
                    startDate: e.target.value || undefined,
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground whitespace-nowrap">
                End date
              </span>
              <input
                type="date"
                className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                value={filterDraft.endDate ?? ""}
                onChange={(e) =>
                  setFilterDraft((prev) => ({
                    ...prev,
                    endDate: e.target.value || undefined,
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground whitespace-nowrap">
                Min. rating
              </span>
              <select
                className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                value={filterDraft.minRating}
                onChange={(e) =>
                  setFilterDraft((prev) => ({
                    ...prev,
                    minRating: Number(e.target.value),
                  }))
                }
              >
                <option value={0}>Any</option>
                <option value={4}>4.0+</option>
                <option value={3}>3.0+</option>
                <option value={2}>2.0+</option>
              </select>
            </div>
            <div className="hidden lg:flex items-center justify-end text-xs text-muted-foreground">
              {displayedProjects.length} project
              {displayedProjects.length === 1 ? "" : "s"} found
            </div>
          </div>
        </div>
      </div>

      {displayedProjects.length === 0 ? (
        <p className="text-muted-foreground">No projects found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {displayedProjects.map((project) => {
            const ratingInfo = ratingsMeta[project.id];
            const avgRating = ratingInfo?.average ?? 0;
            const ratingLabel =
              ratingInfo && ratingInfo.count > 0
                ? `${avgRating.toFixed(1)} (${ratingInfo.count})`
                : "Not rated yet";

            return (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col"
              >
                <CardHeader className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg line-clamp-2">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-1">
                        {project.organization_name}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium capitalize ${getStatusBadgeClasses(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                  <div className="space-y-2 text-sm flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>{ratingLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(project.start_date).toLocaleDateString()} -{" "}
                        {new Date(project.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {project.volunteers_registered}/
                        {project.volunteers_needed} volunteers
                      </span>
                    </div>
                    <Badge variant="secondary">{project.category}</Badge>
                  </div>
                  <Button
                    className="w-full mt-4 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90"
                    onClick={() => handleProjectSelect(project)}
                  >
                    View Details & Rate
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="text-sm font-medium text-gray-700 border border-gray-300 hover:border-[#0ea5e9] hover:text-[#0ea5e9] rounded-lg px-4 py-2 transition-colors duration-200"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading more..." : "Load more projects"}
          </Button>
        </div>
      )}
    </div>
  );
}

