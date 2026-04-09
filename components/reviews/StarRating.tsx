"use client";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const SIZES = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};

export default function StarRating({
  rating,
  size = "md",
  interactive = false,
  onChange,
}: StarRatingProps) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={cn(
            SIZES[size],
            interactive && "cursor-pointer hover:scale-110 transition-transform",
            star <= Math.round(rating) ? "text-warning" : "text-gray-300"
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}
