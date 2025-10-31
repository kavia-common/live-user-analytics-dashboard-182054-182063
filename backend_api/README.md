# Backend API (Node.js + TypeScript)

This is the backend API for the Real-time User Analytics Dashboard. It exposes an Express HTTP server, integrates with MongoDB (via Mongoose), and is wired for Socket.io real-time capabilities with Clerk authentication and MongoDB Change Streams.

## Tech Stack

- Node.js + TypeScript
- Express, Helmet, CORS, Morgan, Rate Limiting
- Socket.io (namespace: `/realtime`) with Clerk JWT auth
- MongoDB + Mongoose + Change Streams
- Clerk for auth (admin role mapping via ADMIN_EMAILS)
- Joi for input validation

## Environment

Copy `.env.example` to `.env` and set these:

- `MONGODB_URI=...` (MongoDB Atlas/Replica Set required for change streams)
- `PORT=4000`
- `CORS_ORIGIN=http://localhost:3000`
- `SOCKET_PATH=/socket.io`
- `NODE_ENV=development`
- `CLERK_SECRET_KEY=...` (backend secret from Clerk)
- `CLERK_JWT_ISSUER=` (optional, for custom JWT template verification)
- `ADMIN_EMAILS=user1@example.com,user2@example.com` (CSV emails that should be admins)
- `LOCAL_JWT_AUTH=false` (optional; if true, enables legacy password-based signup/login endpoints)
- `JWT_SECRET=` (required only if `LOCAL_JWT_AUTH=true`)

CORS_ORIGIN must match your frontend origin(s) exactly (including protocol). You may provide multiple origins as CSV.

## Getting Started

1. Install dependencies:

   - From the `backend_api` directory:
     ```
     npm install
     ```

2. Run in development:

   ```
   npm run dev
   ```

   Server runs at `http://localhost:4000`.
   - Health: `GET /health`
   - E2E sanity endpoints:
     - `GET /api/e2e/health` → 200 JSON
     - DEV-only (NODE_ENV=development):
       - `POST /api/e2e/dev/signup` and `POST /api/e2e/dev/login` for legacy in-memory auth (when enabled)

3. Build and start (production-like):

   ```
   npm run build
   npm start
   ```

## API Overview

Base path: `/api`

- Auth
  - `GET /api/auth/me` → `{ user }` (Clerk verified; `{ id, email, role }`)
  - Legacy `POST /api/auth/signup|login` only when `LOCAL_JWT_AUTH=true`
- Users (admin only)
  - `GET /api/users?page=1&limit=20` → paginated list
  - `PATCH /api/users/:id/role` body: `{ role: "admin" | "user" }`
- Activities
  - `GET /api/activities/recent?limit=50` → latest events
  - `POST /api/activities/track` → track client events (see payload schema below)
  - `POST /api/activities` (admin) → create synthetic event for testing
- Stats
  - `GET /api/stats/overview?sinceMinutes=60`
  - `GET /api/stats/timeseries?intervalMinutes=5&totalMinutes=60`
  - `GET /api/stats/devices?sinceMinutes=60`
  - `GET /api/stats/locations?sinceMinutes=60`

All non-auth routes require a valid Clerk JWT via `Authorization: Bearer <token>`.

### Event Tracking Payload Schema

POST `/api/activities/track` expects:

```json
{
  "type": "page_view | login | session_start | session_end | click | navigation",
  "metadata": {
    "path": "/path",
    "referrer": "https://referrer",
    "device": { "ua": "...", "os": "macOS", "browser": "Chrome" },
    "location": { "country": "US", "region": "CA", "city": "SF", "ip": "203.0.113.5" }
  }
}
```

See `src/models/ActivityEvent.ts` for stored fields and indexes.

## Realtime

Socket.io is mounted at `SOCKET_PATH` and protected by Clerk JWT on the `/realtime` namespace.

- Namespace: `/realtime`
- Authenticate by providing token:
  - Query: `io('/realtime', { path: SOCKET_PATH, query: { token } })`
  - Auth payload: `io('/realtime', { auth: { token: 'Bearer <token>' } })`
  - Extra header: `Authorization: Bearer <token>`

Events emitted:
- `connected` — on successful connection
- `activity:new` — on new `ActivityEvent` insert
- `stats:update` — on activity/session changes with refreshed overview stats

Backed by MongoDB Change Streams on `ActivityEvent` and `Session`. Requires a replica set.

## Project Structure

```
backend_api/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   └── env.ts
│   ├── db/
│   │   └── mongoose.ts
│   ├── middleware/
│   │   ├── auth.ts            # legacy (dev-only)
│   │   ├── clerkAuth.ts       # Clerk verification + role mapping
│   │   └── error.ts
│   ├── models/
│   ├── realtime/
│   │   ├── socket.ts          # Socket.io with Clerk auth on /realtime
│   │   └── changeStreams.ts
│   ├── routes/
│   │   ├── auth.ts            # /me (Clerk) + optional legacy endpoints
│   │   ├── users.ts
│   │   ├── activities.ts
│   │   └── stats.ts
│   └── services/
├── tsconfig.json
├── package.json
└── README.md
```

## Deployment

- Set Clerk keys and `ADMIN_EMAILS`.
- Keep `SOCKET_PATH` and CORS aligned with frontend.
- Prefer same-origin for `/api` and `/socket.io` in production.

## Troubleshooting

- 401 Unauthorized:
  - Missing or invalid Clerk token. Ensure frontend sends `Authorization: Bearer <jwt>`.
  - Keys from different Clerk projects/environments; use matching pair.
- CORS/WS issues:
  - Add exact frontend origin(s) to `CORS_ORIGIN`. Include protocol and port.
  - Ensure `SOCKET_PATH` matches frontend `REACT_APP_SOCKET_PATH`.
- Change Streams disabled:
  - Use MongoDB Atlas or enable a replica set locally. `$changeStream` requires replica set.
- Proxy/ad blockers:
  - Some block analytics routes. Consider custom paths or separate `REACT_APP_API_URL`.

