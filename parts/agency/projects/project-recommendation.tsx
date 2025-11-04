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
import { useSendMail } from "@/services/mail"; // <-- your async mail helper

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

/* --------------------------------------------------------------- */
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

  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      startLoading();

      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError) throw new Error(userIdError);
        if (!userId) throw new Error("Please log in");

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(projectId)) throw new Error("Invalid project ID format.");

        // admin check
        const { data: isAdminData, error: isAdminError } = await supabase.rpc("is_admin");
        if (isAdminError) throw new Error(isAdminError.message);
        const isAdmin = isAdminData || false;

        // fetch project
        let query = supabase
          .from("projects")
          .select("required_skills, status, title, organization_id")
          .eq("id", projectId);

        if (!isAdmin) query = query.eq("organization_id", userId);

        const { data: projectData, error: projectError } = await query;
        if (projectError) throw new Error(projectError.message);
        if (!projectData?.length) throw new Error("Project not found or you don’t have access.");

        const project = projectData[0];
        const requiredSkills = project.required_skills?.length ? project.required_skills : ["general"];

        // fetch volunteers
        const { data: volunteerData, error: volunteerError } = await supabase.rpc(
          "select_volunteers_for_project",
          { p_project_id: projectId, p_required_skills: requiredSkills }
        );
        if (volunteerError) throw new Error(volunteerError.message);

        // fetch request statuses
        let requestQuery = supabase
          .from("agency_requests")
          .select("volunteer_id, status")
          .eq("project_id", projectId);

        if (!isAdmin) requestQuery = requestQuery.eq("requester_id", userId);

        const { data: requestData, error: requestError } = await requestQuery;
        if (requestError) throw new Error(requestError.message);

        const recommendedVolunteers: Volunteer[] = (volunteerData ?? []).map((v: any) => ({
          volunteer_id: v.volunteer_id,
          full_name: v.full_name,
          email: v.email,
          skills: v.skills,
          availability: v.availability,
          residence_country: v.residence_country,
          residence_state: v.residence_state,
          volunteer_countries: v.volunteer_countries ?? [],
          volunteer_states: v.volunteer_states ?? [],
          volunteer_lgas: v.volunteer_lgas ?? [],
          average_rating: v.average_rating ?? 0,
          request_status: requestData?.find((r: any) => r.volunteer_id === v.volunteer_id)?.status ?? null,
          matched_skills: v.skills.filter((s: string) => requiredSkills.includes(s)),
        }));

        setVolunteers(recommendedVolunteers);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
        stopLoading();
      }
    };

    fetchRecommendations();
  }, [projectId]);

  /* ------------------------------------------------------------------ */
  const handleSendRequest = async (volunteer: Volunteer) => {
    try {
      startLoading();

      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to send requests.");

      const { data: isAdminData, error: isAdminError } = await supabase.rpc("is_admin");
      if (isAdminError) throw new Error(isAdminError.message);
      const isAdmin = isAdminData || false;

      // requester profile (agency name)
      const { data: requesterData, error: requesterError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", userId)
        .single();
      if (requesterError) throw new Error(requesterError.message);

      // existing request?
      let query = supabase
        .from("agency_requests")
        .select("id, status")
        .eq("project_id", projectId)
        .eq("volunteer_id", volunteer.volunteer_id);

      if (!isAdmin) query = query.eq("requester_id", userId);

      const { data: existingRequest, error: requestCheckError } = await query;
      if (requestCheckError) throw new Error(requestCheckError.message);
      if (existingRequest?.length) {
        toast.error(`Request already sent (Status: ${existingRequest[0].status})`);
        return;
      }

      // already assigned?
      const { data: existingAssignment, error: assignmentError } = await supabase
        .from("project_volunteers")
        .select("volunteer_id")
        .eq("project_id", projectId)
        .eq("volunteer_id", volunteer.volunteer_id);
      if (assignmentError) throw new Error(assignmentError.message);
      if (existingAssignment?.length) {
        toast.error("Volunteer is already assigned to this project.");
        return;
      }

      // volunteer limit?
      if (volunteersRegistered >= volunteersNeeded) {
        toast.error("Volunteer limit reached for this project.");
        return;
      }

      // project title
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("title")
        .eq("id", projectId)
        .single();
      if (projectError) throw new Error(projectError.message);
      const projectTitle = projectData.title;

      // INSERT request
      const { error: requestError } = await supabase
        .from("agency_requests")
        .insert({
          project_id: projectId,
          volunteer_id: volunteer.volunteer_id,
          requester_id: userId,
          status: "pending",
        });
      if (requestError) throw new Error(requestError.message);

      // --------------------------------------------------------------
      // SEND EMAIL TO VOLUNTEER
      // --------------------------------------------------------------
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const volunteerDashboardUrl = `${origin}/dashboard/volunteer`;

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e2e8f0;border-radius:8px;">
          <h2 style="color:#1a73e8;">DiasporaBase</h2>
          <p>Hi <strong>${volunteer.full_name}</strong>,</p>
          <p>
            <strong>${requesterData.full_name || "An agency"}</strong> has invited you to join the project
            <strong>"${projectTitle}"</strong>.
          </p>
          <p>
            <a href="${volunteerDashboardUrl}" style="color:#1a73e8;text-decoration:underline;">
              View your dashboard
            </a> to accept or decline the request.
          </p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0;">
          <p style="font-size:0.9em;color:#666;">
            If you did not expect this email, you can safely ignore it.
          </p>
        </div>
      `;

      await useSendMail({
        to: volunteer.email,
        subject: `Invitation to join project "${projectTitle}"`,
        html,
        onSuccess: () => {
          toast.success(`Request sent to ${volunteer.full_name} (email delivered)`);
        },
        onError: (msg) => {
          console.error("Mail error:", msg);
          toast.error(`Request saved, but email failed: ${msg}`);
        },
      });

      // update UI
      setVolunteers((prev) =>
        prev.map((v) =>
          v.volunteer_id === volunteer.volunteer_id ? { ...v, request_status: "pending" } : v
        )
      );

      setIsRequestDialogOpen(false);
    } catch (err: any) {
      console.error(err);
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
                            variant={volunteer.matched_skills.includes(skill) ? "default" : "outline"}
                            className={volunteer.matched_skills.includes(skill) ? "bg-blue-600 text-white ml-1" : "ml-1"}
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
                          className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
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

        {/* Confirmation dialog */}
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Volunteer Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to send a request to{" "}
                <strong>{selectedVolunteer?.full_name}</strong> for this project?
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