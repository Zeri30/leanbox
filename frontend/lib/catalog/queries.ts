import type { ProductCardProps } from "@/components/product-card";
import { api, ApiRequestError } from "@/lib/api";
import type {
  Category,
  Pagination,
  Product,
  Review,
} from "@/lib/types/api";

/** Sort options accepted by GET /products (mirrors ProductController::applySort). */
export const PRODUCT_SORTS = [
  "featured",
  "price_low",
  "price_high",
  "name",
  "newest",
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const DEFAULT_PER_PAGE = 12;

/** Filter/sort/paging state for the catalog listing. */
export interface ProductsParams {
  search?: string;
  category?: string;
  sort?: ProductSort;
  page?: number;
  perPage?: number;
  featured?: boolean;
  bestSelling?: boolean;
}

export interface ProductsPage {
  items: Product[];
  pagination: Pagination;
}

/**
 * Serialize listing params into a stable query string. Empty/default values are
 * omitted so the URL (and the TanStack Query key) stay clean and shareable.
 */
export function productsQueryString(params: ProductsParams): string {
  const qs = new URLSearchParams();
  const search = params.search?.trim();
  if (search) qs.set("search", search);
  if (params.category) qs.set("category", params.category);
  if (params.sort && params.sort !== "featured") qs.set("sort", params.sort);
  if (params.page && params.page > 1) qs.set("page", String(params.page));
  if (params.perPage) qs.set("per_page", String(params.perPage));
  if (params.featured) qs.set("featured", "1");
  if (params.bestSelling) qs.set("best_selling", "1");
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/** Raw search params as Next.js delivers them to a page (post-await). */
export type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Parse/validate URL search params into ProductsParams. Unknown sorts fall back
 * to "featured" and a non-positive page falls back to 1, so a hand-edited URL
 * can never produce an invalid API request.
 */
export function parseProductsParams(raw: RawSearchParams): ProductsParams {
  const sortRaw = firstValue(raw.sort);
  const sort = PRODUCT_SORTS.includes(sortRaw as ProductSort)
    ? (sortRaw as ProductSort)
    : undefined;

  const pageRaw = Number(firstValue(raw.page));
  const page = Number.isInteger(pageRaw) && pageRaw > 1 ? pageRaw : undefined;

  const search = firstValue(raw.search)?.trim() || undefined;
  const category = firstValue(raw.category) || undefined;

  return { search, category, sort, page };
}

const FALLBACK_PAGINATION: Pagination = {
  current_page: 1,
  last_page: 1,
  per_page: DEFAULT_PER_PAGE,
  total: 0,
};

/** Browse products with optional search/category/sort/paging. */
export async function getProducts(
  params: ProductsParams = {},
): Promise<ProductsPage> {
  const { data, meta } = await api.get<Product[]>(
    `/products${productsQueryString(params)}`,
  );
  const pagination =
    (meta?.pagination as Pagination | undefined) ?? FALLBACK_PAGINATION;
  return { items: data, pagination };
}

/**
 * Tiny in-process TTL cache. Runs only where these helpers execute server-side
 * (categories + home rails are global, public, and change rarely), so a brief
 * cache lets repeat navigations skip the slow remote-DB round trip. Filtered
 * catalog queries (search/category/page) are never cached — always fresh.
 */
const ttlCache = new Map<string, { at: number; value: unknown }>();

function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = ttlCache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) {
    return Promise.resolve(hit.value as T);
  }
  return fn().then((value) => {
    ttlCache.set(key, { at: Date.now(), value });
    return value;
  });
}

const CATEGORIES_TTL_MS = 60_000;
const HOME_RAIL_TTL_MS = 30_000;

/** Active categories for storefront nav and filters (cached ~60s). */
export async function getCategories(): Promise<Category[]> {
  return memo("categories", CATEGORIES_TTL_MS, async () => {
    const { data } = await api.get<Category[]>("/categories");
    return data;
  });
}

/** Featured products for the home rail (cached ~30s). */
export function getFeaturedProducts(limit = 4): Promise<ProductsPage> {
  return memo(`featured:${limit}`, HOME_RAIL_TTL_MS, () =>
    getProducts({ featured: true, perPage: limit }),
  );
}

/** Best-selling products for the home rail (cached ~30s). */
export function getBestSellers(limit = 8): Promise<ProductsPage> {
  return memo(`bestsellers:${limit}`, HOME_RAIL_TTL_MS, () =>
    getProducts({ bestSelling: true, perPage: limit }),
  );
}

/** Single product by slug (incl. category, images, nutrition, reviews_summary). Null if not found. */
export async function getProduct(slug: string): Promise<Product | null> {
  try {
    const { data } = await api.get<Product>(
      `/products/${encodeURIComponent(slug)}`,
    );
    return data;
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) return null;
    throw e;
  }
}

export interface ReviewsPage {
  items: Review[];
  pagination: Pagination;
}

/** Visible reviews for a product (paginated, newest first). Keyed by product id. */
export async function getProductReviews(
  productId: number,
  page = 1,
): Promise<ReviewsPage> {
  const { data, meta } = await api.get<Review[]>(
    `/products/${productId}/reviews?page=${page}`,
  );
  const pagination =
    (meta?.pagination as Pagination | undefined) ?? FALLBACK_PAGINATION;
  return { items: data, pagination };
}

/** Primary image URL for a product (falls back to the first image, if any). */
export function primaryImage(product: Product): string | null {
  const images = product.images ?? [];
  const primary = images.find((img) => img.is_primary) ?? images[0];
  return primary?.url ?? null;
}

/** Map a Product onto the props the shared <ProductCard> expects. */
export function productToCardProps(product: Product): ProductCardProps {
  return {
    productId: product.id,
    name: product.name,
    price: product.price,
    href: `/products/${product.slug}`,
    image: primaryImage(product),
    category: product.category?.name,
    rating: product.reviews_summary?.average ?? null,
    reviewCount: product.reviews_summary?.count,
    stock: product.stock_quantity,
    featured: product.is_featured,
  };
}
