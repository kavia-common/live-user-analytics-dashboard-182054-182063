# Backend API (Node.js + TypeScript)

This is the backend API for the Real-time User Analytics Dashboard. It exposes an Express HTTP server, integrates with MongoDB (via Mongoose), and is wired for Socket.io real-time capabilities with JWT authentication and MongoDB Change Streams.

## Tech Stack

- Node.js + TypeScript
- Express, Helmet, CORS, Morgan, Rate Limiting
- Socket.io (namespace: `/realtime`) with JWT auth
- MongoDB + Mongoose + Change Streams
- JWT, Bcrypt
- Joi for input validation

## Environment

Copy `.env.example` to `.env` and set these:

- `MONGODB_URI=...` (MongoDB Atlas/Replica Set required for change streams)
- `JWT_SECRET=...`
- `PORT=4000`
- `CORS_ORIGIN=http://localhost:3000`
- `SOCKET_PATH=/socket.io`
- `NODE_ENV=development`

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

3. Build and start (production-like):

   ```
   npm run build
   npm start
   ```

## API Overview

Base path: `/api`

- Auth
  - `POST /api/auth/signup` → `{ token, user }`
  - `POST /api/auth/login` → `{ token, user }`
  - `GET /api/auth/me` → `{ user }` (requires `Authorization: Bearer <token>`)
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

All non-auth routes require JWT via `Authorization: Bearer <token>`.

## Realtime

Socket.io is mounted at `SOCKET_PATH` and protected by JWT on the `/realtime` namespace.

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
│   ├── app.ts                  # Express app builder with middleware and routes
│   ├── server.ts               # Bootstrap server + socket + changestreams
│   ├── config/
│   │   └── env.ts              # Env helpers
│   ├── db/
│   │   └── mongoose.ts         # MongoDB connection helper
│   ├── middleware/
│   │   ├── auth.ts             # JWT auth + role check
│   │   └── error.ts            # Error handler
│   ├── models/
│   │   ├── User.ts
│   │   ├── ActivityEvent.ts
│   │   └── Session.ts
│   ├── realtime/
│   │   ├── socket.ts           # Socket.io with JWT auth on /realtime
│   │   └── changeStreams.ts    # MongoDB Change Streams emit realtime events
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── activities.ts
│   │   └── stats.ts
│   └── services/
│       ├── authService.ts
│       ├── userService.ts
│       ├── activityService.ts
│       └── statsService.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Notes

- MongoDB Change Streams require a replica set (Atlas recommended).
- CORS is configured via `CORS_ORIGIN`. Set to your frontend host (dev or Vercel domain).
- The Socket.io namespace `/realtime` enforces JWT during the handshake.
- Minimal aggregations are provided for the dashboard, extend as needed.
