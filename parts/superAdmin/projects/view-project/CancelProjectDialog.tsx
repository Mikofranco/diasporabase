"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Ban, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CancelProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancelReason: string;
  onCancelReasonChange: (value: string) => void;
  onConfirm: () => void;
  isCancelling: boolean;
}

export function CancelProjectDialog({
  open,
  onOpenChange,
  cancelReason,
  onCancelReasonChange,
  onConfirm,
  isCancelling,
}: CancelProjectDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) onCancelReasonChange("");
      }}
    >
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-amber-600" />
            Cancel project
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          You must provide a reason for cancelling this project. This will be
          stored and shown on the project view.
        </p>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">
            Cancellation reason <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="cancel-reason"
            placeholder="e.g. Project no longer feasible, timeline changed…"
            value={cancelReason}
            onChange={(e) => onCancelReasonChange(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onCancelReasonChange("");
            }}
            className="rounded-lg"
          >
            Back
          </Button>
          <Button
            type="button"
            disabled={!cancelReason.trim() || isCancelling}
            onClick={onConfirm}
            className={cn(
              "rounded-lg",
              "border-amber-300 bg-amber-600 text-white hover:bg-amber-700"
            )}
          >
            {isCancelling ? (
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            ) : (
              <Ban className="h-4 w-4 shrink-0" />
            )}
            {isCancelling ? "Cancelling…" : "Confirm cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
