"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MapPin,
  Star,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Search,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { startLoading, stopLoading } from "@/lib/loading";
import { useSendMail } from "@/services/mail";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { matchVolunteersToProjectLocation } from "@/lib/utils/matchvolunteersToProject";
import { Volunteer } from "@/lib/types";
import { checkIfVolunteerHasRequested } from "@/services/requests";
import { routes } from "@/lib/routes";

const supabase = createClient();
const MAX_RECOMMENDATIONS = 15;

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function mapRpcVolunteer(v: any, requestStatusMap: Map<string, string>, requiredSkills: string[]): Volunteer {
  return {
    volunteer_id: v.volunteer_id,
    full_name: v.full_name,
    email: v.email,
    skills: v.skills ?? [],
    availability: v.availability,
    residence_country: v.residence_country,
    residence_state: v.residence_state,
    volunteer_countries: v.volunteer_countries ?? [],
    volunteer_states: v.volunteer_states ?? [],
    volunteer_lgas: v.volunteer_lgas ?? [],
    average_rating: v.average_rating ?? 0,
    request_status: requestStatusMap.get(v.volunteer_id) ?? undefined,
    matched_skills: (v.skills ?? []).filter((s: string) => requiredSkills.includes(s)),
    joined_at: "",
  };
}

interface FindVolunteersPageProps {
  projectId: string;
}

