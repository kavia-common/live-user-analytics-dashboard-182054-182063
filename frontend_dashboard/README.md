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
- REACT_APP_CLERK_PUBLISHABLE_KEY (required) — Clerk frontend key
- REACT_APP_API_URL — optional override of API base (default: same-origin)
- REACT_APP_SOCKET_URL — optional override WS base (default: same-origin)
- REACT_APP_SOCKET_PATH — defaults to `/socket.io`
- REACT_APP_ADMIN_EMAILS — optional CSV of admin emails for client-side UI gating (server is authoritative)

### Clerk setup

1) Create a Clerk application and get:
- Publishable Key → set REACT_APP_CLERK_PUBLISHABLE_KEY in frontend
- Secret Key → set CLERK_SECRET_KEY in backend

2) In Clerk dashboard, add redirect URLs for:
- http://localhost:3000/sign-in
- http://localhost:3000/sign-up

3) In production, set the correct URLs for your domain.

### Cloud Preview (single-host dev)

Same as before; CRA proxy is configured and websockets are proxied. Use `npm run start:preview` if needed.

Verify:
- Backend running on port 4000
- Frontend at http://localhost:3000
- Check: `curl http://localhost:3000/api/health` → `{ status: "ok" }`

### Development proxy (local)

- `"proxy": "http://localhost:4000"` forwards `/api/*` and `/socket.io/*` to backend.
- For split-host dev, create `.env` with:
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

## Notes

- All non-auth API requests include Clerk JWT via Authorization header.
- Socket.io connects to `/realtime` namespace; backend handshake verifies Clerk token (same-origin).
- isAdmin is determined by backend `/api/auth/me`. For UI-only hints, you may set REACT_APP_ADMIN_EMAILS to a CSV of emails, but the server is the source of truth.
