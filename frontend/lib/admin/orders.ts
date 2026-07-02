import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Order, OrderStatus, Pagination } from "@/lib/types/api";

import { ADMIN_QUERY_KEY } from "./dashboard";
import { ADMIN_DELIVERIES_KEY } from "./deliveries";

export const ADMIN_ORDERS_KEY = [...ADMIN_QUERY_KEY, "orders"] as const;

export function adminOrderKey(id: number) {
  return [...ADMIN_ORDERS_KEY, id] as const;
}

function useAdminEnabled() {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && user?.role === "admin";
}

/** Admin advances an order forward one legal step (Delivered is rider-driven). */
export type AdminOrderAction = "confirmed" | "preparing" | "shipped";

/**
 * The single legal forward status an admin may set from the current one, or null
 * when there's nothing to advance to (shipped waits on the rider; delivered /
 * cancelled are terminal). Mirrors the order lifecycle in CLAUDE.md rule 5.
 */
export function nextAdminStatus(current: OrderStatus): AdminOrderAction | null {
  switch (current) {
    case "pending":
      return "confirmed";
    case "confirmed":
      return "preparing";
    case "preparing":
      return "shipped";
    default:
      return null;
  }
}

/** Admins can cancel only while the order is still pending or confirmed. */
export function canAdminCancel(current: OrderStatus): boolean {
  return current === "pending" || current === "confirmed";
}

export interface AdminOrdersParams {
  status?: OrderStatus | "";
  search?: string;
  page?: number;
}

export interface AdminOrdersPage {
  items: Order[];
  pagination: Pagination | null;
}

function ordersQuery(params: AdminOrdersParams): string {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function useAdminOrders(params: AdminOrdersParams = {}) {
  return useQuery({
    queryKey: [...ADMIN_ORDERS_KEY, "list", params],
    queryFn: async (): Promise<AdminOrdersPage> => {
      const res = await api.get<Order[]>(`/admin/orders${ordersQuery(params)}`);
      return {
        items: res.data,
        pagination: (res.meta?.pagination as Pagination | undefined) ?? null,
      };
    },
    enabled: useAdminEnabled(),
    staleTime: 15_000,
  });
}

export function useAdminOrder(id: number) {
  return useQuery({
    queryKey: adminOrderKey(id),
    queryFn: async () => (await api.get<Order>(`/admin/orders/${id}`)).data,
    enabled: useAdminEnabled() && Number.isFinite(id),
  });
}

export function useUpdateOrderStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: AdminOrderAction) =>
      (await api.patch<Order>(`/admin/orders/${id}/status`, { status })).data,
    onSuccess: (order) => {
      qc.setQueryData(adminOrderKey(id), order);
      qc.invalidateQueries({ queryKey: ADMIN_ORDERS_KEY });
      // Confirming an order auto-creates its delivery — refresh the deliveries list.
      qc.invalidateQueries({ queryKey: ADMIN_DELIVERIES_KEY });
    },
  });
}

export function useCancelAdminOrder(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      (await api.patch<Order>(`/admin/orders/${id}/cancel`)).data,
    onSuccess: (order) => {
      qc.setQueryData(adminOrderKey(id), order);
      qc.invalidateQueries({ queryKey: ADMIN_ORDERS_KEY });
    },
  });
}
