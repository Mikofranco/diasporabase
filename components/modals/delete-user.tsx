// components/modals/delete-user-dialog.tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;  // ← Important: make onConfirm async
  isLoading?: boolean;             // Optional: control loading externally if preferred
}

export default function DeleteUserDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading: externalLoading = false,
}: DeleteUserDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = externalLoading || internalLoading;

  const handleConfirm = async () => {
    setInternalLoading(true);
    try {
      await onConfirm();           // Your deleteUser server action
    } catch (error) {
      // Error handling is done in parent (toast, etc.)
      console.error("Deletion failed:", error);
    } finally {
      setInternalLoading(false);
      // Do NOT close dialog here — let parent handle based on success/failure
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this user? This action cannot be undone. 
            All related data (profile, confirmation links, auth record) will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}