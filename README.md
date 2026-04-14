# Statsupal

Status pages, HTTP monitoring, and incident notifications (Discord, email) backed by **Supabase** and deployable on **Railway**.

## Launch checklist (ops)

### Required environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Web + worker | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web | Browser client (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Web + worker | Server-only; monitoring and admin queries |
| `NEXT_PUBLIC_APP_URL` | Web | Absolute URLs (OAuth, emails, links) |
| `MONITOR_INTERVAL_MS` | Web (loop) / worker | Check interval in ms (default `60000`) |
| `ENABLE_SERVER_MONITORING_LOOP` | Web | `true` / `false` — see [Monitoring](#monitoring-single-instance) |
| `RESEND_API_KEY` | Web | Transactional email (optional) |
| `RESEND_FROM_EMAIL` | Web | From address for Resend |
| `DISCORD_*` | Web | Discord OAuth + bot (optional) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Web | Shown in marketing, legal, and support copy |
| `MONITOR_HEARTBEAT_WEBHOOK_URL` | Web / worker | Optional POST after each successful cycle (e.g. healthchecks.io) |
| `STATSUPAL_AI_*` | Web (optional) | Server-only AI for incident summaries and draft status text; see [Developer API and AI](#developer-api-and-ai) |

Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, Discord secrets, webhook URLs) must stay **server-side** only. Never prefix with `NEXT_PUBLIC_` except the anon key and app URL as documented in `.env.example`.

### Supabase migrations

Apply everything under `supabase/migrations/` in timestamp order (includes `monitor_heartbeat` for cross-process monitor health). For a full reset from the snapshot, see `supabase/schema.sql`.

### Railway

1. **Web service**: build/start your Next.js app (`npm run build` + `npm start` or your Dockerfile).
2. **Monitoring**: choose **one** of:
   - **Embedded loop**: set `ENABLE_SERVER_MONITORING_LOOP=true` on the web service and run **a single** web replica for the process that runs checks, **or**
   - **Dedicated worker**: run `npx tsx src/worker/monitoring-worker.ts` (or compile and run) as a separate Railway service with **one** replica, and set `ENABLE_SERVER_MONITORING_LOOP=false` on the web app.

3. Health checks:
   - `GET /api/health` — process up.
   - `GET /api/health/monitoring` — in-process snapshot + DB heartbeat + stale hint (rate limited).

### Verify notifications

- **Discord**: complete OAuth in Settings; trigger a test incident or use a down staging URL to confirm bot/webhook posts (check server logs for `[discord]` / `[notifications]`).
- **Email**: configure Resend + `RESEND_FROM_EMAIL`; confirm workspace alert email in Settings; same incident path as above.

### Verify the monitoring loop

- Logs: lines tagged with `[monitoring]` for cycle start/finish and errors.
- `GET /api/health/monitoring`: `database.lastCycleCompletedAt` should advance roughly every `MONITOR_INTERVAL_MS` when Supabase and migrations are applied.
- Optional: set `MONITOR_HEARTBEAT_WEBHOOK_URL` to an external ping service and confirm pings after successful cycles.

## If something goes wrong

| Symptom | What to check |
|---------|----------------|
| **Supabase down** | App and worker cannot load or write data; health routes may still respond but dashboard fails; check Supabase status and credentials. |
| **Discord 403** | Bot missing permissions or kicked from server; webhook URL revoked; see logs `[discord]`. Monitoring and incidents in the DB still work. |
| **Resend fails** | Invalid API key, unverified domain, or rate limits; see logs `[notifications]`. Monitoring continues; emails are skipped. |
| **Worker stopped** | `database` heartbeat stops updating; `/api/health/monitoring` goes `stale`; restart Railway worker or re-enable loop on a single web instance. |

## Developer API and AI

### Customer API keys (Settings → Developer API)

- Keys are created in the dashboard; the **full secret is shown once**. The database stores only a **SHA-256 hash** and a short **prefix** for identification.
- Authenticate programmatic requests with `Authorization: Bearer stu_live_...`.
- **Public HTTP API** (scoped, rate limited): `GET/POST /api/public/status`, `/api/public/incidents`, `/api/public/uptime`, `POST /api/public/maintenance`. Each key has scopes such as `read:status`, `write:incidents`, etc.
- **Key management** (session cookie, not Bearer): `GET/POST /api/developer/keys`, `DELETE /api/developer/keys/[id]`.

Apply migration `20260408120000_developer_api_keys.sql` (or use an up-to-date `supabase/schema.sql`) so the `developer_api_keys` table exists.

### AI assistant (optional)

- Configure `STATSUPAL_AI_PROVIDER`, `STATSUPAL_AI_API_KEY`, and `STATSUPAL_AI_MODEL` in the server environment (see `.env.example`). Temperature and max output tokens are optional.
- AI is used only for **draft text** (summaries, suggested public updates, likely-cause hints, friendly rewrites). It does **not** change service status, monitoring, or third-party sites.

## Monitoring (single instance)

The monitor is designed for **one writer** at a time. In-memory rate limits and the in-process fields on `/api/health/monitoring` are **per Node process**. Scaling multiple workers or multiple loops without redesign will duplicate checks and incidents. The `monitor_heartbeat` table gives a **shared** last-success timestamp when migrations are applied.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run test
```

## Project structure (high level)

- `src/app/` — App Router (dashboard, marketing, public status, API routes).
- `src/lib/monitoring/` — HTTP checks, server cycle, optional heartbeat webhook.
- `src/worker/monitoring-worker.ts` — Standalone monitor process for Railway.
- `supabase/migrations/` — Incremental SQL migrations.
