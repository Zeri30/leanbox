import type { Delivery } from "@/lib/types/api";

/** Label + count of what to deliver (order line items or subscription meals). */
export function deliveryItemSummary(d: Delivery): string {
  if (d.items && d.items.length > 0) {
    const count = d.items.reduce((sum, i) => sum + i.quantity, 0);
    return `${count} item${count === 1 ? "" : "s"}`;
  }
  if (d.plan) {
    return `${d.plan.name} · ${d.plan.meals_per_cycle} meals`;
  }
  return "—";
}

/** Human reference for a delivery (order number, subscription, or delivery id). */
export function deliveryReference(d: Delivery): string {
  if (d.order?.order_number) return d.order.order_number;
  if (d.subscription_id) return `Subscription #${d.subscription_id}`;
  return `Delivery #${d.id}`;
}
