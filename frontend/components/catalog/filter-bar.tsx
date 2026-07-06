"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PRODUCT_SORTS, type ProductSort } from "@/lib/catalog/queries";
import type { Category } from "@/lib/types/api";
import { cn } from "@/lib/utils";

const SORT_LABELS: Record<ProductSort, string> = {
  featured: "Featured",
  price_low: "Price: Low to High",
  price_high: "Price: High to Low",
  name: "Name (A–Z)",
  newest: "Newest",
};

export interface FilterBarProps {
  search: string;
  category: string;
  sort: ProductSort;
  categories: Category[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: ProductSort) => void;
  className?: string;
}

/** Sticky filter row: search + category + sort (UI/UX §6 Product Listing). */
export function FilterBar({
  search,
  category,
  sort,
  categories,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "sticky top-16 z-30 -mx-4 flex flex-col gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className="pl-9"
        />
      </div>

      <div className="flex gap-3">
        <Select
          value={category || "all"}
          onValueChange={(v) => onCategoryChange(v === "all" ? "" : v)}
          options={[
            { value: "all", label: "All categories" },
            ...categories.map((c) => ({ value: c.slug, label: c.name })),
          ]}
          aria-label="Filter by category"
          className="h-11 flex-1 sm:flex-none"
        />

        <Select
          value={sort}
          onValueChange={(v) => onSortChange(v as ProductSort)}
          options={PRODUCT_SORTS.map((s) => ({ value: s, label: SORT_LABELS[s] }))}
          aria-label="Sort products"
          className="h-11 flex-1 sm:flex-none"
        />
      </div>
    </div>
  );
}
