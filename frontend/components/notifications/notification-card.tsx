"use client";

import {
  Bell,
  Package,
  Repeat,
  Tag,
  Truck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { notificationAction } from "@/lib/notifications";
import type { Notification, NotificationType } from "@/lib/types/api";
import { cn, formatRelativeTime } from "@/lib/utils";

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  order_update: Package,
  delivery_assigned: Truck,
  subscription: Repeat,
  promotion: Tag,
  new_order: Package,
  low_stock: Package,
  system: Bell,
};

/** Accent color per category, applied to the icon chip. */
function iconTone(type: NotificationType): string {
  if (type === "promotion") return "bg-accent-lime/15 text-accent-lime";
  if (type === "order_update" || type === "delivery_assigned" || type === "new_order")
    return "bg-primary-soft text-primary";
  if (type === "subscription") return "bg-info/10 text-info";
  return "bg-elevated text-muted-foreground";
}

/**
 * A single notification rendered as a card: icon, title, message, relative
 * timestamp, and a contextual action. Unread cards are visually distinct and
 * expose a "Mark as read" affordance.
 */
export function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: number) => void;
}) {
  const Icon = TYPE_ICON[notification.type] ?? Bell;
  const action = notificationAction(notification.type);
  const unread = !notification.is_read;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border p-4 transition-colors sm:gap-4",
        unread
          ? "border-primary/30 bg-primary-soft/20"
          : "border-border bg-card",
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full",
          unread ? iconTone(notification.type) : "bg-elevated text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm text-foreground",
              unread ? "font-semibold" : "font-medium",
            )}
          >
            {notification.title}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <span className="whitespace-nowrap text-xs text-subtle">
              {formatRelativeTime(notification.created_at)}
            </span>
            {unread && (
              <span
                className="size-2 rounded-full bg-primary"
                aria-label="Unread"
              />
            )}
          </div>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {notification.message}
        </p>

        {(action || unread) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {action && (
              <Button
                asChild
                size="sm"
                variant={unread ? "primary" : "secondary"}
                onClick={() => unread && onMarkRead(notification.id)}
              >
                <Link href={action.href}>{action.label}</Link>
              </Button>
            )}
            {unread && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMarkRead(notification.id)}
              >
                Mark as read
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
