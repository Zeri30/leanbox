import { Check, Clock, CookingPot, PackageCheck, Truck, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { OrderStatus } from "@/lib/types/api";
import { cn } from "@/lib/utils";

interface Step {
  status: Exclude<OrderStatus, "cancelled">;
  label: string;
  icon: LucideIcon;
  /** Marked because it is advanced by the rider, not the customer/admin. */
  riderDriven?: boolean;
}

/** Happy-path lifecycle (App\Enums\OrderStatus::allowedTransitions). */
const STEPS: Step[] = [
  { status: "pending", label: "Pending", icon: Clock },
  { status: "confirmed", label: "Confirmed", icon: Check },
  { status: "preparing", label: "Preparing", icon: CookingPot },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: PackageCheck, riderDriven: true },
];

const STEP_INDEX = new Map(STEPS.map((s, i) => [s.status, i]));

/**
 * Vertical progress timeline for an order's lifecycle. Steps up to (and
 * including) the current status read as complete; later steps are muted.
 * `cancelled` is off-path, so it renders as a terminal cancelled state.
 */
export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <p className="text-sm font-semibold text-foreground">Order cancelled</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            This order was cancelled and will not be delivered.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STEP_INDEX.get(status) ?? 0;

  return (
    <ol className="flex flex-col">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const reached = done || current;
        const Icon = done ? Check : step.icon;
        const isLast = i === STEPS.length - 1;

        return (
          <li key={step.status} className="flex gap-3">
            {/* Marker + connector */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full border transition-colors",
                  reached
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-subtle",
                  current && "ring-2 ring-primary/30",
                )}
              >
                <Icon className="size-4" />
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "my-1 w-px flex-1",
                    done ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>

            {/* Label */}
            <div className={cn("pb-6", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-medium",
                  reached ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              {current && (
                <p className="mt-0.5 text-xs text-primary">Current status</p>
              )}
              {step.riderDriven && !current && (
                <p className="mt-0.5 text-xs text-subtle">Set by your rider</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
