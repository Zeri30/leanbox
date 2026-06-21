# Leanbox — System Architecture Document

**Version:** 1.0 (planning)
**Companion files:** `Leanbox-Architecture-Diagram.mermaid`, `Leanbox-Tech-Stack.md`, `Leanbox-ERD.mermaid`, `Leanbox-Database-Design.md`
**Status:** Pre-development blueprint — no code yet.

---

## 1. Architectural overview

Leanbox uses a **decoupled client–server architecture**: a Next.js + Tailwind frontend (storefront and admin dashboard) talking to a **Laravel REST API**, backed by PostgreSQL via Eloquent, with Redis for caching/queues, object storage for images, and external services for payments and notifications.

The API is organized into **feature domains** (catalog, cart, orders, subscriptions, payments, inventory, deliveries, reviews, notifications, auth). This is a **modular monolith** to start — one deployable Laravel application with clean internal boundaries — which is simpler to build and operate than microservices, while the domain boundaries leave a clear path to split services later if scale demands it. Recurring subscription billing is handled by **Laravel Cashier (Stripe)**.

See `Leanbox-Architecture-Diagram.mermaid` for the visual.

---

## 2. Frontend architecture

Three role-based surfaces share one design system and type definitions:

- **Storefront** — public + authenticated customer experience: browsing, search/filter, product detail, cart, checkout, order history, subscription management, reviews, notifications.
- **Admin dashboard** — protected by role: dashboard/analytics, product & category CRUD, image upload, order processing, subscription plan management, customer management, **delivery assignment**, review moderation.
- **Rider view** — mobile-first, minimal: a rider sees only their assigned deliveries and can mark out-for-delivery / delivered and upload proof.

**Rendering strategy:** Server-render (SSR/SSG) public catalog and product pages for SEO and speed; client-render authenticated, interactive areas (cart, dashboard). **TanStack Query** handles server data with caching and optimistic updates; **Zustand** holds light UI state like the cart drawer.

### Proposed frontend folder structure (`leanbox-web` — standalone Next.js app)

```
leanbox-web/
├─ app/
│  ├─ (shop)/                 # products, categories, product/[slug]
│  ├─ (account)/              # profile, orders, subscriptions
│  ├─ (admin)/                # admin dashboard (role-gated route group)
│  │   └─ dashboard, products, orders, subscriptions, customers, deliveries, reviews
│  ├─ (rider)/                # rider view (role-gated, mobile-first): my deliveries
│  ├─ cart/  checkout/
│  └─ layout.tsx
├─ components/                # UI built on shadcn/ui
├─ features/                  # cart, catalog, reviews (hooks + components)
├─ lib/                       # API client (calls Laravel), TanStack Query setup, utils
├─ types/                     # TS types mirroring the API DTOs (from OpenAPI)
└─ styles/                    # tailwind theme tokens (dark + green)
```

The storefront and admin live in one Next.js app, separated by route groups; the admin group is gated by role. The frontend talks to the Laravel API over REST; TypeScript types are generated from the API's OpenAPI spec to stay in sync.

---

## 3. Backend architecture

A **Laravel** application following the controller → service/action → Eloquent model layering, organized by domain. Form Requests handle validation, API Resources shape JSON responses, Policies enforce authorization, and Jobs run background work on the queue. Recurring billing uses **Laravel Cashier**.

### Proposed backend folder structure (`leanbox-api` — Laravel)

```
leanbox-api/
├─ app/
│  ├─ Http/
│  │  ├─ Controllers/Api/       # Auth, Product, Cart, Order, Subscription,
│  │  │                         #   Payment, Delivery, Review, Notification, Admin/*, Rider/*
│  │  ├─ Requests/              # FormRequest validation per endpoint
│  │  ├─ Resources/             # API Resources (JSON transformers)
│  │  └─ Middleware/            # auth:sanctum, role checks, throttling
│  ├─ Models/                   # User, Product, Category, Order, OrderItem,
│  │                            #   Cart, Subscription, Payment, Delivery, Review, ...
│  ├─ Services/                 # business logic (Catalog, Order, Inventory...)
│  ├─ Policies/                 # authorization (admin vs. customer, ownership)
│  ├─ Jobs/                     # RecurringBilling, SendNotification, LowStock
│  ├─ Events/ + Listeners/      # order placed, low stock, subscription renewed
│  └─ Notifications/            # mail + database (in-app) notifications
├─ routes/
│  ├─ api.php                   # /api/v1 routes (public + auth + admin groups)
│  └─ console.php               # scheduled commands (billing scheduler)
├─ database/
│  ├─ migrations/               # schema from the ERD
│  ├─ factories/ + seeders/     # demo/test data
├─ config/                      # cashier, services (Stripe/PayMongo), queue
└─ tests/                       # Pest/PHPUnit (Feature + Unit)
```

