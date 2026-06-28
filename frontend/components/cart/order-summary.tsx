import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatPHP } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Cart totals + checkout CTA. Shipping/tax are applied at checkout. */
export function OrderSummary({
  subtotal,
  itemCount,
  className,
}: {
  subtotal: string;
  itemCount: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-card p-5",
        className,
      )}
    >
      <h2 className="text-lg font-semibold">Order summary</h2>

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </dt>
          <dd className="font-medium text-foreground tabular-nums">
            {formatPHP(subtotal)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="text-muted-foreground">Calculated at checkout</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-bold text-primary tabular-nums">
          {formatPHP(subtotal)}
        </span>
      </div>

      <Button asChild className="w-full" size="lg">
        <Link href="/checkout">Proceed to checkout</Link>
      </Button>
    </div>
  );
}
