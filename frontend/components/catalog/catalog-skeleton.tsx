import { ProductGridSkeleton } from "@/components/catalog/product-grid";
import { Skeleton } from "@/components/ui/skeleton";

/** Streamed fallback for the catalog while the first page of data loads. */
export function CatalogSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-11 flex-1" />
        <div className="flex gap-3">
          <Skeleton className="h-11 w-36" />
          <Skeleton className="h-11 w-36" />
        </div>
      </div>
      <Skeleton className="h-5 w-24" />
      <ProductGridSkeleton />
    </div>
  );
}
