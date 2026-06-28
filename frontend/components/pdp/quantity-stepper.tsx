"use client";

import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

/** Clamp a quantity into [min, max]. Exported for reuse + testing. */
export function clampQuantity(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(Math.round(value), min), max);
}

/** Accessible −/+ quantity stepper. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
  className?: string;
}) {
  const set = (next: number) => onChange(clampQuantity(next, min, max));

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-input",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => set(value - 1)}
        disabled={disabled || value <= min}
        className="grid size-10 place-items-center rounded-l-lg text-foreground transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span
        aria-live="polite"
        className="min-w-10 text-center text-sm font-semibold tabular-nums"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => set(value + 1)}
        disabled={disabled || value >= max}
        className="grid size-10 place-items-center rounded-r-lg text-foreground transition-colors hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
