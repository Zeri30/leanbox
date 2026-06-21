# Leanbox — Sprint & Task Breakdown

**Deliverable:** Sprint & Task Breakdown (feeds the ClickUp workspace)
**Builds on:** `Leanbox-Development-Roadmap.md`, PRD, Architecture
**Structure:** Milestones → Epics → Tasks → Subtasks, separated by workstream (Database/Infra · Backend · Frontend · QA · Deployment).

---

## How this maps to ClickUp

| Planning concept | ClickUp object |
|---|---|
| Workstream (Backend, Frontend, …) | **Folder** |
| Epic (Auth, Catalog, Cart…) | **List** |
| Task | **Task** |
| Subtask | **Subtask** |
| Sprint (0–7) | **Tag** on each task |
| Milestone (M0–M7) | **Milestone task** |

Sprints are 2 weeks each (Sprint 0 is a 1-week setup). Adjust cadence to your real capacity.

---

## Sprint plan (what to work on, when)

| Sprint | Weeks | Focus | Milestone |
|---|---|---|---|
| Sprint 0 | Wk 1 | Project setup, design finalize, DB schema | M0, M1 |
| Sprint 1 | Wk 2–3 | Auth & users (BE) + FE setup/shared components | — |
| Sprint 2 | Wk 4–5 | Catalog + Cart/Orders (BE) + storefront pages (FE) | M2 |
| Sprint 3 | Wk 6–7 | Payments + Subscriptions (BE) + checkout UI (FE) | M3 |
| Sprint 4 | Wk 8–9 | Deliveries/Reviews/Notifications (BE) + account UI | M4 |
| Sprint 5 | Wk 10–11 | Admin dashboard + Rider view + polish | M5 |
| Sprint 6 | Wk 12–13 | Testing & QA, bug fixes, UAT | M6 |
| Sprint 7 | Wk 14 | Deployment & launch | M7 |

---

## Workstream A — Database & Infrastructure

### Epic: Project scaffolding (Sprint 0)
- Task: Initialize Laravel API repo — *subtasks:* set up repo, env, PostgreSQL connection, Redis, code style/linting, base CI.
- Task: Initialize Next.js web repo — *subtasks:* Next.js + TypeScript, Tailwind theme tokens, shadcn/ui, ESLint/Prettier, API client scaffold.
- Task: Shared conventions — *subtasks:* OpenAPI doc setup, error envelope, commit/PR conventions.

### Epic: Database schema (Sprint 0)
- Task: Migrations for all 17 tables — *subtasks:* users/addresses, categories/products/product_images/nutrition_facts, carts/cart_items, orders/order_items/payments, subscription_plans/subscriptions/subscription_payments, deliveries, reviews, notifications.
- Task: Eloquent models + relationships — *subtasks:* define models, relations, casts, the order/subscription CHECK constraint on deliveries.
- Task: Seeders & factories — *subtasks:* demo users (admin/customer/rider), products across all categories, sample orders/subscriptions/deliveries.

## Workstream B — Backend (API)

### Epic: Auth & users (Sprint 1)
- Task: Registration & login (Sanctum) — *subtasks:* register, login, logout, token issue/revoke, password hashing.
- Task: Roles & policies — *subtasks:* role middleware (admin/customer/rider), ownership policies, suspended-account block.
- Task: Profile & password — *subtasks:* update profile, change password, admin list/suspend users.

### Epic: Catalog (Sprint 2)
- Task: Products & categories CRUD — *subtasks:* admin create/edit/soft-delete, category management, featured/best-seller flags.
- Task: Images & nutrition — *subtasks:* Cloudinary upload, image ordering, nutrition facts.
- Task: Browse API — *subtasks:* list/search/filter/sort, product detail, stock display.

### Epic: Cart & Orders (Sprint 2)
- Task: Cart — *subtasks:* add/update/remove items, price snapshot, totals.
- Task: Checkout & orders — *subtasks:* create order, stock validation + decrement, order status lifecycle, cancel-while-pending.
- Task: Admin order management — *subtasks:* list/detail, status updates, cancel + restock.

### Epic: Payments (Sprint 3)
- Task: Gateway adapter layer — *subtasks:* common interface, config for Stripe + PayMongo/Xendit.
- Task: GCash + card checkout — *subtasks:* payment intent, redirect/confirm, COD handling.
- Task: Webhooks — *subtasks:* signature verification, status sync, idempotency.

