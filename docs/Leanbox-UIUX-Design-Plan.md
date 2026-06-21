# Leanbox — UI/UX Design Plan

**Deliverable:** UI/UX Design Plan (no Figma — Tailwind-ready specs + live HTML style guide)
**Companion file:** `Leanbox-StyleGuide.html` (open in a browser to see the theme)
**Design direction:** Modern dark theme, green accents, clean/premium, mobile-first & responsive.
**Builds on:** `Leanbox-PRD.md`, `Leanbox-User-Flows.md`

---

## 1. Design principles

1. **Mobile-first.** Design every screen for a ~375px phone first, then scale up. Most fitness shoppers browse on mobile.
2. **Premium & calm.** Generous spacing, restrained color, one clear accent. Dark surfaces make food photography and product images pop.
3. **One accent, used with intent.** Green signals action, health, and success — reserve it for primary buttons, active states, and key highlights, never as a wash.
4. **Clarity over decoration.** Strong hierarchy, legible type, obvious primary actions. Every screen has exactly one primary action.
5. **Consistent components.** Reuse the same button, card, input, and badge everywhere (this also makes the React build faster).

---

## 2. Color system (dark theme + green accent)

All values are ready to drop into a Tailwind theme (`tailwind.config` → `theme.extend.colors`). Hex chosen for AA contrast on dark surfaces.

### Backgrounds & surfaces
| Token | Hex | Use |
|---|---|---|
| `bg.base` | `#0E1311` | App background (near-black, slight green undertone) |
| `bg.surface` | `#161C1A` | Cards, panels |
| `bg.elevated` | `#1E2624` | Modals, dropdowns, hover surfaces |
| `border` | `#2A332F` | Dividers, card borders, input borders |
| `border.strong` | `#3A463F` | Focus rings (neutral), emphasized edges |

### Brand / accent (green)
| Token | Hex | Use |
|---|---|---|
| `primary` | `#22C55E` | Primary buttons, active nav, key accents |
| `primary.hover` | `#16A34A` | Hover/pressed primary |
| `primary.soft` | `#0F2E1F` | Subtle green tint backgrounds (badges, highlights) |
| `accent.lime` | `#A3E635` | Sparing secondary highlight (e.g., "high-protein" tag) |

### Text
| Token | Hex | Use |
|---|---|---|
| `text.primary` | `#F1F5F4` | Headings, key text |
| `text.secondary` | `#9CA8A3` | Body, labels |
| `text.muted` | `#6B7772` | Hints, placeholders, disabled |

### Status
| Token | Hex | Use |
|---|---|---|
| `success` | `#22C55E` | Delivered, in stock, paid |
| `warning` | `#F59E0B` | Low stock, pending |
| `error` | `#EF4444` | Failed, out of stock, cancel |
| `info` | `#38BDF8` | Informational, "out for delivery" |

