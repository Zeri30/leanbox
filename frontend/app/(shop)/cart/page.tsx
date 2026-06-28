"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";

import { RequireAuth } from "@/components/auth/require-auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart";
import { formatPHP } from "@/lib/utils";

export default function CartPage() {
  return (
    <RequireAuth>
      <CartContent />
    </RequireAuth>
  );
}

function CartContent() {
  const { data: cart, isLoading, isError } = useCart();

  const isEmpty = !isLoading && !isError && (!cart || cart.items.length === 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-28 md:pb-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
      <h1 className="mb-6 text-3xl font-bold">Your cart</h1>

      {isLoading ? (
        <CartSkeleton />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load your cart. Please refresh and try again.
        </p>
      ) : isEmpty ? (
        <EmptyCart />
      ) : (
        cart && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ul className="divide-y divide-border">
                {cart.items.map((item) => (
                  <li key={item.id}>
                    <CartLineItem item={item} />
                  </li>
                ))}
              </ul>
            </div>

            {/* Desktop summary; mobile uses the sticky bar below. */}
            <OrderSummary
              subtotal={cart.subtotal}
              itemCount={cart.item_count}
              className="hidden h-fit lg:sticky lg:top-20 lg:block"
            />

            {/* Sticky mobile checkout bar — above the bottom tab bar. */}
            <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden">
              <div className="mx-auto flex max-w-7xl items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    {formatPHP(cart.subtotal)}
                  </span>
                </div>
                <Button asChild className="flex-1" size="lg">
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </div>
          </div>
        )
      )}
    </main>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
      <ShoppingCart className="size-8 text-subtle" />
      <p className="text-base font-semibold text-foreground">
        Your cart is empty
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Browse the catalog and add a few healthy picks to get started.
      </p>
      <Button asChild className="mt-1">
        <Link href="/products">Browse products</Link>
      </Button>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-border py-4">
            <Skeleton className="size-20 shrink-0 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="hidden h-56 rounded-2xl lg:block" />
    </div>
  );
}
