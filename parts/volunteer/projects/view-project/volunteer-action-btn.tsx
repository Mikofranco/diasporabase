// components/project/VolunteerActionButton.tsx
import { Button } from "@/components/ui/button";

interface VolunteerActionButtonProps {
  hasRequested: boolean;
  isFull: boolean;
  onClick: () => void;
}

export const VolunteerActionButton: React.FC<VolunteerActionButtonProps> = ({
  hasRequested,
  isFull,
  onClick,
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={hasRequested || isFull}
      className="w-full text-lg py-6 action-btn"
    >
      {hasRequested
        ? "Request Submitted"
        : isFull
        ? "Volunteer Slots Full"
        : "Apply to Volunteer"}
    </Button>
  );
};