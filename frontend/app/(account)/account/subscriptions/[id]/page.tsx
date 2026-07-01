"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { FormBanner } from "@/components/auth/field";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/auth";
import {
  BILLING_INTERVAL_LABEL,
  DELIVERY_SCHEDULE_LABEL,
  MEAL_TYPE_LABEL,
  useManageSubscription,
  useSubscription,
} from "@/lib/subscriptions";
import type { SubscriptionAction } from "@/lib/types/api";
import { formatDate, formatPHP } from "@/lib/utils";

const ACTION_COPY: Record<
  SubscriptionAction,
  { title: string; description: string; confirmText: string; danger: boolean }
> = {
  pause: {
    title: "Pause subscription?",
    description:
      "No further deliveries or charges until you resume. You can resume anytime.",
    confirmText: "Pause",
    danger: false,
  },
  resume: {
    title: "Resume subscription?",
    description: "Deliveries and billing will start again on the next cycle.",
    confirmText: "Resume",
    danger: false,
  },
  cancel: {
    title: "Cancel subscription?",
    description: "This stops all future deliveries and can't be undone.",
    confirmText: "Cancel subscription",
    danger: true,
  },
};

export default function SubscriptionManagePage() {
  const params = useParams();
  const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const { data: sub, isLoading, isError } = useSubscription(id);
  const manage = useManageSubscription();

  const [pendingAction, setPendingAction] = useState<SubscriptionAction | null>(
    null,
  );
  const [banner, setBanner] = useState<string | null>(null);

  async function onConfirm() {
    if (!pendingAction) return;
    setBanner(null);
    try {
      await manage.mutateAsync({ id, action: pendingAction });
      setPendingAction(null);
    } catch (err) {
      setPendingAction(null);
      setBanner(errorMessage(err));
    }
  }

  const backLink = (
    <Link
      href="/account/subscriptions"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to subscriptions
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !sub) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-base font-semibold text-foreground">
            Subscription not found
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            We couldn&apos;t find this subscription. It may belong to another
            account.
          </p>
        </div>
      </div>
    );
  }

  const copy = pendingAction ? ACTION_COPY[pendingAction] : null;

  return (
    <div className="flex flex-col gap-6">
      {backLink}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {sub.plan?.name ?? "Subscription"}
          </h1>
          {sub.plan?.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {sub.plan.description}
            </p>
          )}
        </div>
        <StatusBadge status={sub.status} className="mt-1.5" />
      </div>

      {banner && <FormBanner>{banner}</FormBanner>}

      {/* Plan + schedule details */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Details</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {sub.plan && (
            <>
              <div>
                <dt className="text-muted-foreground">Price</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                  {formatPHP(sub.plan.price)} /{" "}
                  {BILLING_INTERVAL_LABEL[sub.plan.billing_interval]}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Meals per cycle</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {sub.plan.meals_per_cycle}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Meal type</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {MEAL_TYPE_LABEL[sub.plan.meal_type]}
                </dd>
              </div>
            </>
          )}
          <div>
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {DELIVERY_SCHEDULE_LABEL[sub.delivery_schedule]}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Started</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {formatDate(sub.start_date)}
            </dd>
          </div>
          {sub.status === "cancelled" ? (
            <div>
              <dt className="text-muted-foreground">Cancelled</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {formatDate(sub.cancelled_at)}
              </dd>
            </div>
          ) : (
            <div>
              <dt className="text-muted-foreground">Next delivery</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {sub.status === "paused"
                  ? "Paused"
                  : formatDate(sub.next_delivery_date)}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* Payment history */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Billing history</h2>
        {sub.payments && sub.payments.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border text-sm">
            {sub.payments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium tabular-nums text-foreground">
                    {formatPHP(payment.amount)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(payment.billing_date)}
                  </p>
                </div>
                <StatusBadge status={payment.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No charges yet.</p>
        )}
      </section>

      {/* Actions */}
      {sub.status !== "cancelled" && (
        <div className="flex flex-wrap gap-3">
          {sub.status === "active" && (
            <Button
              variant="secondary"
              onClick={() => setPendingAction("pause")}
            >
              Pause
            </Button>
          )}
          {sub.status === "paused" && (
            <Button onClick={() => setPendingAction("resume")}>Resume</Button>
          )}
          <Button variant="danger" onClick={() => setPendingAction("cancel")}>
            Cancel subscription
          </Button>
        </div>
      )}

      {copy && (
        <ConfirmDialog
          open={pendingAction !== null}
          onOpenChange={(open) => !open && setPendingAction(null)}
          title={copy.title}
          description={copy.description}
          confirmText={copy.confirmText}
          variant={copy.danger ? "danger" : "primary"}
          loading={manage.isPending}
          onConfirm={onConfirm}
        />
      )}
    </div>
  );
}
