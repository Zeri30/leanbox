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
  /** Present when the product is eager-loaded (e.g. GET /reviews/me). */
  product_name?: string;
  user_id: number;
  rating: number;
  comment: string | null;
  is_hidden: boolean;
  created_at: string | null;
  reviewer?: string;
}

/** Notification categories (App\Enums\NotificationType). */
export type NotificationType =
  | "order_update"
  | "subscription"
  | "promotion"
  | "new_order"
  | "low_stock"
  | "delivery_assigned"
  | "system";

/** Mirrors backend App\Http\Resources\NotificationResource. */
export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string | null;
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

/** Mirrors backend App\Http\Resources\AddressResource. */
export interface Address {
  id: number;
  label: string | null;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at: string | null;
}

/** Payload for POST /addresses. */
export interface NewAddress {
  label?: string | null;
  recipient_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  is_default?: boolean;
}

/** Backend App\Enums\PaymentMethod. COD is the only active gateway for now. */
export type PaymentMethod = "cod" | "gcash" | "card" | "paypal";

/** Order lifecycle (App\Enums\OrderStatus). */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

/** Mirrors backend App\Http\Resources\OrderItemResource. */
export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

/** Mirrors backend App\Http\Resources\PaymentResource. */
export interface Payment {
  id: number;
  method: PaymentMethod;
  status: string;
  amount: string;
  transaction_id: string | null;
  paid_at: string | null;
}

/** Mirrors backend App\Http\Resources\OrderResource. */
export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: string;
  shipping_fee: string;
  tax: string;
  total: string;
  delivery_address_id: number;
  placed_at: string | null;
  created_at: string | null;
  items?: OrderItem[];
  payment?: Payment;
}

/* ---------------------------------------------------------------------------
 * Subscriptions — mirrors backend Subscription resources.
 * ------------------------------------------------------------------------ */

/** Subscription lifecycle (App\Enums\SubscriptionStatus). */
export type SubscriptionStatus = "active" | "paused" | "cancelled";

/** Cadence a subscription is delivered/billed on (App\Enums\DeliverySchedule). */
export type DeliverySchedule = "daily" | "weekly" | "biweekly";

/** Plan billing cadence (App\Enums\BillingInterval). */
export type BillingInterval = "weekly" | "monthly";

/** Plan meal focus (App\Enums\MealType). */
export type MealType = "vegetarian" | "high_protein" | "mixed";

/** Actions accepted by PATCH /subscriptions/{id} (App\...\ManageSubscriptionRequest). */
export type SubscriptionAction = "pause" | "resume" | "cancel";

/** Mirrors backend App\Http\Resources\SubscriptionPlanResource (price is decimal string). */
export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string | null;
  meal_type: MealType;
  price: string;
  billing_interval: BillingInterval;
  meals_per_cycle: number;
  is_active: boolean;
}

/** Mirrors backend App\Http\Resources\SubscriptionPaymentResource. */
export interface SubscriptionPayment {
  id: number;
  amount: string;
  status: string;
  billing_date: string | null;
  paid_at: string | null;
}

/** Mirrors backend App\Http\Resources\SubscriptionResource. */
export interface Subscription {
  id: number;
  status: SubscriptionStatus;
  delivery_schedule: DeliverySchedule;
  start_date: string | null;
  next_delivery_date: string | null;
  cancelled_at: string | null;
  delivery_address_id: number;
  plan?: SubscriptionPlan;
  payments?: SubscriptionPayment[];
}
