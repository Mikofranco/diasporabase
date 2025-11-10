"use client";

import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Briefcase, Calendar, MapPin, Users, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

const supabase = createClient();

interface Project {
  id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "pending" | "cancelled";
  start_date: string;
  end_date: string;
  location?: string;
  volunteers_registered: number;
  volunteers_needed: number;
  country?: string;
  state?: string;
  lga?: string;
}

interface ProjectsListProps {
  agencyId: string;
}

export default function ProjectsList({ agencyId }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!agencyId) return;

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          title,
          description,
          status,
          start_date,
          end_date,
          location,
          volunteers_registered,
          volunteers_needed,
          country,
          state,
          lga
        `)
        .eq("organization_id", agencyId) // Exact match from your schema
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        setError(error.message);
      } else {
        setProjects(data as Project[]);
      }
      setLoading(false);
    };

    fetchProjects();
  }, [agencyId]);

  if (loading) return <ProjectsSkeleton />;

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Failed to Load Projects</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto mt-8 border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-lg font-medium">No Projects Yet</p>
          <p className="mt-2 text-sm">
            Create your first project to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Projects</h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const progress = Math.min(
            100,
            Math.round((project.volunteers_registered / project.volunteers_needed) * 100)
          );

          return (
            <Link
              key={project.id}
              href={`/dashboard/agency/projects/${project.id}`}
              className="group block"
            >
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                    <StatusBadge status={project.status} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Volunteers</span>
                      <span>
                        {project.volunteers_registered} / {project.volunteers_needed}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                    {project.start_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(project.start_date), "MMM d")}
                        {project.end_date && ` – ${format(new Date(project.end_date), "MMM d")}`}
                      </div>
                    )}
                    {(project.location || project.lga) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {project.lga || project.location}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


function StatusBadge({ status }: { status: Project["status"] }) {
  const config = {
    active: { label: "Active", class: "bg-green-100 text-green-800 border-green-300" },
    completed: { label: "Completed", class: "bg-blue-100 text-blue-800 border-blue-300" },
    pending: { label: "Pending", class: "bg-amber-100 text-amber-800 border-amber-300" },
    cancelled: { label: "Cancelled", class: "bg-red-100 text-red-800 border-red-300" },
  }[status];

  return (
    <Badge variant="outline" className={`font-medium ${config.class}`}>
      {config.label}
    </Badge>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="mt-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-8 w-full rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}