"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import { Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";

type ProjectWithInterest = {
  id: string;
  title: string;
  applications: number;
};

export function TopProjectsByVolunteerInterest() {
  const [projects, setProjects] = useState<ProjectWithInterest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data: userId, error: userError } = await getUserId();
        if (userError || !userId) {
          setProjects([]);
          return;
        }

        // Fetch agency's projects
        const { data: projectsData } = await supabase
          .from("projects")
          .select("id, title")
          .eq("organization_id", userId);
        const projectList = (projectsData ?? []) as { id: string; title: string }[];
        const projectIds: string[] = projectList.map((p) => p.id);

        if (projectIds.length === 0) {
          setProjects([]);
          return;
        }

        // Volunteer-initiated: volunteer_requests (applications)
        const { data: volunteerReqs } = await supabase
          .from("volunteer_requests")
          .select("project_id")
          .in("project_id", projectIds);

        // Agency-initiated + accepted: agency_requests (invites accepted by volunteer)
        const { data: agencyReqs } = await supabase
          .from("agency_requests")
          .select("project_id")
          .in("project_id", projectIds)
          .eq("status", "accepted");

        const countByProject: Record<string, number> = {};
        projectIds.forEach((id: string) => (countByProject[id] = 0));

        (volunteerReqs ?? []).forEach((r: { project_id: string }) => {
          countByProject[r.project_id] = (countByProject[r.project_id] || 0) + 1;
        });
        (agencyReqs ?? []).forEach((r: { project_id: string }) => {
          countByProject[r.project_id] = (countByProject[r.project_id] || 0) + 1;
        });

        const projectTitleById = new Map<string, string>(
          projectList.map((p) => [p.id, p.title] as [string, string])
        );
        const top5: ProjectWithInterest[] = Object.entries(countByProject)
          .filter(([, count]: [string, number]) => count > 0)
          .map(([id, applications]: [string, number]) => ({
            id,
            title: projectTitleById.get(id) ?? "Unknown",
            applications,
          }))
          .sort((a, b) => b.applications - a.applications)
          .slice(0, 5);

        setProjects(top5);
      } catch (e) {
        console.error("Top projects fetch error:", e);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Top Projects by Volunteer Interest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Top Projects by Volunteer Interest
          </CardTitle>
          <Link
            href={routes.agencyAnalytics}
            className="text-sm text-diaspora-blue hover:underline"
          >
            View analytics
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground text-sm">
            <Users className="h-10 w-10 mb-2 opacity-50" />
            <p>No volunteer applications or accepted invites yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Top 5 Projects Volunteers Want to Join
        </CardTitle>
        {/* <Link
          href={routes.agencyAnalytics}
          className="text-sm text-diaspora-blue hover:underline"
        >
          View analytics
        </Link> */}
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {projects.map((p, i) => (
            <li key={p.id} className="flex items-center justify-between gap-3">
              <Link
                href={routes.agencyViewProject(p.id)}
                className="flex-1 min-w-0 text-sm font-medium text-slate-900 hover:text-diaspora-blue truncate"
              >
                {i + 1}. {p.title}
              </Link>
              <span className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                <Users className="h-4 w-4" />
                {p.applications} {p.applications === 1 ? "application" : "applications"}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
