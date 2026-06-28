import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

const SIZE_HEIGHT = {
  sm: "h-7", // footer
  md: "h-10", // top nav
  lg: "h-12", // auth screens
} as const;

/**
 * Leanbox logo — premium green mark + wordmark. Reused across all nav shells.
 * Rendered from /public SVGs via next/image (unoptimized: SVGs are served as-is,
 * which also isolates their internal gradient/filter IDs from the rest of the page).
 *
 * - variant "full" (default): icon + "LEANBOX" wordmark — for the top nav & footer.
 * - variant "icon": square mark only — for tight spots (collapsed sidebar, etc.).
 */
export function Brand({
  href = "/",
  className,
  variant = "full",
  size = "sm",
}: {
  href?: string;
  className?: string;
  variant?: "full" | "icon";
  size?: keyof typeof SIZE_HEIGHT;
}) {
  const isIcon = variant === "icon";

  return (
    <Link
      href={href}
      aria-label="Leanbox"
      className={cn("inline-flex items-center", className)}
    >
      <Image
        src={isIcon ? "/brand/leanbox-icon.svg" : "/brand/leanbox-logo.svg"}
        alt="Leanbox"
        width={isIcon ? 140 : 500}
        height={isIcon ? 140 : 130}
        unoptimized
        className={cn("w-auto", SIZE_HEIGHT[size])}
      />
    </Link>
  );
}
