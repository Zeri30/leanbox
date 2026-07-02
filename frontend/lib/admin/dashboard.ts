import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type {
  BestSeller,
  DashboardSummary,
  Order,
  Pagination,
  Product,
  RevenuePoint,
} from "@/lib/types/api";

export const ADMIN_QUERY_KEY = ["admin"] as const;

/** Shared gate: admin analytics queries only run for an authenticated admin. */
function useAdminEnabled() {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && user?.role === "admin";
}

/** KPI totals for the dashboard cards (cached ~60s server-side too). */
export function useDashboardSummary() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEY, "summary"],
    queryFn: async () =>
      (await api.get<DashboardSummary>("/admin/dashboard/summary")).data,
    enabled: useAdminEnabled(),
    staleTime: 30_000,
  });
}

/** Daily revenue series for the chart (default 30 days, clamped 7–90 by the API). */
export function useRevenueSeries(days = 30) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEY, "revenue", days],
    queryFn: async () =>
      (await api.get<RevenuePoint[]>(`/admin/analytics/revenue?days=${days}`))
        .data,
    enabled: useAdminEnabled(),
    staleTime: 30_000,
  });
}

/** Best-selling products (units + revenue), ranked. */
export function useBestSellers() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEY, "best-sellers"],
    queryFn: async () =>
      (await api.get<BestSeller[]>("/admin/analytics/best-sellers")).data,
    enabled: useAdminEnabled(),
    staleTime: 30_000,
  });
}

/** Active products at/below their low-stock threshold (first page only for the panel). */
export function useLowStock() {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEY, "low-stock"],
    queryFn: async () =>
      (await api.get<Product[]>("/admin/inventory/low-stock")).data,
    enabled: useAdminEnabled(),
    staleTime: 30_000,
  });
}

export interface RecentOrders {
  orders: Order[];
  pagination: Pagination | null;
}

/** Most recent orders (newest first) for the dashboard activity panel. */
export function useRecentOrders(limit = 6) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEY, "recent-orders", limit],
    queryFn: async (): Promise<RecentOrders> => {
      const res = await api.get<Order[]>("/admin/orders");
      return {
        orders: res.data.slice(0, limit),
        pagination: (res.meta?.pagination as Pagination | undefined) ?? null,
      };
    },
    enabled: useAdminEnabled(),
    staleTime: 30_000,
  });
}