Payments use a **gateway-adapter** layer in `app/Services/Payments/` so Stripe (cards + Cashier subscriptions) and PayMongo/Xendit (GCash) share one interface. The Laravel **scheduler** (`console.php`) triggers the recurring-billing job each cycle.

---

## 4. API architecture (REST)

Versioned base path `/api/v1`. JSON over HTTPS. Consistent response envelope `{ data, meta, error }`, cursor/offset pagination on list endpoints, and standard HTTP status codes. Representative endpoints:

| Domain | Endpoints (representative) |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` (Sanctum tokens) |
| Users | `GET/PATCH /users/me`, `PATCH /users/me/password`, `GET /admin/users`, `PATCH /admin/users/:id/status` |
| Catalog | `GET /products` (search/filter/sort), `GET /products/:slug`, `POST/PATCH/DELETE /admin/products`, `POST /admin/products/:id/images`, `GET /categories` |
| Cart | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id` |
| Orders | `POST /orders` (checkout), `GET /orders` (my orders), `GET /orders/:id`, `PATCH /orders/:id/cancel`, `GET /admin/orders`, `PATCH /admin/orders/:id/status` |
| Payments | `POST /payments/intent`, `POST /payments/webhook` (Stripe/GCash) |
| Subscriptions | `GET /plans`, `POST /subscriptions`, `PATCH /subscriptions/:id` (pause/resume/cancel), `GET /subscriptions`, `POST/PATCH /admin/plans` |
| Inventory | `PATCH /admin/products/:id/stock`, `GET /admin/inventory/low-stock` |
| Deliveries | `GET /admin/deliveries`, `POST /admin/deliveries/:id/assign`, `PATCH /admin/deliveries/:id` (reassign/fail), `GET /rider/deliveries` (mine), `PATCH /rider/deliveries/:id/status`, `POST /rider/deliveries/:id/proof` |
| Reviews | `GET /products/:id/reviews`, `POST /products/:id/reviews`, `GET /reviews/me`, `PATCH /admin/reviews/:id` (hide), `GET /admin/reviews/stats` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read` |
| Analytics | `GET /admin/dashboard/summary`, `GET /admin/analytics/best-sellers` |

Admin routes are grouped under `/admin/*` and protected by the role middleware + policies.

---

## 5. Authentication & authorization flow

**Authentication:** Email + password via **Laravel Sanctum**. Passwords hashed with **bcrypt**. On login the API issues a Sanctum API token the React client stores and sends as a Bearer token; logout revokes the token. (Sanctum's SPA/cookie mode is an alternative if frontend and API share a domain.)

**Authorization (RBAC):** Requests pass the `auth:sanctum` middleware, then a **role middleware** and **Laravel Policies**. The `users.role` field gates access across **three roles** — `admin` reaches `/admin/*`; `customer` reaches their own resources only; `rider` reaches `/rider/*` and only their **assigned** deliveries. Policies enforce ownership so a customer can only touch their own cart/orders/subscriptions/reviews and a rider can only touch deliveries assigned to them. Suspended accounts (`status = suspended`) are rejected by middleware.

```
Login → verify hash → issue Sanctum token
Request → auth:sanctum → role middleware → Policy (ownership) → Controller
Logout → revoke token
```

---

## 6. Core domain flows

**Product management (admin).** Create/edit product → upload images to Cloudinary (URLs stored in `product_images`) → set category, price, nutrition, flags → product appears in catalog. Soft-delete (`is_active = false`) instead of hard delete to preserve order history.

**Browse & cart (customer).** Catalog served via cached, SSR product/category pages → add to cart (`cart_items` with price snapshot) → update/remove → cart summary computes subtotal/total.

**Checkout & order.** `POST /orders` validates stock, snapshots line items, creates an `order` (`status = pending`) → creates a payment intent → on payment success (webhook) order moves to `confirmed`, stock is decremented, and a notification fires. Admin then advances `confirmed → preparing → shipped`; the final `delivered` transition is driven by the rider (see Delivery). Customer can cancel while `pending`.

**Delivery (rider).** When an order is ready (or a subscription cycle is due), the admin creates a `deliveries` record and **assigns a rider** → rider is notified and the delivery shows in their view (`status = assigned`). The rider marks `out_for_delivery`, then `delivered` with a proof-of-delivery photo. Marking `delivered` advances the linked order to `Delivered` (enabling the customer review) and notifies the customer. A delivery references exactly one order **or** one subscription cycle, enforced by a DB `CHECK` constraint and validated in the service.

**Payment.** Market is the **Philippines (PHP)**: **GCash is primary** via PayMongo/Xendit, with **Stripe for cards** and **COD** supported. The Payment Service uses a **gateway-adapter pattern** so all providers share one interface. Webhooks are the source of truth for payment status; the `payments` row records method, status, amount, transaction id.

**Inventory.** Stock decrements on confirmed orders/recurring deliveries. After each decrement the Inventory Service checks `stock_quantity <= low_stock_threshold` and emits a **low-stock event** → admin notification. Admins can manually adjust stock.

**Subscriptions (recurring).** Customer selects a plan + delivery schedule → `subscriptions` row created (`status = active`, `next_delivery_date` set) → a scheduled **billing job** (Laravel Cashier + Stripe) charges each cycle, writes a `subscription_payments` row, generates the delivery, and fires a renewal notification. Customer can pause/resume/cancel; admin manages plans and views active/cancelled subscriptions.

**Notifications.** Domain events (new order, order status change, low stock, subscription renewal, promotions) publish to the Notification Service, which writes in-app `notifications` and optionally sends email/SMS. `is_read` tracks state for both admin and customer.

---

## 7. Deployment & infrastructure

Frontend (Next.js) on **Vercel** (global CDN, SSR). Laravel API on **Laravel Forge + a VPS** (or Render/Railway) with a **queue worker** and the **scheduler** (cron → `schedule:run`) running alongside. Managed **PostgreSQL** (Neon/Supabase) with automated backups; **Redis** managed instance; images on **Cloudinary/S3+CloudFront**. **GitHub Actions** runs lint/test/build then deploys on merge to `main`. **Sentry** for error tracking; structured logs from the platform. Secrets via platform env vars (never committed).

```
Dev → PR → GitHub Actions (Pest + frontend tests, build) → Preview deploy
Merge main → deploy API + web → run `php artisan migrate --force` → smoke test
```

---

## 8. Scalability & cross-cutting concerns

- **Stateless API** behind a load balancer → horizontal scaling; cache and tokens live in Redis/DB, not memory.
- **Caching:** Redis for hot catalog reads; CDN for static/SSG pages and images.
- **Background jobs:** recurring billing, email/SMS, and low-stock alerts run on **Laravel Queues (Redis driver)**, keeping request latency low.
- **Security:** HTTPS everywhere, input validation (Form Requests), rate limiting/throttling, CORS allowlist, parameterized queries via Eloquent, webhook signature verification, secrets in env/vault.
- **Observability:** Sentry + request logging + health checks.
- **Path to microservices:** payments, subscriptions, and notifications are the most likely first extractions thanks to clean domain boundaries.

---

## 9. Requirement coverage check

| Requirement domain | Covered by |
|---|---|
| Admin dashboard & analytics | Analytics module, `/admin/dashboard/*` |
| Product management + images | Catalog module, Cloudinary, `products`/`product_images` |
| Low-stock alerts | Inventory module + Notification events |
| Meal subscription management | Subscriptions module, plans + recurring billing |
| Delivery management (rider) | Deliveries module, `/admin/deliveries/*` + `/rider/deliveries/*`, `deliveries` table |
| Order management + statuses | Orders module, status lifecycle |
| Customer management + suspend | Users module, `status` + RolesGuard |
| Reviews & moderation | Reviews module, `is_hidden` |
| Notifications (admin + user) | Notification Service, unified `notifications` |
| Account/auth/profile/password | Auth + Users modules, JWT + RBAC |
| Browse/search/filter | Catalog module, SSR + query params |
| Cart & checkout | Cart + Orders modules |
| Payments incl. GCash | Payment Service, gateway adapters |

---

*Next deliverables that build on this: Product Requirements Document (PRD), User Flow Diagrams, then UI/UX Design Plan + Figma structure, then Development Roadmap, Sprint/Task Breakdown, and the ClickUp workspace.*
