import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Pagination, User, UserStatus } from "@/lib/types/api";

import { ADMIN_QUERY_KEY } from "./dashboard";

export const ADMIN_CUSTOMERS_KEY = [...ADMIN_QUERY_KEY, "customers"] as const;

function useAdminEnabled() {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && user?.role === "admin";
}

export interface AdminCustomersParams {
  search?: string;
  page?: number;
}

export interface AdminCustomersPage {
  items: User[];
  pagination: Pagination | null;
}

export function useAdminCustomers(params: AdminCustomersParams = {}) {
  return useQuery({
    queryKey: [...ADMIN_CUSTOMERS_KEY, "list", params],
    queryFn: async (): Promise<AdminCustomersPage> => {
      const qs = new URLSearchParams();
      if (params.search?.trim()) qs.set("search", params.search.trim());
      if (params.page && params.page > 1) qs.set("page", String(params.page));
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const res = await api.get<User[]>(`/admin/users${suffix}`);
      return {
        items: res.data,
        pagination: (res.meta?.pagination as Pagination | undefined) ?? null,
      };
    },
    enabled: useAdminEnabled(),
    staleTime: 15_000,
  });
}

/** Suspend or reactivate a customer. */
export function useUpdateCustomerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: UserStatus }) =>
      (await api.patch<User>(`/admin/users/${id}/status`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_CUSTOMERS_KEY }),
  });
}
