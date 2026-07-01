"use client";

import { CalendarClock, Repeat } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BILLING_INTERVAL_LABEL,
  useSubscriptions,
} from "@/lib/subscriptions";
import { formatDate, formatPHP } from "@/lib/utils";

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useSubscriptions(page);

  const subscriptions = data?.subscriptions ?? [];
  const pagination = data?.pagination ?? null;
  const isEmpty = !isLoading && !isError && subscriptions.length === 0;

  return (
    <div>
      <h1 className="text-2xl font-bold">Subscriptions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your recurring meal-prep plans.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <SubscriptionsSkeleton />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load your subscriptions. Please refresh and try again.
          </p>
        ) : isEmpty ? (
          <EmptySubscriptions />
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {subscriptions.map((sub) => (
                <li key={sub.id}>
                  <Link
                    href={`/account/subscriptions/${sub.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-border-strong"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {sub.plan?.name ?? "Subscription"}
                      </p>
                      {sub.plan && (
                        <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                          {formatPHP(sub.plan.price)} /{" "}
                          {BILLING_INTERVAL_LABEL[sub.plan.billing_interval]}
                        </p>
                      )}
                      {sub.status === "active" && sub.next_delivery_date && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarClock className="size-3.5" />
                          Next delivery {formatDate(sub.next_delivery_date)}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={sub.status} className="mt-1 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>

            {pagination && pagination.last_page > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= pagination.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptySubscriptions() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
      <Repeat className="size-8 text-subtle" />
      <p className="text-base font-semibold text-foreground">
        No subscriptions yet
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Subscribe to a meal-prep plan to get fresh meals delivered on a schedule.
      </p>
    </div>
  );
}

function SubscriptionsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
        >
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
