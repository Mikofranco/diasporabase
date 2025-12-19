// app/dashboard/volunteer-projects/page.tsx
"use client";

import { supabase } from "@/lib/supabase/client";
import { formatLocation, getUserId } from "@/lib/utils";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  Tag,
  ArrowRight,
} from "lucide-react";
import { Project, ProjectStatus } from "@/lib/types";

// Update status variant to match your actual statuses
const statusVariant: Record<
  ProjectStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  active: "outline",
  completed: "outline",
  cancelled: "destructive",
};

export default function VolunteerProjectsManagement() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        `
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

  const spotsLeft = (p: Project) =>
    Math.max(0, (p.volunteersNeeded || 0) - (p.volunteersRegistered || 0));

  const formatDate = (date?: string) =>
    date ? format(new Date(date), "MMM d, yyyy") : "TBD";

  const goToProjectDetails = (projectId: string) => {
    router.push(`/dashboard/volunteer/projects/${projectId}`);
  };
  const handleRouteToViewProject = () => {
    router.push("/dashboard/volunteer/find-opportunity");
  };

  // Loading State
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Skeleton className="h-10 w-80 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
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
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center md:flex-row flex-col">
          <div className="mb-8">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              My Volunteer Projects
            </h1>
            <p className="text-muted-foreground mt-1">
              Projects you've signed up for and are participating in
            </p>
          </div>
          {projects.length != 0 && (
            <Button className="action-btn text-base md:text-sm" onClick={handleRouteToViewProject}>
              View Ongoing Projects
            </Button>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-muted p-6 mb-6">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              No registered projects
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              You haven't signed up for any volunteer projects yet. Browse
              available opportunities!
            </p>
            <Button
              className="action-btn"
              onClick={() =>
                router.push("/dashboard/volunteer/find-opportunity")
              }
            >
              Browse Projects
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-xl line-clamp-2">
                    {project.title}
                  </CardTitle>
                  <Badge variant={statusVariant[project.status!]}>
                    {project.status}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {project.organizationName}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {project.location || "Location not set"}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(project.startDate)} →{" "}
                    {formatDate(project.endDate)}
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      <span className={spotsLeft(project) === 0 ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                        {spotsLeft(project)}
                      </span>{" "}
                      spots left
                    </span>
                  </div> */}
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
                            className="text-xs"
                          >
                            <Tag className="mr-1 h-3 w-3" />
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}

                <Button
                  className="w-full mt-4 action-btn"
                  onClick={() => goToProjectDetails(project.id)}
                >
                  View Project Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
