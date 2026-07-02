"use client";

import { PackageCheck } from "lucide-react";

import { Stagger, StaggerItem } from "@/components/motion";
import { DeliveryCard } from "@/components/rider/delivery-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ACTIVE_STATUSES,
  STATUS_ORDER,
  useRiderDeliveries,
} from "@/lib/rider/deliveries";

export default function RiderDeliveriesPage() {
  const { data, isLoading, isError } = useRiderDeliveries();

  const active = (data?.items ?? [])
    .filter((d) => ACTIVE_STATUSES.includes(d.status))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">My deliveries</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your active deliveries, most urgent first.
      </p>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
        ) : isError ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Couldn&apos;t load your deliveries. Pull to refresh.
          </p>
        ) : active.length === 0 ? (
          <Card className="text-center">
            <PackageCheck className="mx-auto size-8 text-primary" />
            <p className="mt-2 text-sm font-medium text-foreground">
              All caught up!
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              No active deliveries right now. Check History for past ones.
            </p>
          </Card>
        ) : (
          <Stagger className="space-y-3">
            {active.map((d) => (
              <StaggerItem key={d.id}>
                <DeliveryCard delivery={d} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </div>
  );
}