> **Accessibility:** body text uses `text.secondary` (#9CA8A3) or lighter on dark surfaces for AA. Never put green text on dark for body copy — use green for fills/borders, not paragraphs.

---

## 3. Typography

- **Headings/display:** `Sora` (geometric, modern, premium). Fallback: system sans.
- **Body/UI:** `Inter`. Fallback: system sans.
- Both are free Google Fonts.

| Style | Size / line-height | Weight | Use |
|---|---|---|---|
| Display | 40 / 48 | 700 | Landing hero |
| H1 | 32 / 40 | 700 | Page titles |
| H2 | 24 / 32 | 600 | Section headers |
| H3 | 20 / 28 | 600 | Card titles |
| Body-lg | 18 / 28 | 400 | Lead paragraphs |
| Body | 16 / 24 | 400 | Default text |
| Small | 14 / 20 | 400 | Labels, meta |
| Caption | 12 / 16 | 500 | Badges, hints |

Mobile: scale Display/H1 down one step (Display→32, H1→28).

---

## 4. Spacing, radius, elevation

- **Spacing scale (4px base):** 4, 8, 12, 16, 24, 32, 48, 64. Use Tailwind `p-`, `gap-`, `space-y-` equivalents.
- **Container:** max-width 1200px, 16px gutters on mobile, 24–32px on desktop.
- **Radius:** inputs/buttons `rounded-lg` (10px); cards `rounded-2xl` (16px); pills/badges `rounded-full`.
- **Elevation:** keep flat; separate with surface color + 1px border rather than heavy shadows. Primary buttons may use a soft green glow: `shadow-[0_0_0_1px_#22C55E33,0_8px_24px_-8px_#22C55E55]`.

---

## 5. Core components

**Buttons**
- *Primary:* green fill (`primary`), white-ish text (`#06210F`), `rounded-lg`, 44px tall (touch target), hover → `primary.hover`.
- *Secondary:* transparent with `border` + `text.primary`, hover → `bg.elevated`.
- *Ghost:* text-only, for tertiary actions.
- *Destructive:* `error` text/border; solid `error` only for confirm-delete.

**Inputs**
- `bg.surface`, `border` 1px, `text.primary`, placeholder `text.muted`, 44px tall, focus ring in `primary` at 40% opacity. Labels in `Small`/`text.secondary` above the field.

**Cards**
- `bg.surface`, `border` 1px, `rounded-2xl`, 16–20px padding. Product card: image top (4:3, rounded), category pill, title (H3), price (bold, `text.primary`), rating row, "Add to cart" primary button full-width.

**Badges / pills**
- Category pill: `primary.soft` bg + `primary` text. Status badges map to status colors (Low stock=warning, Out of stock=error, Featured=lime, Delivered=success).

**Navigation**
- *Storefront top nav:* logo left, category links center (desktop), search + cart + account right. Mobile: hamburger + bottom tab bar (Home, Search, Cart, Account).
- *Admin:* left sidebar (collapsible) with sections; top bar with search + notifications + profile.
- *Rider:* minimal top bar + a single list; large tap targets.

**Feedback**
- Toasts top-right (desktop) / top (mobile); inline form errors in `error`; empty states with icon + short copy + a primary action; skeleton loaders on cards/lists.

---

## 6. Page-by-page layout specs

Each entry: purpose, key regions (top→bottom), primary action, and mobile note. These map 1:1 to the user flows.

### Storefront (Customer)

**Home / Landing**
Hero (headline + subcopy + primary CTA "Shop now" + hero image) → category quick-links (5 pills/cards: Vegetarian, High-Protein, Supplements, Snacks, Wellness) → Featured products grid → Best-sellers row → Subscription promo band → footer. *Primary action:* Shop / Subscribe. *Mobile:* hero stacks, grids become 1–2 cols, horizontal scroll for best-sellers.

**Product Listing / Category**
Page title + result count → filter bar (category, price, sort) as a sticky row (desktop) / bottom-sheet (mobile) → responsive product grid (4 cols desktop → 2 cols tablet → 1–2 mobile) → pagination/infinite scroll. *Primary action:* open product / add to cart. 

**Product Detail (PDP)**
Breadcrumb → 2-col on desktop: left = image gallery (thumbnails), right = title, price, rating, stock badge, quantity stepper, "Add to cart" (primary) + "Subscribe" if applicable → tabs/sections: Description, Nutrition facts (table), Ingredients → Reviews list with rating summary. *Mobile:* single column, sticky "Add to cart" bar at bottom.

**Cart**
Line items (image, name, unit price, qty stepper, remove) → order summary card (subtotal, delivery est., total) → "Checkout" primary. *Mobile:* summary collapses to a sticky bottom bar with total + checkout.

**Checkout**
Stepper or single page: 1) Delivery info (address select/add) → 2) Payment method (GCash / Card / COD radio cards) → 3) Review & place order → summary sidebar (desktop) / collapsible (mobile). *Primary action:* Place order.

**Order Confirmation**
Success state (check + order number) → order summary → "Track order" + "Continue shopping".

