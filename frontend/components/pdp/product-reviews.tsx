"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Stars } from "@/components/pdp/stars";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductReviews } from "@/lib/catalog/queries";
import type { ReviewsSummary } from "@/lib/types/api";

const dateFmt = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateFmt.format(d);
}

export function ProductReviews({
  productId,
  summary,
}: {
  productId: number;
  summary?: ReviewsSummary;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reviews", productId, page],
    queryFn: () => getProductReviews(productId, page),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const count = summary?.count ?? 0;
  const average = summary?.average ?? null;

  return (
    <section aria-labelledby="reviews-heading" className="flex flex-col gap-5">
      <h2 id="reviews-heading" className="text-2xl font-bold">
        Reviews
      </h2>

      {/* Rating summary */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">
            {average !== null ? average.toFixed(1) : "—"}
          </div>
          <Stars rating={average ?? 0} className="mt-1 justify-center" />
        </div>
        <div className="text-sm text-muted-foreground">
          {count > 0
            ? `Based on ${count} ${count === 1 ? "review" : "reviews"}`
            : "No reviews yet"}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load reviews right now.
        </p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Be the first to review this product after your purchase.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {data.items.map((review) => (
            <li key={review.id} className="flex flex-col gap-1.5 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">
                  {review.reviewer ?? "Anonymous"}
                </span>
                <span className="text-xs text-subtle">
                  {formatDate(review.created_at)}
                </span>
              </div>
              <Stars rating={review.rating} size="size-3.5" />
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {data && data.pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={data.pagination.current_page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.current_page} of {data.pagination.last_page}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={data.pagination.current_page >= data.pagination.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </section>
  );
}