export default function FindVolunteersPage({ projectId }: FindVolunteersPageProps) {
  const router = useRouter();
  const [project, setProject] = useState<{
    title: string;
    volunteers_needed: number;
    volunteers_registered: number;
  } | null>(null);
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
    return data;
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
      const requiredSkills = (projectRow?.required_skills?.length ? projectRow.required_skills : ["general"]) as string[];

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
      const requestStatusMap = new Map((requestData ?? []).map((r: any) => [r.volunteer_id, r.status]));

      const recommended: Volunteer[] = (volunteerData ?? []).map((v: any) =>
        mapRpcVolunteer(v, requestStatusMap, requiredSkills)
      );
      const matched = await matchVolunteersToProjectLocation(projectId, recommended);
      const withRequestStatus = await Promise.all(
        matched.map(async (v) => {
          const hasRequested = await checkIfVolunteerHasRequested({ projectId, volunteerId: v.volunteer_id });
          return { ...v, hasRequested };
        })
      );
      const shuffled = shuffle(withRequestStatus);
      setVolunteers(shuffled.slice(0, MAX_RECOMMENDATIONS));
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
      stopLoading();
    }
  }, [projectId, fetchProject]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const runSearch = async () => {
    if (!searchName && !searchSkills && !searchMinRating && !searchLocation) {
      fetchRecommendations();
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const projectData = project ?? await fetchProject();
      setProject(projectData);

      let query = supabase
        .from("profiles")
        .select("id, full_name, email, skills, residence_country, residence_state, volunteer_countries, volunteer_states, volunteer_lgas, average_rating")
        .eq("role", "volunteer");

      if (searchName.trim()) query = query.ilike("full_name", `%${searchName.trim()}%`);
      if (searchSkills.trim()) {
        const skills = searchSkills.split(",").map((s) => s.trim()).filter(Boolean);
        if (skills.length) query = query.overlaps("skills", skills);
      }
      if (searchMinRating.trim()) {
        const num = parseFloat(searchMinRating);
        if (!isNaN(num)) query = query.gte("average_rating", num);
      }
      if (searchLocation.trim()) {
        query = query.or(`residence_country.ilike.%${searchLocation.trim()}%,residence_state.ilike.%${searchLocation.trim()}%`);
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
        requestStatusMap = new Map((myRequests.data ?? []).map((r: any) => [r.volunteer_id, r.status]));
      }

      const requiredSkills: string[] = [];
      const list: Volunteer[] = (profileList ?? []).map((p: any) => ({
        volunteer_id: p.id,
        full_name: p.full_name ?? "",
        email: p.email ?? "",
        skills: p.skills ?? [],
        residence_country: p.residence_country,
        residence_state: p.residence_state,
        volunteer_countries: p.volunteer_countries ?? [],
        volunteer_states: p.volunteer_states ?? [],
        volunteer_lgas: p.volunteer_lgas ?? [],
        average_rating: p.average_rating ?? 0,
        request_status: requestStatusMap.get(p.id) ?? undefined,
        matched_skills: (p.skills ?? []).filter((s: string) => requiredSkills.includes(s)),
        joined_at: "",
      }));

      const withRequestStatus = await Promise.all(
        list.map(async (v) => {
          const hasRequested = await checkIfVolunteerHasRequested({ projectId, volunteerId: v.volunteer_id });
          return { ...v, hasRequested };
        })
      );
      setVolunteers(withRequestStatus);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (volunteer: Volunteer) => {
    try {
      startLoading();
      const { data: userId, error: userIdError } = await getUserId();
      if (userIdError || !userId) throw new Error("Please log in to send requests.");

      const { data: existingRequest } = await supabase
        .from("agency_requests")
        .select("id, status")
        .eq("project_id", projectId)
        .eq("volunteer_id", volunteer.volunteer_id)
        .eq("requester_id", userId);
      if (existingRequest?.length) {
        toast.error(`Request already sent (Status: ${existingRequest[0].status})`);
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

      const origin = typeof window !== "undefined" ? window.location.origin : "";
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
        onSuccess: () => toast.success(`Request sent to ${volunteer.full_name}`),
        onError: (msg) => toast.warning(`Request saved, but email failed: ${msg}`),
      });

      setVolunteers((prev) =>
        prev.map((v) =>
          v.volunteer_id === volunteer.volunteer_id ? { ...v, request_status: "pending" } : v
        )
      );
      setIsRequestDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send request");
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

  if (loading && !project) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-600 text-center">
            <p className="font-medium">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push(routes.agencyViewProject(projectId))}>
              Back to project
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const projectTitle = project?.title ?? "Project";

  return (
    <TooltipProvider>
      <div className={cn("container mx-auto p-4 sm:p-6 max-w-7xl space-y-6", isRequestDialogOpen && "blur-sm")}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={routes.agencyProjects}>Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={routes.agencyViewProject(projectId)} className="truncate max-w-[180px] sm:max-w-xs inline-block">
                  {projectTitle}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground">Find volunteers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Find volunteers</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {volunteersRegistered} / {volunteersNeeded} slots filled
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.agencyViewProject(projectId)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to project
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Search volunteers</CardTitle>
            <p className="text-sm text-muted-foreground">
              Not happy with recommendations? Search by name, skills, rating, or location.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  placeholder="Volunteer name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Skills (comma-separated)</Label>
                <Input
                  placeholder="e.g. React, Design"
                  value={searchSkills}
                  onChange={(e) => setSearchSkills(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Min. star rating (0–5)</Label>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  placeholder="e.g. 4"
                  value={searchMinRating}
                  onChange={(e) => setSearchMinRating(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Location</Label>
                <Input
                  placeholder="Country or state..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={runSearch} disabled={searching} className="bg-diaspora-blue hover:bg-diaspora-blue/90">
                <Search className="h-4 w-4 mr-2" />
                {searching ? "Searching..." : "Search"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchName("");
                  setSearchSkills("");
                  setSearchMinRating("");
                  setSearchLocation("");
                  fetchRecommendations();
                }}
              >
                Show recommendations
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserCheck className="h-4 w-4" />
          <span>
            {volunteers.length} volunteer{volunteers.length !== 1 ? "s" : ""} shown
          </span>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {volunteers.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-gray-900">No volunteers found</p>
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your search or view recommendations again.
              </p>
              <Button variant="outline" className="mt-4" onClick={fetchRecommendations}>
                Show recommendations
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {volunteers.map((volunteer) => {
              const initials = volunteer.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              const matchedSkills = volunteer.matched_skills ?? [];
              return (
                <Card
                  key={volunteer.volunteer_id}
                  className={cn(
                    "group relative overflow-hidden transition-all duration-200 hover:shadow-lg flex flex-col border border-gray-200 bg-white",
                    volunteer.request_status && "opacity-90"
                  )}
                >
                  <CardContent className="p-5 flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-gray-100">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 line-clamp-1">{volunteer.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{volunteer.email}</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-1.5">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(volunteer.skills ?? []).slice(0, 4).map((skill) => (
                          <Badge
                            key={skill}
                            variant={matchedSkills.includes(skill) ? "default" : "secondary"}
                            className="text-xs font-medium px-2 py-0.5"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {(volunteer.skills?.length ?? 0) > 4 && (
                          <Badge variant="outline" className="text-xs">+{(volunteer.skills?.length ?? 0) - 4}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
                      <span className="line-clamp-1">
                        {volunteer.residence_state || volunteer.volunteer_states?.[0] || "—"},{" "}
                        {volunteer.residence_country || volunteer.volunteer_countries?.[0] || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-4">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{(volunteer.average_rating ?? 0).toFixed(1)}</span>
                      <span className="text-xs text-gray-500">/ 5.0</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-5 pt-0">
                    {volunteer.request_status ? (
                      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium", getStatusColor(volunteer.request_status))}>
                        {getStatusIcon(volunteer.request_status)}
                        <span>{volunteer.request_status.charAt(0).toUpperCase() + volunteer.request_status.slice(1)}</span>
                      </div>
                    ) : (volunteer as any).hasRequested?.hasRequested ? (
                      <Button disabled className="w-full bg-gray-400 cursor-not-allowed">
                        <Clock className="h-4 w-4 mr-2" /> Awaiting approval
                      </Button>
                    ) : (
                      <Button
                        className={cn("w-full", volunteersRegistered >= volunteersNeeded && "bg-gray-300 cursor-not-allowed")}
                        onClick={() => { setSelectedVolunteer(volunteer); setIsRequestDialogOpen(true); }}
                        disabled={volunteersRegistered >= volunteersNeeded}
                      >
                        <Send className="h-4 w-4 mr-2" /> Send request
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-[#0ea5e9]" /> Confirm invitation
              </DialogTitle>
              <DialogDescription>
                Send a project invitation to <strong>{selectedVolunteer?.full_name}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => selectedVolunteer && handleSendRequest(selectedVolunteer)} className="action-btn">
                <Send className="h-4 w-4 mr-2" /> Send request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
