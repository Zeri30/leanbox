"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/auth";
import type { NewAddress } from "@/lib/types/api";

function Labeled({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}

/** New delivery address form. Calls onSubmit with the payload; parent runs the mutation. */
export function AddressForm({
  onSubmit,
  onCancel,
  submitting,
  error,
  showCancel,
}: {
  onSubmit: (payload: NewAddress) => void;
  onCancel?: () => void;
  submitting?: boolean;
  error?: unknown;
  showCancel?: boolean;
}) {
  const [form, setForm] = useState<NewAddress>({
    label: "",
    recipient_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    is_default: false,
  });

  const set = (key: keyof NewAddress) => (value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error != null && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage(error)}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled id="recipient_name" label="Recipient name" required>
          <Input
            id="recipient_name"
            value={form.recipient_name}
            onChange={(e) => set("recipient_name")(e.target.value)}
            required
            autoComplete="name"
          />
        </Labeled>
        <Labeled id="phone" label="Phone" required>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => set("phone")(e.target.value)}
            required
            inputMode="tel"
            autoComplete="tel"
          />
        </Labeled>
      </div>

      <Labeled id="line1" label="Address line 1" required>
        <Input
          id="line1"
          value={form.line1}
          onChange={(e) => set("line1")(e.target.value)}
          required
          autoComplete="address-line1"
        />
      </Labeled>

      <Labeled id="line2" label="Address line 2">
        <Input
          id="line2"
          value={form.line2 ?? ""}
          onChange={(e) => set("line2")(e.target.value)}
          autoComplete="address-line2"
        />
      </Labeled>

      <div className="grid gap-4 sm:grid-cols-3">
        <Labeled id="city" label="City" required>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => set("city")(e.target.value)}
            required
            autoComplete="address-level2"
          />
        </Labeled>
        <Labeled id="state" label="Province / State">
          <Input
            id="state"
            value={form.state ?? ""}
            onChange={(e) => set("state")(e.target.value)}
            autoComplete="address-level1"
          />
        </Labeled>
        <Labeled id="postal_code" label="Postal code">
          <Input
            id="postal_code"
            value={form.postal_code ?? ""}
            onChange={(e) => set("postal_code")(e.target.value)}
            autoComplete="postal-code"
          />
        </Labeled>
      </div>

      <Labeled id="label" label="Label (e.g. Home, Work)">
        <Input
          id="label"
          value={form.label ?? ""}
          onChange={(e) => set("label")(e.target.value)}
        />
      </Labeled>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={!!form.is_default}
          onChange={(e) => set("is_default")(e.target.checked)}
          className="size-4 rounded border-input accent-primary"
        />
        Set as default address
      </label>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save address"}
        </Button>
        {showCancel && onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
