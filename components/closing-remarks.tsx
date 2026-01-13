"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";
import { ProjectStatus } from "@/lib/types";

type ClosingRemarksModalProps = {
  projectId: string;
  currentStatus: ProjectStatus;
  isAuthorized: boolean; // true if user is project_manager_id OR organization_id
  onProjectClosed?: () => void; // callback to refresh/redirect
};

export function ClosingRemarksModal({
  projectId,
  currentStatus,
  isAuthorized,
  onProjectClosed,
}: ClosingRemarksModalProps) {
  const [open, setOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  if (!isAuthorized || currentStatus !== "active") {
    return null;
  }

  const handleCloseProject = async () => {
    const trimmedRemarks = remarks.trim();

    if (!trimmedRemarks) {
      toast({
        title: "Remarks are required",
        description: "Please share a few words about the project outcome.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          status: "completed",
          closing_remarks: trimmedRemarks,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .eq("status", "active"); // extra safety: only update if still active

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Project marked as completed!",
        description: "Thank you for closing the project.",
      });

      // Auto-close modal after success
      setTimeout(() => {
        setOpen(false);
        onProjectClosed?.();
      }, 1800);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Failed to complete project",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="lg" className="gap-2 w-fit action-btn">
          <CheckCircle2 className="h-5 w-5" />
          Complete Project
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        {!success ? (
          <>
            <DialogHeader>
              <DialogTitle>Close Project & Add Closing Remarks</DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-5">
              <p className="text-sm text-muted-foreground">
                Please share final thoughts, achievements, or thanks to the team. 
                This will be visible to all participants.
              </p>

              <div className="space-y-2">
                <label htmlFor="remarks" className="text-sm font-medium">
                  Closing Remarks <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="remarks"
                  placeholder="The project was a great success thanks to excellent teamwork and timely delivery..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={5}
                  disabled={loading}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCloseProject}
                disabled={loading || !remarks.trim()}
                className="gap-2  bg-diaspora-blue hover:bg-diaspora-blue/90 text-white"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Mark as Completed
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Success view
          <div className="py-12 text-center space-y-6">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
            <div>
              <h3 className="text-2xl font-semibold">Project Completed!</h3>
              <p className="text-muted-foreground mt-2">
                Thank you for your contribution to this project.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}