"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface RejectProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle: string;
  projectId: string;
  onConfirmReject: (reason: string, details?: string) => Promise<void> | void;
}

const REJECTION_REASONS = [
  { value: "incomplete_information", label: "Incomplete or missing information" },
  { value: "does_not_meet_criteria", label: "Does not meet program criteria/eligibility" },
  { value: "low_impact", label: "Low potential impact or scalability" },
  { value: "duplicate", label: "Duplicate of an existing project" },
  { value: "budget_constraints", label: "Budget or resource constraints" },
  { value: "location_not_suitable", label: "Location not within current focus areas" },
  { value: "other", label: "Other (please specify)" },
];

export function RejectProjectDialog({
  open,
  onOpenChange,
  projectTitle,
  projectId,
  onConfirmReject,
}: RejectProjectDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherDetails, setOtherDetails] = useState<string>("");
  const [internalNote, setInternalNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error("Please select a rejection reason");
      return;
    }

    if (selectedReason === "other" && !otherDetails.trim()) {
      toast.error("Please provide details for 'Other' reason");
      return;
    }

    setIsSubmitting(true);

    try {
      const mainReason =
        selectedReason === "other"
          ? otherDetails.trim()
          : REJECTION_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;

      await onConfirmReject(mainReason, internalNote.trim() || undefined);

      toast.success("Project rejected successfully");
      onOpenChange(false);

      // Reset form
      setSelectedReason("");
      setOtherDetails("");
      setInternalNote("");
    } catch (err: any) {
      toast.error(err.message || "Failed to reject project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Reject Project
          </DialogTitle>
          <DialogDescription className="pt-2">
            You are about to <strong>permanently reject</strong> the project:
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border text-gray-900 font-medium">
              {projectTitle}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="font-medium">
              Reason for rejection <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select primary reason" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="details" className="font-medium">
                Please specify the reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="details"
                placeholder="Describe why this project is being rejected..."
                value={otherDetails}
                onChange={(e) => setOtherDetails(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Optional internal note – only visible to admins */}
          <div className="space-y-2">
            <Label htmlFor="internal-note" className="font-medium">
              Internal note <span className="text-gray-500 text-xs">(not visible to agency)</span>
            </Label>
            <Textarea
              id="internal-note"
              placeholder="Private notes for team (optional)"
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              This action cannot be undone.
            </p>
            <p className="mt-1">
              The agency will be notified and will no longer be able to edit or resubmit this project.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Confirm Rejection"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}