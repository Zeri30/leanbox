"use client";

import { AlertTriangle, Package, TrendingUp } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BestSeller, Order, Product } from "@/lib/types/api";
import { formatDate, formatPHP } from "@/lib/utils";

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

/** Newest orders with status + total. */
export function RecentOrdersPanel({
  orders,
  loading,
}: {
  orders: Order[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="mb-3 flex-row items-center justify-between">
        <CardTitle>Recent orders</CardTitle>
        <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      {loading ? (
        <PanelSkeleton />
      ) : orders.length === 0 ? (
        <EmptyRow>No orders yet.</EmptyRow>
      ) : (
        <ul className="divide-y divide-border">
          {orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {o.order_number}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(o.placed_at ?? o.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-foreground">
                  {formatPHP(o.total)}
                </span>
                <StatusBadge status={o.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Active products at/below their low-stock threshold. */
export function LowStockPanel({
  products,
  loading,
}: {
  products: Product[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="mb-3 flex-row items-center gap-2">
        <AlertTriangle className="size-4 text-warning" />
        <CardTitle>Low stock</CardTitle>
      </CardHeader>
      {loading ? (
        <PanelSkeleton />
      ) : products.length === 0 ? (
        <EmptyRow>Everything is well stocked. 🎉</EmptyRow>
      ) : (
        <ul className="divide-y divide-border">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <Link
                href={`/admin/products/${p.id}/edit`}
                className="min-w-0 truncate text-sm font-medium text-foreground hover:text-primary"
              >
                {p.name}
              </Link>
              <span className="flex items-center gap-1.5 text-sm">
                <Package className="size-3.5 text-muted-foreground" />
                <span
                  className={
                    p.stock_quantity === 0 ? "font-semibold text-destructive" : "text-warning"
                  }
                >
                  {p.stock_quantity} left
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Best-selling products by units sold. */
export function BestSellersPanel({
  items,
  loading,
}: {
  items: BestSeller[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="mb-3 flex-row items-center gap-2">
        <TrendingUp className="size-4 text-primary" />
        <CardTitle>Best sellers</CardTitle>
      </CardHeader>
      {loading ? (
        <PanelSkeleton />
      ) : items.length === 0 ? (
        <EmptyRow>No sales recorded yet.</EmptyRow>
      ) : (
        <ol className="divide-y divide-border">
          {items.map((it, i) => (
            <li key={it.product_id} className="flex items-center gap-3 py-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-elevated text-xs font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {it.name ?? "Unknown product"}
              </span>
              <span className="text-xs text-muted-foreground">{it.units} sold</span>
              <span className="w-24 text-right text-sm font-semibold text-foreground">
                {formatPHP(it.revenue)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
