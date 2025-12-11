// components/project/LeaveProjectModal.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LogOut, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const supabase = createClient();

interface LeaveProjectModalProps {
  project: {
    id: string;
    title: string | undefined;
  };
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export default function LeaveProjectModal({
  project,
  onSuccess,
  trigger,
}: LeaveProjectModalProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLeave = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for leaving.");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const projectId = project.id;
      const volunteerId = user.id;

      // Step 1: Remove volunteer from project
      const { error: deleteError } = await supabase
        .from("project_volunteers")
        .delete()
        .eq("project_id", projectId)
        .eq("volunteer_id", volunteerId);

      if (deleteError) throw deleteError;

      // Step 2: Try to record the reason
      const { error: reasonError } = await supabase
        .from("project_leave_reasons")
        .insert({
          project_id: projectId,
          volunteer_id: volunteerId,
          reason: reason.trim(),
        });

      // If recording reason fails → rollback the deletion!
      if (reasonError) {
        // Try to re-add the volunteer
        const { error: rollbackError } = await supabase
          .from("project_volunteers")
          .insert({
            project_id: projectId,
            volunteer_id: volunteerId,
          });

        if (rollbackError) {
          console.error("CRITICAL: Failed to rollback after leave reason error", rollbackError);
          toast.error(
            "Something went wrong and your status may be inconsistent. Please contact support."
          );
          return;
        }

        throw new Error("Failed to save leave reason. You've been kept in the project.");
      }

      // SUCCESS: Both operations worked
      toast.success(`You have left "${project.title}".`);
      setOpen(false);
      setReason("");
      setConfirmOpen(false);
      onSuccess?.(); // Safe to call — everything succeeded
    } catch (err: any) {
      console.error("Leave project error:", err);
      toast.error(err.message || "Failed to leave project. Please try again.");
      // onSuccess is NOT called on error
    } finally {
      setSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="destructive" className="w-full">
      <LogOut className="mr-2 h-4 w-4" />
      Leave Project
    </Button>
  );

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger || defaultTrigger}
      </div>

      {/* Main Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Leave Project</DialogTitle>
            <DialogDescription className="text-base">
              You're about to leave <strong>{project.title}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-orange-800 dark:text-orange-300">
                This action <strong>cannot be undone</strong>. You will lose access to project updates and communication.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-base">
                Why are you leaving? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="e.g., Schedule conflict, personal reasons, completed my part..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="resize-none"
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Your feedback helps us improve the platform.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={submitting || !reason.trim()}
            >
              Leave Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            <p>
              Project: <strong>{project.title}</strong>
            </p>
            <p className="mt-2">
              Reason: <span className="italic">"{reason}"</span>
            </p>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              No, Keep Me In
            </Button>
            <Button variant="destructive" onClick={handleLeave} disabled={submitting}>
              {submitting ? "Leaving..." : "Yes, Leave Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}