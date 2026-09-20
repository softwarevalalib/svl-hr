# Deployment Guide — Vercel (frontend + API) + Neon (database)

## Architecture

| Layer | Platform | Notes |
|-------|----------|--------|
| Frontend + API | **Vercel** (one project) | Live: [https://hrsystem-ochre.vercel.app/](https://hrsystem-ochre.vercel.app/) |
| Database | **Neon Postgres** | Project `svl-hrm` (`winter-cloud-48935640`) |

Same origin: React SPA + Express `/api/*` on one deployment (`vercel.json` at repo root).

Neon provides PostgreSQL. The Node API runs as a Vercel serverless function (`api/index.js`) connected via `DATABASE_URL`.

---

## 1. Neon database (done / re-run anytime)

Project: **svl-hrm**  
Region: `aws-us-east-1`

```bash
cd hr_system_react/frontend/backend
cp .env.example .env
# Paste DATABASE_URL from Neon console → Connection string (pooled)
npm install
npm run migrate:neon
```

Default login after seed: `admin` / `admin123`

Get the connection string anytime from [Neon Console](https://console.neon.tech) or MCP `get_connection_string` for project `winter-cloud-48935640`.

Use the **pooled** connection string (`-pooler` host) for serverless.

---

## 2. Deploy to Vercel (frontend + API together)

**Root Directory:** repository root (where `vercel.json` and `api/` live) — not `frontend/` alone.

```bash
cd hr_system_react
npx vercel
```

In the Vercel project **Settings → Environment Variables**, set:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon pooled connection string |
| `JWT_SECRET` | Long random secret (same as local if you want shared sessions) |
| `CORS_ORIGINS` | `https://hrsystem-ochre.vercel.app,http://localhost:3000,http://localhost:3002` |
| `NODE_ENV` | `production` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Optional — enables email notifications |

`REACT_APP_API_URL` is **not required** when using the same host (frontend calls `/api/...`).

Redeploy after setting env vars.

Health check: [https://hrsystem-ochre.vercel.app/api/health](https://hrsystem-ochre.vercel.app/api/health)

**Live app:** [https://hrsystem-ochre.vercel.app/](https://hrsystem-ochre.vercel.app/)

After updating schema (documents/notifications), re-run:

```bash
cd frontend/backend && npm run migrate:neon
```

Or apply only the extra SQL file in Neon SQL Editor: `database/postgres/documents_notifications.sql`.

---

## Frontend API URL (important)

**Do not** set `REACT_APP_API_URL` to your Neon `DATABASE_URL`. That causes `Unsupported protocol postgresql:` on login.

For same-origin deploy (`hrsystem-ochre.vercel.app`), leave `REACT_APP_API_URL` **unset** so the app uses `/api`.

If you previously set it incorrectly, delete that env var and redeploy.

---

## 4. Local development

**Option A — SQLite (default)**  
Unset `DATABASE_URL`, run:

```bash
cd frontend/backend && npm start
cd frontend && npm start   # proxies /api → localhost:3001
```

**Option B — Neon locally**

```bash
cd frontend/backend
# .env contains DATABASE_URL
npm start
```

Frontend:

```bash
cd frontend
# optional .env.local:
# REACT_APP_API_URL=http://localhost:3001/api
npm start
```

---

## 5. CORS

Backend allows origins listed in `CORS_ORIGINS` (comma-separated). Include every Vercel preview URL you need, or use `*` only for temporary testing.

---

## 6. Checklist

- [ ] `npm run migrate:neon` succeeded
- [ ] Backend Vercel env: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`
- [ ] Frontend Vercel env: `REACT_APP_API_URL`
- [ ] Login works with `admin` / `admin123`
- [ ] `/api/health` reports `Neon/PostgreSQL`

---

## Notes

- `backend/.env` is gitignored — never commit Neon credentials.
- SQLite remains available for local offline work when `DATABASE_URL` is absent.
- Large PDF exports on Vercel are subject to serverless timeouts; increase max duration in the Vercel dashboard if needed.
