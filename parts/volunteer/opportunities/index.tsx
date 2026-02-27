"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatLocation, getUserId, LocationData } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  MapPin,
  Briefcase,
  Calendar,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";

const supabase = createClient();
const PAGE_SIZE_OPTIONS = [6, 12, 24];

interface Project {
  id: string;
  title: string;
  description: string;
  organization_name: string;
  location: LocationData;
  start_date: string;
  end_date: string;
  volunteers_needed: number;
  volunteers_registered: number;
  status: string;
  category: string;
  required_skills: string[] | null;
  created_at: string;
}

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

const Opportunities: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftFilters, setDraftFilters] = useState<OpportunityFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<OpportunityFilters>(DEFAULT_FILTERS);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [totalCount, setTotalCount] = useState(0);
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);

  const loadFilterOptions = async () => {
    const { data, error: optionsError, count } = await supabase
      .from("projects")
      .select("category, required_skills", { count: "exact" })
      .eq("status", "active");

    if (optionsError) throw new Error(optionsError.message);

    const skillsSet = new Set<string>();
    const categorySet = new Set<string>();
    (data || []).forEach((item: any) => {
      if (item.category) categorySet.add(item.category);
      if (Array.isArray(item.required_skills)) {
        item.required_skills.forEach((skill: string) => skillsSet.add(skill));
      }
    });
    setAvailableSkills(Array.from(skillsSet).sort());
    setAvailableCategories(Array.from(categorySet).sort());
    setActiveProjectsCount(count || 0);
  };

  const fetchProjects = async (
    filters: OpportunityFilters,
    page: number,
    size: number,
    isInitial = false
  ) => {
    if (isInitial) setLoading(true);
    else setSearching(true);
    setError(null);

    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to view opportunities.");

      const from = (page - 1) * size;
      const to = from + size - 1;

      let query = supabase
        .from("projects")
        .select(
          "id, title, description, organization_name, location, start_date, end_date, volunteers_needed, volunteers_registered, status, category, required_skills, created_at",
          { count: "exact" }
        )
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (filters.search.trim()) {
        const value = filters.search.trim();
        query = query.or(
          `title.ilike.%${value}%,description.ilike.%${value}%,organization_name.ilike.%${value}%`
        );
      }
      if (filters.location.trim()) {
        const value = filters.location.trim();
        query = query.or(
          `location->>state.ilike.%${value}%,location->>country.ilike.%${value}%,location->>lga.ilike.%${value}%`
        );
      }
      if (filters.category) query = query.eq("category", filters.category);
      if (filters.skills.length > 0) query = query.contains("required_skills", filters.skills);

      const { data, error: projectsError, count } = await query.range(from, to);
      if (projectsError) throw new Error(projectsError.message);

      setProjects(data || []);
      setTotalCount(count || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadFilterOptions();
        await fetchProjects(DEFAULT_FILTERS, 1, pageSize, true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading) fetchProjects(appliedFilters, currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handleSearch = async () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
    await fetchProjects(draftFilters, 1, pageSize);
  };

  const handleClearFilters = async () => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
    await fetchProjects(DEFAULT_FILTERS, 1, pageSize);
  };

  const toggleSkill = (skill: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const hasActiveFilters =
    !!draftFilters.search.trim() ||
    !!draftFilters.location.trim() ||
    !!draftFilters.category ||
    draftFilters.skills.length > 0;

  const formatDate = (date: string) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "-";

  if (loading) {
    return (
      <div className="container mx-auto space-y-6 p-6 max-w-8xl">
        <Skeleton className="h-8 w-64" />
        <Card><CardContent className="pt-4"><Skeleton className="h-10 w-full" /></CardContent></Card>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-4/5" /></CardHeader>
              <CardContent><Skeleton className="h-32 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-8xl">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => fetchProjects(appliedFilters, currentPage, pageSize)}>
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
        <h1 className="text-2xl md:text-3xl font-bold">Volunteer Opportunities</h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{activeProjectsCount}</span> active projects available.
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
                <SelectTrigger className="h-9"><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Skills</Label>
              <Select value="" onValueChange={(v) => v && toggleSkill(v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Add skill filter..." /></SelectTrigger>
                <SelectContent>
                  {availableSkills.length > 0 ? (
                    availableSkills.map((skill) => (
                      <SelectItem key={skill} value={skill}>{skill.replace(/_/g, " ")}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No skills in projects</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {draftFilters.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {draftFilters.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => toggleSkill(skill)}>
                  {skill.replace(/_/g, " ")} ×
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{totalCount}</span> matching projects
            </p>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} disabled={searching}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
              <Button size="sm" className="action-btn" onClick={handleSearch} disabled={searching}>
                <Search className="h-4 w-4 mr-1" /> {searching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">No projects match your criteria</h3>
            <Button variant="outline" onClick={handleClearFilters}>Clear filters</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="line-clamp-2 text-lg">{project.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    {project.organization_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                  <p className="line-clamp-3">{project.description}</p>
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {formatLocation(project.location)}</p>
                  <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(project.start_date)} - {formatDate(project.end_date)}</p>
                  <p className="flex items-center gap-2"><Users className="h-4 w-4" /> {project.volunteers_registered} / {project.volunteers_needed} volunteers</p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full action-btn group">
                    <Link href={routes.volunteerViewProject(project.id)}>
                      View details <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {totalCount === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, totalCount)} of {totalCount} projects
              </p>
              <div className="flex items-center gap-2">
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="h-8 w-[72px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1 || searching}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || searching}>
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
