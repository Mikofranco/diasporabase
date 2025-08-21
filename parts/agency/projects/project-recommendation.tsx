// app/dashboard/agency/projects/project-recommendation.tsx
"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Star, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const supabase = createClient();

interface Volunteer {
  volunteer_id: string;
  full_name: string;
  email: string;
  skills: string[];
  residence_country: string;
  volunteer_state: string;
  average_rating: number;
  request_status?: string;
  matched_skills: string[];
}

interface ProjectRecommendationProps {
  projectId: string;
  volunteersNeeded: number;
  volunteersRegistered: number;
}

const ProjectRecommendation: React.FC<ProjectRecommendationProps> = ({
  projectId,
  volunteersNeeded,
  volunteersRegistered,
}) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState<boolean>(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in to view recommendations.");

        // Fetch project required skills and status
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("required_skills, status")
          .eq("id", projectId)
          .eq("organization_id", userId)
          .single();

        if (projectError) throw new Error("Error fetching project: " + projectError.message);
        if (!projectData) throw new Error("Project not found or you don’t have access.");

        const requiredSkills = projectData.required_skills?.length > 0 ? projectData.required_skills : ["general"];

        // Fetch recommended volunteers using the function
        const { data: volunteerData, error: volunteerError } = await supabase.rpc(
          "select_volunteers_for_project",
          {
            p_project_id: projectId,
            p_required_skills: requiredSkills,
          }
        );

        if (volunteerError) throw new Error("Error fetching volunteers: " + volunteerError.message);

        // Fetch existing request statuses
        const { data: requestData, error: requestError } = await supabase
          .from("volunteer_requests")
          .select("volunteer_id, status")
          .eq("project_id", projectId);

        if (requestError) throw new Error("Error fetching request statuses: " + requestError.message);

        // Map volunteers with request status and matched skills
        const recommendedVolunteers: Volunteer[] = volunteerData?.map((v: any) => ({
          volunteer_id: v.volunteer_id,
          full_name: v.full_name,
          email: v.email,
          skills: v.skills,
          residence_country: v.residence_country,
          volunteer_state: v.volunteer_state,
          average_rating: v.average_rating || 0,
          request_status: requestData?.find((r: any) => r.volunteer_id === v.volunteer_id)?.status || null,
          matched_skills: v.skills.filter((skill: string) => requiredSkills.includes(skill)),
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

  const handleSendRequest = async (volunteer: Volunteer) => {
    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to send requests.");

      // Check if a request already exists
      const { data: existingRequest } = await supabase
        .from("volunteer_requests")
        .select("id, status")
        .eq("project_id", projectId)
        .eq("volunteer_id", volunteer.volunteer_id)
        .single();

      if (existingRequest) {
        toast.error(`Request already sent (Status: ${existingRequest.status})`);
        return;
      }

      // Check if volunteer is already assigned
      const { data: existingAssignment } = await supabase
        .from("project_volunteers")
        .select("volunteer_id")
        .eq("project_id", projectId)
        .eq("volunteer_id", volunteer.volunteer_id)
        .single();

      if (existingAssignment) {
        toast.error("Volunteer is already assigned to this project.");
        return;
      }

      // Check volunteer limit
      if (volunteersRegistered >= volunteersNeeded) {
        toast.error("Volunteer limit reached for this project.");
        return;
      }

      // Send request
      const { error: requestError } = await supabase.from("volunteer_requests").insert([
        {
          project_id: projectId,
          volunteer_id: volunteer.volunteer_id,
          status: "pending",
        },
      ]);

      if (requestError) throw new Error("Error sending request: " + requestError.message);

      // Update local state to reflect request status
      setVolunteers(
        volunteers.map((v) =>
          v.volunteer_id === volunteer.volunteer_id ? { ...v, request_status: "pending" } : v
        )
      );
      toast.success(`Request sent to ${volunteer.full_name}!`);
      setIsRequestDialogOpen(false);
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
        <h3 className="text-lg font-semibold text-gray-900">Recommended Volunteers</h3>
        {volunteers.length === 0 ? (
          <p className="text-gray-500">No volunteers found with matching skills.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {volunteers.map((volunteer) => (
              <Card
                key={volunteer.volunteer_id}
                className="hover:shadow-md transition-shadow duration-200 border-0 bg-gray-50"
              >
                <CardContent className="pt-4">
                  <p className="font-semibold text-gray-900">{volunteer.full_name}</p>
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
                                ? "bg-blue-600 text-white ml-1"
                                : "ml-1"
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
                  <p className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>{volunteer.average_rating.toFixed(1)}</span>
                  </p>
                  {volunteer.request_status ? (
                    <p className="text-sm mt-2">
                      <strong>Request Status:</strong>{" "}
                      <span
                        className={`${
                          volunteer.request_status === "pending"
                            ? "text-yellow-600"
                            : volunteer.request_status === "accepted"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {volunteer.request_status.charAt(0).toUpperCase() +
                          volunteer.request_status.slice(1)}
                      </span>
                    </p>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                          onClick={() => {
                            setSelectedVolunteer(volunteer);
                            setIsRequestDialogOpen(true);
                          }}
                          disabled={volunteersRegistered >= volunteersNeeded}
                        >
                          Send Request
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {volunteersRegistered >= volunteersNeeded
                          ? "Volunteer limit reached"
                          : "Send a request to this volunteer"}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Volunteer Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to send a request to {selectedVolunteer?.full_name} for this project?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRequestDialogOpen(false)}
                className="hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedVolunteer && handleSendRequest(selectedVolunteer)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Send Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ProjectRecommendation;