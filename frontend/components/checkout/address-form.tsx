"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { errorMessage } from "@/lib/auth";
import { PH_PROVINCES, citiesForProvince, provinceByName } from "@/lib/ph-locations";
import type { Address, NewAddress } from "@/lib/types/api";
import { cn } from "@/lib/utils";

const LABEL_OPTIONS = ["Home", "Work", "Other"] as const;
type LabelType = (typeof LABEL_OPTIONS)[number] | "";

function initialLabelType(label: string | null | undefined): LabelType {
  if (label === "Home" || label === "Work") return label;
  if (label && label.trim()) return "Other";
  return "";
}

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

/**
 * Delivery address form — used to add or edit. Calls onSubmit with the payload;
 * the parent runs the mutation. Province / city are PSGC dropdowns and the label
 * is a Home / Work / Other radio.
 */
export function AddressForm({
  onSubmit,
  onCancel,
  submitting,
  error,
  showCancel,
  initial,
  submitLabel,
}: {
  onSubmit: (payload: NewAddress) => void;
  onCancel?: () => void;
  submitting?: boolean;
  error?: unknown;
  showCancel?: boolean;
  initial?: Address;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<NewAddress>({
    label: initial?.label ?? "",
    recipient_name: initial?.recipient_name ?? "",
    phone: initial?.phone ?? "",
    line1: initial?.line1 ?? "",
    line2: initial?.line2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    postal_code: initial?.postal_code ?? "",
    is_default: initial?.is_default ?? false,
  });
  const [provinceCode, setProvinceCode] = useState<string>(
    provinceByName(initial?.state)?.code ?? "",
  );
  const [labelType, setLabelType] = useState<LabelType>(
    initialLabelType(initial?.label),
  );
  const [customLabel, setCustomLabel] = useState<string>(
    initialLabelType(initial?.label) === "Other" ? (initial?.label ?? "") : "",
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const set = (key: keyof NewAddress) => (value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  function pickLabel(type: Exclude<LabelType, "">) {
    setLabelType(type);
    setForm((f) => ({ ...f, label: type === "Other" ? customLabel : type }));
  }

  function onProvinceChange(code: string) {
    const name = PH_PROVINCES.find((p) => p.code === code)?.name ?? "";
    setProvinceCode(code);
    setLocalError(null);
    // Changing province clears the city — it may not belong to the new one.
    setForm((f) => ({ ...f, state: name, city: "" }));
  }

  const cityOptions = provinceCode
    ? citiesForProvince(provinceCode).map((c) => ({ value: c.name, label: c.name }))
    : [];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // The province/city dropdowns aren't native inputs, so validate them here.
    if (!provinceCode || !form.city) {
      setLocalError("Please select a province and city.");
      return;
    }
    setLocalError(null);
    onSubmit({ ...form, label: form.label?.toString().trim() || null });
  };

  // Only show a banner when there's an actual message (a blank one reads as a red bar).
  const bannerMessage =
    localError ??
    (error != null
      ? errorMessage(error) || "Couldn't save the address. Please check your entries."
      : null);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {bannerMessage && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {bannerMessage}
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
          placeholder="House / unit no., street, barangay"
          autoComplete="address-line1"
        />
      </Labeled>

      <Labeled id="line2" label="Address line 2">
        <Input
          id="line2"
          value={form.line2 ?? ""}
          onChange={(e) => set("line2")(e.target.value)}
          placeholder="Landmark, building, etc. (optional)"
          autoComplete="address-line2"
        />
      </Labeled>

      <div className="grid gap-4 sm:grid-cols-3">
        <Labeled id="state" label="Province" required>
          <Select
            value={provinceCode}
            onValueChange={onProvinceChange}
            options={PH_PROVINCES.map((p) => ({ value: p.code, label: p.name }))}
            placeholder="Select province"
            aria-label="Province"
            className="w-full"
          />
        </Labeled>
        <Labeled id="city" label="City / Municipality" required>
          <Select
            value={form.city}
            onValueChange={(v) => {
              setLocalError(null);
              set("city")(v);
            }}
            options={cityOptions}
            placeholder={provinceCode ? "Select city" : "Pick a province first"}
            disabled={!provinceCode}
            aria-label="City or municipality"
            className="w-full"
          />
        </Labeled>
        <Labeled id="postal_code" label="Postal code">
          <Input
            id="postal_code"
            value={form.postal_code ?? ""}
            onChange={(e) => set("postal_code")(e.target.value)}
            inputMode="numeric"
            autoComplete="postal-code"
          />
        </Labeled>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Label</Label>
        <div className="flex flex-wrap gap-4">
          {LABEL_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
            >
              <input
                type="radio"
                name="address-label"
                checked={labelType === opt}
                onChange={() => pickLabel(opt)}
                className="size-4 accent-primary"
              />
              {opt}
            </label>
          ))}
        </div>
        {labelType === "Other" && (
          <Input
            aria-label="Custom label"
            placeholder="e.g. Mom's house"
            value={customLabel}
            onChange={(e) => {
              setCustomLabel(e.target.value);
              set("label")(e.target.value);
            }}
            className={cn("mt-1")}
          />
        )}
      </div>

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
          {submitting ? "Saving…" : (submitLabel ?? "Save address")}
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
