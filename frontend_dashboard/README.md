# Frontend Dashboard (React)

A modern, responsive, real-time User Analytics Dashboard UI implementing the Violet Dreams theme.

## Features

- React Router v6: Dashboard, Users (admin only), Settings, Login
- AuthContext with JWT, persisted in localStorage
- Axios API client with request/response interceptors
- Socket.io client hook for realtime updates (/realtime namespace with JWT)
- Charts via Recharts (line, bar, pie)
- Live activity feed, stat cards, and responsive layout with sidebar + header
- Dark mode with persistence and theme variables

## Environment

Single-host mode is the default. The frontend calls the backend at the same origin:
- HTTP requests go to relative `/api/*`
- Socket.io connects to the same origin at path `/socket.io` and namespace `/realtime`

No environment variables are required for single-host mode.

### Cloud Preview (single-host dev)

Some cloud environments expose the CRA dev server via a preview URL and inject a non-localhost Host header. By default, CRA rejects unknown hosts with "Invalid Host header". This repo includes a dev-only override:

- `.env.development.local` sets:
  - `HOST=0.0.0.0` so the dev server binds externally
  - `DANGEROUSLY_DISABLE_HOST_CHECK=true` so the preview host is accepted (dev only)
- `package.json` has a `proxy` pointing to the backend at `http://localhost:4000` and also proxies websockets (`/socket.io`), so both HTTP and WS go through the same origin.
- Optional: use `npm run start:preview` to force these envs if your platform ignores `.env.development.local`.

Verify:
- Backend running on port 4000
- Start frontend:
  - `npm start` (uses .env.development.local) or
  - `npm run start:preview`
- Check: `curl <your-preview-url>/api/health` → should return `{ status: "ok", ... }`.

WebSocket notes:
- CRA's built-in proxy forwards websockets to the backend automatically when `proxy` is set, so Socket.io (`/socket.io` + `/realtime`) works on the same origin without extra config.

### Development proxy (local)

- The CRA dev server is configured with `"proxy": "http://localhost:4000"` in `package.json`.
- When running `npm start` in `frontend_dashboard` and the backend is running on port 4000, all requests to:
  - `/api/*` will be proxied to the backend.
  - `/socket.io/*` (websocket) will also be proxied to the backend.
- Proxy preserves JSON semantics and does not transform request/response bodies. POST/PUT are forwarded correctly.
- Verify with:
  - `curl -i http://localhost:3000/api/health` → 200 JSON
  - `curl -i -X POST http://localhost:3000/api/auth/signup -H 'Content-Type: application/json' -d '{"email":"u1@example.com","password":"secret123"}'`

To use split-host for local development without relying on the proxy, create a `.env` file:

- `REACT_APP_API_URL=http://localhost:4000`
- `REACT_APP_SOCKET_URL=http://localhost:4000` (optional; defaults to API URL)
- `REACT_APP_SOCKET_PATH=/socket.io` (optional; default is `/socket.io`)

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

- Login: Email/password login or quick signup (glassmorphism design)
- Dashboard: KPIs, timeseries, devices/locations charts, and live feed
- Users: Admin-only user list and role updates
- Settings: Profile summary and theme toggle

## Notes

- All non-auth API requests require JWT bearer token.
- Socket.io connects to `/realtime` namespace using the JWT during handshake.
- Users page is protected with role-based guard (admin).
