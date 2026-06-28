import { describe, expect, it } from "vitest";

import { recomputeCart } from "@/lib/cart";
import type { Cart, CartItem } from "@/lib/types/api";

function item(id: number, unit_price: string, quantity: number): CartItem {
  return {
    id,
    product_id: id,
    quantity,
    unit_price,
    line_total: (Number(unit_price) * quantity).toFixed(2),
  };
}

const baseCart: Cart = {
  id: 1,
  items: [item(1, "100.00", 2), item(2, "50.50", 1)],
  item_count: 3,
  subtotal: "250.50",
};

describe("recomputeCart", () => {
  it("recomputes item_count and subtotal from the items list", () => {
    const next = recomputeCart(baseCart, [
      item(1, "100.00", 3),
      item(2, "50.50", 1),
    ]);
    expect(next.item_count).toBe(4);
    expect(next.subtotal).toBe("350.50");
  });

  it("handles removal down to an empty cart", () => {
    const next = recomputeCart(baseCart, []);
    expect(next.item_count).toBe(0);
    expect(next.subtotal).toBe("0.00");
  });

  it("preserves other cart fields", () => {
    const next = recomputeCart(baseCart, [item(1, "100.00", 1)]);
    expect(next.id).toBe(1);
    expect(next.items).toHaveLength(1);
    expect(next.subtotal).toBe("100.00");
  });
});