**Subscription Plans**
Plan cards (meal type, price, interval, what's included, "Subscribe") → comparison → FAQ. *Primary:* Subscribe.

**Auth (Login / Register)**
Centered card on dark bg, logo, fields, primary button, switch link, social/optional. Minimal and fast.

**Account area** (tabbed or sidebar)
Profile (edit info, change password) · Orders (list → order detail with status timeline + cancel if pending) · Subscriptions (list → manage: pause/resume/cancel, history) · My Reviews · Notifications (list, mark read).

### Admin Dashboard

**Dashboard** — KPI cards (Products, Orders, Active Subscriptions, Revenue) → revenue chart → recent orders table → recent subscriptions → low-stock alerts panel.
**Products** — searchable/filterable table (image, name, category, price, stock, status, actions) → Add/Edit form (fields + image uploader + featured/best-seller toggles + nutrition fields).
**Orders** — table with status filter → order detail (items, customer, payment, status updater, "assign delivery").
**Subscriptions/Plans** — plans manager (create/edit) + active/cancelled subscriptions list.
**Customers** — table with status; view/suspend.
**Deliveries** — table of deliveries (order/subscription, address, status, rider) → assign rider action.
**Reviews** — moderation table (hide/delete) + review stats.

### Rider View (mobile-first)

**My Deliveries** — simple list of assigned deliveries (address, items count, status), sorted by status; big tap targets.
**Delivery Detail** — address + map link, items, customer contact, status buttons ("Out for delivery", "Delivered"), proof-of-delivery photo upload + notes.

---

## 7. Responsive breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | < 640px | 1–2 col grids, bottom tab nav, sticky action bars, bottom-sheets for filters |
| Tablet | 640–1024px | 2–3 col grids, condensed sidebar |
| Desktop | > 1024px | full grids, persistent sidebar (admin), multi-column PDP/checkout |

---

## 8. Animation & interaction spec

Motion should feel **premium and restrained** — it confirms actions and guides attention, never decorates for its own sake. Rule of thumb: if an animation makes the user wait, it's too long.

**Library:** `Framer Motion` for component/page animation; Tailwind `transition` utilities for simple hover/focus states. (Added to the tech stack.)

### Global motion tokens
| Token | Value | Use |
|---|---|---|
| `duration.fast` | 120ms | Hover, press, color/opacity changes |
| `duration.base` | 220ms | Most enter/exit, dropdowns, toasts |
| `duration.slow` | 400ms | Page transitions, hero reveals |
| `easing.standard` | cubic-bezier(0.4, 0, 0.2, 1) | Default ease-in-out |
| `easing.exit` | cubic-bezier(0.4, 0, 1, 1) | Elements leaving |
| Distance | 8–16px | Slide/translate offset (keep small) |

### Where motion is used (and where it isn't)
| Element | Interaction |
|---|---|
| Primary buttons | Hover: color shift + subtle scale 1.02 (fast). Press: scale 0.98. |
| Product cards | Hover (desktop): lift 4px + border brightens (fast). Tap (mobile): brief scale-down. |
| Add to cart | Button shows a quick check/loader, then the cart badge bumps (scale pulse) and a toast slides in. |
| Cart drawer / modals | Slide/fade in over a dimmed backdrop (base); reverse on close. |
| Toasts | Slide in from top-right (desktop) / top (mobile), auto-dismiss, slide out. |
| Lists & grids | Staggered fade-up (40–60ms stagger) on first load — capped so long lists don't cascade slowly. |
| Page transitions | Quick fade / fade-up between routes (slow but ≤400ms). |
| Skeleton loaders | Soft shimmer while product/data loads — replaces spinners on cards and tables. |
| Landing page | Gentle scroll-reveal (fade-up) on sections as they enter the viewport; hero content fades up on load. |
| Order placed | A one-time success animation (check draws in + subtle confetti or pulse) on the confirmation screen. |
| Status changes | Order/delivery status badges cross-fade when updated. |
| Form errors | Field border eases to red + a small shake (one cycle) to draw the eye. |

### Restraint & accessibility rules
- One focal animation per screen at a time — don't animate everything at once.
- No infinite/looping motion except subtle skeleton shimmer and loaders.
- Respect `prefers-reduced-motion`: disable non-essential motion and fall back to instant or simple opacity changes.
- Keep transforms to opacity/scale/translate (GPU-friendly) for smoothness; avoid animating layout-heavy properties.
- Mobile: prefer fast, small motions; avoid large parallax or heavy scroll effects.

---

## 9. Handoff notes for the build (Claude Code)

- Put all tokens in `tailwind.config.ts` under `theme.extend.colors` / `fontFamily` so components reference semantic names (`bg-surface`, `text-primary`, `bg-primary`).
- Build the components in §5 once as shared UI (shadcn/ui as the base), then compose pages from them.
- The `Leanbox-StyleGuide.html` file is the visual source of truth for colors/typography/components — match it.

*Next deliverable: Development Roadmap → Sprint/Task Breakdown → ClickUp workspace.*
