"use client";

import { Bell, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { NotificationCard } from "@/components/notifications/notification-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  matchesTab,
  NOTIFICATION_TABS,
  sortByPriority,
  useMarkNotificationRead,
  useNotificationsFeed,
  useUnreadNotificationCount,
  type NotificationTab,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

const EMPTY_COPY: Record<NotificationTab, string> = {
  all: "Updates about your orders, deliveries, and subscriptions will show up here.",
  unread: "You're all caught up — no unread notifications.",
  orders: "Order and delivery updates will appear here.",
  rewards: "Rewards and loyalty updates will appear here.",
  promotions: "Promotions and offers will appear here.",
};

export default function NotificationsPage() {
  const [tab, setTab] = useState<NotificationTab>("all");
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotificationsFeed();
  const unread = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();

  const loaded = useMemo(
    () => data?.pages.flatMap((p) => p.notifications) ?? [],
    [data],
  );

  const visible = useMemo(() => {
    const inTab = loaded.filter((n) => matchesTab(n, tab));
    return tab === "all" || tab === "unread" ? sortByPriority(inTab) : inTab;
  }, [loaded, tab]);

  // Only the full chronological feed auto-loads on scroll; filtered tabs use a
  // manual "Load older" so we never scan the whole history to satisfy a filter.
  const autoLoad = tab === "all";
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autoLoad || !hasNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoLoad, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const markAllRead = () =>
    loaded.filter((n) => !n.is_read).forEach((n) => markRead.mutate(n.id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unread > 0 ? `${unread} unread` : "You're all caught up."}
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={markAllRead}
            disabled={markRead.isPending}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Notification categories"
        className="mt-5 flex gap-1 overflow-x-auto border-b border-border"
      >
        {NOTIFICATION_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.id === "unread" && unread > 0 && (
                <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <NotificationsSkeleton />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load notifications. Please refresh and try again.
          </p>
        ) : (
          <>
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
                <Bell className="size-8 text-subtle" />
                <p className="text-base font-semibold text-foreground">
                  Nothing here yet
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {EMPTY_COPY[tab]}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {visible.map((n) => (
                  <li key={n.id}>
                    <NotificationCard
                      notification={n}
                      onMarkRead={(id) => markRead.mutate(id)}
                    />
                  </li>
                ))}
              </ul>
            )}

            {/* Load older — auto on the full feed, manual on filtered tabs. */}
            {hasNextPage &&
              (autoLoad ? (
                <div
                  ref={sentinelRef}
                  className="flex justify-center py-6 text-muted-foreground"
                >
                  {isFetchingNextPage && (
                    <Loader2 className="size-5 animate-spin motion-reduce:animate-none" />
                  )}
                </div>
              ) : (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? "Loading…" : "Load older notifications"}
                  </Button>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-2xl border border-border p-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}
