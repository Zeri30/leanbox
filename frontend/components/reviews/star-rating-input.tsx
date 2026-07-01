"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

const LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"];

/** Interactive 1–5 star rating input (0 = unrated). Keyboard + hover support. */
export function StarRatingInput({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (rating: number) => void;
  className?: string;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Rating"
        onMouseLeave={() => setHover(0)}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const star = i + 1;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                className={cn(
                  "size-7",
                  star <= active
                    ? "fill-warning text-warning"
                    : "fill-transparent text-subtle",
                )}
              />
            </button>
          );
        })}
      </div>
      {active > 0 && (
        <span className="text-sm text-muted-foreground">{LABELS[active - 1]}</span>
      )}
    </div>
  );
}
