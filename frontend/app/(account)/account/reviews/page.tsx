"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Stars } from "@/components/pdp/stars";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyReviews } from "@/lib/reviews";
import { formatDate } from "@/lib/utils";

export default function MyReviewsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMyReviews(page);

  const reviews = data?.reviews ?? [];
  const pagination = data?.pagination ?? null;
  const isEmpty = !isLoading && !isError && reviews.length === 0;

  return (
    <div>
      <h1 className="text-2xl font-bold">My reviews</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Reviews you&apos;ve written on delivered products.
      </p>

      <div className="mt-6">
        {isLoading ? (
          <ReviewsSkeleton />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load your reviews. Please refresh and try again.
          </p>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
            <Star className="size-8 text-subtle" />
            <p className="text-base font-semibold text-foreground">
              No reviews yet
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Once an order is delivered, you can review its products from the
              order details.
            </p>
            <Button asChild className="mt-1">
              <Link href="/account/orders">View orders</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {review.product_name ?? `Product #${review.product_id}`}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <Stars rating={review.rating} className="mt-1.5" />
                  {review.comment && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            {pagination && pagination.last_page > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= pagination.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-24" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
        </div>
      ))}
    </div>
  );
}
