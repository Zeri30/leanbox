# CLAUDE.md — Leanbox project context

> Monorepo layout: this repo holds both apps — **`backend/`** (Laravel API, was "leanbox-api") and **`frontend/`** (Next.js web, was "leanbox-web") — plus shared `docs/`. This file lives at the repo root and Claude Code reads it automatically every session. Keep it accurate as decisions change.

## What Leanbox is
A fitness-focused e-commerce platform (Philippines market, PHP currency) selling vegetarian meals, high-protein meal packages, supplements, healthy snacks, wellness products, and recurring meal-prep subscriptions. There are three user roles: **admin**, **customer**, and **rider** (delivery).

## Source of truth
All planning docs live in `docs/`. Always consult them before building:
- `Leanbox-PRD.md` — features & acceptance criteria (the spec)
- `Leanbox-ERD.mermaid` + `Leanbox-Database-Design.md` — data model (17 tables)
- `Leanbox-System-Architecture.md` — architecture, API design, auth, folder structure
- `Leanbox-Tech-Stack.md` — the stack
- `Leanbox-User-Flows.md` (+ flow diagrams) — user journeys
- `Leanbox-UIUX-Design-Plan.md` + `Leanbox-StyleGuide.html` — design system & animation
- `Leanbox-Sprint-Task-Breakdown.md` + `Leanbox-Development-Roadmap.md` — what to build when

If anything in a task conflicts with these docs, **stop and flag it** — don't guess.

## Tech stack
- **Frontend (`frontend/`):** Next.js (App Router) + React + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion. State: TanStack Query + Zustand.
- **Backend (`backend/`):** Laravel (PHP 8.2+) + Eloquent + Sanctum (auth).
- **Database:** PostgreSQL via **Supabase**. **Cache/queue:** **Laravel `database` driver** (no Redis). **Images:** **Supabase Storage** (S3-compatible → Laravel S3 filesystem driver), bucket **`leanbox-images`** — all product/uploaded images go here.
- **Payments (current):** **COD only.** Stripe (cards), PayMongo/Xendit (GCash), and Laravel Cashier are **deferred** — do not pull in these packages yet.

> **Stack decisions (deviations from the blueprint docs — these override the docs):**
> - **Supabase** provides Postgres + image storage, replacing the docs' separate Postgres host + Cloudinary.
> - **No Redis.** Queues, cache, and the recurring-billing scheduler run on Laravel's `database` driver. Revisit if job throughput demands it.
> - **Payments simplified to COD** for now; revisit Stripe/GCash/Cashier before Sprint 3.
> The `docs/` files still describe the original Cloudinary/Redis/full-payments plan — treat this section as the current truth where they conflict.

## Architecture rules
- Backend is a **modular monolith** organized by domain (auth, catalog, cart, orders, payments, subscriptions, deliveries, reviews, notifications, analytics).
- Layering: Controller → Service/Action → Eloquent model. Validate with Form Requests, shape JSON with API Resources, authorize with Policies, run background work with Jobs.
- API is REST under `/api/v1`, JSON envelope `{ data, meta, error }`. Admin routes under `/admin/*`, rider routes under `/rider/*`.
- Frontend talks to the API over REST; generate TS types from the OpenAPI spec.

## Non-negotiable business rules (get these right)
1. **Three roles, strict RBAC.** Customers touch only their own data; riders see only deliveries assigned to them; admins manage everything. Enforce with middleware + Policies. Suspended users are blocked at auth.
2. **Soft-delete products** (`is_active = false`) — never hard delete; it must not break order history.
3. **Snapshot price + name** onto `cart_items` and `order_items` so later product edits don't change past orders.
4. **Order creation + stock decrement run in a DB transaction** (avoid overselling). Emit a low-stock event when stock ≤ threshold.
5. **Order status lifecycle:** pending → confirmed → preparing → shipped → delivered (or cancelled from pending/confirmed). Only valid transitions allowed.
6. **The rider sets "Delivered"** (with proof-of-delivery), which advances the order and unlocks the customer review. Admin/customer do not set Delivered directly.
7. **A delivery references exactly one** order OR subscription cycle (DB CHECK + service validation).
8. **Payments are confirmed by webhooks**, not client-side success. Verify webhook signatures; make handlers idempotent.
9. **Recurring billing** runs via the scheduler + queue (Cashier); each cycle writes a `subscription_payments` row and creates a delivery; handle dunning/retry on failure.
10. **Notifications** are one unified, typed system serving all three roles (in-app + email).

## Design rules (frontend)
- Dark theme + green accent. Use the exact tokens in `Leanbox-UIUX-Design-Plan.md` §2–§4 (and match `Leanbox-StyleGuide.html`). Put tokens in `tailwind.config.ts` and reference semantic names (`bg-primary`, `text-primary`).
- Mobile-first and responsive. Build the shared component library once, compose pages from it.
- Animation is restrained — follow the spec in UI/UX §8; honor `prefers-reduced-motion`.

## How to work
- **One task at a time.** Plan first, then implement in small steps, then add tests, then stop.
- Every task has a **Definition of Done** — satisfy it (including tests) before considering it complete.
- Tests: PHPUnit (backend), Vitest + RTL (frontend), Playwright (E2E for register→checkout, subscribe→recurring, rider deliver).
- Never commit secrets. Keep `.env` out of git.
- Round all currency/numbers shown to users.

## Commands (fill in as the repos are created)
- API: `php artisan migrate`, `php artisan test` (PHPUnit), `php artisan queue:work`, `php artisan schedule:work`
- Web: `npm run dev`, `npm run test`, `npm run build`, `npm run lint`
