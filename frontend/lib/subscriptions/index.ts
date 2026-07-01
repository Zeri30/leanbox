import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type {
  BillingInterval,
  DeliverySchedule,
  MealType,
  Pagination,
  Subscription,
  SubscriptionAction,
  SubscriptionPlan,
} from "@/lib/types/api";

/** Selectable delivery cadences (App\Enums\DeliverySchedule), in display order. */
export const DELIVERY_SCHEDULES: DeliverySchedule[] = [
  "daily",
  "weekly",
  "biweekly",
];

export const SUBSCRIPTIONS_QUERY_KEY = ["subscriptions"] as const;

/** Human labels for the delivery cadence. */
export const DELIVERY_SCHEDULE_LABEL: Record<DeliverySchedule, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
};

/** Per-cycle noun for a plan's billing interval (e.g. "₱1,499 / week"). */
export const BILLING_INTERVAL_LABEL: Record<BillingInterval, string> = {
  weekly: "week",
  monthly: "month",
};

/** Human labels for a plan's meal focus. */
export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  vegetarian: "Vegetarian",
  high_protein: "High-protein",
  mixed: "Mixed",
};

/** Cache key for a single subscription. */
export function subscriptionQueryKey(id: number) {
  return ["subscription", id] as const;
}

export interface SubscriptionsPage {
  subscriptions: Subscription[];
  pagination: Pagination | null;
}

/** The authenticated customer's subscriptions (newest first, paginated). */
export function useSubscriptions(page = 1) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...SUBSCRIPTIONS_QUERY_KEY, page],
    queryFn: async (): Promise<SubscriptionsPage> => {
      const res = await api.get<Subscription[]>(`/subscriptions?page=${page}`);
      return {
        subscriptions: res.data,
        pagination: (res.meta?.pagination as Pagination | undefined) ?? null,
      };
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

/** A single subscription by id (manage view). */
export function useSubscription(id: number) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: subscriptionQueryKey(id),
    queryFn: async () =>
      (await api.get<Subscription>(`/subscriptions/${id}`)).data,
    enabled: isAuthenticated && Number.isFinite(id),
  });
}

/**
 * Pause / resume / cancel a subscription. The server enforces valid transitions
 * (e.g. pause only from active) and returns the updated subscription; we seed its
 * detail cache and refresh the list. The 422 for an invalid action surfaces to
 * the caller so the UI can show a message.
 */
export function useManageSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: number;
      action: SubscriptionAction;
    }) =>
      (
        await api.patch<Subscription>(`/subscriptions/${id}`, { action })
      ).data,
    onSuccess: (subscription) => {
      queryClient.setQueryData(
        subscriptionQueryKey(subscription.id),
        subscription,
      );
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY });
    },
  });
}

export const PLANS_QUERY_KEY = ["plans"] as const;

/** Active subscription plans (public list, price-ascending). */
export function usePlans() {
  return useQuery({
    queryKey: PLANS_QUERY_KEY,
    queryFn: async () => (await api.get<SubscriptionPlan[]>("/plans")).data,
    staleTime: 5 * 60_000,
  });
}

/**
 * A single plan by id, resolved from the plans list (there's no GET /plans/{id}).
 * Returns { plan, isLoading, isError } so the subscribe page can render states.
 */
export function usePlan(id: number) {
  const { data, isLoading, isError } = usePlans();
  return {
    plan: data?.find((p) => p.id === id) ?? null,
    isLoading,
    isError,
  };
}

export interface SubscribeVars {
  planId: number;
  deliveryAddressId: number;
  deliverySchedule: DeliverySchedule;
}

/**
 * Subscribe to a plan (creates an active subscription + first COD cycle). Seeds
 * the new subscription's detail cache and refreshes the list so it shows up in
 * Account → Subscriptions immediately.
 */
export function useSubscribe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      planId,
      deliveryAddressId,
      deliverySchedule,
    }: SubscribeVars) =>
      (
        await api.post<Subscription>(
          "/subscriptions",
          {
            plan_id: planId,
            delivery_address_id: deliveryAddressId,
            delivery_schedule: deliverySchedule,
          },
          // Subscribe runs a multi-insert transaction; give the DB headroom.
          { timeoutMs: 30_000 },
        )
      ).data,
    onSuccess: (subscription) => {
      queryClient.setQueryData(
        subscriptionQueryKey(subscription.id),
        subscription,
      );
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY });
    },
  });
}
