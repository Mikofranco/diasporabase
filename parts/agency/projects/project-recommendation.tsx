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
import { startLoading, stopLoading } from "@/lib/loading";

const supabase = createClient();

interface Volunteer {
  volunteer_id: string;
  full_name: string;
  email: string;
  skills: string[];
  availability: string;
  residence_country: string;
  residence_state: string;
  volunteer_countries: string[];
  volunteer_states: string[];
  volunteer_lgas: string[];
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
      startLoading();

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in");

        // Validate projectId
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(projectId)) {
          throw new Error("Invalid project ID format.");
        }

        // Check admin status
        const { data: isAdminData, error: isAdminError } = await supabase.rpc("is_admin");
        if (isAdminError) throw new Error("Error checking admin status: " + isAdminError.message);
        const isAdmin = isAdminData || false;

        console.log("User is admin:", isAdmin, "User ID:", userId, "Project ID:", projectId);

        // Fetch project
        let query = supabase
          .from("projects")
          .select("required_skills, status, title, organization_id")
          .eq("id", projectId);

        if (!isAdmin) {
          query = query.eq("organization_id", userId);
        }

        const { data: projectData, error: projectError } = await query;

        if (projectError) throw new Error("Error fetching project: " + projectError.message);
        if (!projectData || projectData.length === 0) {
          throw new Error("Project not found or you don’t have access.");
        }

        const project = projectData[0];
        const requiredSkills = project.required_skills?.length > 0 ? project.required_skills : ["general"];

        // Fetch recommended volunteers
        const { data: volunteerData, error: volunteerError } = await supabase.rpc(
          "select_volunteers_for_project",
          {
            p_project_id: projectId,
            p_required_skills: requiredSkills,
          }
        );
        if (volunteerError) throw new Error("Error fetching volunteers: " + volunteerError.message);

        // Fetch existing request statuses from agency_requests
        let requestQuery = supabase
          .from("agency_requests")
          .select("volunteer_id, status")
          .eq("project_id", projectId);

        if (!isAdmin) {
          requestQuery = requestQuery.eq("requester_id", userId);
        }

        const { data: requestData, error: requestError } = await requestQuery;
        if (requestError) throw new Error("Error fetching request statuses: " + requestError.message);

        // Map volunteers
        const recommendedVolunteers: Volunteer[] = volunteerData?.map((v: any) => ({
          volunteer_id: v.volunteer_id,
          full_name: v.full_name,
          email: v.email,
          skills: v.skills,
          availability: v.availability,
          residence_country: v.residence_country,
          residence_state: v.residence_state,
          volunteer_countries: v.volunteer_countries || [],
          volunteer_states: v.volunteer_states || [],
          volunteer_lgas: v.volunteer_lgas || [],
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
        stopLoading();
      }
    };

    console.log("Fetching recommendations for project:", projectId);
    fetchRecommendations();
  }, [projectId]);

  const handleSendRequest = async (volunteer: Volunteer) => {
    try {
      startLoading();
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to send requests.");

      // Check admin status
      const { data: isAdminData, error: isAdminError } = await supabase.rpc("is_admin");
      if (isAdminError) throw new Error("Error checking admin status: " + isAdminError.message);
      const isAdmin = isAdminData || false;

      // Fetch requester's role and name
      const { data: requesterData, error: requesterError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", userId)
        .single();
      if (requesterError) throw new Error("Error fetching requester details: " + requesterError.message);

      // Check existing request in agency_requests
      let query = supabase
        .from("agency_requests")
        .select("id, status")
        .eq("project_id", projectId)
        .eq("volunteer_id", volunteer.volunteer_id);

      if (!isAdmin) {
        query = query.eq("requester_id", userId);
      }

      const { data: existingRequest, error: requestCheckError } = await query;
      if (requestCheckError) throw new Error("Error checking existing request: " + requestCheckError.message);

      if (existingRequest && existingRequest.length > 0) {
        toast.error(`Request already sent (Status: ${existingRequest[0].status})`);
        return;
      }

      // Check if volunteer is already assigned
      const { data: existingAssignment, error: assignmentError } = await supabase
        .from("project_volunteers")
        .select("volunteer_id")
        .eq("project_id", projectId)
        .eq("volunteer_id", volunteer.volunteer_id);

      if (assignmentError) throw new Error("Error checking assignment: " + assignmentError.message);
      if (existingAssignment && existingAssignment.length > 0) {
        toast.error("Volunteer is already assigned to this project.");
        return;
      }

      // Check volunteer limit
      if (volunteersRegistered >= volunteersNeeded) {
        toast.error("Volunteer limit reached for this project.");
        return;
      }

      // Fetch project title for notification
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("title")
        .eq("id", projectId)
        .single();

      if (projectError) throw new Error("Error fetching project title: " + projectError.message);

      // Send request to agency_requests
      const { error: requestError } = await supabase.from("agency_requests").insert([
        {
          project_id: projectId,
          volunteer_id: volunteer.volunteer_id,
          requester_id: userId,
          status: "pending",
        },
      ]);

      if (requestError) throw new Error("Error sending request: " + requestError.message);

      // Insert notification for volunteer
      const { error: notificationError } = await supabase.from("notifications").insert([
        {
          user_id: volunteer.volunteer_id,
          message: `You have been invited to join project "${projectData.title}" by ${requesterData.full_name || requesterData.role}.`,
          type: "volunteer_request",
          is_read: false,
          related_id: projectId,
        },
      ]);

      if (notificationError) throw new Error("Error creating notification: " + notificationError.message);

      // Update local state
      setVolunteers(
        volunteers.map((v) =>
          v.volunteer_id === volunteer.volunteer_id ? { ...v, request_status: "pending" } : v
        )
      );
      toast.success(`Request sent to ${volunteer.full_name} with notification!`);
      setIsRequestDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      stopLoading();
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
          <p className="text-gray-500">No volunteers found with matching skills or location.</p>
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
                      {volunteer.residence_state || volunteer.volunteer_states.join(", ") || "N/A"},{" "}
                      {volunteer.residence_country || volunteer.volunteer_countries.join(", ") || "N/A"}
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