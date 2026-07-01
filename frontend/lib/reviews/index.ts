import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Pagination, Review } from "@/lib/types/api";

export const MY_REVIEWS_QUERY_KEY = ["reviews", "me"] as const;

export interface MyReviewsPage {
  reviews: Review[];
  pagination: Pagination | null;
}

/** The authenticated user's own reviews (newest first, paginated). */
export function useMyReviews(page = 1) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [...MY_REVIEWS_QUERY_KEY, page],
    queryFn: async (): Promise<MyReviewsPage> => {
      const res = await api.get<Review[]>(`/reviews/me?page=${page}`);
      return {
        reviews: res.data,
        pagination: (res.meta?.pagination as Pagination | undefined) ?? null,
      };
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

/**
 * The user's reviews keyed by product id (from their most recent reviews), so
 * the order detail can show which items are still reviewable — and, for those
 * already reviewed, the rating they gave.
 */
export function useMyReviewsByProduct(): Map<number, Review> {
  const { data } = useMyReviews(1);
  return new Map((data?.reviews ?? []).map((r) => [r.product_id, r]));
}

export interface SubmitReviewVars {
  productId: number;
  rating: number;
  comment?: string | null;
}

/**
 * Submit a verified-purchase review for a product. The server enforces
 * eligibility (delivered order + one review per product) and returns 422 on
 * `not_eligible` / `already_reviewed`, which surfaces to the caller.
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, rating, comment }: SubmitReviewVars) =>
      (
        await api.post<Review>(`/products/${productId}/reviews`, {
          rating,
          comment: comment?.trim() || null,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_REVIEWS_QUERY_KEY });
    },
  });
}
