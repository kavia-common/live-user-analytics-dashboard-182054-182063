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

Frontend (`frontend_dashboard/.env`):
- `REACT_APP_CLERK_PUBLISHABLE_KEY` — required Clerk frontend key
- `REACT_APP_API_URL` — optional override backend base (default: relative `/api` via CRA proxy)
- `REACT_APP_SOCKET_URL` — optional WS base (default: same as API/base origin)
- `REACT_APP_SOCKET_PATH` — defaults to `/socket.io`
- `REACT_APP_ADMIN_EMAILS` — optional CSV for client-side UI gating only

Backend (`backend_api/.env`):
- `MONGODB_URI` — Atlas/Replica Set required for Change Streams
- `CLERK_SECRET_KEY` — required Clerk backend secret
- `CORS_ORIGIN` — CSV of allowed origins (e.g., `http://localhost:3000,https://your-frontend.vercel.app`)
- `PORT` — default `4000` (platform may inject)
- `SOCKET_PATH` — default `/socket.io`
- `NODE_ENV` — `development` or `production`
- `ADMIN_EMAILS` — CSV of admin emails (server source of truth)
- `LOCAL_JWT_AUTH` — optional; `true` enables legacy local auth endpoints for dev
- `JWT_SECRET` — required only if `LOCAL_JWT_AUTH=true`
- `CLERK_JWT_ISSUER` — optional override if using custom Clerk JWT template

Note on container_env map: the following variables may appear in containerized environments and should be mapped to the above as appropriate:
`REACT_APP_MONGODB_URI, REACT_APP_JWT_SECRET, REACT_APP_CORS_ORIGIN, REACT_APP_backend_api.MONGODB_URI, REACT_APP_backend_api.JWT_SECRET, REACT_APP_backend_api.CORS_ORIGIN, REACT_APP_backend_api.PORT, REACT_APP_frontend_dashboard.REACT_APP_API_URL, REACT_APP_frontend_dashboard.REACT_APP_SOCKET_URL, REACT_APP_frontend_dashboard.REACT_APP_SOCKET_PATH, REACT_APP_CLERK_PUBLISHABLE_KEY, REACT_APP_CLERK_SECRET_KEY, REACT_APP_ADMIN_EMAILS, REACT_APP_REACT_APP_CLERK_PUBLISHABLE_KEY`. Frontend uses only `REACT_APP_*`. Backend reads non-`REACT_APP_*` values.

## Clerk Setup

- Create a Clerk application.
- Set frontend: `REACT_APP_CLERK_PUBLISHABLE_KEY`.
- Set backend: `CLERK_SECRET_KEY`.
- Ensure both keys are from the same Clerk project/environment.
- Add dev redirect URLs in Clerk: `http://localhost:3000/sign-in` and `http://localhost:3000/sign-up`.

## Admin Role Mapping (ADMIN_EMAILS)

The backend maps admin role by comparing the authenticated Clerk user email against `ADMIN_EMAILS` (CSV). This mapping is enforced in both HTTP middleware and Socket.io handshake. The frontend `REACT_APP_ADMIN_EMAILS` is only for UI hints; server is authoritative.

## Event Tracking Payload

The frontend posts activity to `/api/activities/track`. The canonical payload structure is:

```json
{
  "type": "page_view | login | session_start | session_end | click | navigation",
  "metadata": {
    "path": "/current/path",
    "referrer": "https://referrer.example",
    "device": { "ua": "...", "os": "macOS", "browser": "Chrome" },
    "location": { "country": "US", "region": "CA", "city": "San Francisco", "ip": "203.0.113.5" }
  }
}
```

On insert, the backend stores an ActivityEvent document with fields:
- `type`, `page/path/referrer`, `device`, `location`, `metadata`, `occurredAt`, and optional `userId`, `clerkUserId`, `email`, `sessionId`.

Example page view:

```json
{
  "type": "page_view",
  "metadata": {
    "path": "/dashboard",
    "referrer": "",
    "device": { "ua": "Mozilla/5.0", "os": "Windows", "browser": "Chrome" },
    "location": { "country": "US" }
  }
}
```

## Realtime

- Socket.io server runs at `SOCKET_PATH` (default `/socket.io`) with namespace `/realtime`.
- Clients connect to `ws(s)://<backend>/realtime` and include a Clerk JWT:
  - As `auth: { token: "<jwt>" }`, or
  - As `headers: { Authorization: "Bearer <jwt>" }`, or
  - As `query: { token: "<jwt or Bearer <jwt>>" }`.

MongoDB Change Streams on `ActivityEvent` and `Session` emit:
- `activity:new` on new activity inserts (includes essential event fields).
- `stats:update` on activity/session changes with refreshed overview stats.

Requires MongoDB replica set (Atlas recommended).

## Startup Checklist

1. MongoDB Atlas URI with replica set → `MONGODB_URI`.
2. Clerk keys set: frontend `REACT_APP_CLERK_PUBLISHABLE_KEY`, backend `CLERK_SECRET_KEY`.
3. Backend `.env`: `CORS_ORIGIN` includes your frontend origin(s); `SOCKET_PATH` consistent.
4. Frontend `.env`: configure `REACT_APP_API_URL`, `REACT_APP_SOCKET_URL`, and `REACT_APP_SOCKET_PATH` if not single-origin.
5. Start backend: `npm run dev` (http://localhost:4000).
6. Start frontend: `npm start` (http://localhost:3000).
7. Verify:
   - `GET http://localhost:4000/health` → 200
   - `GET http://localhost:3000/api/e2e/health` via proxy → 200
   - Socket connects and receives `connected`.
   - Dashboard updates on new activities.

## Troubleshooting

- Invalid Host header: in preview environments, set CRA dev env (local only): `DANGEROUSLY_DISABLE_HOST_CHECK=true`, `HOST=0.0.0.0`, `PORT=3000`.
- Ports/proxy: CRA proxy forwards `/api/*` and `/socket.io/*` to `http://localhost:4000`. If using split hosts, set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL`.
- CORS: ensure `CORS_ORIGIN` on backend includes exact frontend origins (protocol + host + port).
- Ad blockers: some block `/api/analytics` or similar. Use `REACT_APP_API_URL` pointing to a different host or path.
- WebSocket path mismatch: keep `SOCKET_PATH` same across frontend and backend.
- MongoDB change streams require a replica set; if you see “$changeStream not supported”, switch to Atlas or enable replica set locally.
- Clerk 401s: verify tokens are sent and keys are from the same project/environment. If using custom JWT template, set `CLERK_JWT_ISSUER` accordingly.

## Deployment Overview

- Backend (Render/Railway):
  - Set env vars: `MONGODB_URI`, `CLERK_SECRET_KEY`, `ADMIN_EMAILS`, `CORS_ORIGIN`, `SOCKET_PATH` (optional), `NODE_ENV=production`. Platform sets `PORT`.
  - Build: `npm install && npm run build`
  - Start: `npm start`

- Frontend (Vercel):
  - Set env vars: `REACT_APP_CLERK_PUBLISHABLE_KEY`, `REACT_APP_API_URL`, `REACT_APP_SOCKET_URL` (optional), `REACT_APP_SOCKET_PATH` (if changed).
  - Deploy with default React settings.

Ensure `CORS_ORIGIN` on backend matches your deployed frontend origin to allow HTTP and WebSocket connections. Keep same-origin for `/api` and `/socket.io` if possible.