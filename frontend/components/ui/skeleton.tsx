import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Soft shimmer placeholder (UI/UX §8) — replaces spinners on cards/lists/tables.
 * The shimmer is disabled automatically under prefers-reduced-motion.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-md bg-elevated",
        "bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)] bg-[length:200%_100%] [animation:var(--animate-shimmer)]",
        "motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
