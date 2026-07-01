"use client";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { PlanCard } from "@/components/plans/plan-card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlans } from "@/lib/subscriptions";

export default function PlansPage() {
  const { data: plans, isLoading, isError } = usePlans();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-24 md:pb-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Meal Plans" }]}
      />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Meal-prep subscriptions</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Fresh, chef-made meals delivered on a schedule. Pick a plan, choose
          how often it&apos;s delivered, and manage or cancel it anytime from
          your account.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load plans. Please refresh and try again.
        </p>
      ) : !plans || plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-base font-semibold text-foreground">
            No plans available yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon — new meal plans are on the way.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </main>
  );
}
