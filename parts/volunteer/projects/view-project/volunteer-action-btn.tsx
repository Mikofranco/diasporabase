// components/project/VolunteerActionButton.tsx
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface VolunteerActionButtonProps {
  hasRequested: boolean;
  isFull: boolean;
  isRequesting?: boolean; // Controlled from parent (optional)
  onClick: () => void;
}

export const VolunteerActionButton: React.FC<VolunteerActionButtonProps> = ({
  hasRequested,
  isFull,
  isRequesting = false, // Default false if not passed
  onClick,
}) => {
  // If already requested → show permanent "Awaiting Approval" state
  if (hasRequested) {
    return (
      <Button
        disabled
        variant="outline"
        size="lg"
        className="w-full text-lg py-6 bg-yellow-50 hover:bg-yellow-50 cursor-not-allowed border-yellow-300 text-yellow-800"
      >
        <Clock className="h-5 w-5 mr-2" />
        Awaiting Approval
      </Button>
    );
  }

  // If project is full → disabled
  if (isFull) {
    return (
      <Button
        disabled
        variant="secondary"
        size="lg"
        className="w-full text-lg py-6"
      >
        Volunteer Slots Full
      </Button>
    );
  }

  // Normal state: clickable with requesting feedback
  return (
    <Button
      onClick={onClick}
      disabled={isRequesting}
      size="lg"
      className={cn(
        "w-full text-lg py-6 action-btn transition-all",
        isRequesting && "bg-primary/90"
      )}
    >
      {isRequesting ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Requesting...
        </>
      ) : (
        "Apply to Volunteer"
      )}
    </Button>
  );
};