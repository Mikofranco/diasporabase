"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useProjectRecommendations, RecommendedProject } from "@/hooks/useProjectRecommendations";
import { RecommendationCard } from "@/parts/volunteer/dashboard/recommended-projects";
import { routes } from "@/lib/routes";
import { useSkillLabels } from "@/hooks/useSkillLabels";

const PAGE_SIZE_OPTIONS = [6, 12, 24];

type OpportunityFilters = {
  search: string;
  location: string;
  category: string;
  skills: string[];
};

const DEFAULT_FILTERS: OpportunityFilters = {
  search: "",
  location: "",
  category: "",
  skills: [],
};

function getLocationString(p: RecommendedProject): string {
  const parts: string[] = [];
  if (p.location_lga) parts.push(p.location_lga);
  if (p.location_state) parts.push(p.location_state);
  if (p.location_country) parts.push(p.location_country === "NG" ? "Nigeria" : p.location_country);
  return parts.join(" ").toLowerCase();
}

function matchesFilters(project: RecommendedProject, filters: OpportunityFilters): boolean {
  const search = filters.search.trim().toLowerCase();
  if (search) {
    const title = (project.title ?? "").toLowerCase();
    const desc = (project.description ?? "").toLowerCase();
    const org = (project.organization_name ?? "").toLowerCase();
    const cat = (project.category ?? "").toLowerCase();
    if (!title.includes(search) && !desc.includes(search) && !org.includes(search) && !cat.includes(search)) {
      return false;
    }
  }

  const loc = filters.location.trim().toLowerCase();
  if (loc && !getLocationString(project).includes(loc)) {
    return false;
  }

  if (filters.category && project.category !== filters.category) {
    return false;
  }

  if (filters.skills.length > 0) {
    const projectSkills = new Set(project.required_skills ?? []);
    const hasAll = filters.skills.every((s) => projectSkills.has(s));
    if (!hasAll) return false;
  }

  return true;
}

/** Map raw project from DB to RecommendedProject format */
function projectToRecommended(project: {
  id: string;
  title?: string | null;
  description?: string | null;
  organization_name?: string | null;
  location?: { country?: string; state?: string; lga?: string } | null;
  country?: string | null;
  state?: string | null;
  lga?: string | null;
  required_skills?: string[] | null;
  category?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  volunteers_needed?: number | null;
  volunteers_registered?: number | null;
  created_at?: string | null;
}): RecommendedProject {
  const loc = project.location && typeof project.location === "object" ? project.location : null;
  return {
    project_id: project.id,
    title: project.title ?? "",
    description: project.description ?? null,
    location_country: project.country ?? loc?.country ?? null,
    location_state: project.state ?? loc?.state ?? null,
    location_lga: project.lga ?? loc?.lga ?? null,
    required_skills: project.required_skills ?? null,
    category: project.category ?? "",
    organization_name: project.organization_name ?? null,
    start_date: project.start_date ?? null,
    end_date: project.end_date ?? null,
    volunteers_needed: project.volunteers_needed ?? null,
    volunteers_registered: project.volunteers_registered ?? null,
    score: 0,
    created_at: project.created_at ?? null,
  };
}

