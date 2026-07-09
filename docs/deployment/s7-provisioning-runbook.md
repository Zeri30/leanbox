# S7 — Production Provisioning Runbook

**Task:** [S7] Provision infrastructure (ClickUp `86d3dte3k`)
**Goal (DoD):** all services provisioned & connected; queue worker + scheduler running in production.

## Architecture (as provisioned)

Per **CLAUDE.md** stack decisions (which override the blueprint docs):

| Component | Service | Notes |
|---|---|---|
| Frontend (Next.js) | **Vercel** (free) | zero-config; needs `NEXT_PUBLIC_API_URL` |
| API | **Render web service (free)** | Docker; sleeps ~15 min idle, ~50s cold start |
| Queue | **`sync` driver** (free) | jobs run inline — Render free has no worker |
| Scheduler | **deferred / free cron ping** | Render free has no cron; run `subscriptions:process-due` manually or via cron-job.org |
| Database (Postgres) | **Supabase** | session pooler, port 5432 |
| Image storage | **Supabase Storage** | bucket `leanbox-images` (S3-compatible) — **not** Cloudinary |
| Cache / sessions | **Laravel `database` driver** | **no Redis** |

> **Free-tier note:** Render's free plan only covers **web services** — background workers and cron jobs are paid. So this build runs one free web service with `QUEUE_CONNECTION=sync` and defers the scheduler. On a paid plan, re-add a `worker` (`php artisan queue:work`) and a `cron` (`* * * * *` → `php artisan schedule:run`) to `render.yaml`.

> **Deviations from the ClickUp task text (intentional):** the task listed a *Redis instance* and *Cloudinary*. Both are superseded by CLAUDE.md — we provision neither. Auth is **Bearer-token** (`config/cors.php` has `supports_credentials => false`), so the Vercel↔Render cross-domain split needs only a CORS allowlist, no shared cookie domain.

Repo artifacts backing this runbook:
- `render.yaml` — Render Blueprint (web + worker + cron + shared env group)
- `backend/Dockerfile` + `backend/.dockerignore` — production image
- `backend/.env.production.example` — env template

---

## 1. Supabase (database + storage)

1. Create a Supabase project (region close to users, e.g. Singapore / `ap-southeast-1`).
2. **Database** → Connect → copy the **Session pooler** connection (port **5432**). Record `DB_HOST`, `DB_USERNAME` (`postgres.<project-ref>`), `DB_PASSWORD`.
3. **Storage** → create bucket **`leanbox-images`** (public). Record the public URL base for `SUPABASE_PUBLIC_URL`.
4. **Storage → S3 access keys** → generate keys. Record `SUPABASE_ENDPOINT` (`https://<ref>.storage.supabase.co/storage/v1/s3`), `SUPABASE_ACCESS_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_REGION`.

## 2. Render (free web service)

1. **New → Blueprint**, connect the GitHub repo, **branch `develop`**. Render reads `render.yaml` and proposes 1 free web service (`leanbox-api`).
2. Fill every `sync: false` var from step 1 plus:
   - `APP_KEY` — run `php artisan key:generate --show` locally, paste the `base64:…` value.
   - `APP_URL` — the Render web URL (e.g. `https://leanbox-api.onrender.com`); can fill after first deploy.
   - `FRONTEND_URL` — start with `http://localhost:3000`, update to the Vercel URL in step 3.
   - `MAIL_MAILER` stays `log` for now (no SMTP required).
3. **Apply** → Render builds the Docker image and starts `leanbox-api`.
   - `AUTORUN_ENABLED=true` makes the container run `php artisan migrate --force` on boot (free tier has no pre-deploy step), building the schema on Supabase.
4. Verify: `GET https://<api>/up` → 200; `GET https://<api>/api/v1/...` returns the JSON envelope.

### Scheduler (free options, do later)
Render free has no cron. The only scheduled job is `subscriptions:process-due` (daily 02:00), and recurring billing is deferred (COD), so this is low-stakes:
- **Manual:** run `php artisan subscriptions:process-due` when needed (locally against Supabase, or via Render Shell on a paid plan).
- **Free daily ping:** add a small token-protected route that runs the command, and schedule a daily GET from **cron-job.org** (free).

## 3. Vercel (frontend)

1. **Add New → Project**, import the repo, set **Root Directory = `frontend`** (Next.js auto-detected).
2. Env var: `NEXT_PUBLIC_API_URL = https://<api>/api/v1`.
3. Deploy. Copy the production domain and set it as `FRONTEND_URL` on Render (`leanbox-shared`) → redeploy Render so CORS allows the origin.

## 4. Connect & verify (DoD checklist)

- [ ] `GET /up` returns 200 on the Render web service.
- [ ] Frontend loads and can register/login (proves API reachable + CORS OK).
- [ ] An image upload lands in the Supabase `leanbox-images` bucket and its public URL renders.
- [ ] **Queue worker running:** trigger a notification (e.g. place an order) → row leaves the `jobs` table and the notification is delivered; `leanbox-queue` logs show it processed.
- [ ] **Scheduler running:** `leanbox-scheduler` cron shows minutely runs; `subscriptions:process-due` fires at 02:00 (or run it manually via Shell to confirm it queues cycles).
- [ ] No secrets committed to git (all live in Render/Vercel/Supabase dashboards).

---

## Notes / gotchas

- **Render free tier spins down** on idle — use **Starter+** for the web and worker so the queue/scheduler stay alive (recurring billing & notifications depend on them).
- **DB connection limits:** the Supabase session pooler is right for persistent web + worker. Do not point the app at the transaction pooler (6543) with persistent/prepared-statement settings.
- **Migrations** run in the web pre-deploy step only — the worker/cron images do not migrate, avoiding races.
- **Scheduler model:** Render cron invokes `schedule:run` every minute; Laravel decides what's actually due (only `subscriptions:process-due` at 02:00 today). Equivalent to a server crontab.
