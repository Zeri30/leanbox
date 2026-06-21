# Leanbox — Development Roadmap

**Deliverable:** Development Roadmap
**Companion:** `Leanbox-Roadmap-Timeline.mermaid` (visual Gantt)
**Builds on:** PRD, ERD, System Architecture, Tech Stack, User Flows, UI/UX Design Plan

---

## Planning assumptions

- **Capacity:** 1 developer working with Claude Code, roughly full-time. *(Tell me your real capacity/launch date and I'll rescale every duration.)*
- **Stack (locked):** Next.js (React) + Tailwind + Framer Motion · Laravel + Eloquent + Sanctum + Cashier · PostgreSQL · Redis · Stripe + PayMongo/Xendit (GCash) · Cloudinary.
- **Estimate:** ~**15 weeks** to v1 launch, then ongoing maintenance. Phases overlap where safe.
- Planning, UI/UX, and database design are **already largely complete** in this blueprint — the roadmap front-loads those as "done/finalize," so most effort is build, test, deploy.

---

## Phases at a glance

| # | Phase | Duration | Status |
|---|---|---|---|
| 1 | Planning & Requirements | Done (this blueprint) | ✅ Complete |
| 2 | UI/UX Design | Wk 1 (finalize) | ✅ Mostly done |
| 3 | Database Design & Setup | Wk 1–2 | ✅ Designed → build |
| 4 | Backend Development | Wk 2–8 | ⬜ |
| 5 | Frontend Development | Wk 4–11 | ⬜ |
| 6 | Testing & QA | Wk 9–13 (continuous from Wk 4) | ⬜ |
| 7 | Deployment | Wk 13–14 | ⬜ |
| 8 | Maintenance & Future Enhancements | Wk 15+ | ⬜ |

---

## Phase 1 — Planning & Requirements ✅
**Goal:** A complete, agreed blueprint before any code.
**Done:** PRD, ERD, architecture, tech stack, user flows, UI/UX plan, rider model, payment market decision.
**Exit criteria:** All planning docs reviewed and approved (this is the gate we're at now).

## Phase 2 — UI/UX Design (Week 1, finalize)
**Goal:** Lock the visual system so the frontend has no ambiguity.
**Activities:** Confirm green accent + theme in the style guide; finalize component list; (optional) source product photography/placeholder imagery; confirm animation spec.
**Deliverables:** Approved design system + page layouts + animation spec.
**Exit criteria:** Design tokens finalized in writing; sign-off on look & feel.

## Phase 3 — Database Design & Setup (Weeks 1–2)
**Goal:** Turn the ERD into a real, migratable schema.
**Activities:** Scaffold the Laravel project; write migrations for all 17 tables; define Eloquent models + relationships; add the order/subscription delivery CHECK constraint; seeders + factories with demo data; configure PostgreSQL + Redis.
**Deliverables:** Running database, migrations, models, seed data.
**Exit criteria:** `migrate:fresh --seed` builds the full schema with realistic sample data; relationships verified.

## Phase 4 — Backend Development (Weeks 2–8)
**Goal:** A complete, secure REST API behind the storefront, admin, and rider apps.
**Build order (by domain):**
1. Auth & users (Sanctum, roles, policies, suspend) — *Wk 2–3*
2. Catalog: products, categories, images (Cloudinary), nutrition, search/filter — *Wk 3–4*
3. Cart & checkout; orders + status lifecycle — *Wk 4–5*
4. Payments: Stripe + GCash adapters, webhooks — *Wk 5–6*
5. Subscriptions + recurring billing (Cashier) + scheduler/queues — *Wk 6–7*
6. Deliveries: admin assignment + rider endpoints + proof upload — *Wk 7*
7. Reviews, notifications, inventory/low-stock events, admin analytics — *Wk 7–8*
**Deliverables:** Documented API (OpenAPI), Pest tests per domain.
**Exit criteria:** All PRD endpoints implemented, authorized, and passing tests; webhooks verified.

## Phase 5 — Frontend Development (Weeks 4–11)
**Goal:** Build all three surfaces against the API, matching the design system.
**Build order:**
1. Project setup: Next.js + Tailwind theme tokens + shadcn/ui + API client + Framer Motion — *Wk 4*
2. Shared UI components (buttons, cards, inputs, badges, nav) from the style guide — *Wk 4–5*
3. Storefront: home, catalog/category, product detail, search/filter — *Wk 5–7*
4. Cart, checkout (GCash/card/COD), order confirmation — *Wk 7–8*
5. Customer account: profile, orders, subscriptions, reviews, notifications — *Wk 8–9*
6. Admin dashboard: products, orders, subscriptions, customers, deliveries, reviews, analytics — *Wk 9–10*
7. Rider view (mobile-first): my deliveries, status + proof — *Wk 10–11*
8. Animations & polish pass — *Wk 11*
**Deliverables:** Fully wired UI for customer, admin, rider.
**Exit criteria:** Every user flow completable end-to-end in the UI; responsive on mobile.

## Phase 6 — Testing & QA (Weeks 9–13; continuous testing from Wk 4)
**Goal:** Confidence the system is correct, secure, and smooth.
**Activities:** Unit/feature tests (Pest, Vitest), E2E of critical journeys (Playwright: register→checkout, subscribe→recurring charge, rider deliver), payment sandbox testing, security review (authz, webhooks, rate limits), accessibility (AA, reduced-motion), performance (mobile LCP), UAT with real scenarios.
**Deliverables:** Passing test suites, bug-fix log, QA sign-off.
**Exit criteria:** Critical/high bugs cleared; payments verified in sandbox; performance targets met.

## Phase 7 — Deployment (Weeks 13–14)
**Goal:** Production launch.
**Activities:** Provision Vercel (web) + Laravel Forge/VPS (API + queue worker + scheduler) + managed Postgres + Redis + Cloudinary; configure env/secrets; live payment keys + webhook endpoints; GitHub Actions CI/CD; Sentry; backups; domain/SSL; smoke tests; soft launch.
**Deliverables:** Live production environment, runbook.
**Exit criteria:** Production smoke tests pass; monitoring + backups active; rollback plan documented.

## Phase 8 — Maintenance & Future Enhancements (Week 15+)
**Goal:** Keep it healthy and grow it.
**Activities:** Monitor errors/performance, patch/update dependencies, triage feedback, iterate.
**Future candidates (post-v1):** native mobile app, loyalty/points, delivery carrier/maps integration with live tracking, recommendation engine, multi-language, in-app chat, promo/coupon engine, per-cycle subscription meal customization.

---

## Milestones (gates)

| Milestone | When | Definition of done |
|---|---|---|
| M0 — Blueprint approved | End Wk 1 | All planning docs signed off |
| M1 — Database live | End Wk 2 | Schema + seed data running |
| M2 — Core commerce API | End Wk 5 | Auth + catalog + cart + orders working |
| M3 — Payments + subscriptions | End Wk 7 | GCash/card checkout + recurring billing verified |
| M4 — Storefront usable | End Wk 8 | Browse → checkout works in the UI |
| M5 — Admin + rider complete | End Wk 11 | All three surfaces functional |
| M6 — QA passed | End Wk 13 | Tests green, critical bugs cleared |
| M7 — Launch | End Wk 14 | Live in production |

---

## Critical path & dependencies

Database (P3) → Backend domains (P4) gate the matching Frontend screens (P5): you can't build checkout UI before the order API exists. Recommended rhythm: **backend leads each domain by ~1–2 weeks, frontend follows.** Payments and subscriptions are the highest-risk items — start their sandbox testing early. Deployment depends on QA sign-off; don't compress it.

## Key risks & mitigations
- **Recurring billing complexity** → lean on Laravel Cashier; test dunning/webhooks in sandbox early (Wk 6).
- **GCash integration specifics** → confirm PayMongo/Xendit account + sandbox access in Wk 1; build behind the gateway adapter so it's swappable.
- **Scope creep** → the PRD is the source of truth; new ideas go to Phase 8.
- **Solo-dev bottleneck** → Claude Code accelerates build, but reserve buffer in QA; the timeline rescales if capacity changes.

*Next deliverable: Sprint & Task Breakdown (epics → tasks → subtasks), then build the ClickUp workspace.*
