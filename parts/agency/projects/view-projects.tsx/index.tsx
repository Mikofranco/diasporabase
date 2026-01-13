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

const supabase = createClient();

interface Project {
  id: string;
  title: string;
  description: string;
  organization_id: string;
  organization_name: string;
  location: string;
  start_date: string;
  end_date: string;
  volunteers_needed: number;
  volunteers_registered: number;
  status: string;
  category: string;
  created_at: string;
  required_skills: string[];
  project_manager_id: string | null;
}

interface Volunteer {
  volunteer_id: string;
  full_name: string;
  email: string;
  skills: string[];
  availability: string;
  residence_country: string;
  volunteer_states: string[];
  average_rating: number;
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
    null
  );
  const [editingDeliverable, setEditingDeliverable] =
    useState<Deliverable | null>(null);

  // Delete Confirmation States
  const [deleteMilestoneId, setDeleteMilestoneId] = useState<string | null>(
    null
  );
  const [deleteDeliverableId, setDeleteDeliverableId] = useState<string | null>(
    null
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
          .select("*, required_skills")
          .eq("id", projectId)
          .eq("organization_id", userId)
          .single();

        if (projErr || !projectData) throw new Error("Project not found.");
        setProject(projectData);

        const { data: miles } = await supabase
          .from("milestones")
          .select("*")
          .eq("project_id", projectId)
          .order("due_date"); 
        setMilestones(//@ts-ignore
          (miles || []).map((m) => ({ ...m, status: m.status || "Pending" }))
        );

        const { data: dels } = await supabase
          .from("deliverables")
          .select("*")
          .eq("project_id", projectId)
          .order("due_date"); 
        setDeliverables(//@ts-ignore
          (dels || []).map((d) => ({ ...d, status: d.status || "Pending" }))
        );

        const { data: vols } = await supabase
          .from("project_volunteers")
          .select(
            "volunteer_id, profiles!inner(full_name, email, skills, availability, residence_country, volunteer_states)"
          )
          .eq("project_id", projectId);

        console.log("Assigned Volunteers Data:", vols);

        setAssignedVolunteers(
          (vols || []).map((v: any) => ({
            volunteer_id: v.volunteer_id,
            full_name: v.profiles.full_name,
            email: v.profiles.email,
            skills: v.profiles.skills || [],
            availability: v.profiles.availability || "N/A",
            residence_country: v.profiles.residence_country || "N/A",
            volunteer_states: v.profiles.volunteer_states || [],
            average_rating: 0,
          }))
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
      setProjectEditForm({
        title: project.title,
        description: project.description,
        location: project.location,
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
      const { error } = await supabase
        .from("projects")
        .update(projectEditForm)
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

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">{project.title}</h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/agency/projects")}
            >
              Back to Projects
            </Button>
            <Button
              variant="outline"
              onClick={openProjectEditModal}
              className="action-btn"
            >
              Edit Project
            </Button>
            {/* <Button data-modal-trigger="assign-project-manager">Assign Project Manager</Button> */}
            <AssignProjectManager
              projectId={project.id}
              currentManagerId={project.project_manager_id}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{project.title}</CardTitle>
                <CardDescription>{project.organization_name}</CardDescription>
              </div>
              <Badge
                variant={project.status === "active" ? "default" : "secondary"}
                className={`${
                  project.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <p className="text-muted-foreground">{project.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              {/*@ts-ignore */}
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />{/*@ts-ignore*/}
                <span>{formatLocation(project.location)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>
                  {new Date(project.start_date).toLocaleDateString()} -{" "}
                  {new Date(project.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{project.volunteers_registered} volunteers</span>
              </div>
            </div>
            <MilestonesSection projectId={project.id} canEdit={true} />

            <section>
              <h2 className="text-2xl font-bold mb-6">
                Assigned Volunteers ({assignedVolunteers.length})
              </h2>{/*@ts-ignore*/}
              <AssignedVolunteersTable volunteers={assignedVolunteers} />
            </section>
             <h3>closing remark</h3>   
            <ClosingRemarksModal
              projectId={project.id}
              currentStatus={project.status}
              isAuthorized={true}
              onProjectClosed={() => router.refresh()}
            />
            <ProjectRecommendation
              projectId={projectId as string}
              volunteersNeeded={project.volunteers_needed}
              volunteersRegistered={project.volunteers_registered}
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
                  value={projectEditForm.location || ""}
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
