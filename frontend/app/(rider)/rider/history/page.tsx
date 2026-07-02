"use client";

import { History } from "lucide-react";

import { DeliveryCard } from "@/components/rider/delivery-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  COMPLETED_STATUSES,
  useRiderDeliveries,
} from "@/lib/rider/deliveries";

export default function RiderHistoryPage() {
  const { data, isLoading, isError } = useRiderDeliveries();

  // API returns newest-first; keep that order for a chronological log.
  const completed = (data?.items ?? []).filter((d) =>
    COMPLETED_STATUSES.includes(d.status),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">History</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your completed and failed deliveries, most recent first.
      </p>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
        ) : isError ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Couldn&apos;t load your history. Please try again.
          </p>
        ) : completed.length === 0 ? (
          <Card className="text-center">
            <History className="mx-auto size-8 text-subtle" />
            <p className="mt-2 text-sm text-muted-foreground">
              No completed deliveries yet.
            </p>
          </Card>
        ) : (
          completed.map((d) => <DeliveryCard key={d.id} delivery={d} />)
        )}
      </div>
    </div>
  );
}
