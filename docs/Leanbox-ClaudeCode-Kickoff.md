# Leanbox — How to Build with Claude Code

A practical guide for turning the ClickUp tasks into working code. The golden rule: **work one task at a time, in order, and review/test before moving on.** Don't ask Claude Code to "build the whole app" in one go — it produces far better results task by task.

---

## Step 0 — Before you start (accounts & tools)

Set these up once so Claude Code never blocks on missing credentials:

- **Local tools:** Node.js 20+, PHP 8.2+, Composer, Git.
- **Database:** a PostgreSQL instance (local, or Neon/Supabase free tier).
- **Redis:** local or a managed instance.
- **Payments (sandbox/test keys):** Stripe + PayMongo or Xendit (GCash).
- **Images:** a Cloudinary account.
- **Email:** Resend account (can defer until notifications).

Keep all keys in a password manager; you'll paste them into `.env` files (never commit them).

---

## Step 1 — Set up the repos and give Claude Code the blueprint

1. Create two folders/repos: `leanbox-api` (Laravel) and `leanbox-web` (Next.js).
2. In **each** repo, create a `docs/` folder and copy in all the blueprint files (PRD, ERD, Database Design, System Architecture, Tech Stack, User Flows, UI/UX Design Plan, the StyleGuide.html, Roadmap, Sprint Breakdown).
3. Copy the provided **`CLAUDE.md`** file into the root of each repo. Claude Code reads this automatically on every session, so it always has the project context, stack, and rules.

> Why: Claude Code works best when the source-of-truth docs live in the repo. The task descriptions reference them by name (e.g. "see PRD §5.4"), so they need to be present.

---

## Step 2 — Connect ClickUp (optional) or copy-paste

**Option A — Copy-paste (simplest, always works).** Open a ClickUp task, copy its whole description, and paste it as your prompt to Claude Code. Each task is already a self-contained brief.

**Option B — Connect ClickUp to Claude Code (recommended once set up).** Add the ClickUp MCP server so Claude Code reads tasks directly (and can update status / read comments). One-time setup:

1. In your repo terminal, add the server (use `-s user` to make it available in every project):
   ```
   claude mcp add --transport http clickup https://mcp.clickup.com/mcp -s user
   ```
2. Start Claude Code and run `/mcp`, then authenticate ClickUp in the browser (OAuth) and authorize your workspace.
3. Run `/mcp` again to confirm `clickup` shows as connected.
4. Now prompt by task, e.g.:
   ```
   Using the ClickUp MCP, open the task https://app.clickup.com/t/86d3dtdz2,
   read its full description, and implement it following CLAUDE.md and the docs in docs/.
   Plan first, then code in small steps, add tests, and don't start the next task.
   When done and tests pass, add a short comment on the ClickUp task summarizing what you did.
   ```

Notes: the MCP can read AND write your ClickUp (create comments, change status), so review what it does. It also uses some context/tool-calls per task — still work **one task at a time**. If setup ever fails, fall back to Option A (copy-paste) which always works.

> Tip: each task's URL is on its ClickUp page (and was returned when we created it, e.g. `https://app.clickup.com/t/<id>`). You can also just say "find the next unstarted task in the Leanbox — B. Backend (API) space and implement it."

---

## Step 3 — The order to build in

Follow the sprints (see `Leanbox-Sprint-Task-Breakdown.md`). Backend leads each domain; frontend follows.

1. **Sprint 0** — Database & Infra folder: scaffold both repos, build the schema, seed data.
2. **Sprint 1** — Auth & Users (backend), then Foundation & Auth UI (frontend).
3. **Sprint 2** — Catalog + Cart & Orders (backend), then Storefront (frontend).
4. **Sprint 3** — Payments + Subscriptions (backend), then Cart & Checkout (frontend).
5. **Sprint 4** — Deliveries, Reviews, Notifications (backend), then Customer Account (frontend).
6. **Sprint 5** — Admin Dashboard + Rider View + polish (frontend).
7. **Sprint 6** — Testing & QA.
8. **Sprint 7** — Deployment.

---

## Step 4 — The loop for every task

For each task, repeat this cycle:

1. **Prompt** — paste the task description (Option A) or point Claude Code at it (Option B).
2. **Review** — read the diff Claude Code proposes; ask questions before accepting.
3. **Test** — run the migrations/tests it wrote; try the feature.
4. **Commit** — commit with a clear message, then check the task off in ClickUp.
5. **Next** — move to the next task in the sprint.

Keep each task to its own focused session/conversation where practical — it keeps Claude Code's context clean.

---

## Ready-to-use prompts

### A) Very first session (run once, in `leanbox-api`)
```
This is the Leanbox project — a fitness e-commerce platform. Read CLAUDE.md and
the files in docs/ (especially PRD, ERD, Database Design, System Architecture, and
Tech Stack) to understand the project before doing anything.

We are starting Sprint 0. Do NOT build features yet. First, confirm you understand:
1. the tech stack, 2. the data model (17 tables), 3. the three user roles, and
4. the build order. Give me a short summary, then wait for my first task.
```

### B) Template for every build task
```
Implement this task for Leanbox. Follow CLAUDE.md and the referenced docs in docs/.
Work in small steps, explain your plan first, then write the code. Add tests.
Don't start the next task.

--- TASK ---
<paste the full ClickUp task description here>
```

### C) Concrete first build task (after the project is scaffolded)
```
Implement this task. Reference docs/Leanbox-ERD.mermaid and
docs/Leanbox-Database-Design.md. Show me the migration files before running them.

--- TASK ---
[S0] Migrations for all 17 tables
<paste the task's full description from ClickUp>
```

### D) When something needs a decision
```
Before coding, list any assumptions or open questions about this task. If anything
conflicts with the docs in docs/, flag it instead of guessing.
```

---

## Tips that make a big difference

- **One task per prompt.** Resist "build the whole backend." Quality drops fast with scope.
- **Make it plan first.** Ask for a short plan before code; correct course cheaply.
- **Always review diffs.** You're the reviewer; don't blind-accept.
- **Run tests each task.** The tasks include a Definition of Done — hold Claude Code to it.
- **Keep docs/ updated.** If a decision changes, update the doc so future prompts stay accurate.
- **Start the highest-risk items early** (payments, recurring billing) so surprises surface sooner.
- **Commit often.** Small commits per task make it easy to roll back.

---

*Companion file: `CLAUDE.md` — drop this in each repo root.*
