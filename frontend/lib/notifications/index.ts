import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type {
  Notification,
  NotificationType,
  Pagination,
} from "@/lib/types/api";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
export const UNREAD_COUNT_QUERY_KEY = ["notifications-unread-count"] as const;

/* ---------------------------------------------------------------------------
 * Presentation helpers — tabs, priority, and contextual actions.
 * ------------------------------------------------------------------------ */

export type NotificationTab =
  | "all"
  | "unread"
  | "orders"
  | "rewards"
  | "promotions";

export const NOTIFICATION_TABS: { id: NotificationTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "orders", label: "Orders" },
  { id: "rewards", label: "Rewards" },
  { id: "promotions", label: "Promotions" },
];

const ORDER_TYPES: NotificationType[] = [
  "order_update",
  "delivery_assigned",
  "new_order",
];

/** Whether a notification belongs under the given tab. */
export function matchesTab(n: Notification, tab: NotificationTab): boolean {
  switch (tab) {
    case "all":
      return true;
    case "unread":
      return !n.is_read;
    case "orders":
      return ORDER_TYPES.includes(n.type);
    case "promotions":
      return n.type === "promotion";
    case "rewards":
      // Leanbox has no rewards notification type yet — forward-looking tab.
      return false;
  }
}

/**
 * Display priority (lower = higher priority). Orders and account updates rank
 * above promotional messages so important items surface first.
 */
export function notificationPriority(type: NotificationType): number {
  if (ORDER_TYPES.includes(type)) return 0; // orders
  if (type === "subscription" || type === "system") return 1; // account updates
  if (type === "promotion") return 3; // promotional — lowest
  return 2;
}

/** Sort by priority, preserving the API's newest-first order within a tier. */
export function sortByPriority(notifications: Notification[]): Notification[] {
  return [...notifications].sort(
    (a, b) => notificationPriority(a.type) - notificationPriority(b.type),
  );
}

export interface NotificationAction {
  label: string;
  href: string;
}

/** Contextual action for a notification, keyed by type (null = no action). */
export function notificationAction(
  type: NotificationType,
): NotificationAction | null {
  switch (type) {
    case "order_update":
    case "delivery_assigned":
      return { label: "Track order", href: "/account/orders" };
    case "new_order":
      return { label: "View orders", href: "/account/orders" };
    case "subscription":
      return { label: "View subscription", href: "/account/subscriptions" };
    case "promotion":
      return { label: "Shop now", href: "/products" };
    default:
      return null;
  }
}

export interface NotificationsPage {
  notifications: Notification[];
  unreadCount: number;
  pagination: Pagination | null;
}

/**
 * The authenticated user's notification feed, lazily loaded 20 at a time.
 * Older notifications are fetched on demand (infinite scroll / load-more) so we
 * never pull the full history up front.
 */
export function useNotificationsFeed() {
  const { isAuthenticated } = useAuth();
  return useInfiniteQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<NotificationsPage> => {
      const res = await api.get<Notification[]>(
        `/notifications?page=${pageParam}`,
      );
      return {
        notifications: res.data,
        unreadCount: Number(res.meta?.unread_count ?? 0),
        pagination: (res.meta?.pagination as Pagination | undefined) ?? null,
      };
    },
    getNextPageParam: (lastPage) => {
      const p = lastPage.pagination;
      return p && p.current_page < p.last_page ? p.current_page + 1 : undefined;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

/**
 * Unread count for the nav bell badge (0 for guests). Hits a dedicated COUNT
 * endpoint so the badge — rendered on every page — never fetches notification
 * records just to show a number.
 */
export function useUnreadNotificationCount(): number {
  const { isAuthenticated } = useAuth();
  const { data } = useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: async () =>
      (await api.get<{ count: number }>("/notifications/unread-count")).data
        .count,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
  return data ?? 0;
}

interface MarkReadContext {
  feed?: InfiniteData<NotificationsPage>;
  count?: number;
}

/**
 * Mark a notification read. Optimistically flips is_read across every loaded
 * feed page and decrements the cached unread count (with rollback on error).
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation<Notification, Error, number, MarkReadContext>({
    mutationFn: async (id: number) =>
      (await api.patch<Notification>(`/notifications/${id}/read`)).data,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });

      const feed = queryClient.getQueryData<InfiniteData<NotificationsPage>>(
        NOTIFICATIONS_QUERY_KEY,
      );
      const count = queryClient.getQueryData<number>(UNREAD_COUNT_QUERY_KEY);

      let wasUnread = false;
      if (feed) {
        queryClient.setQueryData<InfiniteData<NotificationsPage>>(
          NOTIFICATIONS_QUERY_KEY,
          {
            ...feed,
            pages: feed.pages.map((page) => ({
              ...page,
              notifications: page.notifications.map((n) => {
                if (n.id === id && !n.is_read) {
                  wasUnread = true;
                  return { ...n, is_read: true };
                }
                return n;
              }),
            })),
          },
        );
      }

      if (wasUnread && typeof count === "number") {
        queryClient.setQueryData<number>(
          UNREAD_COUNT_QUERY_KEY,
          Math.max(0, count - 1),
        );
      }

      return { feed, count };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.feed) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, ctx.feed);
      }
      if (ctx?.count !== undefined) {
        queryClient.setQueryData(UNREAD_COUNT_QUERY_KEY, ctx.count);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
    },
  });
}
