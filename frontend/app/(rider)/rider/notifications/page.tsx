"use client";

import { Bell, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { NotificationCard } from "@/components/notifications/notification-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  sortByPriority,
  useMarkNotificationRead,
  useNotificationsFeed,
  useUnreadNotificationCount,
  type NotificationAction,
} from "@/lib/notifications";
import type { NotificationType } from "@/lib/types/api";
import { cn } from "@/lib/utils";

type Tab = "all" | "unread";

/** Rider-scoped notification actions — only ever links within /rider. */
function riderNotificationAction(type: NotificationType): NotificationAction | null {
  if (type === "delivery_assigned") {
    return { label: "View delivery", href: "/rider" };
  }
  return null;
}

export default function RiderNotificationsPage() {
  const [tab, setTab] = useState<Tab>("all");
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
    const inTab = tab === "unread" ? loaded.filter((n) => !n.is_read) : loaded;
    return sortByPriority(inTab);
  }, [loaded, tab]);

  const markAllRead = () =>
    loaded.filter((n) => !n.is_read).forEach((n) => markRead.mutate(n.id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
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
            Mark all read
          </Button>
        )}
      </div>

      <div role="tablist" className="mt-5 flex gap-1 border-b border-border">
        {(["all", "unread"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
              {t === "unread" && unread > 0 && (
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
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load alerts. Please refresh and try again.
          </p>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
            <Bell className="size-8 text-subtle" />
            <p className="text-base font-semibold text-foreground">Nothing here yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Delivery assignments and updates will show up here.
            </p>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {visible.map((n) => (
                <li key={n.id}>
                  <NotificationCard
                    notification={n}
                    onMarkRead={(id) => markRead.mutate(id)}
                    resolveAction={riderNotificationAction}
                  />
                </li>
              ))}
            </ul>
            {tab === "all" && hasNextPage && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
                  ) : (
                    "Load older"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
