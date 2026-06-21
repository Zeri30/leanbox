# Leanbox — Product Requirements Document (PRD)

**Version:** 1.0
**Owner:** Product
**Status:** Approved for planning — pre-development
**Related documents:** `Leanbox-System-Requirements.pdf` (source stories), `Leanbox-ERD.mermaid`, `Leanbox-Database-Design.md`, `Leanbox-System-Architecture.md`, `Leanbox-Tech-Stack.md`

> This PRD is the project's **source of truth**. Any scope or feature change should be reflected here first.

---

## 1. Overview

**Product:** Leanbox — a fitness-focused e-commerce platform selling health and nutrition products: vegetarian meals, high-protein meal packages, supplements, healthy snacks, wellness products, and recurring meal-prep subscriptions.

**Vision:** Make healthy eating effortless by combining a premium, easy-to-shop catalog with flexible meal-prep subscriptions, delivered through a fast, modern, mobile-first experience.

**Primary market:** Philippines (PHP). Payments via **GCash** (primary), **cards** (Stripe), and **cash-on-delivery**.

**Platform:** Responsive web — storefront for customers and an admin dashboard for operations. Dark theme with green accents, mobile-first.

---

## 2. Goals & success metrics

| Goal | Metric (initial targets, revisit post-launch) |
|---|---|
| Enable online purchase of nutrition products | Successful checkout completion rate > 65% |
| Drive recurring revenue via subscriptions | % of active customers with a subscription > 15% |
| Keep catalog accurate & in-stock | Stockouts on featured items < 2%; low-stock alerts actioned < 24h |
| Deliver a premium, fast experience | Mobile LCP < 2.5s; bounce on product pages trending down |
| Build trust through reviews | % delivered orders with a review > 20% |
| Operational efficiency for admins | Avg. order status update time; orders processed per admin/day |

---

## 3. Personas

**Maya — the fitness customer.** Shops on mobile, wants plant-based and high-protein options, reads nutrition facts and reviews, values a subscription that auto-delivers meals on her schedule.

**Carlos — the store administrator.** Manages catalog, stock, and orders daily; needs a dashboard, low-stock alerts, fast order status updates, and the ability to assign deliveries to riders.

**Ramon — the delivery rider.** Works on mobile; logs in to see only the deliveries assigned to him, marks them out-for-delivery and delivered, and uploads proof of delivery from the field.

---

## 4. Scope

**In scope (v1):** account/auth, product catalog with search/filter, product detail with nutrition + reviews, cart, checkout, orders with full status lifecycle, meal-prep subscriptions (subscribe/pause/cancel + recurring billing), **rider-based delivery management (admin assignment + rider mobile view + proof of delivery)**, reviews & ratings, in-app + email notifications, and a full admin dashboard (products, subscriptions, orders, customers, deliveries, reviews, analytics).

**Out of scope (v1):** native mobile apps, multi-vendor marketplace, loyalty/points program, multi-language, in-app live chat, advanced recommendation engine. (Candidates for the Maintenance & Future Enhancements phase.)

---

## 5. Feature requirements

Each feature lists its priority (P0 = launch-critical, P1 = important, P2 = nice-to-have) and traces to the source user stories.

### 5.1 Authentication & account (Customer) — P0
- Register with email + password; secure login; logout. *(R: register, log in securely)*
- View/update profile information. *(R: update profile)*
- Change password. *(R: change password)*
- **Acceptance:** passwords hashed; duplicate emails rejected; invalid login returns generic error; session persists via refresh token.

### 5.2 Product browsing & discovery (Customer) — P0
- Browse all products and by category: vegetarian meals, high-protein packages, supplements, healthy snacks, wellness. *(R: browse all / by category)*
- Search by name; filter by category; sort. *(R: search, filter)*
- Product detail: ingredients, nutrition facts, price, stock availability, images, ratings/reviews. *(R: view detailed product info, view ratings)*
- **Acceptance:** catalog pages SSR for SEO; out-of-stock clearly indicated; search returns relevant matches.

### 5.3 Shopping cart (Customer) — P0
- Add to cart, update quantity, remove items, view summary (subtotal, total). *(R: cart stories)*
- **Acceptance:** cart persists for logged-in users; price snapshot taken at add time; totals recompute live.

### 5.4 Checkout & orders (Customer) — P0
- Place order with delivery information; choose payment method (GCash/card/COD). *(R: place order, delivery info, payment method)*
- View order history, order detail, and status. *(R: order history, details/status)*
- Cancel eligible orders (while `pending`). *(R: cancel eligible orders)*
- **Acceptance:** stock validated at checkout; order confirmed only after payment success (except COD); cancellation blocked once `preparing`.

### 5.5 Meal-prep subscription (Customer) — P0
- Subscribe to a plan; choose meal package + delivery schedule. *(R: subscribe, choose package/schedule)*
- Manage, pause, or cancel subscription. *(R: manage/pause/cancel)*
- View subscription history and status. *(R: subscription history/status)*
- **Acceptance:** recurring billing runs per cycle; pause halts billing + deliveries; cancel stops future cycles; each cycle recorded.

### 5.6 Reviews & ratings (Customer) — P1
- Rate purchased products; leave reviews/comments; view own submitted reviews. *(R: rate, review, view my reviews)*
- **Acceptance:** review tied to a verified purchase (order); rating 1–5 required.

