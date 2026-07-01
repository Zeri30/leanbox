import { describe, expect, it } from "vitest";

import {
  matchesTab,
  notificationAction,
  notificationPriority,
  sortByPriority,
} from "@/lib/notifications";
import type { Notification, NotificationType } from "@/lib/types/api";

function make(
  type: NotificationType,
  is_read = false,
  id = 1,
): Notification {
  return {
    id,
    type,
    title: "t",
    message: "m",
    is_read,
    created_at: "2026-07-01T00:00:00Z",
  };
}

describe("matchesTab", () => {
  it("all matches everything; unread matches only unread", () => {
    expect(matchesTab(make("promotion", true), "all")).toBe(true);
    expect(matchesTab(make("promotion", false), "unread")).toBe(true);
    expect(matchesTab(make("promotion", true), "unread")).toBe(false);
  });

  it("orders tab includes order + delivery types", () => {
    expect(matchesTab(make("order_update"), "orders")).toBe(true);
    expect(matchesTab(make("delivery_assigned"), "orders")).toBe(true);
    expect(matchesTab(make("promotion"), "orders")).toBe(false);
  });

  it("promotions tab includes only promotions; rewards is empty for now", () => {
    expect(matchesTab(make("promotion"), "promotions")).toBe(true);
    expect(matchesTab(make("order_update"), "promotions")).toBe(false);
    expect(matchesTab(make("promotion"), "rewards")).toBe(false);
  });
});

describe("notificationPriority + sortByPriority", () => {
  it("ranks orders and account updates above promotions", () => {
    expect(notificationPriority("order_update")).toBeLessThan(
      notificationPriority("subscription"),
    );
    expect(notificationPriority("subscription")).toBeLessThan(
      notificationPriority("promotion"),
    );
  });

  it("sorts a mixed list with orders first and promotions last", () => {
    const sorted = sortByPriority([
      make("promotion", false, 1),
      make("order_update", false, 2),
      make("system", false, 3),
    ]);
    expect(sorted.map((n) => n.id)).toEqual([2, 3, 1]);
  });
});

describe("notificationAction", () => {
  it("maps types to contextual actions", () => {
    expect(notificationAction("order_update")?.label).toBe("Track order");
    expect(notificationAction("promotion")?.href).toBe("/products");
    expect(notificationAction("system")).toBeNull();
  });
});
