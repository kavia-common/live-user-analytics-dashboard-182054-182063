# Frontend Dashboard (React)

A modern, responsive, real-time User Analytics Dashboard UI implementing the Violet Dreams theme.

## Same-Origin Backend Access (Recommended)

The frontend is configured to call the backend using SAME-ORIGIN by default:
- Axios baseURL is set to an empty string (''), so requests like `/api/*` target the current origin.
- Socket.IO client connects to the current origin by default with path `/socket.io`.

This works when the backend is reverse-proxied under the same host and exposes:
- HTTP API under `/api/*`
- Socket.IO under `/socket.io` (configurable via `REACT_APP_SOCKET_PATH`)

### Environment Overrides (Optional)
If your frontend and backend run on different origins, you can override defaults:
- `REACT_APP_API_URL`: Full API URL. Example: `https://api.myapp.com` or `https://api.myapp.com/api`
- `REACT_APP_SOCKET_URL`: Full Socket.IO URL. Example: `https://api.myapp.com`
- `REACT_APP_SOCKET_PATH`: Socket path (default `/socket.io`)

Create a `.env` from `.env.example` and set only what you need.

## Development with CRA Proxy and Preview Hosts

For local development, CRA can proxy API and Socket.IO to your backend:
- Ensure `proxy` is set in `package.json`:
  {
    "proxy": "http://localhost:4000"
  }

Then the frontend calls `/api/*` and connects to Socket.IO on the same origin (`localhost:3000`), which CRA proxies to `localhost:4000`.

Note: Do not hardcode backend URLs in code. Use relative paths and the environment variables above if needed.

### Preview/Container Environments
Some preview systems inject HOST=0.0.0.0 or enforce non-localhost host headers. Use:
- npm run start:preview
This sets HOST=0.0.0.0 and disables host checks for CRA so port 3001 (or assigned $PORT) becomes ready.

## Environment

- `REACT_APP_CLERK_PUBLISHABLE_KEY` — Clerk frontend key
- `REACT_APP_API_URL` — optional override of API base (default: same-origin)
- `REACT_APP_SOCKET_URL` — optional override WS base (default: same-origin)
- `REACT_APP_SOCKET_PATH` — defaults to `/socket.io`
- `REACT_APP_ADMIN_EMAILS` — optional CSV for UI gating only; server is the source of truth

Some hosting orchestrators may map container-scoped variables (e.g., `REACT_APP_frontend_dashboard.REACT_APP_API_URL`) to the plain variables used by this app.

## Getting Started

1) Install dependencies:
- npm install

2) Start dev server:
- npm start

3) Open http://localhost:3000

4) Build for production:
- npm run build

## Troubleshooting

- 401 errors: ensure you are signed in and Clerk keys are set correctly.
- CORS/WS failures: if using split origins, set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL`. Ensure `REACT_APP_SOCKET_PATH` matches backend socket path.
- Ad blockers: if calls to `/api/*` are blocked, set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` to a different host.
- Invalid Host header in previews: use `npm run start:preview` if provided to disable host checks for local-only previews.

