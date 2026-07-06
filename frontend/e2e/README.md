# E2E tests (Playwright)

End-to-end coverage of the three critical journeys:

| Spec | Journey |
| --- | --- |
| `register-checkout.spec.ts` | register → browse → cart → COD checkout → confirmation |
| `subscribe-recurring.spec.ts` | subscribe to a plan → a due billing cycle produces a recurring charge |
| `rider-deliver.spec.ts` | admin confirms an order & assigns a rider → rider delivers → order is delivered |

These drive the **real web app against the real API**, so both must be running.

## Run locally

1. Start the backend (seeded) and the web app the usual way:
   - `cd backend && php artisan serve` (API on `:8000`)
   - `cd frontend && npm run dev` (web on `:3000`)
   - Make sure the database is seeded: `php artisan migrate:fresh --seed`
2. Install the browser once: `npx playwright install chromium`
3. Run: `npm run test:e2e` (or `npm run test:e2e:ui` for the UI runner)

Playwright reuses the dev server already on `:3000` (it never runs `next build`
while `next dev` holds `.next`). The suite talks to the API at
`NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api/v1`).

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
