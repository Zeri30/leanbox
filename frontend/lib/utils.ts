import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, de-duplicating conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a number as Philippine Peso (e.g. ₱1,250.00). Accepts numeric strings from the API. */
export function formatPHP(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return phpFormatter.format(Number.isFinite(value) ? value : 0);
}
