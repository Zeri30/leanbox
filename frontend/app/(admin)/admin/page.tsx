"use client";

import { CalendarClock, Package, ShoppingBag, Wallet } from "lucide-react";

import {
  BestSellersPanel,
  LowStockPanel,
  RecentOrdersPanel,
} from "@/components/admin/dashboard-panels";
import { KpiCard } from "@/components/admin/kpi-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBestSellers,
  useDashboardSummary,
  useLowStock,
  useRecentOrders,
  useRevenueSeries,
} from "@/lib/admin/dashboard";
import { formatPHP } from "@/lib/utils";

export default function AdminDashboardPage() {
  const summary = useDashboardSummary();
  const revenue = useRevenueSeries(30);
  const bestSellers = useBestSellers();
  const lowStock = useLowStock();
  const recentOrders = useRecentOrders(6);

  const s = summary.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live overview of your store&apos;s performance.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active products"
          value={s?.products ?? 0}
          icon={Package}
          loading={summary.isLoading}
        />
        <KpiCard
          label="Total orders"
          value={s?.orders ?? 0}
          icon={ShoppingBag}
          loading={summary.isLoading}
        />
        <KpiCard
          label="Active subscriptions"
          value={s?.active_subscriptions ?? 0}
          icon={CalendarClock}
          loading={summary.isLoading}
        />
        <KpiCard
          label="Revenue"
          value={s ? formatPHP(s.revenue) : "—"}
          icon={Wallet}
          loading={summary.isLoading}
        />
      </div>

      {/* Revenue chart + best sellers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="mb-4 flex-row items-center justify-between">
            <CardTitle>Revenue — last 30 days</CardTitle>
            {summary.data && (
              <span className="text-sm text-muted-foreground">
                Total {formatPHP(summary.data.revenue)}
              </span>
            )}
          </CardHeader>
          {revenue.isLoading ? (
            <Skeleton className="h-60 w-full" />
          ) : revenue.isError ? (
            <div className="grid h-60 place-items-center text-sm text-muted-foreground">
              Couldn&apos;t load revenue data.
            </div>
          ) : (
            <RevenueChart data={revenue.data ?? []} />
          )}
        </Card>

        <BestSellersPanel
          items={bestSellers.data ?? []}
          loading={bestSellers.isLoading}
        />
      </div>

      {/* Recent orders + low stock */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentOrdersPanel
          orders={recentOrders.data?.orders ?? []}
          loading={recentOrders.isLoading}
        />
        <LowStockPanel
          products={lowStock.data ?? []}
          loading={lowStock.isLoading}
        />
      </div>
    </div>
  );
}
