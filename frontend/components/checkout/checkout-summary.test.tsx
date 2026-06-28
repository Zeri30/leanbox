import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { SHIPPING_FEE } from "@/lib/checkout";
import type { Cart } from "@/lib/types/api";

const cart: Cart = {
  id: 1,
  item_count: 3,
  subtotal: "250.50",
  items: [
    {
      id: 1,
      product_id: 1,
      quantity: 2,
      unit_price: "100.00",
      line_total: "200.00",
      product: {
        id: 1,
        name: "Rainbow Buddha Bowl",
        slug: "rainbow-buddha-bowl",
        price: "100.00",
        stock_status: "in_stock",
        primary_image: null,
      },
    },
    {
      id: 2,
      product_id: 2,
      quantity: 1,
      unit_price: "50.50",
      line_total: "50.50",
      product: {
        id: 2,
        name: "Cold-Pressed Iced Tea",
        slug: "cold-pressed-iced-tea",
        price: "50.50",
        stock_status: "in_stock",
        primary_image: null,
      },
    },
  ],
};

describe("CheckoutSummary", () => {
  it("renders line items and total = subtotal + shipping", () => {
    render(
      <CheckoutSummary
        cart={cart}
        onPlaceOrder={() => {}}
        placing={false}
        disabled={false}
      />,
    );

    expect(screen.getByText("Rainbow Buddha Bowl", { exact: false })).toBeInTheDocument();
    // 250.50 + 49 = 299.50
    expect(SHIPPING_FEE).toBe(49);
    expect(screen.getByText(/299\.50/)).toBeInTheDocument();
  });

  it("disables the place-order button when disabled", () => {
    render(
      <CheckoutSummary
        cart={cart}
        onPlaceOrder={() => {}}
        placing={false}
        disabled
      />,
    );
    expect(screen.getByRole("button", { name: /place order/i })).toBeDisabled();
  });

  it("invokes onPlaceOrder when enabled and clicked", () => {
    const onPlaceOrder = vi.fn();
    render(
      <CheckoutSummary
        cart={cart}
        onPlaceOrder={onPlaceOrder}
        placing={false}
        disabled={false}
      />,
    );
    screen.getByRole("button", { name: /place order/i }).click();
    expect(onPlaceOrder).toHaveBeenCalledOnce();
  });
});
