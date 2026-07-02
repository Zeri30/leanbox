"use client";

import { Eye, EyeOff, Star } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminReviews,
  useModerateReview,
  useReviewStats,
  type AdminReviewsParams,
  type ReviewVisibility,
} from "@/lib/admin/reviews";
import { cn, formatDate } from "@/lib/utils";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-3.5",
            n <= rating ? "fill-warning text-warning" : "text-border-strong",
          )}
        />
      ))}
    </span>
  );
}

function StatsView() {
  const { data: stats, isLoading } = useReviewStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  if (!stats) return null;

  const maxCount = Math.max(1, ...Object.values(stats.rating_distribution));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid grid-cols-2 gap-4">
        <Stat label="Total reviews" value={stats.total} />
        <Stat
          label="Average rating"
          value={stats.average_rating != null ? stats.average_rating.toFixed(2) : "—"}
        />
        <Stat label="Visible" value={stats.visible} />
        <Stat label="Hidden" value={stats.hidden} />
      </div>
      <Card>
        <p className="mb-3 text-sm font-semibold text-foreground">
          Rating distribution (visible)
        </p>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((r) => {
            const count = stats.rating_distribution[String(r)] ?? 0;
            return (
              <div key={r} className="flex items-center gap-2 text-sm">
                <span className="w-3 text-muted-foreground">{r}</span>
                <Star className="size-3.5 fill-warning text-warning" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </Card>
  );
}

const FILTERS: { value: ReviewVisibility; label: string }[] = [
  { value: "all", label: "All" },
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Hidden" },
];

export default function AdminReviewsPage() {
  const { toast } = useToast();
  const [visibility, setVisibility] = useState<ReviewVisibility>("all");
  const [page, setPage] = useState(1);

  const params: AdminReviewsParams = { visibility, page };
  const { data, isLoading, isError } = useAdminReviews(params);
  const moderate = useModerateReview();

  const reviews = data?.items ?? [];
  const pagination = data?.pagination ?? null;

  async function toggle(id: number, hidden: boolean) {
    try {
      await moderate.mutateAsync({ id, hidden });
      toast(hidden ? "Review hidden." : "Review restored.", "success");
    } catch {
      toast("Couldn't update the review.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Moderate customer reviews and track ratings.
        </p>
      </div>

      <StatsView />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Moderation</h2>
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setVisibility(f.value);
                setPage(1);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                visibility === f.value
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Couldn&apos;t load reviews.
          </p>
        ) : reviews.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No reviews match this filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Reviewer</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Comment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.map((r) => (
                  <tr key={r.id} className="align-top hover:bg-elevated/50">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {r.product_name ?? `#${r.product_id}`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.reviewer ?? "—"}
                      <span className="block text-xs text-subtle">
                        {formatDate(r.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Stars rating={r.rating} />
                    </td>
                    <td className="max-w-xs px-4 py-3 text-muted-foreground">
                      {r.comment ? (
                        <span className="line-clamp-3">{r.comment}</span>
                      ) : (
                        <span className="text-subtle">No comment</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.is_hidden ? (
                        <Badge variant="destructive">Hidden</Badge>
                      ) : (
                        <Badge variant="success">Visible</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={moderate.isPending}
                        onClick={() => toggle(r.id, !r.is_hidden)}
                      >
                        {r.is_hidden ? (
                          <>
                            <Eye className="size-4" /> Unhide
                          </>
                        ) : (
                          <>
                            <EyeOff className="size-4" /> Hide
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-3">
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
    </div>
  );
}
