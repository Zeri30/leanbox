"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { FormBanner } from "@/components/auth/field";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/auth";
import { useCancelOrder, useOrder } from "@/lib/orders";
import { formatDate, formatPHP } from "@/lib/utils";

export default function OrderDetailPage() {
  const params = useParams();
  const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const { data: order, isLoading, isError } = useOrder(id);
  const cancel = useCancelOrder();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  async function onCancel() {
    setBanner(null);
    try {
      await cancel.mutateAsync(id);
      setConfirmOpen(false);
    } catch (err) {
      setConfirmOpen(false);
      setBanner(errorMessage(err));
    }
  }

  const backLink = (
    <Link
      href="/account/orders"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to orders
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-base font-semibold text-foreground">
            Order not found
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            We couldn&apos;t find this order. It may belong to another account.
          </p>
        </div>
      </div>
    );
  }

  const canCancel = order.status === "pending";

  return (
    <div className="flex flex-col gap-6">
      {backLink}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {formatDate(order.placed_at ?? order.created_at)}
          </p>
        </div>
        <StatusBadge status={order.status} className="mt-1.5" />
      </div>

      {banner && <FormBanner>{banner}</FormBanner>}

      {/* Status timeline */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Status</h2>
        <OrderTimeline status={order.status} />
      </section>

      {/* Items + totals */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Items</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {order.items?.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="min-w-0 truncate text-muted-foreground">
                {item.product_name}
                <span className="text-subtle"> × {item.quantity}</span>
              </span>
              <span className="shrink-0 tabular-nums text-foreground">
                {formatPHP(item.line_total)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-3 flex flex-col gap-2 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatPHP(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd className="tabular-nums">{formatPHP(order.shipping_fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums text-primary">{formatPHP(order.total)}</dd>
          </div>
        </dl>
      </section>

      {canCancel && (
        <div className="flex flex-col gap-2">
          <Button
            variant="danger"
            className="self-start"
            onClick={() => setConfirmOpen(true)}
          >
            Cancel order
          </Button>
          <p className="text-xs text-muted-foreground">
            Orders can only be cancelled while still pending.
          </p>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cancel this order?"
        description="This can't be undone. The order won't be prepared or delivered."
        confirmText="Cancel order"
        cancelText="Keep order"
        variant="danger"
        loading={cancel.isPending}
        onConfirm={onCancel}
      />
    </div>
  );
}
