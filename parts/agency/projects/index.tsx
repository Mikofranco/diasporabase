// app/dashboard/agency/projects/page.tsx
"use client";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // For navigation
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateProjectForm from "../create-project";
import { Badge } from "@/components/ui/badge";

const supabase = createClient();

interface Project {
  id: string;
  title: string;
  description: string;
  organization_id: string;
  organization_name: string;
  location: string;
  start_date: string;
  end_date: string;
  volunteers_needed: number;
  volunteers_registered: number;
  status: string;
  category: string;
  created_at: string;
}

const OrganizationsProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to view projects.");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, role, organization_name")
          .eq("id", userId)
          .single();

        if (profileError) throw new Error("Error fetching profile: " + profileError.message);
        if (profile.role !== "organization" && profile.role !== "agency") {
          throw new Error("Only organizations or agencies can view projects.");
        }

        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .eq("organization_id", userId)
          .order("created_at", { ascending: false });

        if (projectsError) throw new Error("Error fetching projects: " + projectsError.message);
        setProjects(projectsData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleCreateProjectClick = () => {
    setShowCreateForm(true);
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects([newProject, ...projects]);
    setShowCreateForm(false);
  };

  const handleProjectSelect = (project: Project) => {
    router.push(`/dashboard/agency/projects/${project.id}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">My Organization&apos;s Projects</h1>

      <Button
        onClick={handleCreateProjectClick}
        variant={"outline"}
        // className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Create Project
      </Button>

      {showCreateForm && (//@ts-ignore
        <CreateProjectForm onClose={handleFormClose} onProjectCreated={handleProjectCreated} />
      )}

      {loading && <p className="text-gray-500">Loading projects...</p>}
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
      {!loading && !error && projects.length === 0 && (
        <p className="text-gray-600">No projects found. Create one to get started!</p>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <CardDescription>{project.organization_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{project.description}</p>
                <div className="space-y-2 text-sm">
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
                      {project.volunteers_registered}/{project.volunteers_needed} volunteers
                    </span>
                  </div>
                  <Badge variant="secondary">{project.category}</Badge>
                </div>
                <Button
                  className="w-full mt-4 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#0EA5E9]/90 hover:to-[#0284C7]/90"
                  onClick={() => handleProjectSelect(project)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizationsProjects;