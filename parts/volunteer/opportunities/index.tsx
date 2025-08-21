// app/dashboard/volunteer/opportunities/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MapPin, Briefcase, Calendar, Users } from "lucide-react";
import Link from "next/link";

const supabase = createClient();

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
  required_skills: string[] | null;
  created_at: string;
}

const Opportunities: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to view opportunities.");

        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select(
            "id, title, description, organization_name, location, start_date, end_date, volunteers_registered, status, category, required_skills, created_at"
          )
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (projectsError) throw new Error("Error fetching projects: " + projectsError.message);
        if (!projectsData) throw new Error("No active projects found.");

        setProjects(projectsData);
        setFilteredProjects(projectsData);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    // Filter projects based on search query and location
    const filtered = projects.filter((project) => {
      const matchesSearch =
        searchQuery === "" ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation =
        locationFilter === "" ||
        project.location.toLowerCase().includes(locationFilter.toLowerCase());
      return matchesSearch && matchesLocation;
    });
    setFilteredProjects(filtered);
  }, [searchQuery, locationFilter, projects]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleLocationFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationFilter(e.target.value);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 space-y-8 max-w-6xl">
        <Skeleton className="h-12 w-1/3 rounded-lg" />
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-1/2 rounded-lg" />
          <Skeleton className="h-10 w-1/4 rounded-lg" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 max-w-6xl">
        <Card className="border-red-200 bg-red-50 shadow-md">
          <CardContent className="pt-6 text-red-600">{error}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900">Volunteer Opportunities</h1>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search projects by title or description..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
        />
        <Input
          placeholder="Filter by location (e.g., city or state)..."
          value={locationFilter}
          onChange={handleLocationFilterChange}
          className="border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg transition-shadow duration-200 hover:shadow-sm"
        />
      </div>
      {filteredProjects.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="pt-6 text-gray-600">
            No active projects found matching your criteria.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="shadow-md border-0 hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">{project.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-600 line-clamp-3">{project.description}</p>
                <p className="text-sm text-gray-500">
                  <Briefcase className="inline h-4 w-4 mr-1" />
                  {project.organization_name}
                </p>
                <p className="text-sm text-gray-500">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  {project.location || "Location not specified"}
                </p>
                <p className="text-sm text-gray-500">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  {new Date(project.start_date).toLocaleDateString()} -{" "}
                  {new Date(project.end_date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  <Users className="inline h-4 w-4 mr-1" />
                  {project.volunteers_registered}/{project.volunteers_needed} volunteers
                </p>
                {project.category && (
                  <Badge className="bg-blue-600 text-white">
                    {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                  </Badge>
                )}
                {project.required_skills && project.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.required_skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link href={`/dashboard/volunteer/projects/${project.id}`}>
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Opportunities;