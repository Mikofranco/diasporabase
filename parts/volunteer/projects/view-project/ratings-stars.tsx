// components/project/RatingStars.tsx
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RatingStarsProps {
  value: number;
  onChange: (value: number) => void;
  hovered?: number | null;
  onHover?: (value: number | null) => void;
  size?: "sm" | "lg";
  readonly?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  onChange,
  hovered,
  onHover,
  size = "lg",
  readonly = false,
}) => {
  const current = hovered ?? value;
  const starSize = size === "lg" ? "h-8 w-8" : "h-5 w-5";

  return (
    <div className="flex gap-1" role="radiogroup">
      {[1, 2, 3, 4, 5].map((star) => (
        <Button
          key={star}
          type="button"
          variant="ghost"
          disabled={readonly}
          className={`p-2 transition-colors ${
            readonly
              ? ""
              : current >= star
              ? "text-yellow-500"
              : "text-gray-400 hover:text-yellow-600"
          }`}
          onClick={() => !readonly && onChange(star)}
          onMouseEnter={() => !readonly && onHover?.(star)}
          onMouseLeave={() => !readonly && onHover?.(null)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className={starSize}
            fill={current >= star ? "currentColor" : "none"}
          />
        </Button>
      ))}
    </div>
  );
};