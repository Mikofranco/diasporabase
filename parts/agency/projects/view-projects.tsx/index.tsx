// app/dashboard/agency/projects/[projectId]/page.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { formatLocation, getUserId } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Trash2, Edit, FileText, ImageIcon, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import AssignProjectManager from "@/parts/PM";
import { useSkillLabels } from "@/hooks/useSkillLabels";
import { MilestonesSection } from "./milestone-section";
import { AssignedVolunteersTable } from "./assigned-volunteer";
import { ClosingRemarksModal } from "@/components/closing-remarks";
import { ProjectStatus } from "@/lib/types";
import { routes } from "@/lib/routes";
import { getProjectStatusStyle } from "../filters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import CreateProjectForm from "@/parts/agency/create-project";

const supabase = createClient();

const DOC_IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i;
const DOC_PDF_EXT = /\.pdf(\?|$)/i;

function getDocType(url: string): "pdf" | "image" | "other" {
  if (!url) return "other";
  if (DOC_PDF_EXT.test(url)) return "pdf";
  if (DOC_IMAGE_EXT.test(url)) return "image";
  return "other";
}

interface Project {
  id: string;
  title: string;
  description: string;
  organization_id: string;
  organization_name: string;
  location?: { country?: string; state?: string; lga?: string } | string | null;
  country?: string | null;
  state?: string | null;
  lga?: string | null;
  start_date: string;
  end_date: string;
  volunteers_needed?: number;
  volunteers_registered: number;
  status: string;
  category: string;
  created_at: string;
  required_skills: string[];
  project_manager_id: string | null;
  documents?: Array<{ title: string; url: string }>;
  cancelled_reason?: string | null;
  cancelled_at?: string | null;
}

interface RejectionReasonRow {
  id: string;
  reason_text: string;
  internal_note?: string | null;
  created_at: string;
}

interface Volunteer {
  volunteer_id: string;
  full_name: string;
  email: string;
  profile_picture?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  skills: string[];
  availability: string;
  experience?: string | null;
  residence_country: string;
  residence_state?: string;
  volunteer_states: string[];
  volunteer_countries: string[];
  volunteer_lgas: string[];
  average_rating: number;
  anonymous?: boolean;
  joined_at: string;
}

interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: "Pending" | "In Progress" | "Completed";
  created_at: string;
}

interface Deliverable {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  due_date: string;
  status: "Pending" | "In Progress" | "Done";
  created_at: string;
}

