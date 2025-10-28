# Backend API (Node.js + TypeScript)

This is the backend API for the Real-time User Analytics Dashboard. It exposes an Express HTTP server, integrates with MongoDB (via Mongoose), and is wired for Socket.io real-time capabilities. This scaffold includes MongoDB models (User, ActivityEvent, Session) with analytics-friendly indexes and a robust server bootstrap.

## Tech Stack

- Node.js + TypeScript
- Express, Helmet, CORS, Morgan, Rate Limiting
- Socket.io
- MongoDB + Mongoose
- JWT, Bcrypt
- Joi/Zod (validation ready)

## Getting Started

1. Install dependencies:

   - From the `backend_api` directory:
     ```
     npm install
     ```

2. Configure environment:

   - Copy `.env.example` to `.env` and set real values:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `PORT` (default 4000)
     - `CORS_ORIGIN` (e.g., http://localhost:3000)
     - `SOCKET_PATH` (default /socket.io)
     - `NODE_ENV`

3. Run in development:

   ```
   npm run dev
   ```

   Server runs by default at `http://localhost:4000`.
   - Health check: `GET /health`

4. Build and start (production-like):

   ```
   npm run build
   npm start
   ```

## Project Structure

```
backend_api/
├── src/
│   ├── server.ts                # Express + Socket.io bootstrap
│   ├── db/
│   │   └── mongoose.ts          # MongoDB connection helper
│   └── models/
│       ├── User.ts              # User model (with password helpers)
│       ├── ActivityEvent.ts     # Activity events model
│       └── Session.ts           # Session model
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
```

## Notes

- Uses a singleton pattern to prevent multiple Mongo connections during dev hot reloads.
- Models include indexes optimized for common analytics queries (time-based, by type, user, page, device, country).
- Socket.io is mounted at `SOCKET_PATH` and configured with CORS using `CORS_ORIGIN`.

## Next Steps (Future Work)

- Add authentication routes (signup/login/refresh).
- Add change-stream listeners to push real-time updates via Socket.io.
- Implement API routes for users, sessions, and analytics queries.
- Add input validation with Zod/Joi and request logging.
