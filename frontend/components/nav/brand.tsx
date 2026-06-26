import Link from "next/link";

import { cn } from "@/lib/utils";

/** Leanbox wordmark — green "lean" cube + display type. Reused across all nav shells. */
export function Brand({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground",
        className,
      )}
    >
      <span className="grid size-7 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">
        L
      </span>
      Leanbox
    </Link>
  );
}
