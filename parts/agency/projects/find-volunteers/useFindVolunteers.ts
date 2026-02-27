"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import { startLoading, stopLoading } from "@/lib/loading";
import { useSendMail } from "@/services/mail";
import { matchVolunteersToProjectLocation } from "@/lib/utils/matchvolunteersToProject";
import { Volunteer } from "@/lib/types";
import { checkIfVolunteerHasRequested } from "@/services/requests";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import {
  mapRpcVolunteer,
  shuffle,
  MAX_RECOMMENDATIONS,
} from "./utils";

const supabase = createClient();

export interface ProjectSummary {
  title: string;
  volunteers_needed: number;
  volunteers_registered: number;
}

export function useFindVolunteers(projectId: string) {
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);

  const [searchName, setSearchName] = useState("");
  const [searchSkills, setSearchSkills] = useState("");
  const [searchMinRating, setSearchMinRating] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searching, setSearching] = useState(false);

  const volunteersNeeded = project?.volunteers_needed ?? 0;
  const volunteersRegistered = project?.volunteers_registered ?? 0;

  const fetchProject = useCallback(async () => {
    const { data: userId, error: userIdError } = await getUserId();
    if (userIdError || !userId) throw new Error("Please log in");
    const { data, error: projectError } = await supabase
      .from("projects")
      .select("title, volunteers_needed, volunteers_registered")
      .eq("id", projectId)
      .eq("organization_id", userId)
      .single();
    if (projectError || !data) throw new Error("Project not found.");
    return data as ProjectSummary;
  }, [projectId]);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    startLoading();
    try {
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError) throw new Error(userIdError);
      if (!userId) throw new Error("Please log in");

      const projectData = await fetchProject();
      setProject(projectData);

      const { data: projectRow } = await supabase
        .from("projects")
        .select("required_skills")
        .eq("id", projectId)
        .single();
      const requiredSkills = (projectRow?.required_skills?.length
        ? projectRow.required_skills
        : ["general"]) as string[];

      const { data: volunteerData, error: volunteerError } = await supabase.rpc(
        "select_volunteers_for_project",
        { p_project_id: projectId, p_required_skills: requiredSkills }
      );
      if (volunteerError) throw new Error(volunteerError.message);

      const { data: requestData } = await supabase
        .from("agency_requests")
        .select("volunteer_id, status")
        .eq("project_id", projectId)
        .eq("requester_id", userId);
      const requestStatusMap = new Map<string, string>(
        (requestData ?? []).map((r: { volunteer_id: string; status: string }) => [
          r.volunteer_id,
          r.status,
        ])
      );

      const recommended: Volunteer[] = (volunteerData ?? []).map((v: Record<string, unknown>) =>
        mapRpcVolunteer(v, requestStatusMap, requiredSkills)
      );
      const matched = await matchVolunteersToProjectLocation(projectId, recommended);
      const withRequestStatus = await Promise.all(
        matched.map(async (v) => {
          const hasRequested = await checkIfVolunteerHasRequested({
            projectId,
            volunteerId: v.volunteer_id,
          });
          return { ...v, hasRequested };
        })
      );
      const shuffled = shuffle(withRequestStatus);
      setVolunteers(shuffled.slice(0, MAX_RECOMMENDATIONS));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [projectId, fetchProject]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const runSearch = useCallback(async () => {
    if (!searchName && !searchSkills && !searchMinRating && !searchLocation) {
      fetchRecommendations();
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const projectData = project ?? (await fetchProject());
      setProject(projectData);

      let query = supabase
        .from("profiles")
        .select(
          "id, full_name, email, skills, experience, residence_country, residence_state, volunteer_countries, volunteer_states, volunteer_lgas, average_rating, anonymous"
        )
        .eq("role", "volunteer");

      if (searchName.trim())
        query = query.ilike("full_name", `%${searchName.trim()}%`);
      if (searchSkills.trim()) {
        const skills = searchSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (skills.length) query = query.overlaps("skills", skills);
      }
      if (searchMinRating.trim()) {
        const num = parseFloat(searchMinRating);
        if (!isNaN(num)) query = query.gte("average_rating", num);
      }
      if (searchLocation.trim()) {
        query = query.or(
          `residence_country.ilike.%${searchLocation.trim()}%,residence_state.ilike.%${searchLocation.trim()}%`
        );
      }

      const { data: profileList, error: searchError } = await query;
      if (searchError) throw new Error(searchError.message);

      const { data: requestData } = await supabase
        .from("agency_requests")
        .select("volunteer_id, status")
        .eq("project_id", projectId);
      const { data: userId } = await getUserId();
      let requestStatusMap = new Map<string, string>();
      if (userId && requestData) {
        const myRequests = await supabase
          .from("agency_requests")
          .select("volunteer_id, status")
          .eq("project_id", projectId)
          .eq("requester_id", userId);
        requestStatusMap = new Map<string, string>(
          (myRequests.data ?? []).map((r: { volunteer_id: string; status: string }) => [
            r.volunteer_id,
            r.status,
          ])
        );
      }

      const requiredSkills: string[] = [];
      const list: Volunteer[] = (profileList ?? []).map((p: Record<string, unknown>) => ({
        volunteer_id: p.id as string,
        full_name: (p.full_name as string) ?? "",
        email: (p.email as string) ?? "",
        skills: (p.skills ?? []) as string[],
        experience: (p.experience as string) ?? undefined,
        anonymous: !!(p.anonymous as boolean),
        residence_country: p.residence_country as string | undefined,
        residence_state: p.residence_state as string | undefined,
        volunteer_countries: (p.volunteer_countries ?? []) as string[],
        volunteer_states: (p.volunteer_states ?? []) as string[],
        volunteer_lgas: (p.volunteer_lgas ?? []) as string[],
        average_rating: (p.average_rating as number) ?? 0,
        request_status: requestStatusMap.get(p.id as string) ?? undefined,
        matched_skills: ((p.skills ?? []) as string[]).filter((s) =>
          requiredSkills.includes(s)
        ),
        joined_at: "",
      }));

      const withRequestStatus = await Promise.all(
        list.map(async (v) => {
          const hasRequested = await checkIfVolunteerHasRequested({
            projectId,
            volunteerId: v.volunteer_id,
          });
          return { ...v, hasRequested };
        })
      );
      setVolunteers(withRequestStatus);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setSearching(false);
    }
  }, [
    searchName,
    searchSkills,
    searchMinRating,
    searchLocation,
    projectId,
    project,
    fetchProject,
    fetchRecommendations,
  ]);

  const handleSendRequest = useCallback(
    async (volunteer: Volunteer) => {
      try {
        startLoading();
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError || !userId)
          throw new Error("Please log in to send requests.");

        const { data: existingRequest } = await supabase
          .from("agency_requests")
          .select("id, status")
          .eq("project_id", projectId)
          .eq("volunteer_id", volunteer.volunteer_id)
          .eq("requester_id", userId);
        if (existingRequest?.length) {
          toast.error(
            `Request already sent (Status: ${existingRequest[0].status})`
          );
          return;
        }

        const { data: existingAssignment } = await supabase
          .from("project_volunteers")
          .select("volunteer_id")
          .eq("project_id", projectId)
          .eq("volunteer_id", volunteer.volunteer_id);
        if (existingAssignment?.length) {
          toast.error("Volunteer is already assigned to this project.");
          return;
        }

        if (volunteersRegistered >= volunteersNeeded) {
          toast.error("Volunteer limit reached for this project.");
          return;
        }

        const { data: requesterData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .single();
        const { data: projectData } = await supabase
          .from("projects")
          .select("title")
          .eq("id", projectId)
          .single();
        const projectTitle = projectData?.title ?? "Project";

        await supabase.from("agency_requests").insert({
          project_id: projectId,
          volunteer_id: volunteer.volunteer_id,
          requester_id: userId,
          status: "pending",
        });

        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
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
            <strong>${requesterData?.full_name || "An agency"}</strong> has invited you to join:
          </p>
          <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #1a73e8;">
            <strong style="color: #1a73e8;">"${projectTitle}"</strong>
          </div>
          <p style="margin: 20px 0;">
            <a href="${origin}${routes.volunteerDashboard}" style="background: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
              View in Dashboard
            </a>
          </p>
        </div>
      `;

        await useSendMail({
          to: volunteer.email,
          subject: `Invitation to join "${projectTitle}"`,
          html,
          onSuccess: () =>
            toast.success(`Request sent to ${volunteer.full_name}`),
          onError: (msg) =>
            toast.warning(`Request saved, but email failed: ${msg}`),
        });

        setVolunteers((prev) =>
          prev.map((v) =>
            v.volunteer_id === volunteer.volunteer_id
              ? { ...v, request_status: "pending" }
              : v
          )
        );
        setIsRequestDialogOpen(false);
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Failed to send request"
        );
      } finally {
        stopLoading();
      }
    },
    [projectId, volunteersNeeded, volunteersRegistered]
  );

  const clearSearchAndRefresh = useCallback(() => {
    setSearchName("");
    setSearchSkills("");
    setSearchMinRating("");
    setSearchLocation("");
    fetchRecommendations();
  }, [fetchRecommendations]);

  const openRequestDialog = useCallback((volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setIsRequestDialogOpen(true);
  }, []);

  const closeRequestDialog = useCallback(() => {
    setIsRequestDialogOpen(false);
  }, []);

  return {
    project,
    volunteers,
    loading,
    error,
    volunteersNeeded,
    volunteersRegistered,
    searchName,
    setSearchName,
    searchSkills,
    setSearchSkills,
    searchMinRating,
    setSearchMinRating,
    searchLocation,
    setSearchLocation,
    searching,
    isRequestDialogOpen,
    selectedVolunteer,
    fetchProject,
    fetchRecommendations,
    runSearch,
    handleSendRequest,
    clearSearchAndRefresh,
    openRequestDialog,
    closeRequestDialog,
  };
}
