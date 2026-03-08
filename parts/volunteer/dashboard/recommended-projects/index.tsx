"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, FolderOpen, MapPin, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectRecommendations, RecommendedProject } from "@/hooks/useProjectRecommendations";
import { getUserId } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { routes } from "@/lib/routes";
import { useSkillLabels } from "@/hooks/useSkillLabels";

const DASHBOARD_LIMIT = 3;

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatLocation(p: RecommendedProject): string {
  const parts: string[] = [];
  if (p.location_lga) parts.push(p.location_lga);
  else if (p.location_state) parts.push(p.location_state);
  if (p.location_country) parts.push(p.location_country === "NG" ? "Nigeria" : p.location_country);
  return parts.length ? parts.join(", ") : "Location not specified";
}

interface RecommendationCardProps {
  project: RecommendedProject;
  volunteerSkills: string[];
  onViewProject: (projectId: string) => void;
}

export function RecommendationCard({ project, volunteerSkills, onViewProject }: RecommendationCardProps) {
  const { getLabel } = useSkillLabels();
  const skills = project.required_skills ?? [];
  const matchedSkills = volunteerSkills.length
    ? skills.filter((s) => volunteerSkills.includes(s))
    : skills;

  return (
    <Card
      className={cn(
        "group flex flex-col border border-gray-200/80 bg-white rounded-xl overflow-hidden",
        "hover:shadow-lg hover:border-sky-200/60 transition-all duration-200",
        "cursor-pointer",
      )}
      onClick={() => onViewProject(project.project_id)}
    >
      <div className="px-5 pt-4 pb-1 flex items-start justify-between gap-2 flex-wrap">
        <Badge variant="secondary" className="text-xs font-normal shrink-0">
          {project.category}
        </Badge>
        {project.score > 0 && (
          <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50 shrink-0">
            <Sparkles className="h-3 w-3 mr-1" />
            {project.score}% match
          </Badge>
        )}
      </div>

      <CardHeader className="pt-2 pb-1 px-5">
        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
          {project.title}
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          {project.organization_name ?? "—"}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 px-5 pt-2 pb-4 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {project.description ?? ""}
        </p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 text-sky-600" />
          <span>{formatLocation(project)}</span>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {skills.slice(0, 3).map((skill) => {
              const isMatched = matchedSkills.includes(skill);
              const label = getLabel(skill);
              const displaySkill = label.length > 20 ? `${label.slice(0, 18)}…` : label;
              return (
                <Badge
                  key={skill}
                  variant={isMatched ? "default" : "outline"}
                  className={cn(
                    "text-xs font-normal max-w-[120px] truncate",
                    isMatched && "bg-sky-100 text-sky-800 border-sky-200",
                  )}
                  title={label}
                >
                  {displaySkill}
                </Badge>
              );
            })}
            {skills.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{skills.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-sky-600" />
            <span>
              {formatDate(project.start_date)} – {formatDate(project.end_date)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-sky-600" />
            <span>
              {project.volunteers_registered ?? 0}
              {(project.volunteers_needed ?? 0) > 0
                ? ` / ${project.volunteers_needed}`
                : ""}{" "}
              volunteers
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0">
        <Button
          type="button"
          className="w-full rounded-xl bg-diaspora-blue hover:bg-diaspora-blue/90 text-white font-medium shadow-sm group-hover:shadow-md transition-shadow"
          onClick={(e) => {
            e.stopPropagation();
            onViewProject(project.project_id);
          }}
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          View Project
        </Button>
      </CardFooter>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="border border-gray-200/80 bg-white rounded-xl overflow-hidden animate-pulse">
      <div className="px-5 pt-4 pb-1 flex gap-2">
        <div className="h-5 w-16 rounded bg-gray-200" />
        <div className="h-5 w-20 rounded bg-gray-200" />
      </div>
      <CardHeader className="pt-2 pb-1 px-5">
        <div className="h-5 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-100 mt-2" />
      </CardHeader>
      <CardContent className="px-5 pt-2 pb-4 space-y-3">
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-4/5 rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
        <div className="h-4 w-32 rounded bg-gray-100 mt-4" />
      </CardContent>
      <CardFooter className="px-5 pb-5 pt-0">
        <div className="h-10 w-full rounded-xl bg-gray-200" />
      </CardFooter>
    </Card>
  );
}

interface ProfileCompletenessBannerProps {
  hasSkills: boolean;
  hasAreasOfInterest: boolean;
}

function ProfileCompletenessBanner({ hasSkills, hasAreasOfInterest }: ProfileCompletenessBannerProps) {
  const router = useRouter();
  if (hasSkills && hasAreasOfInterest) return null;

  return (
    <div
      role="banner"
      className="mb-4 rounded-lg border border-sky-200/80 bg-sky-50/80 px-4 py-3 text-sm text-sky-800"
    >
      <p className="font-medium">
        Add your skills and preferred locations to get better project matches
      </p>
      <Button
        variant="link"
        className="h-auto p-0 mt-1 text-sky-600 hover:text-sky-700 font-medium"
        onClick={() => router.push(routes.volunteerProfile)}
      >
        Complete Profile →
      </Button>
    </div>
  );
}

export default function RecommendedProjects() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [volunteerSkills, setVolunteerSkills] = useState<string[]>([]);
  const [hasAreasOfInterest, setHasAreasOfInterest] = useState(true);

  const { recommendations, isLoading, error } = useProjectRecommendations(userId);

  useEffect(() => {
    const loadUserAndProfile = async () => {
      const { data: uid, error: uidErr } = await getUserId();
      if (uidErr || !uid) return;

      setUserId(uid);

      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("skills, volunteer_countries, volunteer_states, volunteer_lgas")
        .eq("id", uid)
        .single();

      if (profile) {
        setVolunteerSkills(profile.skills ?? []);
        const hasAreas =
          (profile.volunteer_countries?.length ?? 0) > 0 ||
          (profile.volunteer_states?.length ?? 0) > 0 ||
          (profile.volunteer_lgas?.length ?? 0) > 0;
        setHasAreasOfInterest(hasAreas);
      }
    };

    loadUserAndProfile();
  }, []);

  const handleViewProject = (projectId: string) => {
    router.push(routes.volunteerViewProject(projectId));
  };

  if (!userId) return null;

  const displayedRecommendations = recommendations?.slice(0, DASHBOARD_LIMIT) ?? [];
  const totalCount = recommendations?.length ?? 0;
  const hasMore = totalCount > DASHBOARD_LIMIT;

  return (
    <div className="flex flex-col gap-2 shadow-sm border rounded-lg p-4 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-gray-600 font-bold">Recommended for You</h2>
          {!isLoading && totalCount > 0 && (
            <span className="text-sm text-muted-foreground">
              ({Math.min(DASHBOARD_LIMIT, totalCount)} of {totalCount})
            </span>
          )}
        </div>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
            onClick={() => router.push(routes.volunteerFindOpportunity)}
          >
            View all
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
      </div>

      <ProfileCompletenessBanner
        hasSkills={volunteerSkills.length > 0}
        hasAreasOfInterest={hasAreasOfInterest}
      />

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-live="polite">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {error && (
        <div className="text-gray-500 text-center py-6" aria-live="polite">
          Unable to load recommendations. Please try again later.
        </div>
      )}

      {!isLoading && !error && (!recommendations || recommendations.length === 0) && (
        <div
          className="text-center py-12 px-4 rounded-lg bg-gray-50 border border-gray-100"
          aria-live="polite"
        >
          <p className="text-gray-600 font-medium mb-1">No recommendations yet</p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Complete your profile with skills and preferred locations to get better project matches.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push(routes.volunteerProfile)}
          >
            Complete Profile
          </Button>
        </div>
      )}

      {!isLoading && !error && displayedRecommendations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedRecommendations.map((project) => (
            <RecommendationCard
              key={project.project_id}
              project={project}
              volunteerSkills={volunteerSkills}
              onViewProject={handleViewProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
