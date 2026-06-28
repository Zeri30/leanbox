import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Read-only 5-star rating display (rounds to the nearest whole star). */
export function Stars({
  rating,
  className,
  size = "size-4",
}: {
  rating: number;
  className?: string;
  size?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            size,
            i < rounded
              ? "fill-warning text-warning"
              : "fill-transparent text-subtle",
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}
