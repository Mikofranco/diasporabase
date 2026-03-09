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
import type { MilestoneSectionMilestone } from "./milestone-types";

const supabase = createClient();

const STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "In Progress", label: "In Progress" },
  { value: "Done", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
] as const;

interface CreateMilestoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialData?: MilestoneSectionMilestone | null;
  onSuccess: () => void;
}

export function CreateMilestoneModal({
  open,
  onOpenChange,
  projectId,
  initialData,
  onSuccess,
}: CreateMilestoneModalProps) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"Pending" | "In Progress" | "Done" | "Cancelled">("Pending");

  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description ?? "");
      setDueDate(initialData.due_date ? initialData.due_date.slice(0, 10) : "");
      setStatus(initialData.status);
    } else {
      setTitle("");
      setDescription("");
      setDueDate("");
      setStatus("Pending");
    }
  }, [open, initialData]);

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
      };

      if (isEdit && initialData?.id) {
        const { error } = await supabase
          .from("milestones")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
        toast.success("Milestone updated");
      } else {
        const { error } = await supabase
          .from("milestones")
          .insert({ ...payload, project_id: projectId })
          .select()
          .single();
        if (error) throw error;
        toast.success("Milestone created");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save milestone");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit" : "Add"} Milestone</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="milestone-title">Title</Label>
            <Input
              id="milestone-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Milestone title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="milestone-desc">Description (optional)</Label>
            <Textarea
              id="milestone-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="milestone-due">Due date</Label>
            <Input
              id="milestone-due"
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="action-btn">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create milestone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
