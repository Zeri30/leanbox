import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type {
  BillingInterval,
  MealType,
  Pagination,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/types/api";

import { ADMIN_QUERY_KEY } from "./dashboard";

export const ADMIN_SUBSCRIPTIONS_KEY = [
  ...ADMIN_QUERY_KEY,
  "subscriptions",
] as const;
export const ADMIN_PLANS_KEY = [...ADMIN_QUERY_KEY, "plans"] as const;

function useAdminEnabled() {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && user?.role === "admin";
}

/* --------------------------------- Plans --------------------------------- */

export interface PlanPayload {
  name: string;
  description?: string | null;
  meal_type: MealType;
  price: number;
  billing_interval: BillingInterval;
  meals_per_cycle: number;
  is_active?: boolean;
}

export function useAdminPlans() {
  return useQuery({
    queryKey: [...ADMIN_PLANS_KEY, "list"],
    queryFn: async () =>
      (await api.get<SubscriptionPlan[]>("/admin/plans")).data,
    enabled: useAdminEnabled(),
    staleTime: 30_000,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PlanPayload) =>
      (await api.post<SubscriptionPlan>("/admin/plans", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_PLANS_KEY }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<PlanPayload> & { id: number }) =>
      (await api.patch<SubscriptionPlan>(`/admin/plans/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_PLANS_KEY }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.delete<{ message: string }>(`/admin/plans/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_PLANS_KEY }),
  });
}

/* ----------------------------- Subscriptions ----------------------------- */

export interface AdminSubscriptionsParams {
  status?: SubscriptionStatus | "";
  search?: string;
  page?: number;
}

export interface AdminSubscriptionsPage {
  items: Subscription[];
  pagination: Pagination | null;
}

function subsQuery(params: AdminSubscriptionsParams): string {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function useAdminSubscriptions(params: AdminSubscriptionsParams = {}) {
  return useQuery({
    queryKey: [...ADMIN_SUBSCRIPTIONS_KEY, "list", params],
    queryFn: async (): Promise<AdminSubscriptionsPage> => {
      const res = await api.get<Subscription[]>(
        `/admin/subscriptions${subsQuery(params)}`,
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
