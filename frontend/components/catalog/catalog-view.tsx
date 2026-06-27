"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { FilterBar } from "@/components/catalog/filter-bar";
import {
  ProductGrid,
  ProductGridEmpty,
  ProductGridSkeleton,
} from "@/components/catalog/product-grid";
import { Button } from "@/components/ui/button";
import {
  getProducts,
  productsQueryString,
  type ProductSort,
  type ProductsPage,
  type ProductsParams,
} from "@/lib/catalog/queries";
import type { Category } from "@/lib/types/api";

const SEARCH_DEBOUNCE_MS = 300;

/** Two params are equivalent if they serialize to the same query string. */
function sameParams(a: ProductsParams, b: ProductsParams): boolean {
  return productsQueryString(a) === productsQueryString(b);
}

export interface CatalogViewProps {
  categories: Category[];
  /** Params parsed from the URL on the server (seed the first query + UI). */
  initialParams: ProductsParams;
  /** Products fetched on the server for initialParams (SSR/SEO + instant paint). */
  initialData: ProductsPage;
}

/**
 * Client catalog: search/category/sort/paging driven by TanStack Query.
 *
 * In-page filter changes update the URL *shallowly* via the History API — no
 * server round-trip, so results stay shareable while the client refetches.
 * Real navigations (nav links, direct URLs) re-render the server tree and remount
 * this view (it's keyed on the server params), so it always reflects the live URL.
 */
export function CatalogView({
  categories,
  initialParams,
  initialData,
}: CatalogViewProps) {
  const pathname = usePathname();

  const [params, setParams] = useState<ProductsParams>(initialParams);
  const [searchInput, setSearchInput] = useState(initialParams.search ?? "");

  // Set the active params (re-render + refetch) and reflect them in the URL
  // without navigating, so the back button isn't polluted by every filter tweak.
  const apply = useCallback(
    (next: ProductsParams) => {
      setParams(next);
      window.history.replaceState(
        null,
        "",
        `${pathname}${productsQueryString(next)}`,
      );
    },
    [pathname],
  );

  // Debounce the search box into the active params (resets to page 1).
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === (params.search ?? "")) return;
    const id = setTimeout(() => {
      apply({ ...params, search: trimmed || undefined, page: 1 });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput, params, apply]);

  const isInitial = sameParams(params, initialParams);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", productsQueryString(params)],
    queryFn: () => getProducts(params),
    initialData: isInitial ? initialData : undefined,
    staleTime: 30_000,
  });

  const gridTopRef = useRef<HTMLDivElement>(null);
  const goToPage = (page: number) => {
    apply({ ...params, page });
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetFilters = () => {
    setSearchInput("");
    apply({});
  };

  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <FilterBar
        search={searchInput}
        category={params.category ?? ""}
        sort={params.sort ?? "featured"}
        categories={categories}
        onSearchChange={setSearchInput}
        onCategoryChange={(category) =>
          apply({ ...params, category: category || undefined, page: 1 })
        }
        onSortChange={(sort: ProductSort) => apply({ ...params, sort, page: 1 })}
      />

      <div ref={gridTopRef} className="scroll-mt-32" aria-live="polite">
        {!isLoading && !isError && (
          <p className="mb-4 text-sm text-muted-foreground">
            {total} {total === 1 ? "product" : "products"}
          </p>
        )}

        {isLoading ? (
          <ProductGridSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-destructive/40 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load products. Please try again.
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <ProductGridEmpty onReset={resetFilters} />
        ) : (
          <ProductGrid products={data.items} />
        )}
      </div>

      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={pagination.current_page <= 1}
            onClick={() => goToPage(pagination.current_page - 1)}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.current_page} of {pagination.last_page}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={pagination.current_page >= pagination.last_page}
            onClick={() => goToPage(pagination.current_page + 1)}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