### Epic: Subscriptions (Sprint 3)
- Task: Plans & subscribe (Cashier) — *subtasks:* plan CRUD, subscribe flow, first charge.
- Task: Recurring billing — *subtasks:* scheduler + queue job, subscription_payments, dunning/retry.
- Task: Manage subscription — *subtasks:* pause/resume/cancel, history/status.

### Epic: Deliveries (Sprint 4)
- Task: Delivery creation & assignment — *subtasks:* create from order/subscription cycle, assign rider, reassign/fail.
- Task: Rider endpoints — *subtasks:* my-deliveries, status updates, proof-of-delivery upload, order-status sync on delivered.

### Epic: Reviews, Notifications, Analytics (Sprint 4)
- Task: Reviews — *subtasks:* verified-purchase review, list, admin hide, review stats.
- Task: Notifications — *subtasks:* event fan-out (order/subscription/promo/new-order/low-stock/delivery), in-app + email, mark-read.
- Task: Inventory & analytics — *subtasks:* low-stock event, dashboard summary, best-sellers.

## Workstream C — Frontend (Web)

### Epic: Foundation (Sprint 1)
- Task: Theme & shared UI — *subtasks:* Tailwind tokens, buttons/cards/inputs/badges/nav, Framer Motion setup, layout shells.
- Task: Auth screens — *subtasks:* login, register, profile, change password.

### Epic: Storefront (Sprint 2)
- Task: Home & catalog — *subtasks:* landing/hero, category links, featured/best-sellers, listing with filter/search.
- Task: Product detail — *subtasks:* gallery, nutrition/ingredients, reviews, add-to-cart, sticky mobile bar.

### Epic: Cart & Checkout (Sprint 3)
- Task: Cart — *subtasks:* line items, qty/remove, summary, sticky mobile total.
- Task: Checkout — *subtasks:* address step, payment method (GCash/card/COD), review & place, confirmation screen.

### Epic: Customer account (Sprint 4)
- Task: Orders & subscriptions — *subtasks:* order history/detail/status timeline/cancel, subscription manage/pause/cancel/history.
- Task: Reviews & notifications — *subtasks:* submit/view reviews, notifications feed + mark read.

### Epic: Admin dashboard (Sprint 5)
- Task: Dashboard & catalog mgmt — *subtasks:* KPI cards, charts, product/category management UI, image uploader.
- Task: Orders/subscriptions/customers — *subtasks:* tables + detail, status updaters, plan management, customer suspend.
- Task: Deliveries & reviews — *subtasks:* delivery assignment UI, review moderation, stats.

### Epic: Rider view + polish (Sprint 5)
- Task: Rider app — *subtasks:* my-deliveries list, delivery detail, status buttons, proof upload.
- Task: Animation & polish pass — *subtasks:* micro-interactions, transitions, skeletons, empty/error states, reduced-motion.

## Workstream D — Testing & QA (Sprint 6; continuous from Sprint 1)

### Epic: Quality assurance
- Task: Automated tests — *subtasks:* Pest feature/unit, Vitest components, Playwright E2E (register→checkout, subscribe→recurring, rider deliver).
- Task: Payments & security — *subtasks:* sandbox payment tests, authz review, webhook + rate-limit checks.
- Task: Accessibility & performance — *subtasks:* AA contrast, reduced-motion, mobile LCP, image optimization.
- Task: UAT & bug fixing — *subtasks:* scenario walkthroughs, bug log, fixes.

## Workstream E — Deployment (Sprint 7)

### Epic: Launch
- Task: Provision infrastructure — *subtasks:* Vercel (web), Forge/VPS (API + queue worker + scheduler), managed Postgres + Redis, Cloudinary.
- Task: Go-live config — *subtasks:* env/secrets, live payment keys + webhooks, domain/SSL, Sentry, backups.
- Task: CI/CD & launch — *subtasks:* GitHub Actions deploy, migrations, smoke tests, soft launch, runbook.

---

## Milestone tasks (gates)
M0 Blueprint approved · M1 Database live · M2 Core commerce API · M3 Payments + subscriptions · M4 Storefront usable · M5 Admin + rider complete · M6 QA passed · M7 Launch.

*Final step: build this structure in the connected ClickUp workspace.*
