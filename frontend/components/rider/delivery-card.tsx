import { ChevronRight, MapPin, Package } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { deliveryItemSummary, deliveryReference } from "@/lib/rider/format";
import type { Delivery } from "@/lib/types/api";

/** Tappable delivery summary card shared by the Deliveries and History lists. */
export function DeliveryCard({ delivery }: { delivery: Delivery }) {
  return (
    <Link href={`/rider/deliveries/${delivery.id}`} className="block">
      <Card className="flex items-center gap-3 transition-colors hover:border-primary active:scale-[0.99] motion-reduce:active:scale-100">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-foreground">
              {deliveryReference(delivery)}
            </span>
            <StatusBadge status={delivery.status} />
          </div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">
              {delivery.address
                ? `${delivery.address.recipient_name} · ${delivery.address.city}`
                : "Address unavailable"}
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Package className="size-4 shrink-0" />
            {deliveryItemSummary(delivery)}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-subtle" />
      </Card>
    </Link>
  );
}
