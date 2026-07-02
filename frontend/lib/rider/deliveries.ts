import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Delivery, DeliveryStatus, Pagination } from "@/lib/types/api";

export const RIDER_DELIVERIES_KEY = ["rider", "deliveries"] as const;

export function riderDeliveryKey(id: number) {
  return [...RIDER_DELIVERIES_KEY, id] as const;
}

function useRiderEnabled() {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && user?.role === "rider";
}

export interface RiderDeliveriesPage {
  items: Delivery[];
  pagination: Pagination | null;
}

/** Deliveries still needing rider action (the work queue). */
export const ACTIVE_STATUSES: DeliveryStatus[] = [
  "out_for_delivery",
  "assigned",
  "pending",
];

/** Completed deliveries (for history). */
export const COMPLETED_STATUSES: DeliveryStatus[] = ["delivered", "failed"];

/** Sort active work so the most urgent floats to the top. */
export const STATUS_ORDER: Record<DeliveryStatus, number> = {
  out_for_delivery: 0,
  assigned: 1,
  pending: 2,
  failed: 3,
  delivered: 4,
};

/** The rider's deliveries in API order (newest first). Split by status in the UI. */
export function useRiderDeliveries() {
  return useQuery({
    queryKey: [...RIDER_DELIVERIES_KEY, "list"],
    queryFn: async (): Promise<RiderDeliveriesPage> => {
      const res = await api.get<Delivery[]>("/rider/deliveries");
      return {
        items: res.data,
        pagination: (res.meta?.pagination as Pagination | undefined) ?? null,
      };
    },
    enabled: useRiderEnabled(),
    staleTime: 15_000,
  });
}

export function useRiderDelivery(id: number) {
  return useQuery({
    queryKey: riderDeliveryKey(id),
    queryFn: async () => (await api.get<Delivery>(`/rider/deliveries/${id}`)).data,
    enabled: useRiderEnabled() && Number.isFinite(id),
  });
}

/** Rider status transitions: out_for_delivery, delivered, failed. */
export type RiderStatusAction = "out_for_delivery" | "delivered" | "failed";

export function useUpdateRiderDeliveryStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: RiderStatusAction) =>
      (await api.patch<Delivery>(`/rider/deliveries/${id}/status`, { status })).data,
    onSuccess: (delivery) => {
      qc.setQueryData(riderDeliveryKey(id), delivery);
      qc.invalidateQueries({ queryKey: RIDER_DELIVERIES_KEY });
    },
  });
}

export interface ProofVars {
  file: File;
  notes?: string;
}

export function useUploadRiderProof(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, notes }: ProofVars) => {
      const form = new FormData();
      form.append("image", file);
      if (notes) form.append("notes", notes);
      return (await api.upload<Delivery>(`/rider/deliveries/${id}/proof`, form)).data;
    },
    onSuccess: (delivery) => {
      qc.setQueryData(riderDeliveryKey(id), delivery);
      qc.invalidateQueries({ queryKey: RIDER_DELIVERIES_KEY });
    },
  });
}
