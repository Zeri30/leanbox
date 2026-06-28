"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AddressStep } from "@/components/checkout/address-step";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { PaymentStep } from "@/components/checkout/payment-step";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart";
import { useAddresses, usePlaceOrder } from "@/lib/checkout";
import type { PaymentMethod } from "@/lib/types/api";

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutContent />
    </RequireAuth>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <span className="grid size-7 place-items-center rounded-full bg-primary-soft text-sm text-primary">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const placeOrder = usePlaceOrder();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  // Derive the effective selection: the user's explicit pick, else their
  // default (or first) saved address. Avoids syncing state in an effect.
  const defaultAddressId =
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null;
  const effectiveAddressId = selectedAddressId ?? defaultAddressId;

  const handlePlaceOrder = () => {
    if (effectiveAddressId === null) return;
    placeOrder.mutate(
      { deliveryAddressId: effectiveAddressId, paymentMethod },
      { onSuccess: (order) => router.push(`/checkout/success/${order.id}`) },
    );
  };

  // Keep the page steady through the place-order → redirect transition.
  const finishing = placeOrder.isPending || placeOrder.isSuccess;

  if (cartLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-6 h-9 w-40" />
        <Skeleton className="h-80 rounded-2xl" />
      </main>
    );
  }

  if ((!cart || cart.items.length === 0) && !finishing) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Checkout" }]} />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="text-base font-semibold text-foreground">
            Your cart is empty
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add a few items before checking out.
          </p>
          <Button asChild className="mt-1">
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!cart) return null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cart", href: "/cart" },
          { label: "Checkout" },
        ]}
      />
      <h1 className="mb-6 text-3xl font-bold">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-10 lg:col-span-2">
          <Section step={1} title="Delivery address">
            <AddressStep
              addresses={addresses}
              isLoading={addressesLoading}
              selectedId={effectiveAddressId}
              onSelect={setSelectedAddressId}
            />
          </Section>

          <Section step={2} title="Payment method">
            <PaymentStep value={paymentMethod} onChange={setPaymentMethod} />
          </Section>
        </div>

        <CheckoutSummary
          cart={cart}
          onPlaceOrder={handlePlaceOrder}
          placing={finishing}
          disabled={effectiveAddressId === null}
          error={placeOrder.error}
          className="h-fit lg:sticky lg:top-20"
        />
      </div>
    </main>
  );
}
