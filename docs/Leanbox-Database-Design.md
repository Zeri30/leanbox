# Leanbox — Database Design (ERD Companion)

**Deliverable:** Database Design / Entity Relationship Model
**Source of truth:** `Leanbox-System-Requirements.pdf`
**Diagram file:** `Leanbox-ERD.mermaid`
**Target engine:** PostgreSQL (relational, ACID — best fit for orders, payments, and recurring billing)

---

## 1. Overview

The model has **17 tables** organized into six domains, derived from the admin and customer user stories plus the rider-based delivery model:

| Domain | Tables |
|---|---|
| Identity & access | `users`, `addresses` |
| Catalog | `categories`, `products`, `product_images`, `nutrition_facts` |
| Cart & checkout | `carts`, `cart_items`, `orders`, `order_items`, `payments` |
| Subscriptions | `subscription_plans`, `subscriptions`, `subscription_payments` |
| Fulfillment | `deliveries` |
| Engagement | `reviews`, `notifications` |

A single `users` table with a `role` enum (`admin` / `customer` / `rider`) serves all three actor types, so admin, customer, and rider stories share one identity model.

---

## 2. Entities

### users
Administrators, customers, and delivery riders. `role` distinguishes them; `status` supports the admin story "disable or suspend accounts." `password_hash` (never plain text) supports secure login. Email is unique. Riders are simply users with `role = rider` and access only to their assigned deliveries.

### addresses
A user can save multiple delivery addresses (`is_default` flags the primary). Referenced by both `orders` and `subscriptions` so delivery info is reusable and consistent.

### categories
Product types: vegetarian meals, high-protein meals, supplements, healthy snacks, wellness. Drives "filter products by category" and "categorize products by type."

### products
Core catalog entity. `is_featured` / `is_best_selling` power the homepage placement stories; `stock_quantity` + `low_stock_threshold` power the admin low-stock alerts; `is_active` enables soft-delete of discontinued items (keeps order history intact rather than a hard delete).

### product_images
One-to-many so a product can show multiple images; `is_primary` and `sort_order` control display order on product detail pages.

### nutrition_facts
One-to-one with `products`. Split into its own table because nutrition data is only meaningful for edible products (meals, snacks, supplements) and not for general wellness gear — keeps `products` lean and avoids many null columns.

### carts / cart_items
One active cart per user (`users ||--o| carts`). `cart_items` stores quantity and a `unit_price` snapshot. Supports add / update quantity / remove / view summary.

### orders / order_items
`orders` captures status lifecycle (`pending → confirmed → preparing → shipped → delivered → cancelled`) matching the admin status-update story exactly, plus money breakdown (`subtotal`, `shipping_fee`, `tax`, `total`). `order_items` snapshots `product_name`, `unit_price`, and `line_total` at purchase time so historical orders stay accurate even if the product later changes or is deactivated.

### payments
One-to-one with an order. Holds method, status, amount, and gateway `transaction_id`. Separated from `orders` so refunds and payment retries don't bloat the order record.

### subscription_plans
Admin-created recurring meal plans: `meal_type`, `price`, `billing_interval`, `meals_per_cycle`. Editable per the "edit subscription plans, pricing, and delivery schedules" story.

### subscriptions
A customer's active subscription to a plan. `status` (`active / paused / cancelled`) supports manage/pause/cancel; `delivery_schedule` and `next_delivery_date` drive recurring fulfillment; links to a delivery address.

### subscription_payments
Recurring billing records per cycle, separate from one-off `payments`. Gives a clean billing history and supports "subscription history and status."

### deliveries
The fulfillment record for the rider model. A delivery belongs to **either** a one-off `order` **or** a `subscription` cycle (exactly one of the two FKs is set), is assigned to a `rider` (a user with `role = rider`), and targets a `delivery_address`. `status` tracks `pending → assigned → out_for_delivery → delivered` (or `failed`); `assigned_at` / `delivered_at` timestamp the lifecycle; `proof_image_url` holds rider proof-of-delivery; `delivery_notes` captures field notes. Admins create/assign deliveries; riders update status and upload proof from their view.

### reviews
Tied to `user`, `product`, and the `order` that justifies it (verified-purchase support). `rating` (1–5) + `comment`; `is_hidden` lets admins moderate inappropriate reviews without deleting data.

### notifications
Unified table for both actors via `type` enum — covers customer order/subscription/promo alerts and admin new-order/low-stock alerts. `is_read` supports the "mark as read" stories.

---

## 3. Key relationships

- `users 1—N addresses, orders, subscriptions, reviews, notifications`
- `users 1—1 carts` (one active cart)
- `categories 1—N products`
- `products 1—N product_images, cart_items, order_items, reviews`
- `products 1—1 nutrition_facts`
- `carts 1—N cart_items`
- `orders 1—N order_items`; `orders 1—1 payments`
- `addresses 1—N orders` and `1—N subscriptions` (delivery target)
- `subscription_plans 1—N subscriptions`; `subscriptions 1—N subscription_payments`
- `orders 1—1 deliveries`; `subscriptions 1—N deliveries`; `users (rider) 1—N deliveries`; `addresses 1—N deliveries`

---

## 4. Design decisions worth noting

1. **Soft deletes over hard deletes** (`is_active` on products/categories) — discontinuing a product must not break historical orders/reviews.
2. **Price + name snapshots** on `cart_items` and `order_items` — protects order history from later price/name edits.
3. **Single users table** — simpler auth and one place to manage accounts; role-based access enforced in the API layer.
4. **Separate nutrition table** — avoids sparse null columns for non-edible products.
5. **Two payment tables** — one-off order payments vs. recurring subscription billing have different lifecycles.
6. **Unified notifications** — one table, typed, serves admin, customer, and rider alert stories.
7. **Single deliveries table for orders + subscriptions** — both fulfillment types share one rider workflow and status lifecycle; a `CHECK` constraint enforces exactly one of `order_id` / `subscription_id` is set.

---

## 5. Suggested indexes (for the build phase)

- `users.email` (unique), `products.slug` (unique), `categories.slug` (unique), `orders.order_number` (unique)
- FK columns: `products.category_id`, `order_items.order_id`, `cart_items.cart_id`, `subscriptions.user_id`, `reviews.product_id`
- Filtering: `products(category_id, is_active)`, `products(is_featured)`, `orders(user_id, status)`, `notifications(user_id, is_read)`, `deliveries(rider_id, status)`, `deliveries(order_id)`, `deliveries(subscription_id)`

---

*Next deliverables that build on this ERD: System Architecture, API design, then the full PRD and ClickUp workspace.*