const Opportunities: React.FC = () => {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [volunteerSkills, setVolunteerSkills] = useState<string[]>([]);
  const [draftFilters, setDraftFilters] = useState<OpportunityFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<OpportunityFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [searchResults, setSearchResults] = useState<RecommendedProject[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [allProjectsForFilters, setAllProjectsForFilters] = useState<RecommendedProject[]>([]);

  const { recommendations, isLoading, error, refetch } = useProjectRecommendations(userId);
  const { getLabel } = useSkillLabels();

  const isSearchMode =
    !!appliedFilters.search.trim() ||
    !!appliedFilters.location.trim() ||
    !!appliedFilters.category ||
    appliedFilters.skills.length > 0;

  useEffect(() => {
    const loadUser = async () => {
      const { data: uid, error: uidErr } = await getUserId();
      if (uidErr || !uid) return;
      setUserId(uid);

      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("skills")
        .eq("id", uid)
        .single();
      if (profile) setVolunteerSkills(profile.skills ?? []);
    };
    loadUser();
  }, []);

  const loadFilterOptions = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select("id, title, description, organization_name, location, country, state, lga, required_skills, category, start_date, end_date, volunteers_needed, volunteers_registered, created_at")
      .eq("status", "active");
    if (data) {
      setAllProjectsForFilters(data.map(projectToRecommended));
    }
  }, []);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  const fetchSearchResults = useCallback(async (filters: OpportunityFilters) => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      let query = supabase
        .from("projects")
        .select("id, title, description, organization_name, location, country, state, lga, required_skills, category, start_date, end_date, volunteers_needed, volunteers_registered, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (filters.search.trim()) {
        const v = filters.search.trim();
        query = query.or(`title.ilike.%${v}%,description.ilike.%${v}%,organization_name.ilike.%${v}%`);
      }
      if (filters.location.trim()) {
        const v = filters.location.trim();
        query = query.or(`country.ilike.%${v}%,state.ilike.%${v}%,lga.ilike.%${v}%`);
      }
      if (filters.category) query = query.eq("category", filters.category);
      if (filters.skills.length > 0) query = query.contains("required_skills", filters.skills);

      const { data, error: qError } = await query;
      if (qError) throw new Error(qError.message);
      setSearchResults((data ?? []).map(projectToRecommended));
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const filteredRecommendations = useMemo(() => {
    if (!recommendations) return [];
    return recommendations.filter((p) => matchesFilters(p, appliedFilters));
  }, [recommendations, appliedFilters]);

  const displayProjects = isSearchMode ? searchResults : filteredRecommendations;

  const availableCategories = useMemo(() => {
    const source = isSearchMode ? allProjectsForFilters : (recommendations ?? []);
    const set = new Set<string>();
    source.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [isSearchMode, allProjectsForFilters, recommendations]);

  const availableSkills = useMemo(() => {
    const source = isSearchMode ? allProjectsForFilters : (recommendations ?? []);
    const set = new Set<string>();
    source.forEach((p) => {
      (p.required_skills ?? []).forEach((s) => set.add(s));
    });
    return Array.from(set).sort();
  }, [isSearchMode, allProjectsForFilters, recommendations]);

  const totalCount = displayProjects.length;
  const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProjects = displayProjects.slice(startIndex, startIndex + pageSize);

  const hasActiveFilters =
    !!draftFilters.search.trim() ||
    !!draftFilters.location.trim() ||
    !!draftFilters.category ||
    draftFilters.skills.length > 0;

  const handleSearch = async () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
    if (hasActiveFilters) {
      await fetchSearchResults(draftFilters);
    } else {
      setSearchResults([]);
    }
  };

  const handleClearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
    setSearchResults([]);
    setSearchError(null);
  };

  const toggleSkill = (skill: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleViewProject = (projectId: string) => {
    router.push(routes.volunteerViewProject(projectId));
  };

  if (!userId) {
    return (
      <div className="container mx-auto p-6 max-w-8xl">
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">Please log in to view opportunities.</p>
        </div>
      </div>
    );
  }

  const showInitialLoading = isLoading && !isSearchMode;
  const showSearchLoading = searchLoading;

  if (showInitialLoading) {
    return (
      <div className="container mx-auto space-y-6 p-6 max-w-8xl">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="pt-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-32 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !isSearchMode) {
    return (
      <div className="container mx-auto p-6 max-w-8xl">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6 max-w-8xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Recommended for You</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Projects matched to your skills and interests. Use filters to narrow your search.
        </p>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="pt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-9"
                  value={draftFilters.search}
                  placeholder="Title, description, organization..."
                  onChange={(e) => setDraftFilters((p) => ({ ...p, search: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-9"
                  value={draftFilters.location}
                  placeholder="State, country, or city..."
                  onChange={(e) => setDraftFilters((p) => ({ ...p, location: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select
                value={draftFilters.category || "all"}
                onValueChange={(v) => setDraftFilters((p) => ({ ...p, category: v === "all" ? "" : v }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Skills</Label>
              <Select value="" onValueChange={(v) => v && v !== "none" && toggleSkill(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Add skill filter..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSkills.length > 0 ? (
                    availableSkills.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {getLabel(skill)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No skills in recommendations
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {draftFilters.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {draftFilters.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleSkill(skill)}
                >
                  {getLabel(skill)} ×
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{totalCount}</span>{" "}
              {isSearchMode
                ? `matching ${totalCount === 1 ? "project" : "projects"} (includes projects you're on)`
                : `matching ${totalCount === 1 ? "project" : "projects"}`}
            </p>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
              <Button
                size="sm"
                className="action-btn"
                onClick={handleSearch}
                disabled={showSearchLoading}
              >
                <Search className="h-4 w-4 mr-1" /> {showSearchLoading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {searchError && isSearchMode && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{searchError}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => fetchSearchResults(appliedFilters)}>
              Retry search
            </Button>
          </CardContent>
        </Card>
      )}

      {showSearchLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-32 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paginatedProjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="flex justify-center mb-3">
              <Sparkles className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">
              {!isSearchMode && recommendations?.length === 0
                ? "No recommendations yet"
                : isSearchMode
                  ? "No projects match your search"
                  : "No projects match your filters"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              {!isSearchMode && recommendations?.length === 0
                ? "Complete your profile with skills and preferred locations to get personalized project matches."
                : "Try adjusting your filters or clear them to see recommendations."}
            </p>
            <Button
              variant="outline"
              onClick={() =>
                !isSearchMode && recommendations?.length === 0
                  ? router.push(routes.volunteerProfile)
                  : handleClearFilters()
              }
            >
              {!isSearchMode && recommendations?.length === 0 ? "Complete Profile" : "Clear filters"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedProjects.map((project) => (
              <RecommendationCard
                key={project.project_id}
                project={project}
                volunteerSkills={volunteerSkills}
                onViewProject={handleViewProject}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {totalCount === 0 ? 0 : startIndex + 1}–
                {Math.min(startIndex + pageSize, totalCount)} of {totalCount} projects
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[72px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Opportunities;
