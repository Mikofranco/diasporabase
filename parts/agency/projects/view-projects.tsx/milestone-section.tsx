"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentsModal } from "@/components/modals/comment";
import { Volunteer } from "@/lib/types";

const supabase = createClient();

interface Deliverable {
  id?: string;
  title: string;
  description?: string;
  due_date: string;
  status: "Pending" | "In Progress" | "Done" | "Cancelled";
  milestone_id?: string;
}

interface Milestone {
  id?: string;
  title: string;
  description?: string;
  due_date: string;
  status: "Pending" | "In Progress" | "Done" | "Cancelled";
  deliverables: Deliverable[];
}

interface MilestonesSectionProps {
  projectId: string;
  canEdit?: boolean; 
  volunteers: Volunteer[]
}

export function MilestonesSection({
  projectId,
  canEdit = true,
  volunteers
}: MilestonesSectionProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [editMilestone, setEditMilestone] = useState<Milestone | null>(null);
  const [editDeliverable, setEditDeliverable] = useState<Deliverable | null>(
    null
  );
  const [milestoneToAddDeliverable, setMilestoneToAddDeliverable] = useState<
    string | null
  >(null);

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    setLoading(true);
    const { data: milestonesData } = await supabase
      .from("milestones")
      .select("*")
      .eq("project_id", projectId)
      .order("due_date");

    if (milestonesData) {
      const milestoneIds = milestonesData.map((m:any) => m.id);
      const { data: deliverablesData } = await supabase
        .from("deliverables")
        .select("*")
        .in("milestone_id", milestoneIds);

      const deliverablesMap = (deliverablesData || []).reduce((acc:any, d:any) => {
        if (!acc[d.milestone_id]) acc[d.milestone_id] = [];
        acc[d.milestone_id].push(d);
        return acc;
      }, {} as Record<string, Deliverable[]>);

      const fullMilestones = milestonesData.map((m:any) => ({
        ...m,
        deliverables: deliverablesMap[m.id] || [],
      }));

      setMilestones(fullMilestones);
    }
    setLoading(false);
  };

  const saveMilestone = async () => {
    if (!editMilestone) return;
    setSaving(true);

    const payload = {
      title: editMilestone.title,
      description: editMilestone.description || null,
      due_date: editMilestone.due_date,
      status: editMilestone.status,
      project_id: projectId,
    };

    let result;
    if (editMilestone.id) {
      result = await supabase
        .from("milestones")
        .update(payload)
        .eq("id", editMilestone.id);
    } else {
      result = await supabase
        .from("milestones")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      toast.error("Failed to save milestone");
    } else {
      toast.success("Milestone saved!");
      fetchMilestones();
      setEditMilestone(null);
    }
    setSaving(false);
  };

  const deleteMilestone = async (id: string) => {
    if (!confirm("Delete this milestone and all its deliverables?")) return;

    const { error } = await supabase.from("milestones").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete milestone");
    } else {
      toast.success("Milestone deleted");
      fetchMilestones();
    }
  };

  const saveDeliverable = async () => {
    if (!editDeliverable || !milestoneToAddDeliverable) return;
    setSaving(true);

    const payload = {
      title: editDeliverable.title,
      description: editDeliverable.description || null,
      due_date: editDeliverable.due_date,
      status: editDeliverable.status,
      project_id: projectId,
      milestone_id: milestoneToAddDeliverable,
    };

    let result;
    if (editDeliverable.id) {
      result = await supabase
        .from("deliverables")
        .update(payload)
        .eq("id", editDeliverable.id);
    } else {
      result = await supabase
        .from("deliverables")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      toast.error("Failed to save deliverable");
    } else {
      toast.success("Deliverable saved!");
      fetchMilestones();
      setEditDeliverable(null);
      setMilestoneToAddDeliverable(null);
    }
    setSaving(false);
  };

  const deleteDeliverable = async (id: string) => {
    if (!confirm("Delete this deliverable?")) return;

    const { error } = await supabase.from("deliverables").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete deliverable");
    } else {
      toast.success("Deliverable deleted");
      fetchMilestones();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Pending":
        return "bg-amber-100 text-amber-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center py-16">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Milestones Defined</h3>
          <p className="text-gray-600">
            Start by adding your first milestone and its deliverables.
          </p>
          {canEdit && (
            <Button
              onClick={() =>
                setEditMilestone({
                  title: "",
                  description: "",
                  due_date: "",
                  status: "Pending",
                  deliverables: [],
                })
              }
              className="text-diaspora-darkBlue border-diaspora-darkBlue mt-5"
              variant={"outline"}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Milestone
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl text-diaspora-darkBlue font-bold">
          Project Milestones & Deliverables
        </h2>
        {canEdit && (
          <Button
            onClick={() =>
              setEditMilestone({
                title: "",
                description: "",
                due_date: "",
                status: "Pending",
                deliverables: [],
              })
            }
            className="text-diaspora-darkBlue border-diaspora-darkBlue"
            variant={"outline"}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Milestone
          </Button>
        )}
      </div>

      {milestones.map((milestone) => (
        <Card
          key={milestone.id}
          className="shadow-lg hover:shadow-xl transition-shadow"
        >
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl flex items-center gap-3">
                  {milestone.title}
                </CardTitle>
                {milestone.description && (
                  <CardDescription className="mt-2 text-base">
                    {milestone.description}
                  </CardDescription>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <Badge className={getStatusColor(milestone.status)}>
                    {milestone.status}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Due: {format(new Date(milestone.due_date), "MMMM d, yyyy")}
                  </div>
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditMilestone(milestone)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      milestone.id && deleteMilestone(milestone.id)
                    }
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-semibold">
                Deliverables ({milestone.deliverables.length})
              </h4>
              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditDeliverable({
                      title: "",
                      description: "",
                      due_date: "",
                      status: "Pending",
                    });
                    setMilestoneToAddDeliverable(milestone.id || "");
                  }}
                  className="text-diaspora-darkBlue border-diaspora-darkBlue"
                  variant={"outline"}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Deliverable
                </Button>
              )}
            </div>

            {milestone.deliverables.length === 0 ? (
              <p className="text-gray-500 italic py-4 text-center">
                No deliverables yet.
              </p>
            ) : (
              <div className="space-y-4">
                {milestone.deliverables.map((del) => (
                  <div
                    key={del.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <h5 className="font-medium">{del.title}</h5>
                      {del.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {del.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>
                          {format(new Date(del.due_date), "MMM d, yyyy")}
                        </span>
                        <Badge className={getStatusColor(del.status)}>
                          {del.status}
                        </Badge>
                      </div>
                      <CommentsModal deliverableId={del.id || ""} volunteers={volunteers} projectId={projectId} />
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditDeliverable(del);
                            setMilestoneToAddDeliverable(milestone.id || "");
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => del.id && deleteDeliverable(del.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Edit Milestone Dialog */}
      <Dialog
        open={!!editMilestone}
        onOpenChange={() => setEditMilestone(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editMilestone?.id ? "Edit" : "Add"} Milestone
            </DialogTitle>
          </DialogHeader>
          {editMilestone && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editMilestone.title}
                  onChange={(e) =>
                    setEditMilestone({
                      ...editMilestone,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={editMilestone.description || ""}
                  onChange={(e) =>
                    setEditMilestone({
                      ...editMilestone,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={editMilestone.due_date}
                  onChange={(e) =>
                    setEditMilestone({
                      ...editMilestone,
                      due_date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editMilestone.status}
                  onValueChange={(v) =>
                    setEditMilestone({ ...editMilestone, status: v as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMilestone(null)}>
              Cancel
            </Button>
            <Button
              onClick={saveMilestone}
              disabled={saving}
              className="action-btn"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Deliverable Dialog */}
      <Dialog
        open={!!editDeliverable}
        onOpenChange={() => {
          setEditDeliverable(null);
          setMilestoneToAddDeliverable(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editDeliverable?.id ? "Edit" : "Add"} Deliverable
            </DialogTitle>
          </DialogHeader>
          {editDeliverable && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editDeliverable.title}
                  onChange={(e) =>
                    setEditDeliverable({
                      ...editDeliverable,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={editDeliverable.description || ""}
                  onChange={(e) =>
                    setEditDeliverable({
                      ...editDeliverable,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={editDeliverable.due_date}
                  onChange={(e) =>
                    setEditDeliverable({
                      ...editDeliverable,
                      due_date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editDeliverable.status}
                  onValueChange={(v) =>
                    setEditDeliverable({ ...editDeliverable, status: v as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDeliverable(null);
                setMilestoneToAddDeliverable(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={saveDeliverable}
              disabled={saving}
              className="action-btn"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Deliverable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
