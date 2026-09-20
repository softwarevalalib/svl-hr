# Deployment Guide — Vercel (frontend) + Neon (database) + Vercel (API)

## Architecture

| Layer | Platform | Notes |
|-------|----------|--------|
| Frontend | **Vercel** | CRA React app (`frontend/`) |
| API | **Vercel** (Node serverless) | Express app (`backend/`) — Neon does not host Express |
| Database | **Neon Postgres** | Project `svl-hrm` (`winter-cloud-48935640`) |

Neon provides PostgreSQL. The Node API is deployed as a Vercel serverless function that connects to Neon via `DATABASE_URL`.

---

## 1. Neon database (done / re-run anytime)

Project: **svl-hrm**  
Region: `aws-us-east-1`

```bash
cd hr_system_react/backend
cp .env.example .env
# Paste DATABASE_URL from Neon console → Connection string (pooled)
npm install
npm run migrate:neon
```

Default login after seed: `admin` / `admin123`

Get the connection string anytime from [Neon Console](https://console.neon.tech) or MCP `get_connection_string` for project `winter-cloud-48935640`.

Use the **pooled** connection string (`-pooler` host) for serverless.

---

## 2. Deploy backend API to Vercel

```bash
cd hr_system_react/backend
npx vercel
```

In the Vercel project **Settings → Environment Variables**, set:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon pooled connection string |
| `JWT_SECRET` | Long random secret |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app` |
| `NODE_ENV` | `production` |

Redeploy after setting env vars.

Health check: `https://your-api.vercel.app/api/health`

---

## 3. Deploy frontend to Vercel

```bash
cd hr_system_react/frontend
npx vercel
```

Environment variables:

| Name | Value |
|------|--------|
| `REACT_APP_API_URL` | `https://your-api.vercel.app/api` |

**Important:** CRA bakes `REACT_APP_*` in at build time. Set the variable before the production build / redeploy after changing it.

Root directory in Vercel UI: `frontend` (if importing the monorepo), or deploy from `frontend/` alone.

---

## 4. Local development

**Option A — SQLite (default)**  
Unset `DATABASE_URL`, run:

```bash
cd backend && npm start
cd frontend && npm start   # proxies /api → localhost:3001
```

**Option B — Neon locally**

```bash
cd backend
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
