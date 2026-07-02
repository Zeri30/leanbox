import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Pagination, Review, ReviewStats } from "@/lib/types/api";

import { ADMIN_QUERY_KEY } from "./dashboard";

export const ADMIN_REVIEWS_KEY = [...ADMIN_QUERY_KEY, "reviews"] as const;

function useAdminEnabled() {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && user?.role === "admin";
}

/** "all" = no filter; "visible"/"hidden" map to ?hidden=0|1. */
export type ReviewVisibility = "all" | "visible" | "hidden";

export interface AdminReviewsParams {
  visibility?: ReviewVisibility;
  page?: number;
}

export interface AdminReviewsPage {
  items: Review[];
  pagination: Pagination | null;
}

function reviewsQuery(params: AdminReviewsParams): string {
  const qs = new URLSearchParams();
  if (params.visibility === "hidden") qs.set("hidden", "1");
  if (params.visibility === "visible") qs.set("hidden", "0");
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function useAdminReviews(params: AdminReviewsParams = {}) {
  return useQuery({
    queryKey: [...ADMIN_REVIEWS_KEY, "list", params],
    queryFn: async (): Promise<AdminReviewsPage> => {
      const res = await api.get<Review[]>(`/admin/reviews${reviewsQuery(params)}`);
      return {
        items: res.data,
        pagination: (res.meta?.pagination as Pagination | undefined) ?? null,
      };
    },
    enabled: useAdminEnabled(),
    staleTime: 15_000,
  });
}

export function useReviewStats() {
  return useQuery({
    queryKey: [...ADMIN_REVIEWS_KEY, "stats"],
    queryFn: async () =>
      (await api.get<ReviewStats>("/admin/reviews/stats")).data,
    enabled: useAdminEnabled(),
    staleTime: 30_000,
  });
}

/** Hide or unhide a review. */
export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hidden }: { id: number; hidden: boolean }) =>
      (await api.patch<Review>(`/admin/reviews/${id}`, { is_hidden: hidden })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_REVIEWS_KEY }),
  });
}
