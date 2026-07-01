import { Check } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BILLING_INTERVAL_LABEL,
  MEAL_TYPE_LABEL,
} from "@/lib/subscriptions";
import type { SubscriptionPlan } from "@/lib/types/api";
import { formatPHP } from "@/lib/utils";

/** A single subscription-plan card with a Subscribe CTA. */
export function PlanCard({ plan }: { plan: SubscriptionPlan }) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">{plan.name}</h2>
        <Badge variant="category">{MEAL_TYPE_LABEL[plan.meal_type]}</Badge>
      </div>

      {plan.description && (
        <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
      )}

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {formatPHP(plan.price)}
        </span>
        <span className="text-sm text-muted-foreground">
          / {BILLING_INTERVAL_LABEL[plan.billing_interval]}
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <Check className="size-4 shrink-0 text-primary" />
          {plan.meals_per_cycle} meals per cycle
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-4 shrink-0 text-primary" />
          Billed {plan.billing_interval}, cancel anytime
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-4 shrink-0 text-primary" />
          Cash on delivery
        </li>
      </ul>

      <Button asChild className="mt-5">
        <Link href={`/plans/${plan.id}/subscribe`}>Subscribe</Link>
      </Button>
    </div>
  );
}
