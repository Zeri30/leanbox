# S7 — Production Provisioning Runbook

**Task:** [S7] Provision infrastructure (ClickUp `86d3dte3k`)
**Goal (DoD):** all services provisioned & connected; queue worker + scheduler running in production.

## Architecture (as provisioned)

Per **CLAUDE.md** stack decisions (which override the blueprint docs):

| Component | Service | Notes |
|---|---|---|
| Frontend (Next.js) | **Vercel** | zero-config; needs `NEXT_PUBLIC_API_URL` |
| API + queue worker + scheduler | **Render** (Docker) | one image → web + worker + cron |
| Database (Postgres) | **Supabase** | session pooler, port 5432 |
| Image storage | **Supabase Storage** | bucket `leanbox-images` (S3-compatible) — **not** Cloudinary |
| Cache / queue / sessions | **Laravel `database` driver** | **no Redis** |

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

## 2. Render (API + worker + scheduler)

1. **New → Blueprint**, connect the GitHub repo (branch `main`). Render reads `render.yaml` and proposes 3 services + the `leanbox-shared` env group.
2. Fill every `sync: false` var from step 1 plus:
   - `APP_KEY` — run `php artisan key:generate --show` locally, paste the `base64:…` value.
   - `APP_URL` — the Render web URL (e.g. `https://leanbox-api.onrender.com`).
   - `FRONTEND_URL` — the Vercel URL (fill after step 3; can start with the preview URL).
   - `MAIL_*` — SMTP provider (e.g. Resend/Mailgun/Postmark SMTP).
3. **Apply** → Render builds the image and starts `leanbox-api` (web), `leanbox-queue` (worker), `leanbox-scheduler` (cron `* * * * *`).
   - The web service's `preDeployCommand` runs `php artisan migrate --force` before traffic shifts.
   - Fallback if pre-deploy isn't available on your plan: open the web service **Shell** and run `php artisan migrate --force` once.
4. Verify: `GET https://<api>/up` → 200; `GET https://<api>/api/v1/...` returns the JSON envelope.

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
