import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Order, Pagination } from "@/lib/types/api";

export const ORDERS_QUERY_KEY = ["orders"] as const;

/** Cache key for a single order (shared with the checkout confirmation page). */
export function orderQueryKey(id: number) {
  return ["order", id] as const;
}

export interface OrdersPage {
  orders: Order[];
  pagination: Pagination | null;
}

/** The authenticated customer's order history (newest first, paginated). */
export function useOrders(page = 1) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...ORDERS_QUERY_KEY, page],
    queryFn: async (): Promise<OrdersPage> => {
      const res = await api.get<Order[]>(`/orders?page=${page}`);
      return {
        orders: res.data,
        pagination: (res.meta?.pagination as Pagination | undefined) ?? null,
      };
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

/** A single order by id (detail view). */
export function useOrder(id: number) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: orderQueryKey(id),
    queryFn: async () => (await api.get<Order>(`/orders/${id}`)).data,
    enabled: isAuthenticated && Number.isFinite(id),
  });
}

/**
 * Cancel a pending order. On success the server returns the updated (cancelled)
 * order; we seed its detail cache and invalidate the list so both reflect the
 * new status. Only valid while the order is pending (the API returns 422 otherwise).
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.patch<Order>(`/orders/${id}/cancel`)).data,
    onSuccess: (order) => {
      queryClient.setQueryData(orderQueryKey(order.id), order);
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
}
