"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Calendar, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Milestone } from "@/lib/types";

const supabase = createClient();

interface Deliverable {
  id: string;
  title: string;
  description?: string | null;
  due_date: string;
  status: string;
  milestone_id: string;
}

interface MilestoneWithDeliverables extends Milestone {
  deliverables: Deliverable[];
}

interface MilestonesTabProps {
  milestones: Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
  projectId: string;
  getStatusColor: (status: string) => string;
}

export function MilestonesTab({
  milestones,
  setMilestones,
  projectId,
  getStatusColor,
}: MilestonesTabProps) {
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [selectedMilestoneForDeliverables, setSelectedMilestoneForDeliverables] = useState<string | null>(null);

  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    due_date: "",
    status: "Pending",
  });

  const [deliverableForm, setDeliverableForm] = useState({
    title: "",
    description: "",
    due_date: "",
    status: "Pending",
  });

  // Fetch deliverables when milestones are loaded
  useEffect(() => {
    const fetchDeliverables = async () => {
      if (milestones.length === 0) return;

      const milestoneIds = milestones.map((m) => m.id);

      const { data: deliverables, error } = await supabase
        .from("deliverables")
        .select("*")
        .in("milestone_id", milestoneIds);

      if (error) {
        console.error("Error fetching deliverables:", error);
        return;
      }

      const deliverablesByMilestone = (deliverables || []).reduce((acc, del) => {
        if (!acc[del.milestone_id]) acc[del.milestone_id] = [];
        acc[del.milestone_id].push(del);
        return acc;
      }, {} as Record<string, Deliverable[]>);

      setMilestones((prev) =>
        prev.map((m) => ({
          ...m,
          deliverables: deliverablesByMilestone[m.id] || [],
        }))
      );
    };

    fetchDeliverables();
  }, [milestones.length]);

  const resetMilestoneForm = () => {
    setMilestoneForm({ title: "", description: "", due_date: "", status: "Pending" });
    setEditingMilestone(null);
  };

  const handleAddOrUpdateMilestone = async () => {
    if (!milestoneForm.title || !milestoneForm.due_date) {
      toast.error("Title and due date are required");
      return;
    }

    try {
      if (editingMilestone) {
        // Update existing milestone
        const { error } = await supabase
          .from("milestones")
          .update(milestoneForm)
          .eq("id", editingMilestone.id);

        if (error) throw error;

        setMilestones((prev) =>
          prev.map((m) => (m.id === editingMilestone.id ? { ...m, ...milestoneForm } : m))
        );
        toast.success("Milestone updated successfully");
      } else {
        // Add new milestone
        const { data, error } = await supabase
          .from("milestones")
          .insert({ ...milestoneForm, project_id: projectId })
          .select()
          .single();

        if (error) throw error;

        setMilestones((prev) => [...prev, data as Milestone]);
        toast.success("Milestone added successfully");
      }

      setIsAddMilestoneOpen(false);
      resetMilestoneForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to save milestone");
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm("Delete this milestone and all its deliverables?")) return;

    try {
      await supabase.from("deliverables").delete().eq("milestone_id", id);
      const { error } = await supabase.from("milestones").delete().eq("id", id);
      if (error) throw error;

      setMilestones((prev) => prev.filter((m) => m.id !== id));
      toast.success("Milestone deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddDeliverable = async (milestoneId: string) => {
    if (!deliverableForm.title || !deliverableForm.due_date) {
      toast.error("Title and due date are required");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("deliverables")
        .insert({
          ...deliverableForm,
          project_id: projectId,
          milestone_id: milestoneId,
        })
        .select()
        .single();

      if (error) throw error;

      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestoneId
            ? { ...m, deliverables: [...(m.deliverables || []), data as Deliverable] }
            : m
        )
      );

      toast.success("Deliverable added successfully");
      setDeliverableForm({ title: "", description: "", due_date: "", status: "Pending" });
      setSelectedMilestoneForDeliverables(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to add deliverable");
    }
  };

  return (
    <div className="space-y-8">
      {/* ==================== ADD MILESTONE BUTTON & DIALOG ==================== */}
      <div className="flex justify-end">
        <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetMilestoneForm} className="action-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingMilestone ? "Edit Milestone" : "Add New Milestone"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="m-title">Title</Label>
                <Input
                  id="m-title"
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  placeholder="e.g., Phase 1 Completion"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="m-desc">Description (optional)</Label>
                <Textarea
                  id="m-desc"
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  placeholder="Describe this milestone..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="m-date">Due Date</Label>
                <Input
                  id="m-date"
                  type="date"
                  value={milestoneForm.due_date}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={milestoneForm.status}
                  onValueChange={(value) => setMilestoneForm({ ...milestoneForm, status: value })}
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

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddMilestoneOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddOrUpdateMilestone} className="action-btn">
                {editingMilestone ? "Update" : "Add"} Milestone
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ==================== MILESTONES LIST ==================== */}
      {milestones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-gray-500 text-lg">No milestones defined yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click the "Add Milestone" button above to create one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {milestones.map((milestone) => (
            <Card key={milestone.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{milestone.title}</CardTitle>
                    {milestone.description && (
                      <CardDescription className="mt-2">{milestone.description}</CardDescription>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Due: {format(new Date(milestone.due_date), "MMMM d, yyyy")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(milestone.status)}>
                      {milestone.status}
                    </Badge>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingMilestone(milestone);
                        setMilestoneForm({
                          title: milestone.title,
                          description: milestone.description || "",
                          due_date: milestone.due_date.split("T")[0], // Format for input type="date"
                          status: milestone.status,
                        });
                        setIsAddMilestoneOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteMilestone(milestone.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-lg">Deliverables</h4>
                    <Button
                      size="sm"
                      onClick={() => setSelectedMilestoneForDeliverables(milestone.id)}
                      variant={"outline"}
                      className="text-disapora-darkBlue "
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Deliverable
                    </Button>
                  </div>

                  {/* Add Deliverable Form */}
                  {selectedMilestoneForDeliverables === milestone.id && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
                      <Input
                        placeholder="Deliverable title"
                        value={deliverableForm.title}
                        onChange={(e) => setDeliverableForm({ ...deliverableForm, title: e.target.value })}
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        rows={2}
                        value={deliverableForm.description}
                        onChange={(e) => setDeliverableForm({ ...deliverableForm, description: e.target.value })}
                      />
                      <div className="flex gap-3">
                        <Input
                          type="date"
                          value={deliverableForm.due_date}
                          onChange={(e) => setDeliverableForm({ ...deliverableForm, due_date: e.target.value })}
                        />
                        <Select
                          value={deliverableForm.status}
                          onValueChange={(value) => setDeliverableForm({ ...deliverableForm, status: value })}
                        >
                          <SelectTrigger className="w-40">
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
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMilestoneForDeliverables(null);
                            setDeliverableForm({ title: "", description: "", due_date: "", status: "Pending" });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddDeliverable(milestone.id)}
                        >
                          Save Deliverable
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Display Existing Deliverables */}
                  {milestone.deliverables && milestone.deliverables.length > 0 ? (
                    <div className="space-y-3">
                      {milestone.deliverables.map((deliverable) => (
                        <div
                          key={deliverable.id}
                          className="flex items-start justify-between p-4 bg-white border rounded-lg hover:bg-gray-50 transition"
                        >
                          <div className="flex-1">
                            <h5 className="font-medium">{deliverable.title}</h5>
                            {deliverable.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {deliverable.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(deliverable.due_date), "MMM d, yyyy")}
                              </div>
                              <Badge className={getStatusColor(deliverable.status)}>
                                {deliverable.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No deliverables yet. Click "Add Deliverable" to create one.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}