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

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};
const dateFormatter = new Intl.DateTimeFormat("en-PH", DATE_OPTS);
// Date-only strings (YYYY-MM-DD) are parsed as UTC midnight; format them in UTC
// so the calendar date never shifts by a day in timezones behind UTC.
const utcDateFormatter = new Intl.DateTimeFormat("en-PH", {
  ...DATE_OPTS,
  timeZone: "UTC",
});

/** Format an ISO date/datetime string as e.g. "Jul 1, 2026". Returns "—" for null/invalid. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return (dateOnly ? utcDateFormatter : dateFormatter).format(date);
}

/**
 * Compact relative time for feeds (e.g. "just now", "5m ago", "3h ago",
 * "2d ago"). Older than a week falls back to an absolute date. "" for
 * null/invalid input.
 */
export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}
