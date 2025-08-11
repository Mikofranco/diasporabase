"use client";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Star, MapPin } from "lucide-react";

const supabase = createClient();

interface Volunteer {
  id: string;
  full_name: string;
  email: string;
  skills: string[];
  residence_country: string;
  volunteer_state: string;
//   average_rating: number;
  matched_skills: string[];
}

interface ProjectRecommendationProps {
  projectId: string;
}

const ProjectRecommendation: React.FC<ProjectRecommendationProps> = ({ projectId }) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to view recommendations.");

        // Fetch project required skills
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("required_skills")
          .eq("id", projectId)
          .eq("organization_id", userId)
          .single();

        if (projectError) throw new Error("Error fetching project: " + projectError.message);
        if (!projectData) throw new Error("Project not found or you don’t have access.");

        const requiredSkills = projectData.required_skills?.length > 0 ? projectData.required_skills : ["general"];

        // Fetch profiles with matching skills
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email, skills, residence_country, volunteer_state")
          .overlaps("skills", requiredSkills);

        if (profilesError) throw new Error("Error fetching profiles: " + profilesError.message);

        // Map profiles to include matched skills
        const recommendedVolunteers: Volunteer[] = profilesData?.map((profile: any) => ({
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          skills: profile.skills,
          residence_country: profile.residence_country,
          volunteer_state: profile.volunteer_state,
        //   average_rating: profile.average_rating || 0,?
          matched_skills: profile.skills.filter((skill: string) => requiredSkills.includes(skill)),
        })) || [];

        setVolunteers(recommendedVolunteers);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [projectId]);

  const handleAssignVolunteer = async (volunteerId: string) => {
    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to assign volunteers.");

      // Check if volunteer is already assigned
      const { data: existingAssignment } = await supabase
        .from("project_volunteers")
        .select("id")
        .eq("project_id", projectId)
        .eq("volunteer_id", volunteerId)
        .single();

      if (existingAssignment) {
        toast.error("Volunteer is already assigned to this project.");
        return;
      }

      // Fetch project to check volunteer limit
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("volunteers_needed, volunteers_registered")
        .eq("id", projectId)
        .single();

      if (projectError) throw new Error("Error fetching project: " + projectError.message);

      if (projectData.volunteers_registered >= projectData.volunteers_needed) {
        toast.error("Volunteer limit reached for this project.");
        return;
      }

      // Assign volunteer
      const { error: assignError } = await supabase.from("project_volunteers").insert([
        {
          project_id: projectId,
          volunteer_id: volunteerId,
        },
      ]);

      if (assignError) throw new Error("Error assigning volunteer: " + assignError.message);

      // Increment volunteers_registered
      const newRegistered = projectData.volunteers_registered + 1;
      const { error: updateError } = await supabase
        .from("projects")
        .update({ volunteers_registered: newRegistered })
        .eq("id", projectId);

      if (updateError) throw new Error("Error updating project: " + updateError.message);

      // Remove assigned volunteer from recommendations
      setVolunteers(volunteers.filter((v) => v.id !== volunteerId));
      toast.success("Volunteer assigned successfully!");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6 text-red-600">{error}</CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Recommended Volunteers</h3>
        {volunteers.length === 0 ? (
          <p className="text-gray-500">No volunteers found with matching skills.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {volunteers.map((volunteer) => (
              <Card
                key={volunteer.id}
                className="hover:shadow-md transition-shadow duration-200"
              >
                <CardContent className="pt-4">
                  <p className="font-semibold">{volunteer.full_name}</p>
                  <p className="text-sm text-gray-600">{volunteer.email}</p>
                  <p className="text-sm">
                    <strong>Skills:</strong>{" "}
                    {volunteer.skills.map((skill) => (
                      <Tooltip key={skill}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant={
                              volunteer.matched_skills.includes(skill)
                                ? "default"
                                : "outline"
                            }
                            className={
                              volunteer.matched_skills.includes(skill)
                                ? "bg-blue-600 text-white"
                                : ""
                            }
                          >
                            {skill}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {volunteer.matched_skills.includes(skill)
                            ? "Matches project requirement"
                            : "Additional skill"}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>
                      {volunteer.volunteer_state}, {volunteer.residence_country}
                    </span>
                  </p>
                  {/* <p className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>{volunteer.average_rating.toFixed(1)}</span>
                  </p> */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="mt-4 w-full bg-green-600 hover:bg-green-700 transition-colors duration-200"
                        onClick={() => handleAssignVolunteer(volunteer.id)}
                      >
                        Assign Volunteer
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Assign this volunteer to the project</TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ProjectRecommendation;