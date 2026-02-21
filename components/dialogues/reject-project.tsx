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
  onConfirmReject: (
    reason: string,
    details?: string
  ) => Promise<{ isThirdRejection?: boolean } | void> | void;
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

      const result = await onConfirmReject(
        mainReason,
        internalNote.trim() || undefined
      );

      toast.success(
        result?.isThirdRejection
          ? "Project rejected and cancelled (maximum rejections reached)."
          : "Project rejected successfully"
      );
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
          <DialogDescription asChild>
            <p className="text-gray-600 pt-1">
              Select a reason for rejecting this project. The agency will see the reason you choose.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm font-medium text-gray-700">
            {projectTitle}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="font-medium text-gray-900">
              Reason for rejection <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="reason" className="rounded-lg">
                <SelectValue placeholder="Select a reason" />
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
              <Label htmlFor="details" className="font-medium text-gray-900">
                Please specify <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="details"
                placeholder="Describe why this project is being rejected..."
                value={otherDetails}
                onChange={(e) => setOtherDetails(e.target.value)}
                rows={3}
                className="resize-none rounded-lg"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="internal-note" className="font-medium text-gray-900">
              Additional notes <span className="text-gray-500 font-normal text-xs">(optional, for admin use only — not sent to agency)</span>
            </Label>
            <Textarea
              id="internal-note"
              placeholder="Add any extra context for your records..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              rows={2}
              className="resize-none rounded-lg"
            />
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