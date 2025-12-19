// app/dashboard/volunteer/opportunities/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatLocation, getUserId, LocationData } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MapPin, Briefcase, Calendar, Users } from "lucide-react";
import Link from "next/link";

const supabase = createClient();

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

const Opportunities: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchProjectsAndSkills = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to view opportunities.");

        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select(
            "id, title, description, organization_name, location, start_date, end_date, volunteers_needed, volunteers_registered, status, category, required_skills, created_at"
          )
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (projectsError) throw new Error("Error fetching projects: " + projectsError.message);
        if (!projectsData) throw new Error("No active projects found.");

        // Extract unique skills
        const skillsSet = new Set<string>();//@ts-ignore
        projectsData.forEach((project) => {
          if (project.required_skills) {//@ts-ignore
            project.required_skills.forEach((skill) => skillsSet.add(skill));
          }
        });
        const uniqueSkills = Array.from(skillsSet).sort();

        setProjects(projectsData);
        setFilteredProjects(projectsData);
        setAvailableSkills(uniqueSkills);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectsAndSkills();
  }, []);
  
  useEffect(() => {
    // Filter projects based on search query, location, and skills
    const filtered = projects.filter((project) => {
      const matchesSearch =
        searchQuery === "" ||
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation =
        locationFilter === "" ||
        formatLocation(project.location).toLowerCase().includes(locationFilter.toLowerCase());
      const matchesSkills =
        skillsFilter.length === 0 ||
        (project.required_skills &&//@ts-ignore
          skillsFilter.every((skill) => project.required_skills.includes(skill)));
      return matchesSearch && matchesLocation && matchesSkills;
    });
    setFilteredProjects(filtered);
  }, [searchQuery, locationFilter, skillsFilter, projects]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleLocationFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationFilter(e.target.value);
  };

  const handleSkillsFilterChange = (value: string) => {
    setSkillsFilter((prev) =>
      prev.includes(value)
        ? prev.filter((skill) => skill !== value)
        : [...prev, value]
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 space-y-8 max-w-6xl">
        <Skeleton className="h-12 w-1/3 rounded-lg" />
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-1/2 rounded-lg" />
          <Skeleton className="h-10 w-1/4 rounded-lg" />
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
    <div className="container mx-auto p-8 space-y-8 ">
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
        <Select
          onValueChange={handleSkillsFilterChange}
          value=""
        >
          <SelectTrigger className="w-full sm:w-1/4 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg">
            <SelectValue placeholder="Filter by skills..." />
          </SelectTrigger>
          <SelectContent>
            {availableSkills.length > 0 ? (
              availableSkills.map((skill) => (
                <SelectItem key={skill} value={skill}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={skillsFilter.includes(skill)}
                      readOnly
                      className="h-4 w-4"
                    />
                    {skill.charAt(0).toUpperCase() + skill.slice(1).replace("_", " ")}
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                No skills available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {skillsFilter.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => handleSkillsFilterChange(skill)}
          >
            {skill.charAt(0).toUpperCase() + skill.slice(1).replace("_", " ")} ×
          </Badge>
        ))}
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
                  {formatLocation(project.location) || "Location not specified"}
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
                  <Badge className="action-btn text-white">
                    {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                  </Badge>
                )}
                {project.required_skills && project.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.required_skills.slice(0,5).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-sm">
                        {skill.charAt(0).toUpperCase() + skill.slice(1).replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  className="w-full action-btn"
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