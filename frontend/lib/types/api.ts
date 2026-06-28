/** Shapes mirroring the backend's { data, meta, error } envelope (see backend App\Support\ApiResponse). */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: Record<string, unknown> | null;
  error: ApiError | null;
}

export type UserRole = "admin" | "customer" | "rider";
export type UserStatus = "active" | "suspended";

/** Mirrors backend App\Http\Resources\UserResource. */
export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  created_at: string | null;
}

/** Response body for POST /auth/login and /auth/register. */
export interface AuthResult {
  user: User;
  token: string;
}

/* ---------------------------------------------------------------------------
 * Catalog (storefront browse) — mirrors backend Catalog resources.
 * ------------------------------------------------------------------------ */

/** Mirrors backend App\Http\Resources\CategoryResource. */
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

/** Mirrors backend App\Http\Resources\ProductImageResource. */
export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

/** Availability computed by Product::stockStatus(). */
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface ReviewsSummary {
  count: number;
  average: number | null;
}

/** Mirrors backend App\Http\Resources\ProductResource (decimal price is a string). */
export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_featured: boolean;
  is_best_selling: boolean;
  is_active: boolean;
  stock_status: StockStatus;
  created_at: string | null;
  updated_at: string | null;
  category?: Category;
  images?: ProductImage[];
  nutrition?: NutritionFact | null;
  reviews_summary?: ReviewsSummary;
}

/** Shape of meta.pagination on the products index response. */
export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/** Mirrors backend App\Http\Resources\NutritionFactResource (macros are decimal strings). */
export interface NutritionFact {
  serving_size: string | null;
  calories: number | null;
  protein_g: string | null;
  carbs_g: string | null;
  fat_g: string | null;
  fiber_g: string | null;
  sugar_g: string | null;
  sodium_mg: string | null;
  ingredients: string | null;
}

/** Mirrors backend App\Http\Resources\ReviewResource. */
export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  comment: string | null;
  is_hidden: boolean;
  created_at: string | null;
  reviewer?: string;
}

/** Mirrors backend App\Http\Resources\CartItemResource. */
export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  line_total: string;
  product?: {
    id: number;
    name: string;
    slug: string;
    price: string;
    stock_status: StockStatus;
    primary_image: string | null;
  };
}

/** Mirrors backend App\Http\Resources\CartResource. */
export interface Cart {
  id: number;
  items: CartItem[];
  item_count: number;
  subtotal: string;
}
