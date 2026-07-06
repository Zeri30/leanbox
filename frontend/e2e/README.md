# E2E tests (Playwright)

End-to-end coverage of the three critical journeys:

| Spec | Journey |
| --- | --- |
| `register-checkout.spec.ts` | register → browse → cart → COD checkout → confirmation |
| `subscribe-recurring.spec.ts` | subscribe to a plan → a due billing cycle produces a recurring charge |
| `rider-deliver.spec.ts` | admin confirms an order & assigns a rider → rider delivers → order is delivered |

These drive the **real web app against the real API**, so both must be running.

## Run locally

1. Start the **seeded backend** — the suite needs the API up:
   - `cd backend && php artisan serve` (API on `:8000`)
   - Seed the database if you haven't: `php artisan migrate:fresh --seed`
2. Install the browser once: `npx playwright install chromium`
3. Run: `cd frontend && npm run test:e2e` (or `npm run test:e2e:ui`)

Playwright manages the **web** server for you: it reuses a dev server already on
`:3000`, or starts `next dev` itself if none is running — no prior `next build`
needed. (It never runs a second dev server against a running one, which would
corrupt `.next`.) The suite talks to the API at `NEXT_PUBLIC_API_URL` (default
`http://localhost:8000/api/v1`). CI instead builds and runs `next start`.

Customer journeys register a fresh account each run (unique email), so they're
safe to re-run against a seeded database without cleanup. `admin@leanbox.test`
and `rider@leanbox.test` (password `password`) come from the seeder.

## How it works

- `support/actions.ts` — reusable UI flows (register, login, add to cart, place
  a COD order, fill the checkout address form).
- `support/backend.ts` — a thin `php artisan` bridge for the one thing the
  browser can't do: run the recurring-billing scheduler (`subscriptions:process-due`).
- `support/accounts.ts` — seeded accounts + unique-email helper.

CI (`.github/workflows/e2e-ci.yml`) stands up Postgres, seeds and serves the
backend, builds and starts the web app, then runs this suite with `CI=true`.
