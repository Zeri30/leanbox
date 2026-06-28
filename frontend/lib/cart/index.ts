import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Cart, CartItem } from "@/lib/types/api";

export const CART_QUERY_KEY = ["cart"] as const;

/** Recompute item_count + subtotal from a new items list (for optimistic updates). */
export function recomputeCart(cart: Cart, items: CartItem[]): Cart {
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + Number(i.unit_price) * i.quantity,
    0,
  );
  return { ...cart, items, item_count: itemCount, subtotal: subtotal.toFixed(2) };
}

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

interface CartMutationContext {
  previous?: Cart;
}

/**
 * Add a product to the cart. Optimistically bumps the cached item_count so the
 * nav badge updates instantly (the slow DB then reconciles via onSuccess), with
 * rollback on error.
 */
export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation<Cart, Error, AddToCartVars, CartMutationContext>({
    mutationFn: async ({ productId, quantity }) =>
      (
        await api.post<Cart>("/cart/items", {
          product_id: productId,
          quantity,
        })
      ).data,
    onMutate: async ({ quantity }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<Cart>(CART_QUERY_KEY, {
          ...previous,
          item_count: previous.item_count + quantity,
        });
      }
      return { previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(CART_QUERY_KEY, ctx.previous);
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}

/** Update a line item's quantity, with an optimistic cache update + rollback. */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation<Cart, Error, { itemId: number; quantity: number }, CartMutationContext>(
    {
      mutationFn: async ({ itemId, quantity }) =>
        (await api.patch<Cart>(`/cart/items/${itemId}`, { quantity })).data,
      onMutate: async ({ itemId, quantity }) => {
        await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
        const previous = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
        if (previous) {
          const items = previous.items.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  quantity,
                  line_total: (Number(i.unit_price) * quantity).toFixed(2),
                }
              : i,
          );
          queryClient.setQueryData(CART_QUERY_KEY, recomputeCart(previous, items));
        }
        return { previous };
      },
      onError: (_e, _vars, ctx) => {
        if (ctx?.previous) queryClient.setQueryData(CART_QUERY_KEY, ctx.previous);
      },
      onSuccess: (cart) => queryClient.setQueryData(CART_QUERY_KEY, cart),
    },
  );
}

/** Remove a line item, with an optimistic cache update + rollback. */
export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation<Cart, Error, { itemId: number }, CartMutationContext>({
    mutationFn: async ({ itemId }) =>
      (await api.delete<Cart>(`/cart/items/${itemId}`)).data,
    onMutate: async ({ itemId }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
      if (previous) {
        const items = previous.items.filter((i) => i.id !== itemId);
        queryClient.setQueryData(CART_QUERY_KEY, recomputeCart(previous, items));
      }
      return { previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(CART_QUERY_KEY, ctx.previous);
    },
    onSuccess: (cart) => queryClient.setQueryData(CART_QUERY_KEY, cart),
  });
}
