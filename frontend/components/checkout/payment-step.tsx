"use client";

import { Banknote, CreditCard, Smartphone, type LucideIcon } from "lucide-react";

import type { PaymentMethod } from "@/lib/types/api";
import { cn } from "@/lib/utils";

interface Option {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: LucideIcon;
  enabled: boolean;
}

// COD is the only active gateway for now (Stripe/GCash deferred per stack decision).
const OPTIONS: Option[] = [
  {
    value: "cod",
    label: "Cash on Delivery",
    description: "Pay with cash when your order arrives.",
    icon: Banknote,
    enabled: true,
  },
  {
    value: "gcash",
    label: "GCash",
    description: "Coming soon.",
    icon: Smartphone,
    enabled: false,
  },
  {
    value: "card",
    label: "Credit / Debit Card",
    description: "Coming soon.",
    icon: CreditCard,
    enabled: false,
  },
];

export function PaymentStep({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.value;
        return (
          <label
            key={opt.value}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4 transition-colors",
              opt.enabled
                ? "cursor-pointer"
                : "cursor-not-allowed opacity-60",
              selected
                ? "border-primary bg-primary-soft/40"
                : "border-border hover:border-border-strong",
            )}
          >
            <input
              type="radio"
              name="payment"
              value={opt.value}
              checked={selected}
              disabled={!opt.enabled}
              onChange={() => opt.enabled && onChange(opt.value)}
              className="size-4 shrink-0 accent-primary"
            />
            <Icon className="size-5 shrink-0 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-semibold text-foreground">{opt.label}</div>
              <div className="text-muted-foreground">{opt.description}</div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
