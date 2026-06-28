"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { AddressForm } from "@/components/checkout/address-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateAddress } from "@/lib/checkout";
import type { Address } from "@/lib/types/api";
import { cn } from "@/lib/utils";

function formatAddress(a: Address): string {
  return [a.line1, a.line2, a.city, a.state, a.postal_code]
    .filter(Boolean)
    .join(", ");
}

export function AddressStep({
  addresses,
  isLoading,
  selectedId,
  onSelect,
}: {
  addresses: Address[];
  isLoading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const createAddress = useCreateAddress();
  // Open the form by default when there are no saved addresses.
  const [adding, setAdding] = useState(false);
  const showForm = adding || (!isLoading && addresses.length === 0);

  const handleCreate = (payload: Parameters<typeof createAddress.mutate>[0]) => {
    createAddress.mutate(payload, {
      onSuccess: (created) => {
        onSelect(created.id);
        setAdding(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {addresses.map((a) => (
        <label
          key={a.id}
          className={cn(
            "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
            selectedId === a.id
              ? "border-primary bg-primary-soft/40"
              : "border-border hover:border-border-strong",
          )}
        >
          <input
            type="radio"
            name="address"
            checked={selectedId === a.id}
            onChange={() => onSelect(a.id)}
            className="mt-1 size-4 shrink-0 accent-primary"
          />
          <div className="min-w-0 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">
                {a.recipient_name}
              </span>
              {a.label && (
                <span className="rounded-full bg-elevated px-2 py-0.5 text-xs text-muted-foreground">
                  {a.label}
                </span>
              )}
              {a.is_default && (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">
                  Default
                </span>
              )}
            </div>
            <p className="mt-1 text-muted-foreground">{formatAddress(a)}</p>
            <p className="text-muted-foreground">{a.phone}</p>
          </div>
        </label>
      ))}

      {showForm ? (
        <div className="rounded-2xl border border-border p-4">
          <h3 className="mb-4 text-sm font-semibold">New address</h3>
          <AddressForm
            onSubmit={handleCreate}
            submitting={createAddress.isPending}
            error={createAddress.error}
            showCancel={addresses.length > 0}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 self-start text-sm font-semibold text-primary hover:underline"
        >
          <Plus className="size-4" />
          Add a new address
        </button>
      )}
    </div>
  );
}
