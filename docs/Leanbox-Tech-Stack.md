# Leanbox — Recommended Technology Stack

**Deliverable:** Recommended Technology Stack
**Constraint locked by client:** Frontend = **React + Tailwind CSS**
**Guiding principles:** scalable, well-documented, strong AI-coding support (you'll build with Claude Code), and good fit for recurring subscriptions + e-commerce.

---

## Summary table

| Layer | Recommendation | Why |
|---|---|---|
| Frontend framework | **Next.js (App Router) + React + TypeScript** | Satisfies the React requirement; adds server-side rendering for SEO on product pages (critical for an online store) and API routes if needed. |
| Styling | **Tailwind CSS** + **shadcn/ui** | Locked. shadcn gives accessible, themeable components — perfect for the dark + green design system. |
| Animation | **Framer Motion** + Tailwind transitions | Premium micro-interactions, page/modal transitions, scroll reveals (see UI/UX design plan §8). |
| State / data fetching | **TanStack Query** + **Zustand** | Query for server state (products, orders); Zustand for light client state (cart UI). |
| Backend framework | **Laravel (PHP)** | Mature, batteries-included e-commerce backend; **Laravel Cashier** handles Stripe subscriptions, plus queues, validation, and auth out of the box. |
| ORM | **Eloquent** (Laravel built-in) | Expressive ActiveRecord ORM with first-class migrations; maps cleanly to our ERD. |
| Database | **PostgreSQL** | Relational integrity for orders, payments, recurring billing. (Laravel supports it natively.) |
| Cache / queue | **Redis** + **Laravel Queues** | Session/cache store and background jobs (recurring billing, notifications, low-stock alerts). |
| Auth | **Laravel Sanctum** (API tokens) with bcrypt hashing; role-based gates/policies | Lightweight token auth for the React SPA; admin/customer roles via policies. |
| Subscriptions billing | **Laravel Cashier (Stripe)** | Purpose-built for recurring billing — directly powers meal-prep subscriptions. |
| Payments (cards/intl) | **Stripe** | Best-in-class subscriptions API — ideal for meal-prep recurring billing. |
| Payments (PH / GCash) | **PayMongo** or **Xendit** | Native GCash support for the local market. |
| File/image storage | **Cloudinary** (or AWS S3 + CloudFront) | Product image uploads, optimization, CDN delivery. |
| Email / SMS | **Resend** (email) + **Twilio** (SMS, optional) | Order/subscription notifications. |
| Frontend hosting | **Vercel** | First-class Next.js hosting, global CDN. |
| Backend hosting | **Laravel Forge + a VPS** (DigitalOcean/Hetzner) or **Render/Railway** | Forge is purpose-built for deploying Laravel; easy zero-downtime deploys. |
| Database hosting | **Neon** or **Supabase** (managed Postgres) | Serverless scaling, backups. |
| CI/CD | **GitHub Actions** | Automated test + deploy. |
| Monitoring | **Sentry** (errors) + **Laravel Telescope** (local debug) | Observability from day one. |
| Testing | Backend: **Pest/PHPUnit**; Frontend: **Vitest + React Testing Library**; E2E: **Playwright** | Unit, integration, end-to-end. |

---

## Notes & alternatives

**Next.js vs. plain React (Vite).** You said "React + Tailwind." Next.js *is* React, and for an e-commerce storefront its SEO/SSR on product and category pages directly drives discoverability and sales. If you'd rather keep a pure single-page app, the alternative is **Vite + React + React Router** — simpler, but you lose SEO benefits and would need a separate SEO strategy. **My recommendation: Next.js.**

**Why Laravel for the backend.** It's a mature, well-documented framework with the e-commerce essentials built in — Eloquent ORM, migrations, validation, queues, mailers, and **Cashier** for Stripe subscriptions. That last point is decisive: recurring meal-prep billing is the hardest part of this project, and Cashier handles subscription lifecycle, proration, and webhooks for you. Strong AI-coding support too. (Node/NestJS remains a fine alternative if you later want one language across the stack.)

**Repo structure.** Frontend and backend are **separate codebases** that communicate over the REST API: a **Next.js app** (`leanbox-web`, storefront + admin) and a **Laravel app** (`leanbox-api`). Shared API contracts are documented (OpenAPI) rather than shared as code, since the two use different languages. This is a clean, conventional split for a React-frontend / Laravel-backend project.

> **Language note:** with Laravel the backend is PHP, so the codebase is React/TypeScript on the frontend and PHP on the backend (rather than TypeScript end-to-end). That's a normal, well-supported pairing.

**Payments decision (LOCKED):** Primary market is the **Philippines**, currency **PHP**. **GCash is the primary method via PayMongo/Xendit**, with **Stripe for card payments**. Cash-on-delivery (COD) is also supported per the order model. The Payment Service uses a gateway-adapter pattern so both providers share one interface.
