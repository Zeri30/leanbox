# Deploy, Rollback & Troubleshooting Runbook

Operational runbook for the Leanbox production deployment (S7). For first-time
provisioning, see `s7-provisioning-runbook.md`. This doc covers **how deploys
happen, how to roll back, and how to fix the issues we've actually hit.**

## Production URLs
- **Web (Vercel):** https://leanbox-umber.vercel.app
- **API (Render):** https://leanbox-api.onrender.com · health: `/up`
- **DB + Storage (Supabase):** project `cmewxytxujdzradzhkiv`

---

## 1. The pipeline

**CI (GitHub Actions)** — runs on push/PR to `main` and `develop`, path-filtered:
| Workflow | Triggers on | Does |
|---|---|---|
| `backend-ci.yml` | `backend/**` | Pint (style) → `migrate` → Pest tests (on a Postgres service) |
| `frontend-ci.yml` | `frontend/**` | ESLint → Vitest → `next build` (type-check + compile) |
| `e2e-ci.yml` | (see file) | Playwright end-to-end |

> Path filters are why a docs/config-only PR shows fewer checks — the unaffected
> app workflows are correctly skipped. `mergeable_state: clean` is the authority.

**CD (platform-native auto-deploy)** — deploys are handled by Vercel and Render's
git integration, **not** a GitHub Actions deploy job. This is deliberate: for these
platforms the native integration is the recommended path (it builds, deploys,
mints preview URLs, and provides one-click rollback). A GH Actions deploy step
would be redundant and worse.

- **API (Render):** on push to its deploy branch, Render rebuilds the Docker image
  (`backend/Dockerfile`) and redeploys. `AUTORUN_ENABLED=true` runs
  `php artisan migrate --force` on boot. Health-gated by `/up`.
- **Web (Vercel):** on push to `main`, Vercel runs `next build` (root dir `frontend`)
  and deploys to the production domain.

### Deploy branches
| Service | Deploys from | Note |
|---|---|---|
| Vercel (web) | `main` | production = `main` |
| Render (API) | `develop` | **recommend aligning to `main`** for a strict "prod = main" pipeline |

**To align Render to `main`** (recommended): Render → `leanbox-api` → **Settings →
Build & Deploy → Branch** → set to `main` → Save. After this, only merges to `main`
deploy the API — matching Vercel and the "deploy on merge to main" intent.

---

## 2. How to deploy

Normal flow (per the team workflow): work on `develop` → PR → merge to `main`.
On merge, Vercel (and Render, once aligned to `main`) auto-deploy. No manual step.

**Manual deploy / redeploy:**
- **Render:** service → **Manual Deploy** → *Deploy latest commit* (or *Clear build cache & deploy*).
- **Vercel:** **Deployments** → ⋯ on a deployment → **Redeploy**.

**After every production deploy — smoke test:**
- [ ] `GET https://leanbox-api.onrender.com/up` → 200
- [ ] Catalog loads with products/images at the web URL
- [ ] Log in as customer / admin / rider
- [ ] (first request may take ~50s if the free API was asleep)

---

## 3. Rollback

Both platforms keep prior deploys, so rollback is fast and needs no code change.

**Vercel (web) — instant, no rebuild:**
1. Project → **Deployments**.
2. Find the last known-good **Production** deployment.
3. ⋯ → **Promote to Production** (a.k.a. Instant Rollback). Traffic switches immediately.

**Render (API):**
1. Service → **Events** (or **Deploys**).
2. Find the last successful deploy → **Rollback** to it (redeploys that image).
   - Or **Manual Deploy → Deploy a specific commit** and pick the last good SHA.
3. Wait for 🟢 Live, then re-run the smoke test.

**Database:** deploys run **additive** migrations only (`migrate --force`) — they
never drop data. If a bad *migration* ships, roll the code back as above and write
a corrective forward migration; do **not** hand-edit the prod DB. Supabase keeps
automated backups per plan (Dashboard → Database → Backups) if a restore is needed.

---

## 4. Common issues & fixes (things we've actually hit)

| Symptom | Cause | Fix |
|---|---|---|
| First request takes ~50s | Free Render instance spun down on idle | Expected on free tier; upgrade to a paid instance to keep it warm |
| Vercel shows plain **`404: NOT_FOUND`** | **Framework Preset = "Other"** → `next build` never ran | Settings → Build & Deployment → **Framework Preset = Next.js** → redeploy |
| Proof/image **403 Forbidden** | URL saved as the S3-endpoint path (`/storage/v1/s3/…`) | Set Render `SUPABASE_PUBLIC_URL` to the public form (`…supabase.co/storage/v1/object/public/leanbox-images`); fix legacy rows via SQL prefix rewrite |
| Frontend loads but **no data / CORS error** in console | `FRONTEND_URL` on Render doesn't match the site origin | Set `FRONTEND_URL` to the exact Vercel origin — `https://…`, **no trailing slash** → redeploy |
| Rider dropdown stuck on **"Loading riders…"** | Cold-start latency on the `useRiders` fetch | Not a bug; wait for the API to wake |
| Deploy fails during migrate | Bad DB env or Supabase unreachable | Check Render `DB_*` env (session pooler, port 5432) and Supabase status |
| Email not sending | `MAIL_MAILER=log` (no SMTP configured) | In-app notifications still work; add an SMTP provider to enable email |

---

## 5. Quick reference — env that matters
- CORS: `FRONTEND_URL` (Render) = exact Vercel origin.
- Storage URLs: `SUPABASE_PUBLIC_URL` (Render) = public-object form.
- DB: `DB_HOST` = Supabase **session** pooler, `DB_PORT=5432`.
- Queue/cache/session = `database`/`sync` drivers (no Redis). Mail = `log` until SMTP added.
- Frontend: `NEXT_PUBLIC_API_URL` (Vercel) = `https://leanbox-api.onrender.com/api/v1` (baked at build — redeploy after changing).
