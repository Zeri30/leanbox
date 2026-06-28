import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Cart } from "@/lib/types/api";

export const CART_QUERY_KEY = ["cart"] as const;

/** The authenticated user's cart. Disabled (and empty) for guests. */
export function useCart() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: async () => (await api.get<Cart>("/cart")).data,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

/** Total item quantity for the cart badge (0 for guests). */
export function useCartCount(): number {
  const { data } = useCart();
  return data?.item_count ?? 0;
}

export interface AddToCartVars {
  productId: number;
  quantity: number;
}

/**
 * Add a product to the cart. On success the fresh cart is written into the
 * query cache, so the nav badge updates immediately without a refetch.
 */
export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity }: AddToCartVars) =>
      (
        await api.post<Cart>("/cart/items", {
          product_id: productId,
          quantity,
        })
      ).data,
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}
