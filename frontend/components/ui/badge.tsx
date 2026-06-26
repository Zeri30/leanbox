import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        // Category pill (UI/UX §5): primary-soft bg + primary text.
        category: "bg-primary-soft text-primary",
        neutral: "bg-elevated text-muted-foreground",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
        info: "bg-info/10 text-info",
        // Featured = lime accent.
        featured: "bg-accent-lime/15 text-accent-lime",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

/**
 * Order/delivery status → badge variant.
 * Lifecycle: pending → confirmed → preparing → shipped → delivered (or cancelled).
 */
const ORDER_STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  pending: "warning",
  confirmed: "info",
  preparing: "info",
  shipped: "info",
  out_for_delivery: "info",
  delivered: "success",
  cancelled: "destructive",
  failed: "destructive",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant = ORDER_STATUS_VARIANT[status] ?? "neutral";
  const label = status.replace(/_/g, " ");
  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {label}
    </Badge>
  );
}

export { badgeVariants };
