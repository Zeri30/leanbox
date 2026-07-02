"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  canAdminCancel,
  nextAdminStatus,
  useAdminOrder,
  useCancelAdminOrder,
  useUpdateOrderStatus,
} from "@/lib/admin/orders";
import { formatDate, formatPHP } from "@/lib/utils";

const NEXT_LABEL: Record<string, string> = {
  confirmed: "Confirm order",
  preparing: "Mark as preparing",
  shipped: "Mark as shipped",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const { toast } = useToast();

  const { data: order, isLoading, isError } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus(id);
  const cancel = useCancelAdminOrder(id);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const next = order ? nextAdminStatus(order.status) : null;
  const cancellable = order ? canAdminCancel(order.status) : false;

  async function advance() {
    if (!next) return;
    try {
      await updateStatus.mutateAsync(next);
      toast("Order status updated.", "success");
    } catch {
      toast("Couldn't update the status. That transition may not be allowed.", "error");
    }
  }

  async function doCancel() {
    try {
      await cancel.mutateAsync();
      toast("Order cancelled.", "success");
    } catch {
      toast("Couldn't cancel this order.", "error");
    } finally {
      setConfirmCancel(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to orders
      </Link>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : isError || !order ? (
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load this order.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {order.order_number}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {order.customer?.full_name ?? "Customer"}
                {order.customer?.email ? ` · ${order.customer.email}` : ""} ·{" "}
                {formatDate(order.placed_at ?? order.created_at)}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Lifecycle */}
          <Card>
            <CardHeader className="mb-4">
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <OrderTimeline status={order.status} />
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader className="mb-3">
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            {order.status === "shipped" ? (
              <p className="text-sm text-muted-foreground">
                Waiting for the rider to mark this <strong>Delivered</strong> — that
                step is rider-driven and can&apos;t be set here.
              </p>
            ) : next ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={advance} disabled={updateStatus.isPending}>
                  {updateStatus.isPending ? "Updating…" : NEXT_LABEL[next]}
                </Button>
                {cancellable && (
                  <Button
                    variant="danger"
                    onClick={() => setConfirmCancel(true)}
                    disabled={cancel.isPending}
                  >
                    Cancel order
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This order is {order.status} — no further action.
              </p>
            )}
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="mb-3">
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <ul className="divide-y divide-border">
              {(order.items ?? []).map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm text-foreground">
                    {it.product_name}
                    <span className="text-muted-foreground"> × {it.quantity}</span>
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatPHP(it.line_total)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <Row label="Subtotal" value={formatPHP(order.subtotal)} />
              <Row label="Shipping" value={formatPHP(order.shipping_fee)} />
              <Row label="Tax" value={formatPHP(order.tax)} />
              <Row label="Total" value={formatPHP(order.total)} strong />
            </div>
          </Card>

          <ConfirmDialog
            open={confirmCancel}
            onOpenChange={setConfirmCancel}
            title={`Cancel ${order.order_number}?`}
            description="This releases the order and returns stock. Only allowed while pending or confirmed."
            confirmText="Cancel order"
            variant="danger"
            loading={cancel.isPending}
            onConfirm={doCancel}
          />
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-semibold text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={strong ? "font-semibold text-foreground" : "text-foreground"}>
        {value}
      </span>
    </div>
  );
}
