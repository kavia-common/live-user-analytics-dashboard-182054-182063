# live-user-analytics-dashboard-182054-182063

Real-time User Analytics Dashboard with React (frontend) and Node.js/Express + MongoDB + Socket.io (backend).

## Local Development

- Backend
  1. cd `backend_api`
  2. Copy `.env.example` → `.env` and fill values
  3. `npm install`
  4. `npm run dev` (http://localhost:4000)

- Frontend
  1. cd `frontend_dashboard`
  2. Copy `.env.example` → `.env` and fill values (point to backend)
  3. `npm install`
  4. `npm start` (http://localhost:3000)

## Environment Variables

Frontend (`frontend_dashboard/.env.example`):
- `REACT_APP_CLERK_PUBLISHABLE_KEY` → Clerk publishable key (required)
- `REACT_APP_API_URL` → backend base URL (http://localhost:4000 in dev) optional. If requests to `/api/stats/*` are blocked by an extension, pointing this to a different host can help.
- `REACT_APP_SOCKET_URL` → backend base URL for socket (optional; defaults to API URL)
- `REACT_APP_SOCKET_PATH` → socket path (defaults to `/socket.io`)
- `REACT_APP_ADMIN_EMAILS` → optional CSV of admin emails (client-side UI gating only)

Backend (`backend_api/.env.example`):
- `MONGODB_URI` (Atlas/Replica Set)
- `PORT` (default 4000)
- `CORS_ORIGIN` (frontend origin)
- `SOCKET_PATH` (default `/socket.io`)
- `NODE_ENV`
- `CLERK_SECRET_KEY` (required)
- `CLERK_JWT_ISSUER` (optional)
- `ADMIN_EMAILS` (CSV of admin emails, server source of truth)
- `LOCAL_JWT_AUTH` (optional; enable legacy local auth endpoints if `true`)
- `JWT_SECRET` (optional; legacy only)

## Deployment Overview

- Backend on Render or Railway:
  - Set env vars: `MONGODB_URI`, `CLERK_SECRET_KEY`, `ADMIN_EMAILS`, `CORS_ORIGIN` (frontend URL), `SOCKET_PATH` (optional), `NODE_ENV=production`. Let platform set `PORT`.
  - Build: `npm install && npm run build`
  - Start: `npm start`

- Frontend on Vercel:
  - Set env vars: `REACT_APP_CLERK_PUBLISHABLE_KEY`, `REACT_APP_API_URL` to backend URL, `REACT_APP_SOCKET_URL` to same (optional), `REACT_APP_SOCKET_PATH` to `/socket.io` (if changed).
  - Deploy with default React settings.

Ensure `CORS_ORIGIN` on backend matches your deployed frontend origin to allow HTTP and WebSocket connections. Keep same-origin `/api` and `/socket.io` for single-host mode.
