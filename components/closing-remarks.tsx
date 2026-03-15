"use client";

import { useState, useEffect } from "react";
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
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";
import { ProjectStatus } from "@/lib/types";
import { Input } from "./ui/input";

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
  const [unratedCount, setUnratedCount] = useState<number | null>(null);
  const { toast } = useToast();
  const [projectLink, setProjectLink] = useState("");
  useEffect(() => {
    if (!open || !projectId || currentStatus !== "active") return;
    const checkRatings = async () => {
      const [volsRes, ratingsRes] = await Promise.all([
        supabase.from("project_volunteers").select("volunteer_id").eq("project_id", projectId),
        supabase.from("volunteer_ratings").select("volunteer_id").eq("project_id", projectId),
      ]);
      const volunteerIds = new Set((volsRes.data ?? []).map((v: { volunteer_id: string }) => v.volunteer_id));
      const ratedIds = new Set((ratingsRes.data ?? []).map((r: { volunteer_id: string }) => r.volunteer_id));
      const unrated = [...volunteerIds].filter((id) => !ratedIds.has(id)).length;
      setUnratedCount(unrated);
    };
    checkRatings();
  }, [open, projectId, currentStatus]);

  if (!isAuthorized || currentStatus !== "active") {
    return null;
  }

  const allRated = unratedCount === null || unratedCount === 0;
  const canComplete = remarks.trim().length > 0 && allRated;

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

    if (!allRated && unratedCount !== null) {
      toast({
        title: "Rate all volunteers first",
        description: `You must rate ${unratedCount} volunteer${unratedCount === 1 ? "" : "s"} before completing the project.`,
        variant: "destructive",
      });
      return;
    }

    if(projectLink.trim() === "") {
      toast({
        title: "Project link is required",
        description: "Please provide a link to the project outcome or deliverable.",
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
          project_link: projectLink.trim() || null,
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
              {!allRated && unratedCount !== null && unratedCount > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Rate all volunteers first</p>
                    <p className="text-sm mt-1">
                      You must rate {unratedCount} volunteer{unratedCount === 1 ? "" : "s"} before completing this project.
                      Go to the Assigned Volunteers section and click &quot;Rate&quot; for each volunteer.
                    </p>
                  </div>
                </div>
              )}  

              <p className="text-sm text-muted-foreground">
                Please share final thoughts, achievements, or thanks to the team. 
                This will be visible to all participants.
              </p>

              <div className="space-y-2">
                <label htmlFor="remarks" className="text-sm font-medium">
                  Project Link <span className="text-red-500">*</span>
                </label>
                <Input
                  id="remarks"
                  placeholder="https://example.com/project-outcome"
                  value={projectLink}
                  onChange={(e) => setProjectLink(e.target.value)}
                  disabled={loading}
                  className="resize-none"
                />
              </div>

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
                disabled={loading || !canComplete}
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