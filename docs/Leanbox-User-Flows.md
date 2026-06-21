# Leanbox — User Flow Diagrams (Index)

**Deliverable:** User Flow Diagrams
**Format:** Seven Mermaid diagrams (each renders visually), derived from the PRD and system requirements.
**Related:** `Leanbox-PRD.md`, `Leanbox-System-Architecture.md`, `Leanbox-ERD.mermaid`

These flows trace the key journeys the build will implement. Decision diamonds show branching, terminal nodes show start/end states, and notifications/stock events are shown where they fire.

---

## 1. Customer — Authentication & Account
**File:** `Leanbox-Flow-1-Auth.mermaid`
Register (with validation + unique email), secure login, suspended-account blocking, profile update, password change, logout. Covers PRD §5.1.

## 2. Customer — Browse → Cart → Checkout → Order
**File:** `Leanbox-Flow-2-Purchase.mermaid`
The core purchase journey: discovery via category/search/featured, product detail with stock check, cart, login gate at checkout, delivery address, payment branch (GCash / card / COD), order creation with stock decrement, and customer + admin notifications (including the low-stock trigger). Covers PRD §5.2–5.4.

## 3. Customer — Meal-Prep Subscription
**File:** `Leanbox-Flow-3-Subscription.mermaid`
Plan selection, schedule + address, first charge via Cashier, the recurring billing cycle (with dunning/retry on failure), and manage/pause/resume/cancel states. Covers PRD §5.5.

## 4. Customer — Reviews & Notifications
**File:** `Leanbox-Flow-4-Reviews-Notifications.mermaid`
Verified-purchase review submission (delivered orders only), admin moderation (hide), review statistics; and the notification fan-out for order/subscription/promo (customer) and new-order/low-stock (admin) events. Covers PRD §5.6, §5.7, §5.14.

## 5. Admin — Order Management
**File:** `Leanbox-Flow-5-Admin-Orders.mermaid`
Dashboard entry, order detail review, the allowed status lifecycle (Pending → Confirmed → Preparing → Shipped → Delivered), cancellation with restock, and customer notification at each change. Covers PRD §5.8, §5.11.

## 6. Admin — Product & Inventory Management
**File:** `Leanbox-Flow-6-Admin-Product-Inventory.mermaid`
Add/edit products (with image upload and featured flags), soft-delete of discontinued items, manual stock adjustment, and the automatic stock-decrement → low-stock-alert loop on confirmed orders/recurring deliveries. Covers PRD §5.9, §5.13.

## 7. Delivery & Rider Fulfillment
**File:** `Leanbox-Flow-7-Delivery-Rider.mermaid`
Delivery creation from an order or a subscription cycle, admin rider assignment, the rider's mobile flow (out-for-delivery → delivered + proof), order-status sync on completion, and the failed/reassign path. Covers PRD §5.15, §5.16. (Flow 5 hands off to this flow at the Shipped step.)

---

### Coverage summary
| PRD feature area | Flow |
|---|---|
| Auth & account | 1 |
| Browsing, cart, checkout, orders | 2 |
| Subscriptions | 3 |
| Reviews, notifications | 4 |
| Admin orders & dashboard | 5 |
| Admin products, inventory, low-stock | 6 |
| Delivery management & riders | 7 |

All customer, admin, and rider journeys from the requirements and approved additions are represented.

*Next deliverable: UI/UX Design Plan + Figma structure (the screens these flows pass through).*
