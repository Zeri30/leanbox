"use client";

import { Package } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/lib/orders";
import { formatDate, formatPHP } from "@/lib/utils";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useOrders(page);

  const orders = data?.orders ?? [];
  const pagination = data?.pagination ?? null;
  const isEmpty = !isLoading && !isError && orders.length === 0;

  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track and review your past orders.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <OrdersSkeleton />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load your orders. Please refresh and try again.
          </p>
        ) : isEmpty ? (
          <EmptyOrders />
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-border-strong"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {order.order_number}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatDate(order.placed_at ?? order.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusBadge status={order.status} />
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatPHP(order.total)}
                      </span>
                    </div>
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

function EmptyOrders() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
      <Package className="size-8 text-subtle" />
      <p className="text-base font-semibold text-foreground">No orders yet</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        When you place an order, it&apos;ll show up here so you can track it.
      </p>
      <Button asChild className="mt-1">
        <Link href="/products">Browse products</Link>
      </Button>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
        >
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
