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

CORS_ORIGIN must match your frontend origin exactly (including protocol). For Vercel, it will look like `https://your-frontend.vercel.app`.

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
       - `POST /api/e2e/dev/signup` and `POST /api/e2e/dev/login` for in-memory fallback (unrelated to Clerk)

3. Build and start (production-like):

   ```
   npm run build
   npm start
   ```

## API Overview

Base path: `/api`

- Auth
  - `GET /api/auth/me` → `{ user }` (Clerk-verified; returns `{ id, email, role }`)
  - `POST /api/auth/signup` and `POST /api/auth/login` only when `LOCAL_JWT_AUTH=true` (for dev compatibility)
- Users (admin only)
  - `GET /api/users?page=1&limit=20` → paginated list
  - `PATCH /api/users/:id/role` body: `{ role: "admin" | "user" }`
- Activities
  - `GET /api/activities/recent?limit=50` → latest events
  - `POST /api/activities` (admin) → create synthetic event for testing
- Stats
  - `GET /api/stats/overview?sinceMinutes=60`
  - `GET /api/stats/timeseries?intervalMinutes=5&totalMinutes=60`
  - `GET /api/stats/devices?sinceMinutes=60`
  - `GET /api/stats/locations?sinceMinutes=60`

All non-auth routes require a Clerk JWT in `Authorization: Bearer <token>`.

## Realtime

Socket.io is mounted at `SOCKET_PATH` and protected by Clerk JWT on the `/realtime` namespace.

- Namespace: `/realtime`
- Authenticate by providing token:
  - As query: `io('/realtime', { path: SOCKET_PATH, query: { token } })`
  - Or as auth header: `io('/realtime', { auth: { token: 'Bearer <token>' } })`

Events emitted:
- `connected` — on successful connection
- `activity:new` — whenever a new `ActivityEvent` is inserted
- `stats:update` — minimal updates on activity/session changes (overview stats)

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
│   │   ├── auth.ts            # legacy role helper and jwt (dev-only)
│   │   ├── clerkAuth.ts       # Clerk verification + role mapping
│   │   └── error.ts
│   ├── models/
│   ├── realtime/
│   │   ├── socket.ts          # Socket.io with Clerk auth on /realtime
│   │   └── changeStreams.ts
│   ├── routes/
│   │   ├── auth.ts            # /me returns Clerk user; legacy endpoints behind flag
│   │   ├── users.ts
│   │   ├── activities.ts
│   │   └── stats.ts
│   └── services/
├── tsconfig.json
├── package.json
└── README.md
```

## Deployment

- Set Clerk keys and ADMIN_EMAILS.
- Keep same-origin with frontend for `/api` and `/socket.io`.

## Notes

- MongoDB Change Streams require a replica set (Atlas recommended).
- The server determines admin role by checking Clerk user email against ADMIN_EMAILS.
- CORS configured via `CORS_ORIGIN`. Keep `SOCKET_PATH` consistent between frontend and backend.
