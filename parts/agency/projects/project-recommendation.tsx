"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import {
  Card,
  CardContent,
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
import { MapPin, Star, Send, CheckCircle, XCircle, Clock, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { startLoading, stopLoading } from "@/lib/loading";
import { useSendMail } from "@/services/mail";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { match } from "assert";
import { matchVolunteersToProjectLocation } from "@/lib/utils/matchvolunteersToProject";
import { Volunteer } from "@/lib/types";

const supabase = createClient();



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

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(projectId)) throw new Error("Invalid project ID format.");

        const { data: isAdminData, error: isAdminError } = await supabase.rpc("is_admin");
        if (isAdminError) throw new Error(isAdminError.message);
        const isAdmin = isAdminData || false;

        let query = supabase
          .from("projects")
          .select("required_skills, status, title, organization_id")
          .eq("id", projectId);

        if (!isAdmin) query = query.eq("organization_id", userId);

        const { data: projectData, error: projectError } = await query;
        if (projectError) throw new Error(projectError.message);
        if (!projectData?.length) throw new Error("Project not found or access denied.");

        const project = projectData[0];
        const requiredSkills = project.required_skills?.length ? project.required_skills : ["general"];

        const { data: volunteerData, error: volunteerError } = await supabase.rpc(
          "select_volunteers_for_project",
          { p_project_id: projectId, p_required_skills: requiredSkills }
        );
        if (volunteerError) throw new Error(volunteerError.message);

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

        const matchedVolunteers = await matchVolunteersToProjectLocation(projectId, recommendedVolunteers);
        setVolunteers(matchedVolunteers);
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

  const handleSendRequest = async (volunteer: Volunteer) => {
    try {
      startLoading();

      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in to send requests.");

      const { data: isAdminData, error: isAdminError } = await supabase.rpc("is_admin");
      if (isAdminError) throw new Error(isAdminError.message);
      const isAdmin = isAdminData || false;

      const { data: requesterData, error: requesterError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", userId)
        .single();
      if (requesterError) throw new Error(requesterError.message);

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

      if (volunteersRegistered >= volunteersNeeded) {
        toast.error("Volunteer limit reached for this project.");
        return;
      }

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("title")
        .eq("id", projectId)
        .single();
      if (projectError) throw new Error(projectError.message);
      const projectTitle = projectData.title;

      const { error: requestError } = await supabase
        .from("agency_requests")
        .insert({
          project_id: projectId,
          volunteer_id: volunteer.volunteer_id,
          requester_id: userId,
          status: "pending",
        });
      if (requestError) throw new Error(requestError.message);

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const volunteerDashboardUrl = `${origin}/dashboard/volunteer`;

      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f9fafb;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #1a73e8; font-size: 24px; margin: 0;">DiasporaBase</h1>
          </div>
          <h2 style="color: #111827; font-size: 18px;">Project Invitation</h2>
          <p style="color: #374151; margin: 16px 0;">
            Hi <strong>${volunteer.full_name}</strong>,
          </p>
          <p style="color: #374151; margin: 16px 0;">
            <strong>${requesterData.full_name || "An agency"}</strong> has invited you to join:
          </p>
          <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #1a73e8;">
            <strong style="color: #1a73e8;">"${projectTitle}"</strong>
          </div>
          <p style="margin: 20px 0;">
            <a href="${volunteerDashboardUrl}" style="background: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
              View in Dashboard
            </a>
          </p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="font-size: 12px; color: #6b7280;">
            If you did not expect this email, you can safely ignore it.
          </p>
        </div>
      `;
      

      await useSendMail({
        to: volunteer.email,
        subject: `Invitation to join "${projectTitle}"`,
        html,
        onSuccess: () => {
          toast.success(`Request sent to ${volunteer.full_name}`);
        },
        onError: (msg) => {
          console.error("Mail error:", msg);
          toast.warning(`Request saved, but email failed: ${msg}`);
        },
      });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-3.5 w-3.5" />;
      case "accepted": return <CheckCircle className="h-3.5 w-3.5" />;
      case "rejected": return <XCircle className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-4/5 mb-4" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="pt-6 text-red-600 dark:text-red-400 text-center">
          <p className="font-medium">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Recommended Volunteers
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <UserCheck className="h-4 w-4" />
            <span>
              {volunteersRegistered} / {volunteersNeeded} slots filled
            </span>
          </div>
        </div>

        {volunteers.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No matches found</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Try adjusting project skills or location filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {volunteers.map((volunteer) => {
              const initials = volunteer.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <Card
                  key={volunteer.volunteer_id}
                  className={cn(
                    "group relative overflow-hidden transition-all duration-200 hover:shadow-lg",
                    "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
                    volunteer.request_status && "opacity-90"
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-gray-100 dark:ring-gray-700">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                            {volunteer.full_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{volunteer.email}</p>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    {/* Skills */}
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {volunteer.skills.slice(0, 4).map((skill) => {
                          const isMatched = volunteer.matched_skills.includes(skill);
                          return (
                            <Tooltip key={skill}>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant={isMatched ? "default" : "secondary"}
                                  className={cn(
                                    "text-xs font-medium px-2 py-0.5 transition-colors",
                                    isMatched
                                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                  )}
                                >
                                  {skill}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isMatched ? "Matches project requirement" : "Additional skill"}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                        {volunteer.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{volunteer.skills.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="line-clamp-1">
                        {volunteer.residence_state || volunteer.volunteer_states[0] || "Anywhere"},{" "}
                        {volunteer.residence_country || volunteer.volunteer_countries[0] || "Global"}
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 mb-4">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {volunteer.average_rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">/ 5.0</span>
                    </div>

                    {/* Request Status or Button */}
                    {volunteer.request_status ? (
                      <div
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium",
                          getStatusColor(volunteer.request_status)
                        )}
                      >
                        {getStatusIcon(volunteer.request_status)}
                        <span>
                          {volunteer.request_status.charAt(0).toUpperCase() +
                            volunteer.request_status.slice(1)}
                        </span>
                      </div>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            className={cn(
                              "w-full transition-all",
                              volunteersRegistered >= volunteersNeeded
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "action-btn text-white shadow-sm"
                            )}
                            onClick={() => {
                              setSelectedVolunteer(volunteer);
                              setIsRequestDialogOpen(true);
                            }}
                            disabled={volunteersRegistered >= volunteersNeeded}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Request
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {volunteersRegistered >= volunteersNeeded
                            ? "Volunteer limit reached"
                            : "Invite this volunteer"}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-[#0ea5e9]" />
                Confirm Invitation
              </DialogTitle>
              <DialogDescription className="pt-2">
                Send a project invitation to:
                <br />
                <strong className="text-gray-900 dark:text-gray-100">
                  {selectedVolunteer?.full_name}
                </strong>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsRequestDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedVolunteer && handleSendRequest(selectedVolunteer)}
                className="w-full sm:w-auto action-btn"
              >
                <Send className="h-4 w-4 mr-2" />
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