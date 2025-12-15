// app/dashboard/agency/projects/[projectId]/page.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Trash2, Edit } from "lucide-react";
import ProjectRecommendation from "../project-recommendation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

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
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);

  // Delete Confirmation States
  const [deleteMilestoneId, setDeleteMilestoneId] = useState<string | null>(null);
  const [deleteDeliverableId, setDeleteDeliverableId] = useState<string | null>(null);

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

        const { data: miles } = await supabase.from("milestones").select("*").eq("project_id", projectId).order("due_date");//@ts-ignore
        setMilestones((miles || []).map(m => ({ ...m, status: m.status || "Pending" })));

        const { data: dels } = await supabase.from("deliverables").select("*").eq("project_id", projectId).order("due_date");//@ts-ignore
        setDeliverables((dels || []).map(d => ({ ...d, status: d.status || "Pending" })));

        const { data: vols } = await supabase
          .from("project_volunteers")
          .select("volunteer_id, profiles!inner(full_name, email, skills, availability, residence_country, volunteer_states)")
          .eq("project_id", projectId);

        setAssignedVolunteers((vols || []).map((v: any) => ({
          volunteer_id: v.volunteer_id,
          full_name: v.profiles.full_name,
          email: v.profiles.email,
          skills: v.profiles.skills || [],
          availability: v.profiles.availability || "N/A",
          residence_country: v.profiles.residence_country || "N/A",
          volunteer_states: v.profiles.volunteer_states || [],
          average_rating: 0,
        })));
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
      const { error } = await supabase.from("projects").update(projectEditForm).eq("id", project.id).eq("organization_id", userId);
      if (error) throw error;
      setProject({ ...project, ...projectEditForm });
      toast.success("Project updated!");
      setIsProjectEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.title || !newMilestone.due_date) return toast.error("Title and due date required");
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
      setNewMilestone({ title: "", description: "", due_date: "", status: "Pending" });
      const { data } = await supabase.from("milestones").select("*").eq("project_id", projectId);
      setMilestones(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateMilestone = async () => {
    if (!editingMilestone || !newMilestone.title || !newMilestone.due_date) return toast.error("Title and due date required");
    try {
      const { error } = await supabase.from("milestones").update({
        title: newMilestone.title,
        description: newMilestone.description || null,
        due_date: newMilestone.due_date,
        status: newMilestone.status,
      }).eq("id", editingMilestone.id);
      if (error) throw error;
      toast.success("Milestone updated!");
      setIsMilestoneModalOpen(false);
      setEditingMilestone(null);
      const { data } = await supabase.from("milestones").select("*").eq("project_id", projectId);
      setMilestones(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteMilestone = async () => {
    if (!deleteMilestoneId) return;
    try {
      const { error } = await supabase.from("milestones").delete().eq("id", deleteMilestoneId);
      if (error) throw error;
      toast.success("Milestone deleted");
      setDeleteMilestoneId(null);
      const { data } = await supabase.from("milestones").select("*").eq("project_id", projectId);
      setMilestones(data || []);
    } catch (err: any) {
      toast.error("Failed to delete milestone");
    }
  };

  const handleAddDeliverable = async () => {
    if (!newDeliverable.title || !newDeliverable.due_date) return toast.error("Title and due date required");
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
      setNewDeliverable({ title: "", description: "", due_date: "", status: "Pending" });
      const { data } = await supabase.from("deliverables").select("*").eq("project_id", projectId);
      setDeliverables(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateDeliverable = async () => {
    if (!editingDeliverable || !newDeliverable.title || !newDeliverable.due_date) return toast.error("Title and due date required");
    try {
      const { error } = await supabase.from("deliverables").update({
        title: newDeliverable.title,
        description: newDeliverable.description || null,
        due_date: newDeliverable.due_date,
        status: newDeliverable.status,
      }).eq("id", editingDeliverable.id);
      if (error) throw error;
      toast.success("Deliverable updated!");
      setIsDeliverableModalOpen(false);
      setEditingDeliverable(null);
      const { data } = await supabase.from("deliverables").select("*").eq("project_id", projectId);
      setDeliverables(data || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteDeliverable = async () => {
    if (!deleteDeliverableId) return;
    try {
      const { error } = await supabase.from("deliverables").delete().eq("id", deleteDeliverableId);
      if (error) throw error;
      toast.success("Deliverable deleted");
      setDeleteDeliverableId(null);
      const { data } = await supabase.from("deliverables").select("*").eq("project_id", projectId);
      setDeliverables(data || []);
    } catch (err: any) {
      toast.error("Failed to delete deliverable");
    }
  };

  if (loading) return <div className="container mx-auto p-6"><Skeleton className="h-96 w-full" /></div>;
  if (error || !project) return <div className="container mx-auto p-6 text-center py-20 text-destructive">{error || "Project not found"}</div>;

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">{project.title}</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/dashboard/agency/projects")}>
              Back to Projects
            </Button>
            <Button variant="outline" onClick={openProjectEditModal} className="action-btn">Edit Project</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{project.title}</CardTitle>
                <CardDescription>{project.organization_name}</CardDescription>
              </div>
              <Badge variant={project.status === "active" ? "default" : "secondary"}>
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <p className="text-muted-foreground">{project.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-center gap-2"><MapPin className="h-5 w-5" /><span>{project.location}</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-5 w-5" /><span>{new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</span></div>
              <div className="flex items-center gap-2"><Users className="h-5 w-5" /><span>{project.volunteers_registered}  volunteers</span></div>
            </div>

            {/* MILESTONES */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Milestones</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingMilestone(null);
                    setNewMilestone({ title: "", description: "", due_date: "", status: "Pending" });
                    setIsMilestoneModalOpen(true);
                  }}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  {milestones.length === 0 ? "Add Milestone" : "Add Another"}
                </Button>
              </div>

              {milestones.length === 0 ? (
                <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground  h-80 scroll-y-auto">No milestones yet. Click "Add Milestone" to create one.</CardContent></Card>
              ) : (
                <div className="space-y-4">
                  {milestones.map((m) => (
                    <Card key={m.id} className="bg-gray-50 border-0">
                      <CardContent className="pt-5 pb-4 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{m.title}</h4>
                          {m.description && <p className="text-sm text-muted-foreground mt-1">{m.description}</p>}
                          <p className="text-sm mt-2"><strong>Due:</strong> {new Date(m.due_date).toLocaleDateString()}</p>
                          <Badge variant={m.status === "Completed" ? "default" : m.status === "In Progress" ? "secondary" : "outline"} className="mt-2">
                            {m.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingMilestone(m);
                              setNewMilestone({
                                title: m.title,
                                description: m.description || "",
                                due_date: m.due_date.split("T")[0],
                                status: m.status,
                              });
                              setIsMilestoneModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteMilestoneId(m.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* DELIVERABLES */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Deliverables</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingDeliverable(null);
                    setNewDeliverable({ title: "", description: "", due_date: "", status: "Pending" });
                    setIsDeliverableModalOpen(true);
                  }}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  {deliverables.length === 0 ? "Add Deliverable" : "Add Another"}
                </Button>
              </div>

              {deliverables.length === 0 ? (
                <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">No deliverables yet. Click "Add Deliverable" to create one.</CardContent></Card>
              ) : (
                <div className="space-y-4">
                  {deliverables.map((d) => (
                    <Card key={d.id} className="bg-gray-50 border-0">
                      <CardContent className="pt-5 pb-4 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{d.title}</h4>
                          {d.description && <p className="text-sm text-muted-foreground mt-1">{d.description}</p>}
                          <p className="text-sm mt-2"><strong>Due:</strong> {new Date(d.due_date).toLocaleDateString()}</p>
                          <Badge variant={d.status === "Done" ? "default" : d.status === "In Progress" ? "secondary" : "outline"} className="mt-2">
                            {d.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingDeliverable(d);
                              setNewDeliverable({
                                title: d.title,
                                description: d.description || "",
                                due_date: d.due_date.split("T")[0],
                                status: d.status,
                              });
                              setIsDeliverableModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteDeliverableId(d.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Assigned Volunteers & Recommendation */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Assigned Volunteers ({assignedVolunteers.length})</h2>
              {assignedVolunteers.length === 0 ? (
                <p className="text-muted-foreground">No volunteers assigned yet.</p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {assignedVolunteers.map(v => (
                    <Card key={v.volunteer_id}>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold">{v.full_name}</h4>
                        <p className="text-sm text-muted-foreground">{v.email}</p>
                        <p className="text-sm mt-2"><strong>Skills:</strong> {v.skills.join(", ")}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <ProjectRecommendation projectId={projectId as string} volunteersNeeded={project.volunteers_needed} volunteersRegistered={project.volunteers_registered} />
          </CardContent>
        </Card>

        {/* Milestone Modal */}
        <Dialog open={isMilestoneModalOpen} onOpenChange={(open) => {
          setIsMilestoneModalOpen(open);
          if (!open) { setEditingMilestone(null); setNewMilestone({ title: "", description: "", due_date: "", status: "Pending" }); }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMilestone ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
              <DialogDescription>{editingMilestone ? "Update milestone details" : "Create a new milestone"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Title *</Label><Input value={newMilestone.title} onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={newMilestone.description} onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })} rows={3} /></div>
              <div><Label>Due Date *</Label><Input type="date" value={newMilestone.due_date} onChange={e => setNewMilestone({ ...newMilestone, due_date: e.target.value })} /></div>
              <div><Label>Status *</Label>
                <Select value={newMilestone.status} onValueChange={v => setNewMilestone({ ...newMilestone, status: v as Milestone["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMilestoneModalOpen(false)}>Cancel</Button>
              <Button onClick={editingMilestone ? handleUpdateMilestone : handleAddMilestone} className="action-btn">
                {editingMilestone ? "Save Changes" : "Add Milestone"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deliverable Modal */}
        <Dialog open={isDeliverableModalOpen} onOpenChange={(open) => {
          setIsDeliverableModalOpen(open);
          if (!open) { setEditingDeliverable(null); setNewDeliverable({ title: "", description: "", due_date: "", status: "Pending" }); }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDeliverable ? "Edit Deliverable" : "Add Deliverable"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Title *</Label><Input value={newDeliverable.title} onChange={e => setNewDeliverable({ ...newDeliverable, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={newDeliverable.description} onChange={e => setNewDeliverable({ ...newDeliverable, description: e.target.value })} rows={3} /></div>
              <div><Label>Due Date *</Label><Input type="date" value={newDeliverable.due_date} onChange={e => setNewDeliverable({ ...newDeliverable, due_date: e.target.value })} /></div>
              <div><Label>Status *</Label>
                <Select value={newDeliverable.status} onValueChange={v => setNewDeliverable({ ...newDeliverable, status: v as Deliverable["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeliverableModalOpen(false)}>Cancel</Button>
              <Button onClick={editingDeliverable ? handleUpdateDeliverable : handleAddDeliverable}>
                {editingDeliverable ? "Save Changes" : "Add Deliverable"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Milestone Confirmation */}
        <AlertDialog open={!!deleteMilestoneId} onOpenChange={() => setDeleteMilestoneId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Milestone?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the milestone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMilestone} className="bg-red-600 hover:bg-red-700">
                Delete Milestone
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Deliverable Confirmation */}
        <AlertDialog open={!!deleteDeliverableId} onOpenChange={() => setDeleteDeliverableId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Deliverable?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the deliverable.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDeliverable} className="bg-red-600 hover:bg-red-700">
                Delete Deliverable
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Project Modal */}
        <Dialog open={isProjectEditModalOpen} onOpenChange={setIsProjectEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={projectEditForm.title || ""} onChange={e => setProjectEditForm({ ...projectEditForm, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={projectEditForm.description || ""} onChange={e => setProjectEditForm({ ...projectEditForm, description: e.target.value })} /></div>
              <div><Label>Location</Label><Input value={projectEditForm.location || ""} onChange={e => setProjectEditForm({ ...projectEditForm, location: e.target.value })} /></div>
              <div><Label>Start Date</Label><Input type="date" value={projectEditForm.start_date || ""} onChange={e => setProjectEditForm({ ...projectEditForm, start_date: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={projectEditForm.end_date || ""} onChange={e => setProjectEditForm({ ...projectEditForm, end_date: e.target.value })} /></div>
              <div><Label>Category</Label><Input value={projectEditForm.category || ""} onChange={e => setProjectEditForm({ ...projectEditForm, category: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProjectEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleProjectEditSubmit} className="action-btn">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ProjectDetails;