"use client";

import { Button } from "@/components/ui/button";
import { SHIPPING_FEE } from "@/lib/checkout";
import { errorMessage } from "@/lib/auth";
import type { Cart } from "@/lib/types/api";
import { cn, formatPHP } from "@/lib/utils";

export function CheckoutSummary({
  cart,
  onPlaceOrder,
  placing,
  disabled,
  error,
  className,
}: {
  cart: Cart;
  onPlaceOrder: () => void;
  placing: boolean;
  disabled: boolean;
  error?: unknown;
  className?: string;
}) {
  const subtotal = Number(cart.subtotal);
  const total = subtotal + SHIPPING_FEE;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-card p-5",
        className,
      )}
    >
      <h2 className="text-lg font-semibold">Order summary</h2>

      <ul className="flex flex-col gap-2 text-sm">
        {cart.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate text-muted-foreground">
              {item.product?.name ?? "Item"}
              <span className="text-subtle"> × {item.quantity}</span>
            </span>
            <span className="shrink-0 tabular-nums text-foreground">
              {formatPHP(item.line_total)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="flex flex-col gap-2 border-t border-border pt-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums text-foreground">{formatPHP(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="tabular-nums text-foreground">{formatPHP(SHIPPING_FEE)}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-bold text-primary tabular-nums">
          {formatPHP(total)}
        </span>
      </div>

      {error != null && (
        <p className="text-sm text-destructive">{errorMessage(error)}</p>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={onPlaceOrder}
        disabled={disabled || placing}
      >
        {placing ? "Placing order…" : "Place order"}
      </Button>
      <p className="text-center text-xs text-subtle">
        You won&apos;t be charged online — Cash on Delivery.
      </p>
    </div>
  );
}
