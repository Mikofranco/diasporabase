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
import { Calendar, MapPin, Users, Trash2, Edit } from "lucide-react";
import ProjectRecommendation from "../project-recommendation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import AssignProjectManager from "@/parts/PM";
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

const supabase = createClient();

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
}

interface Volunteer {
  volunteer_id: string;
  full_name: string;
  email: string;
  skills: string[];
  availability: string;
  residence_country: string;
  volunteer_states: string[];
  volunteer_countries: string[];
  volunteer_lgas: string[];
  average_rating: number;
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
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [assignedVolunteers, setAssignedVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isProjectEditModalOpen, setIsProjectEditModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);

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
  const [projectEditForm, setProjectEditForm] = useState<Partial<Project>>({});
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
  const { projectId } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: userId } = await getUserId();
        if (!userId) throw new Error("Please log in.");

        const { data: projectData, error: projErr } = await supabase
          .from("projects")
          .select(
            "id, title, description, organization_id, organization_name, location, country, state, lga, start_date, end_date, volunteers_needed, volunteers_registered, status, category, created_at, required_skills, project_manager_id, documents"
          )
          .eq("id", projectId)
          .eq("organization_id", userId)
          .single();

        if (projErr || !projectData) throw new Error("Project not found.");
        setProject(projectData as Project);

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
            "volunteer_id, profiles!inner(full_name, email, skills, availability, residence_country, volunteer_states)",
          )
          .eq("project_id", projectId);

        setAssignedVolunteers(
          (vols || []).map((v: any) => ({
            volunteer_id: v.volunteer_id,
            full_name: v.profiles.full_name,
            email: v.profiles.email,
            skills: v.profiles.skills || [],
            availability: v.profiles.availability || "N/A",
            residence_country: v.profiles.residence_country || "N/A",
            volunteer_states: v.profiles.volunteer_states || [],
            volunteer_countries: v.profiles.volunteer_countries || [],
            volunteer_lgas: v.profiles.volunteer_lgas || [],
            average_rating: 0,
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

  const openProjectEditModal = () => {
    if (project) {
      const loc =
        project.location && typeof project.location === "object"
          ? project.location
          : project.country
            ? {
                country: project.country,
                state: project.state ?? undefined,
                lga: project.lga ?? undefined,
              }
            : null;
      setProjectEditForm({
        title: project.title,
        description: project.description,
        location: formatLocation(loc),
        start_date: project.start_date,
        end_date: project.end_date,
        category: project.category,
      });
      setIsProjectEditModalOpen(true);
    }
  };

  const handleProjectEditSubmit = async () => {
    if (!project) return;
    try {
      const { data: userId } = await getUserId();
      const { location: _loc, ...rest } = projectEditForm;
      const { error } = await supabase
        .from("projects")
        .update(rest)
        .eq("id", project.id)
        .eq("organization_id", userId);
      if (error) throw error;
      setProject({ ...project, ...projectEditForm });
      toast.success("Project updated!");
      setIsProjectEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

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
      <div className="container mx-auto p-6">
        <Skeleton className="h-96 w-full" />
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
      {project.status === "cancelled" && (
        <Alert className="text-red-600 bg-red-50">
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Project is cancelled contact admin.
          </AlertDescription>
        </Alert>
      )}
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
            <Button variant="outline" size="sm" onClick={openProjectEditModal}>
              <Edit className="h-4 w-4 sm:mr-1.5" />
              Edit Project
            </Button>
            <AssignProjectManager
              projectId={project.id}
              currentManagerId={project.project_manager_id}
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
                        {skill}
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
              <ul className="space-y-2 text-sm">
                {project.documents.map((doc, i) => (
                  <li key={i}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-diaspora-blue hover:underline"
                    >
                      {doc.title || `Document ${i + 1}`}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Milestones */}
        <Card>
          <CardContent className="pt-6">
            <MilestonesSection
              projectId={project.id}
              canEdit={true}
              volunteers={assignedVolunteers}
            />
          </CardContent>
        </Card>

        {/* Assigned volunteers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              Assigned volunteers ({assignedVolunteers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AssignedVolunteersTable volunteers={assignedVolunteers} />
          </CardContent>
        </Card>

        <ProjectRecommendation
          projectId={projectId as string}
          volunteersNeeded={project.volunteers_needed ?? 0}
          volunteersRegistered={project.volunteers_registered}
        />

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
              onProjectClosed={() => router.refresh()}
            />
          </CardContent>
        </Card>

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

        {/* Edit Project Modal */}
        <Dialog
          open={isProjectEditModalOpen}
          onOpenChange={setIsProjectEditModalOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={projectEditForm.title || ""}
                  onChange={(e) =>
                    setProjectEditForm({
                      ...projectEditForm,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={projectEditForm.description || ""}
                  onChange={(e) =>
                    setProjectEditForm({
                      ...projectEditForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={
                    typeof projectEditForm.location === "string"
                      ? projectEditForm.location
                      : formatLocation(locationForDisplay)
                  }
                  onChange={(e) =>
                    setProjectEditForm({
                      ...projectEditForm,
                      location: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={projectEditForm.start_date || ""}
                  onChange={(e) =>
                    setProjectEditForm({
                      ...projectEditForm,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={projectEditForm.end_date || ""}
                  onChange={(e) =>
                    setProjectEditForm({
                      ...projectEditForm,
                      end_date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={projectEditForm.category || ""}
                  onChange={(e) =>
                    setProjectEditForm({
                      ...projectEditForm,
                      category: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsProjectEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleProjectEditSubmit} className="action-btn">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ProjectDetails;