const ProjectDetails: React.FC = () => {
  const { getLabel } = useSkillLabels();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [assignedVolunteers, setAssignedVolunteers] = useState<Volunteer[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<RejectionReasonRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{
    title: string;
    url: string;
  } | null>(null);

  // Editing States
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null,
  );
  const [editingDeliverable, setEditingDeliverable] =
    useState<Deliverable | null>(null);

  // Delete Confirmation States
  const [deleteMilestoneId, setDeleteMilestoneId] = useState<string | null>(
    null,
  );
  const [deleteDeliverableId, setDeleteDeliverableId] = useState<string | null>(
    null,
  );

  // Form States
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    due_date: "",
    status: "Pending" as Milestone["status"],
  });
  const [newDeliverable, setNewDeliverable] = useState({
    title: "",
    description: "",
    due_date: "",
    status: "Pending" as Deliverable["status"],
  });

  const router = useRouter();
  const params = useParams<{ projectId?: string | string[] }>();
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: userId } = await getUserId();
        if (!userId) throw new Error("Please log in.");

        const { data: projectData, error: projErr } = await supabase
          .from("projects")
          .select(
            "id, title, description, organization_id, organization_name, location, country, state, lga, start_date, end_date, volunteers_needed, volunteers_registered, status, category, created_at, required_skills, project_manager_id, documents, cancelled_reason, cancelled_at"
          )
          .eq("id", projectId)
          .eq("organization_id", userId)
          .single();

        if (projErr || !projectData) throw new Error("Project not found.");
        setProject(projectData as Project);

        if ((projectData as Project).status === "rejected") {
          const { data: reasons } = await supabase
            .from("rejection_reasons")
            .select("id, reason_text, internal_note, created_at")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false });
          setRejectionReasons((reasons ?? []) as RejectionReasonRow[]);
        } else {
          setRejectionReasons([]);
        }

        const { data: miles } = await supabase
          .from("milestones")
          .select("*")
          .eq("project_id", projectId)
          .order("due_date");
        setMilestones(
          //@ts-ignore
          (miles || []).map((m) => ({ ...m, status: m.status || "Pending" })),
        );

        const { data: dels } = await supabase
          .from("deliverables")
          .select("*")
          .eq("project_id", projectId)
          .order("due_date");
        setDeliverables(
          //@ts-ignore
          (dels || []).map((d) => ({ ...d, status: d.status || "Pending" })),
        );

        const { data: vols } = await supabase
          .from("project_volunteers")
          .select(
            "volunteer_id, profiles!inner(full_name, email, profile_picture, phone, date_of_birth, skills, availability, experience, residence_country, residence_state, volunteer_states, volunteer_countries, volunteer_lgas, average_rating, anonymous)",
          )
          .eq("project_id", projectId);

        setAssignedVolunteers(
          (vols || []).map((v: any) => ({
            volunteer_id: v.volunteer_id,
            full_name: v.profiles.full_name ?? "",
            email: v.profiles.email ?? "",
            profile_picture: v.profiles.profile_picture ?? null,
            phone: v.profiles.phone ?? null,
            date_of_birth: v.profiles.date_of_birth ?? null,
            skills: v.profiles.skills || [],
            availability: v.profiles.availability || "N/A",
            experience: v.profiles.experience ?? null,
            residence_country: v.profiles.residence_country || "N/A",
            residence_state: v.profiles.residence_state ?? undefined,
            volunteer_states: v.profiles.volunteer_states || [],
            volunteer_countries: v.profiles.volunteer_countries || [],
            volunteer_lgas: v.profiles.volunteer_lgas || [],
            average_rating: typeof v.profiles.average_rating === "number" ? v.profiles.average_rating : 0,
            anonymous: !!v.profiles.anonymous,
            joined_at: v.joined_at ?? "",
          })),
        );
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const handleAddMilestone = async () => {
    if (!newMilestone.title || !newMilestone.due_date)
      return toast.error("Title and due date required");
    try {
      const { error } = await supabase.from("milestones").insert({
        project_id: projectId,
        title: newMilestone.title,
        description: newMilestone.description || null,
        due_date: newMilestone.due_date,
        status: newMilestone.status,
      });
      if (error) throw error;
      toast.success("Milestone added!");
      setIsMilestoneModalOpen(false);
      setNewMilestone({
        title: "",
        description: "",
        due_date: "",
        status: "Pending",
      });
      const { data } = await supabase
        .from("milestones")
        .select("*")
        .eq("project_id", projectId);
      setMilestones(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateMilestone = async () => {
    if (!editingMilestone || !newMilestone.title || !newMilestone.due_date)
      return toast.error("Title and due date required");
    try {
      const { error } = await supabase
        .from("milestones")
        .update({
          title: newMilestone.title,
          description: newMilestone.description || null,
          due_date: newMilestone.due_date,
          status: newMilestone.status,
        })
        .eq("id", editingMilestone.id);
      if (error) throw error;
      toast.success("Milestone updated!");
      setIsMilestoneModalOpen(false);
      setEditingMilestone(null);
      const { data } = await supabase
        .from("milestones")
        .select("*")
        .eq("project_id", projectId);
      setMilestones(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteMilestone = async () => {
    if (!deleteMilestoneId) return;
    try {
      const { error } = await supabase
        .from("milestones")
        .delete()
        .eq("id", deleteMilestoneId);
      if (error) throw error;
      toast.success("Milestone deleted");
      setDeleteMilestoneId(null);
      const { data } = await supabase
        .from("milestones")
        .select("*")
        .eq("project_id", projectId);
      setMilestones(data || []);
    } catch (err: any) {
      toast.error("Failed to delete milestone");
    }
  };

  const handleAddDeliverable = async () => {
    if (!newDeliverable.title || !newDeliverable.due_date)
      return toast.error("Title and due date required");
    try {
      const { error } = await supabase.from("deliverables").insert({
        project_id: projectId,
        title: newDeliverable.title,
        description: newDeliverable.description || null,
        due_date: newDeliverable.due_date,
        status: newDeliverable.status,
      });
      if (error) throw error;
      toast.success("Deliverable added!");
      setIsDeliverableModalOpen(false);
      setNewDeliverable({
        title: "",
        description: "",
        due_date: "",
        status: "Pending",
      });
      const { data } = await supabase
        .from("deliverables")
        .select("*")
        .eq("project_id", projectId);
      setDeliverables(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateDeliverable = async () => {
    if (
      !editingDeliverable ||
      !newDeliverable.title ||
      !newDeliverable.due_date
    )
      return toast.error("Title and due date required");
    try {
      const { error } = await supabase
        .from("deliverables")
        .update({
          title: newDeliverable.title,
          description: newDeliverable.description || null,
          due_date: newDeliverable.due_date,
          status: newDeliverable.status,
        })
        .eq("id", editingDeliverable.id);
      if (error) throw error;
      toast.success("Deliverable updated!");
      setIsDeliverableModalOpen(false);
      setEditingDeliverable(null);
      const { data } = await supabase
        .from("deliverables")
        .select("*")
        .eq("project_id", projectId);
      setDeliverables(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteDeliverable = async () => {
    if (!deleteDeliverableId) return;
    try {
      const { error } = await supabase
        .from("deliverables")
        .delete()
        .eq("id", deleteDeliverableId);
      if (error) throw error;
      toast.success("Deliverable deleted");
      setDeleteDeliverableId(null);
      const { data } = await supabase
        .from("deliverables")
        .select("*")
        .eq("project_id", projectId);
      setDeliverables(data || []);
    } catch (err: any) {
      toast.error("Failed to delete deliverable");
    }
  };

  if (loading)
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 text-sm">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-40 max-w-[200px] sm:w-48" />
        </div>

        {/* Page header skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-8 w-full max-w-md" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        {/* Overview card skeleton */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>

        {/* Location & dates card skeleton */}
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Category & skills card skeleton */}
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-24" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-6 w-14 rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* Milestones section skeleton */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-7 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>

        {/* Assigned volunteers card skeleton */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-9 w-28" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  if (error || !project)
    return (
      <div className="container mx-auto p-6 text-center py-20 text-destructive">
        {error || "Project not found"}
      </div>
    );

  const locationForDisplay =
    project.location && typeof project.location === "object"
      ? project.location
      : project.country
        ? { country: project.country, state: project.state ?? undefined, lga: project.lga ?? undefined }
        : null;

  return (
    <TooltipProvider>
      <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={routes.agencyProjects}>Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground truncate max-w-[200px] sm:max-w-md">
                {project.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page header: title + actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
              {project.title}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {project.organization_name}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditProject(project)}
              disabled={["pending", "cancelled", "completed"].includes(
                (project.status || "").toLowerCase()
              )}
            >
              <Edit className="h-4 w-4 sm:mr-1.5" />
              Edit Project
            </Button>
            <AssignProjectManager
              projectId={project.id}
              currentManagerId={project.project_manager_id}
              disabled={project.status !== "approved" && project.status !== "active"}
            />
          </div>
        </div>

        {/* Block: Overview & description */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">Overview</CardTitle>
              {(() => {
                const statusStyle = getProjectStatusStyle(project.status);
                return (
                  <Badge
                    variant="outline"
                    className={statusStyle.className}
                  >
                    {statusStyle.label}
                  </Badge>
                );
              })()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Description
              </h3>
              <div className="text-foreground whitespace-pre-line leading-relaxed">
                {project.description}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Block: Location & dates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Location & dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                <span>{formatLocation(locationForDisplay)}</span>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                <span>
                  {new Date(project.start_date).toLocaleDateString()} –{" "}
                  {new Date(project.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Users className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                <span>
                  {project.volunteers_registered}
                  {typeof project.volunteers_needed === "number"
                    ? ` / ${project.volunteers_needed}`
                    : ""}{" "}
                  volunteers
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Block: Category & skills */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Category & skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.category && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Category
                </h3>
                <p className="text-foreground">{project.category}</p>
              </div>
            )}
            {Array.isArray(project.required_skills) &&
              project.required_skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Required skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.required_skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="font-normal"
                      >
                        {getLabel(skill)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Block: Supporting documents */}
        {Array.isArray(project.documents) && project.documents.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Supporting documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {project.documents.map((doc, i) => {
                  const docType = getDocType(doc.url);
                  const label = doc.title || `Document ${i + 1}`;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPreviewDocument({ title: label, url: doc.url })}
                      className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50/80 p-4 text-center transition hover:border-diaspora-blue/50 hover:bg-diaspora-blue/5 focus:outline-none focus:ring-2 focus:ring-diaspora-blue/30"
                    >
                      {docType === "image" ? (
                        <div className="relative mb-2 h-16 w-full overflow-hidden rounded border border-gray-200 bg-white">
                          <img
                            src={doc.url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-white border border-gray-200">
                          {docType === "pdf" ? (
                            <FileText className="h-8 w-8 text-red-600" />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-gray-500" />
                          )}
                        </div>
                      )}
                      <span className="text-xs font-medium text-gray-700 line-clamp-2">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document preview modal */}
        <Dialog
          open={!!previewDocument}
          onOpenChange={(open) => !open && setPreviewDocument(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            {previewDocument && (
              <>
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                  <DialogTitle className="text-base font-medium truncate pr-8">
                    {previewDocument.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 flex flex-col px-6 pb-6">
                  {getDocType(previewDocument.url) === "pdf" && (
                    <iframe
                      src={previewDocument.url}
                      title={previewDocument.title}
                      className="w-full flex-1 min-h-[60vh] rounded border border-gray-200 bg-gray-100"
                    />
                  )}
                  {getDocType(previewDocument.url) === "image" && (
                    <div className="flex-1 min-h-0 flex items-center justify-center bg-gray-100 rounded border border-gray-200 overflow-auto">
                      <img
                        src={previewDocument.url}
                        alt={previewDocument.title}
                        className="max-w-full max-h-[70vh] object-contain"
                      />
                    </div>
                  )}
                  {getDocType(previewDocument.url) === "other" && (
                    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                      <FileText className="h-12 w-12 text-gray-400" />
                      <p className="text-sm text-muted-foreground">
                        This file cannot be previewed in the browser.
                      </p>
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={previewDocument.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in new tab
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Milestones */}
        <Card>
          <CardContent className="pt-6">
            <MilestonesSection
              projectId={project.id}
              canEdit={true}
              volunteers={assignedVolunteers}
              canAddMilestone={["pending", "approved", "active"].includes(project.status)}
              milestonesPageHref={routes.agencyProjectMilestones(project.id)}
            />
          </CardContent>
        </Card>

        {/* Assigned volunteers */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-lg">
                Assigned volunteers ({assignedVolunteers.length})
              </CardTitle>
              {(() => {
                const findVolunteersEnabled =
                  (project.status === "approved" || project.status === "active") &&
                  assignedVolunteers.length < 10;
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-block">
                        <Button
                          asChild={findVolunteersEnabled}
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          disabled={!findVolunteersEnabled}
                        >
                          {findVolunteersEnabled ? (
                            <Link href={routes.agencyProjectRecommendations(project.id)}>
                              Find volunteers
                            </Link>
                          ) : (
                            <>Find volunteers</>
                          )}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!findVolunteersEnabled
                        ? project.status !== "approved" && project.status !== "active"
                          ? "Only available when project is Approved or Active."
                          : "Only available when fewer than 10 volunteers are assigned."
                        : "Search and invite volunteers for this project."}
                    </TooltipContent>
                  </Tooltip>
                );
              })()}
            </div>
          </CardHeader>
          <CardContent>
            <AssignedVolunteersTable projectId={projectId ?? ""} volunteers={assignedVolunteers} />
          </CardContent>
        </Card>

        {/* Rejection reasons – own block when status is rejected */}
        {project.status === "rejected" && rejectionReasons.length > 0 && (
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-red-800">
                Rejection reason{rejectionReasons.length > 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {rejectionReasons.map((r) => (
                  <li key={r.id} className="text-sm text-red-900">
                    <span className="font-medium">{r.reason_text}</span>
                    {r.internal_note && (
                      <p className="mt-1 text-red-700/90 italic">{r.internal_note}</p>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Cancellation reason – own block when status is cancelled */}
        {project.status === "cancelled" && (
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-amber-900">
                Cancellation reason
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-900">
                {project.cancelled_reason?.trim() || "No reason provided."}
              </p>
            </CardContent>
          </Card>
        )}

        {project.status === "active" && (
          <Card className="border-diaspora-blue/20 bg-diaspora-blue/5">
            <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-diaspora-blue">
                  Closing remark &amp; complete project
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Add a closing remark and mark this project as completed.
                </p>
              </div>
              <ClosingRemarksModal
                projectId={project.id}
                currentStatus={project.status as ProjectStatus}
                isAuthorized={true}
                onProjectClosed={() =>
                  setProject((prev) =>
                    prev ? { ...prev, status: "completed" } : prev
                  )
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Milestone Modal */}
        <Dialog
          open={isMilestoneModalOpen}
          onOpenChange={(open) => {
            setIsMilestoneModalOpen(open);
            if (!open) {
              setEditingMilestone(null);
              setNewMilestone({
                title: "",
                description: "",
                due_date: "",
                status: "Pending",
              });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMilestone ? "Edit Milestone" : "Add Milestone"}
              </DialogTitle>
              <DialogDescription>
                {editingMilestone
                  ? "Update milestone details"
                  : "Create a new milestone"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={newMilestone.title}
                  onChange={(e) =>
                    setNewMilestone({ ...newMilestone, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newMilestone.description}
                  onChange={(e) =>
                    setNewMilestone({
                      ...newMilestone,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={newMilestone.due_date}
                  onChange={(e) =>
                    setNewMilestone({
                      ...newMilestone,
                      due_date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Status *</Label>
                <Select
                  value={newMilestone.status}
                  onValueChange={(v) =>
                    setNewMilestone({
                      ...newMilestone,
                      status: v as Milestone["status"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsMilestoneModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={
                  editingMilestone ? handleUpdateMilestone : handleAddMilestone
                }
                className="action-btn"
              >
                {editingMilestone ? "Save Changes" : "Add Milestone"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deliverable Modal */}
        <Dialog
          open={isDeliverableModalOpen}
          onOpenChange={(open) => {
            setIsDeliverableModalOpen(open);
            if (!open) {
              setEditingDeliverable(null);
              setNewDeliverable({
                title: "",
                description: "",
                due_date: "",
                status: "Pending",
              });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDeliverable ? "Edit Deliverable" : "Add Deliverable"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={newDeliverable.title}
                  onChange={(e) =>
                    setNewDeliverable({
                      ...newDeliverable,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newDeliverable.description}
                  onChange={(e) =>
                    setNewDeliverable({
                      ...newDeliverable,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={newDeliverable.due_date}
                  onChange={(e) =>
                    setNewDeliverable({
                      ...newDeliverable,
                      due_date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Status *</Label>
                <Select
                  value={newDeliverable.status}
                  onValueChange={(v) =>
                    setNewDeliverable({
                      ...newDeliverable,
                      status: v as Deliverable["status"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeliverableModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={
                  editingDeliverable
                    ? handleUpdateDeliverable
                    : handleAddDeliverable
                }
              >
                {editingDeliverable ? "Save Changes" : "Add Deliverable"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Milestone Confirmation */}
        <AlertDialog
          open={!!deleteMilestoneId}
          onOpenChange={() => setDeleteMilestoneId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Milestone?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                milestone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteMilestone}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Milestone
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Deliverable Confirmation */}
        <AlertDialog
          open={!!deleteDeliverableId}
          onOpenChange={() => setDeleteDeliverableId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Deliverable?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                deliverable.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDeliverable}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Deliverable
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {editProject && (
          <CreateProjectForm
            initialProject={editProject}
            onClose={() => setEditProject(null)}
            onProjectCreated={(p) => {
              setProject((prev) => (prev ? { ...prev, ...p } : prev));
              setEditProject(null);
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default ProjectDetails;
