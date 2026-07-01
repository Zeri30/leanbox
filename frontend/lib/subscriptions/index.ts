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
} from "@/lib/types/api";

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
