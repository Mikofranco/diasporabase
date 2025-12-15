// components/ui/back-button.tsx
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  label?: string;           // Custom label, e.g., "Back to Dashboard"
  fallbackHref?: string;    // Optional: specific route to go to instead of history.back()
  className?: string;       // For custom styling
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function BackButton({
  label = "Back",
  fallbackHref,
  className = "",
  variant = "outline",
  size = "default",
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (fallbackHref) {
      router.push(fallbackHref);
    } else {
      router.back(); // Goes to previous page in history
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}