"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { AddressForm } from "@/components/checkout/address-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/auth";
import {
  useCreateAddress,
  useDeleteAddress,
  useUpdateAddress,
} from "@/lib/checkout";
import type { Address, NewAddress } from "@/lib/types/api";
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
  const { toast } = useToast();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Address | null>(null);

  const showAddForm = adding || (!isLoading && addresses.length === 0);

  const handleCreate = (payload: NewAddress) => {
    createAddress.mutate(payload, {
      onSuccess: (created) => {
        onSelect(created.id);
        setAdding(false);
      },
    });
  };

  const handleUpdate = (id: number, payload: NewAddress) => {
    updateAddress.mutate(
      { id, payload },
      {
        onSuccess: (updated) => {
          onSelect(updated.id);
          setEditingId(null);
        },
      },
    );
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    deleteAddress.mutate(id, {
      onSuccess: () => {
        toast("Address deleted.", "success");
        // If the removed address was selected, fall back to another one.
        if (selectedId === id) {
          const next = addresses.find((a) => a.id !== id);
          if (next) onSelect(next.id);
        }
        setConfirmDelete(null);
      },
      onError: (err) => {
        toast(errorMessage(err) || "Couldn't delete the address.", "error");
        setConfirmDelete(null);
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
      {addresses.map((a) =>
        editingId === a.id ? (
          <div key={a.id} className="rounded-2xl border border-border p-4">
            <h3 className="mb-4 text-sm font-semibold">Edit address</h3>
            <AddressForm
              initial={a}
              submitLabel="Save changes"
              onSubmit={(payload) => handleUpdate(a.id, payload)}
              submitting={updateAddress.isPending}
              error={updateAddress.error}
              showCancel
              onCancel={() => setEditingId(null)}
            />
          </div>
        ) : (
          <div
            key={a.id}
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
              selectedId === a.id
                ? "border-primary bg-primary-soft/40"
                : "border-border hover:border-border-strong",
            )}
          >
            <label className="flex min-w-0 flex-1 cursor-pointer gap-3">
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

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="Edit address"
                onClick={() => {
                  setEditingId(a.id);
                  setAdding(false);
                }}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-elevated hover:text-foreground"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Delete address"
                onClick={() => setConfirmDelete(a)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ),
      )}

      {showAddForm ? (
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
          onClick={() => {
            setAdding(true);
            setEditingId(null);
          }}
          className="inline-flex items-center gap-2 self-start text-sm font-semibold text-primary hover:underline"
        >
          <Plus className="size-4" />
          Add a new address
        </button>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title="Delete this address?"
        description="This removes it from your saved addresses. Addresses used by existing orders can't be deleted."
        confirmText="Delete"
        variant="danger"
        loading={deleteAddress.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
