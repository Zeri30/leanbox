"use client";

import { useState } from "react";

import { StarRatingInput } from "@/components/reviews/star-rating-input";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/pdp/stars";
import { errorMessage } from "@/lib/auth";
import { useSubmitReview } from "@/lib/reviews";
import type { Review } from "@/lib/types/api";

/**
 * Review control for one item on a delivered order: shows the existing review
 * if the product was already reviewed, otherwise an expandable write form.
 */
export function OrderItemReview({
  productId,
  existingReview,
}: {
  productId: number;
  existingReview: Review | null;
}) {
  const { toast } = useToast();
  const submit = useSubmitReview();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  if (existingReview) {
    return (
      <div className="mt-2 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Stars rating={existingReview.rating} />
          <span className="text-xs text-muted-foreground">Your review</span>
        </div>
        {existingReview.comment && (
          <p className="text-sm text-muted-foreground">
            {existingReview.comment}
          </p>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        variant="secondary"
        size="sm"
        className="mt-2"
        onClick={() => setOpen(true)}
      >
        Write a review
      </Button>
    );
  }

  const handleSubmit = async () => {
    if (rating < 1) {
      toast("Please pick a star rating.", "error");
      return;
    }
    try {
      await submit.mutateAsync({ productId, rating, comment });
      toast("Review submitted. Thanks!");
      setOpen(false);
    } catch (err) {
      toast(errorMessage(err) ?? "Couldn't submit your review.", "error");
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border p-3">
      <StarRatingInput value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share what you thought (optional)"
        rows={3}
        maxLength={2000}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-subtle focus-visible:border-primary focus-visible:outline-none"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={submit.isPending}>
          {submit.isPending ? "Submitting…" : "Submit review"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          disabled={submit.isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
