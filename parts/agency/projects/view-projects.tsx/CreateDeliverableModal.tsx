"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { MilestoneSectionDeliverable } from "./milestone-types";
import type { MilestoneRole } from "./milestone-types";
import type { Volunteer } from "@/lib/types";

const supabase = createClient();

const STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "In Progress", label: "In Progress" },
  { value: "Done", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
] as const;

interface CreateDeliverableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  milestoneId: string;
  role: MilestoneRole;
  volunteers: Volunteer[];
  currentUserId: string | null;
  initialData?: MilestoneSectionDeliverable | null;
  onSuccess: () => void;
  /** When true (e.g. volunteer PM), show "Assigned to" and allow assigning to any project volunteer. */
  canAssignToVolunteers?: boolean;
}

export function CreateDeliverableModal({
  open,
  onOpenChange,
  projectId,
  milestoneId,
  role,
  volunteers,
  currentUserId,
  initialData,
  onSuccess,
  canAssignToVolunteers = false,
}: CreateDeliverableModalProps) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"Pending" | "In Progress" | "Done" | "Cancelled">("Pending");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);

  const isEdit = !!initialData?.id;
  const isVolunteer = role === "volunteer";
  const showAssignSelect = !isVolunteer || canAssignToVolunteers;

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description ?? "");
      setDueDate(initialData.due_date ? initialData.due_date.slice(0, 10) : "");
      setStatus(initialData.status);
      setAssignedTo(initialData.assigned_to ?? null);
    } else {
      setTitle("");
      setDescription("");
      setDueDate("");
      setStatus("Pending");
      setAssignedTo(showAssignSelect ? null : (currentUserId ?? null));
    }
  }, [open, initialData, showAssignSelect, currentUserId]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!dueDate) {
      toast.error("Due date is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate,
        status,
        project_id: projectId,
        milestone_id: milestoneId,
        assigned_to: showAssignSelect ? assignedTo : (isVolunteer ? currentUserId : assignedTo),
      };

      if (isEdit && initialData?.id) {
        const { error } = await supabase
          .from("deliverables")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
        toast.success("Deliverable updated");
      } else {
        const { error } = await supabase
          .from("deliverables")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        toast.success("Deliverable created");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save deliverable");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Add"} Deliverable</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="del-title">Title</Label>
            <Input
              id="del-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Deliverable title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="del-desc">Description (optional)</Label>
            <Textarea
              id="del-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="del-due">Due date</Label>
            <Input
              id="del-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as typeof status)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Assigned To: agency or volunteer PM can assign to any project volunteer */}
          {showAssignSelect && (
            <div className="space-y-2">
              <Label>Assigned to (optional)</Label>
              <Select
                value={assignedTo ?? "unassigned"}
                onValueChange={(v) => setAssignedTo(v === "unassigned" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {volunteers.map((v) => (
                    <SelectItem key={v.volunteer_id} value={v.volunteer_id}>
                      {v.full_name || v.email || v.volunteer_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="action-btn">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create deliverable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
