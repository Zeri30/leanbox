import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CART_QUERY_KEY } from "@/lib/cart";
import type {
  Address,
  NewAddress,
  Order,
  PaymentMethod,
} from "@/lib/types/api";

/** Flat shipping fee (PHP) — mirrors OrderService::SHIPPING_FEE on the backend. */
export const SHIPPING_FEE = 49;

const ADDRESSES_QUERY_KEY = ["addresses"] as const;

/** The authenticated user's saved delivery addresses (default first). */
export function useAddresses() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: async () => (await api.get<Address[]>("/addresses")).data,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/** Create a delivery address; refreshes the address list on success. */
export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NewAddress) =>
      (await api.post<Address>("/addresses", payload, { timeoutMs: 20_000 })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export interface PlaceOrderVars {
  deliveryAddressId: number;
  paymentMethod?: PaymentMethod;
}

/**
 * Place an order from the cart. On success the server clears the cart, so we
 * reset the cart cache (badge → 0) and seed the order cache for the confirmation page.
 */
export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ deliveryAddressId, paymentMethod = "cod" }: PlaceOrderVars) =>
      (
        await api.post<Order>(
          "/orders",
          {
            delivery_address_id: deliveryAddressId,
            payment_method: paymentMethod,
          },
          // Order placement runs a multi-query transaction; give the slow remote
          // dev DB room so the client doesn't abort an order that's still committing.
          { timeoutMs: 30_000 },
        )
      ).data,
    onSuccess: (order) => {
      queryClient.setQueryData(["order", order.id], order);
      queryClient.removeQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

/** A single order by id (for the confirmation screen). */
export function useOrder(id: number) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await api.get<Order>(`/orders/${id}`)).data,
    enabled: isAuthenticated && Number.isFinite(id),
  });
}
