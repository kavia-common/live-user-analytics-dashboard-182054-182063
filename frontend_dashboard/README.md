# Frontend Dashboard (React)

A modern, responsive, real-time User Analytics Dashboard UI implementing the Violet Dreams theme.

## Features

- React Router v6: Dashboard, Users (admin only), Settings, Auth (Clerk SignIn/SignUp)
- Auth via Clerk: useClerk/useUser, token attached to API calls
- Axios API client with Clerk token interceptor
- Socket.io client hook for realtime updates (/realtime namespace)
- Charts via Recharts (line, bar, pie)
- Live activity feed, stat cards, and responsive layout with sidebar + header
- Dark mode with persistence and theme variables

## Environment

Single-host mode is the default. The frontend calls the backend at the same origin:
- HTTP requests go to relative `/api/*`
- Socket.io connects to the same origin at path `/socket.io` and namespace `/realtime`

Environment variables:
- `REACT_APP_CLERK_PUBLISHABLE_KEY` — required Clerk frontend key
- `REACT_APP_API_URL` — optional override of API base (default: relative `/api` via CRA proxy)
- `REACT_APP_SOCKET_URL` — optional override WS base (default: same-origin)
- `REACT_APP_SOCKET_PATH` — defaults to `/socket.io`
- `REACT_APP_ADMIN_EMAILS` — optional CSV for UI gating only; server is source of truth

Note on container_env mapping (if using container orchestration): variables like `REACT_APP_frontend_dashboard.REACT_APP_API_URL` map to the plain `REACT_APP_API_URL` used by this app.

### Clerk setup

1) Create a Clerk application and get:
- Publishable Key → set `REACT_APP_CLERK_PUBLISHABLE_KEY` in frontend
- Secret Key → set `CLERK_SECRET_KEY` in backend

Ensure both keys come from the same Clerk project/environment. If your app is behind a proxy/custom domain (e.g., previews), you may configure Clerk proxy settings to avoid token retrieval errors.

Token retrieval uses `getToken({ template: "default" })`. If using a custom template, ensure backend accepts/validates it.

2) In Clerk dashboard, add dev redirect URLs:
- http://localhost:3000/sign-in
- http://localhost:3000/sign-up

3) In production, set the correct URLs for your domain.

### Event Tracking from Frontend

The frontend posts activity to `/api/activities/track`. Minimal example:

```json
{
  "type": "page_view",
  "metadata": {
    "path": "/dashboard",
    "referrer": "",
    "device": { "ua": "Mozilla/5.0", "os": "macOS", "browser": "Chrome" }
  }
}
```

See `src/utils/activity.js` for helpers such as `trackPageView`, `trackSessionStart`, `trackSessionEnd`, and `trackLogin`.

### Realtime configuration

Socket client defaults:
- Namespace: `/realtime`
- Path: `REACT_APP_SOCKET_PATH` (default `/socket.io`)
- URL: `REACT_APP_SOCKET_URL` (default same-origin), token sent via `Authorization: Bearer <jwt>` and `auth.token`.

### Cloud Preview (single-host dev)

Fixing "Invalid Host header" in previews:
- For local development only, you may use `.env.development.local`:
  - `DANGEROUSLY_DISABLE_HOST_CHECK=true`
  - `HOST=0.0.0.0`
  - `PORT=3000`

Verify:
- Backend at http://localhost:4000
- Frontend at http://localhost:3000
- `curl http://localhost:3000/api/e2e/health` → `{ "status": "ok" }`

### Development proxy (local)

- `"proxy": "http://localhost:4000"` forwards `/api/*` and `/socket.io/*` to the backend.
- For split-host dev, set:
  - `REACT_APP_API_URL=http://localhost:4000`
  - `REACT_APP_SOCKET_URL=http://localhost:4000`
  - `REACT_APP_SOCKET_PATH=/socket.io`

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm start
```

Open http://localhost:3000

3. Build for production:

```bash
npm run build
```

## Pages

- SignIn/SignUp: Clerk-hosted components themed within app shell wrappers
- Dashboard: KPIs, timeseries, devices/locations charts, and live feed
- Users: Admin-only user list and role updates
- Settings: Profile summary and theme toggle

## Troubleshooting

- 401 errors: ensure you are signed in and the Clerk publishable/secret keys are set correctly (frontend/backend).
- CORS/WS failures: confirm backend `CORS_ORIGIN` includes your frontend URL and `REACT_APP_SOCKET_PATH` matches backend `SOCKET_PATH`.
- Ad blockers: if calls to `/api/*` are blocked, set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` to a different host.
- Invalid Host header in previews: see Cloud Preview notes above.

## Notes

- All non-auth API requests include a Clerk JWT via Authorization header.
- Socket.io connects to `/realtime` namespace; backend handshake verifies Clerk token.
- isAdmin is determined by backend `/api/auth/me`. `REACT_APP_ADMIN_EMAILS` is UI-only and not authoritative.