### 5.7 Notifications (Customer) — P1
- Receive order-update notifications; subscription renewal + promotion notifications. *(R: order updates, renewals/promos)*
- **Acceptance:** in-app feed + email; promotions respect opt-in.

### 5.8 Admin dashboard & analytics — P0
- Summary dashboard: total products, orders, subscriptions, revenue. *(R: summary dashboard)*
- Recent orders & subscriptions; sales analytics and best-selling products. *(R: recent activity, analytics)*
- **Acceptance:** metrics accurate to data; best-sellers ranked by units/revenue.

### 5.9 Admin product management — P0
- View all products with search/filter; add products across all categories; upload images; edit name/description/price/stock/nutrition/images; categorize; mark featured/best-selling; delete (soft) discontinued products. *(R: product management stories)*
- **Acceptance:** soft-delete preserves order history; image upload validated (type/size); featured items surface on homepage.

### 5.10 Admin meal-subscription management — P0
- Create subscription plans; edit plans, pricing, delivery schedules; view active/cancelled subscriptions. *(R: subscription management stories)*
- **Acceptance:** plan edits don't retroactively break active subscriptions' agreed terms.

### 5.11 Admin order management — P0
- View all orders; update status (Pending, Confirmed, Preparing, Shipped, Delivered, Cancelled); view order detail (items, customer, payment); cancel orders when necessary. *(R: order management stories)*
- **Acceptance:** status transitions follow allowed sequence; customer notified on each change.

### 5.12 Admin customer management — P0
- View registered customers; disable/suspend policy-violating accounts. *(R: customer management stories)*
- **Acceptance:** suspended users blocked at auth; action is reversible/audited.

### 5.13 Admin reviews & inventory — P1
- View all reviews/ratings; hide/delete inappropriate reviews; view review statistics. *(R: reviews stories)*
- Receive low-stock alerts for supplements, snacks, meal packages. *(R: low-stock alerts)*
- **Acceptance:** hiding a review removes it from storefront without deleting data; low-stock alert fires at threshold.

### 5.14 Admin notifications — P1
- Receive notifications for new orders/subscriptions; mark as read. *(R: admin notification stories)*
- **Acceptance:** unread count visible; mark-as-read persists.

### 5.15 Admin delivery management — P0
- View deliveries for both one-off orders and subscription cycles; assign a delivery to a rider; reassign or mark failed. *(Added: rider-based delivery model)*
- Track delivery status alongside order status; view proof of delivery.
- **Acceptance:** a delivery references exactly one order or one subscription cycle; assigning sets `status = assigned` and notifies the rider; admin sees real-time delivery status.

### 5.16 Rider — delivery fulfillment (P0)
- Rider logs in to a mobile-friendly view showing **only their assigned deliveries**. *(Added: rider role)*
- Mark a delivery *Out for delivery* and *Delivered*; upload proof-of-delivery photo and add notes.
- Marking *Delivered* advances the related order to `Delivered` and enables the customer review. *(R: order delivered → review)*
- **Acceptance:** riders cannot see other riders' deliveries or any admin/customer data; status changes notify the customer; proof image stored.

---

## 6. Non-functional requirements

- **Performance:** mobile-first; product pages LCP < 2.5s; cached catalog reads.
- **Security:** hashed passwords, JWT + RBAC, input validation, rate limiting, payment webhook verification, HTTPS.
- **Scalability:** stateless API, horizontal scaling, background job queue for billing/notifications.
- **Reliability:** managed DB with backups; idempotent payment webhooks.
- **Accessibility:** WCAG AA targets; sufficient contrast for the dark theme.
- **Design:** modern dark theme, green accents, clean/premium, responsive.

---

## 7. Assumptions & dependencies

- Single-region launch (Philippines, PHP); single currency.
- Payment providers: PayMongo/Xendit (GCash), Stripe (cards) — accounts to be provisioned.
- Fulfillment/delivery is handled operationally (no carrier-API integration in v1; status updated manually by admins).
- Email via Resend; SMS optional later.

---

## 8. Open questions

1. Delivery fee model — flat, by location, or free over a threshold?
2. Do subscriptions allow per-cycle meal customization, or fixed package per plan? (Current model assumes fixed package per plan.)
3. Tax/VAT handling for PH (price-inclusive vs. added at checkout)?
4. Return/refund policy and whether refunds are processed in-app.

---

## 9. Requirement traceability (coverage)

Every user story in `Leanbox-System-Requirements.pdf` maps to a feature above:
admin dashboard/analytics → 5.8; product management → 5.9; subscription management → 5.10; order management → 5.11; customer management → 5.12; reviews moderation + low-stock → 5.13; admin notifications → 5.14; customer account → 5.1; browsing → 5.2; cart → 5.3; checkout/orders → 5.4; subscription → 5.5; reviews → 5.6; customer notifications → 5.7. **Coverage: 100% of source stories.**

**Additions beyond the source PDF (approved during planning):** §5.15 Admin delivery management and §5.16 Rider delivery fulfillment, plus the `rider` role and `deliveries` table. These support the business reality that the owner uses delivery riders to fulfill orders and subscription deliveries.

---

*Next deliverables: User Flow Diagrams → UI/UX Design Plan + Figma structure → Development Roadmap → Sprint/Task Breakdown → ClickUp workspace.*
