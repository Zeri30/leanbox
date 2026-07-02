import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type {
  Delivery,
  DeliveryStatus,
  Pagination,
  User,
} from "@/lib/types/api";

import { ADMIN_QUERY_KEY } from "./dashboard";

export const ADMIN_DELIVERIES_KEY = [...ADMIN_QUERY_KEY, "deliveries"] as const;
export const ADMIN_RIDERS_KEY = [...ADMIN_QUERY_KEY, "riders"] as const;

function useAdminEnabled() {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && user?.role === "admin";
}

export interface AdminDeliveriesParams {
  status?: DeliveryStatus | "";
  riderId?: number;
  page?: number;
}

export interface AdminDeliveriesPage {
  items: Delivery[];
  pagination: Pagination | null;
}

function deliveriesQuery(params: AdminDeliveriesParams): string {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.riderId) qs.set("rider_id", String(params.riderId));
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function useAdminDeliveries(params: AdminDeliveriesParams = {}) {
  return useQuery({
    queryKey: [...ADMIN_DELIVERIES_KEY, "list", params],
    queryFn: async (): Promise<AdminDeliveriesPage> => {
      const res = await api.get<Delivery[]>(
        `/admin/deliveries${deliveriesQuery(params)}`,
      );
      return {
        items: res.data,
        pagination: (res.meta?.pagination as Pagination | undefined) ?? null,
      };
    },
    enabled: useAdminEnabled(),
    staleTime: 15_000,
  });
}

/** Active riders for the assignment picker. */
export function useRiders() {
  return useQuery({
    queryKey: [...ADMIN_RIDERS_KEY, "list"],
    queryFn: async () => (await api.get<User[]>("/admin/riders")).data,
    enabled: useAdminEnabled(),
    staleTime: 60_000,
  });
}

/** Assign (or reassign) a rider to a delivery. */
export function useAssignDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      deliveryId,
      riderId,
    }: {
      deliveryId: number;
      riderId: number;
    }) =>
      (
        await api.post<Delivery>(`/admin/deliveries/${deliveryId}/assign`, {
          rider_id: riderId,
        })
      ).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_DELIVERIES_KEY }),
  });
}

/** Mark a delivery failed. */
export function useFailDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deliveryId: number) =>
      (await api.patch<Delivery>(`/admin/deliveries/${deliveryId}`, { status: "failed" }))
        .data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_DELIVERIES_KEY }),
  });
}
