"use client";

import { Check, ShoppingCart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { QuantityStepper, clampQuantity } from "@/components/pdp/quantity-stepper";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAddToCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const FEEDBACK_MS = 2000;
const MAX_PER_ADD = 99;

/**
 * Quantity stepper + add-to-cart button with inline feedback. Guests are sent to
 * login (with a redirect back). On success the nav cart badge updates via the
 * shared cart query cache. Used both in the info panel and the sticky mobile bar.
 */
export function AddToCart({
  productId,
  stock,
  showFeedback = true,
  className,
}: {
  productId: number;
  stock: number;
  /** Render the inline status line (off in the compact mobile bar). */
  showFeedback?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const addToCart = useAddToCart();

  const max = Math.min(stock, MAX_PER_ADD);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const outOfStock = stock <= 0;

  const handleAdd = () => {
    setError(null);
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    // Optimistic feedback: show "Added" immediately (badge bumps via the hook),
    // and only revert if the request actually fails.
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addToCart.mutate(
      { productId, quantity: clampQuantity(qty, 1, max) },
      {
        onSuccess: () => {
          addedTimer.current = setTimeout(() => setAdded(false), FEEDBACK_MS);
        },
        onError: (e) => {
          setAdded(false);
          setError(
            e instanceof ApiRequestError
              ? e.message
              : "Couldn't add to cart. Please try again.",
          );
        },
      },
    );
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-3">
        <QuantityStepper
          value={qty}
          onChange={setQty}
          max={max || 1}
          disabled={outOfStock || addToCart.isPending}
        />
        <Button
          type="button"
          className="flex-1"
          onClick={handleAdd}
          disabled={outOfStock || addToCart.isPending}
        >
          {outOfStock ? (
            "Out of stock"
          ) : added ? (
            <>
              <Check className="size-4" /> Added
            </>
          ) : addToCart.isPending ? (
            "Adding…"
          ) : (
            <>
              <ShoppingCart className="size-4" /> Add to cart
            </>
          )}
        </Button>
      </div>

      {showFeedback && (
        <p
          aria-live="polite"
          className={cn(
            "min-h-5 text-xs",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {error ?? (added ? "Added to your cart." : "")}
        </p>
      )}
    </div>
  );
}
