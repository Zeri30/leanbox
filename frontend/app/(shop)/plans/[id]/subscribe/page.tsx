"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { FormBanner } from "@/components/auth/field";
import { RequireAuth } from "@/components/auth/require-auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AddressStep } from "@/components/checkout/address-step";
import { ScheduleStep } from "@/components/plans/schedule-step";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/auth";
import { useAddresses } from "@/lib/checkout";
import {
  BILLING_INTERVAL_LABEL,
  DELIVERY_SCHEDULE_LABEL,
  MEAL_TYPE_LABEL,
  usePlan,
  useSubscribe,
} from "@/lib/subscriptions";
import type { DeliverySchedule } from "@/lib/types/api";
import { formatPHP } from "@/lib/utils";

export default function SubscribePage() {
  return (
    <RequireAuth role="customer">
      <SubscribeContent />
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

function SubscribeContent() {
  const params = useParams();
  const router = useRouter();
  const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);

  const { plan, isLoading: planLoading, isError: planError } = usePlan(id);
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const subscribe = useSubscribe();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<DeliverySchedule>("weekly");
  const [banner, setBanner] = useState<string | null>(null);

  const defaultAddressId =
    addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? null;
  const effectiveAddressId = selectedAddressId ?? defaultAddressId;

  const finishing = subscribe.isPending || subscribe.isSuccess;

  const handleSubscribe = () => {
    if (!plan || effectiveAddressId === null) return;
    setBanner(null);
    subscribe.mutate(
      {
        planId: plan.id,
        deliveryAddressId: effectiveAddressId,
        deliverySchedule: schedule,
      },
      {
        onSuccess: (sub) => router.push(`/account/subscriptions/${sub.id}`),
        onError: (err) => setBanner(errorMessage(err)),
      },
    );
  };

  if (planLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-6 h-9 w-56" />
        <Skeleton className="h-80 rounded-2xl" />
      </main>
    );
  }

  if (planError || !plan) {
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Plan not found</h1>
        <p className="mt-2 text-muted-foreground">
          This plan may no longer be available.
        </p>
        <Button asChild className="mt-4">
          <Link href="/plans">Browse plans</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-28 md:pb-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Meal Plans", href: "/plans" },
          { label: plan.name },
        ]}
      />
      <h1 className="mb-6 text-3xl font-bold">Subscribe to {plan.name}</h1>

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

          <Section step={2} title="Delivery schedule">
            <ScheduleStep value={schedule} onChange={setSchedule} />
          </Section>
        </div>

        {/* Summary + confirm */}
        <aside className="h-fit lg:sticky lg:top-20">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Summary</h2>

            <dl className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="font-medium text-foreground">{plan.name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="text-foreground">
                  {MEAL_TYPE_LABEL[plan.meal_type]}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Meals / cycle</dt>
                <dd className="text-foreground">{plan.meals_per_cycle}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="text-foreground">
                  {DELIVERY_SCHEDULE_LABEL[schedule]}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-semibold">
              <span>Per cycle</span>
              <span className="tabular-nums text-primary">
                {formatPHP(plan.price)}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {BILLING_INTERVAL_LABEL[plan.billing_interval]}
                </span>
              </span>
            </div>

            {banner && (
              <div className="mt-4">
                <FormBanner>{banner}</FormBanner>
              </div>
            )}

            <Button
              className="mt-4 w-full"
              size="lg"
              disabled={effectiveAddressId === null || finishing}
              onClick={handleSubscribe}
            >
              {finishing ? "Subscribing…" : "Subscribe — pay on delivery"}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              First cycle is cash on delivery. Cancel anytime.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
