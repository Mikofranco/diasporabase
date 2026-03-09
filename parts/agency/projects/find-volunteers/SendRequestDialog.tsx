"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { Volunteer } from "@/lib/types";

interface SendRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVolunteer: Volunteer | null;
  onConfirm: (volunteer: Volunteer) => void;
  loading?: boolean;
}

export function SendRequestDialog({
  open,
  onOpenChange,
  selectedVolunteer,
  onConfirm,
  loading = false,
}: SendRequestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-[#0ea5e9]" /> Confirm invitation
          </DialogTitle>
          <DialogDescription>
            Send a project invitation to{" "}
            <strong>{selectedVolunteer?.full_name}</strong>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              selectedVolunteer && onConfirm(selectedVolunteer)
            }
            disabled={loading}
            className="action-btn"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {loading ? "Sending..." : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
