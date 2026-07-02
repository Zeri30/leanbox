import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type {
  Category,
  NutritionFact,
  Pagination,
  Product,
  ProductImage,
} from "@/lib/types/api";

import { ADMIN_QUERY_KEY } from "./dashboard";

export const ADMIN_PRODUCTS_KEY = [...ADMIN_QUERY_KEY, "products"] as const;
export const ADMIN_CATEGORIES_KEY = [...ADMIN_QUERY_KEY, "categories"] as const;

export function adminProductKey(id: number) {
  return [...ADMIN_PRODUCTS_KEY, id] as const;
}

/* ---------------------------------------------------------------------------
 * Payloads (mirror the backend Form Requests).
 * ------------------------------------------------------------------------ */

export interface ProductPayload {
  category_id: number;
  name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
  low_stock_threshold?: number;
  is_featured?: boolean;
  is_best_selling?: boolean;
  is_active?: boolean;
}

export type NutritionPayload = {
  serving_size?: string | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  ingredients?: string | null;
};

export interface CategoryPayload {
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface AdminProductsParams {
  search?: string;
  categoryId?: number;
  isActive?: boolean;
  page?: number;
}

export interface AdminProductsPage {
  items: Product[];
  pagination: Pagination | null;
}

function useAdminEnabled() {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && user?.role === "admin";
}

function productsQuery(params: AdminProductsParams): string {
  const qs = new URLSearchParams();
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.categoryId) qs.set("category_id", String(params.categoryId));
  if (params.isActive !== undefined) qs.set("is_active", params.isActive ? "1" : "0");
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/* ---------------------------------------------------------------------------
 * Products
 * ------------------------------------------------------------------------ */

/** Admin product listing (includes inactive; searchable, filterable, paginated). */
export function useAdminProducts(params: AdminProductsParams = {}) {
  return useQuery({
    queryKey: [...ADMIN_PRODUCTS_KEY, "list", params],
    queryFn: async (): Promise<AdminProductsPage> => {
      const res = await api.get<Product[]>(
        `/admin/products${productsQuery(params)}`,
      );
      return {
        items: res.data,
        pagination: (res.meta?.pagination as Pagination | undefined) ?? null,
      };
    },
    enabled: useAdminEnabled(),
    staleTime: 15_000,
  });
}

/** A single product with category, images and nutrition (edit form). */
export function useAdminProduct(id: number | null) {
  return useQuery({
    queryKey: id ? adminProductKey(id) : [...ADMIN_PRODUCTS_KEY, "new"],
    queryFn: async () => (await api.get<Product>(`/admin/products/${id}`)).data,
    enabled: useAdminEnabled() && id != null && Number.isFinite(id),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProductPayload) =>
      (await api.post<Product>("/admin/products", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY }),
  });
}

export function useUpdateProduct(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ProductPayload>) =>
      (await api.patch<Product>(`/admin/products/${id}`, payload)).data,
    onSuccess: (product) => {
      qc.setQueryData(adminProductKey(id), product);
      qc.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
    },
  });
}

/** Soft-delete (deactivate) a product; order history stays intact. */
export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.delete<{ message: string }>(`/admin/products/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY }),
  });
}

/** Manually set a product's stock (fires the low-stock check server-side). */
export function useUpdateStock(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (stock_quantity: number) =>
      (await api.patch<Product>(`/admin/products/${id}/stock`, { stock_quantity }))
        .data,
    onSuccess: (product) => {
      qc.setQueryData(adminProductKey(id), product);
      qc.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
    },
  });
}

/* ---------------------------------------------------------------------------
 * Product images (multipart)
 * ------------------------------------------------------------------------ */

export interface UploadImageVars {
  file: File;
  isPrimary?: boolean;
  altText?: string;
}

export function useUploadProductImage(productId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, isPrimary, altText }: UploadImageVars) => {
      const form = new FormData();
      form.append("image", file);
      if (isPrimary) form.append("is_primary", "1");
      if (altText) form.append("alt_text", altText);
      return (
        await api.upload<ProductImage>(
          `/admin/products/${productId}/images`,
          form,
        )
      ).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminProductKey(productId) }),
  });
}

export function useUpdateProductImage(productId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      imageId,
      ...payload
    }: {
      imageId: number;
      is_primary?: boolean;
      alt_text?: string | null;
    }) =>
      (
        await api.patch<ProductImage>(
          `/admin/products/${productId}/images/${imageId}`,
          payload,
        )
      ).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminProductKey(productId) }),
  });
}

export function useDeleteProductImage(productId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (imageId: number) =>
      (
        await api.delete<{ message: string }>(
          `/admin/products/${productId}/images/${imageId}`,
        )
      ).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminProductKey(productId) }),
  });
}

/* ---------------------------------------------------------------------------
 * Nutrition (1:1 upsert)
 * ------------------------------------------------------------------------ */

export function useUpsertNutrition(productId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NutritionPayload) =>
      (
        await api.put<NutritionFact>(
          `/admin/products/${productId}/nutrition`,
          payload,
        )
      ).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminProductKey(productId) }),
  });
}

/* ---------------------------------------------------------------------------
 * Categories
 * ------------------------------------------------------------------------ */

/** All categories (admin listing includes inactive). */
export function useAdminCategories() {
  return useQuery({
    queryKey: [...ADMIN_CATEGORIES_KEY, "list"],
    queryFn: async () =>
      (await api.get<Category[]>("/admin/categories")).data,
    enabled: useAdminEnabled(),
    staleTime: 30_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CategoryPayload) =>
      (await api.post<Category>("/admin/categories", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: CategoryPayload & { id: number }) =>
      (await api.patch<Category>(`/admin/categories/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.delete<{ message: string }>(`/admin/categories/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY }),
  });
}
