import { PackageOpen } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { productToCardProps } from "@/lib/catalog/queries";
import type { Product } from "@/lib/types/api";
import { cn } from "@/lib/utils";

const GRID = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4";

/** Responsive product grid: 2 cols mobile → 3 tablet → 4 desktop. */
export function ProductGrid({
  products,
  className,
}: {
  products: Product[];
  className?: string;
}) {
  return (
    <div className={cn(GRID, className)}>
      {products.map((product) => (
        <ProductCard key={product.id} {...productToCardProps(product)} />
      ))}
    </div>
  );
}

/** Shimmer placeholders shown while a page of products is fetching. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={GRID} aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
        >
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="mt-1 h-11 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Friendly empty state when no products match the current filters. */
export function ProductGridEmpty({ onReset }: { onReset?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
      <PackageOpen className="size-8 text-subtle" />
      <p className="text-base font-semibold text-foreground">
        No products found
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Try a different search term or clear your filters to see everything.
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
