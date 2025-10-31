# Frontend Socket & Auth Setup

This app uses Socket.IO for realtime updates authenticated via Clerk.

Environment variables:
- REACT_APP_API_URL: Base URL for REST API (e.g. https://api.example.com/api)
- REACT_APP_SOCKET_URL: Base URL for Socket.IO server (e.g. https://api.example.com)
- REACT_APP_SOCKET_PATH: Socket.IO path (default: /socket.io)
- REACT_APP_SOCKET_NAMESPACE: Socket.IO namespace (e.g. /realtime). Optional if backend uses root namespace.
- REACT_APP_CLERK_PUBLISHABLE_KEY: Clerk frontend key

Behavior:
- The socket hook tries to get a Clerk session token and includes it in `auth.token` and `Authorization: Bearer` header.
- If Clerk is not configured or user is unauthenticated, the socket connects without auth and subscriptions still work for public events, but protected events may be blocked server-side.
- Dashboard fetches stats from `/stats/overview`, `/stats/timeseries`, `/stats/devices`, `/stats/locations` on mount, and debounced reload on `stats:update`.
- LiveActivityFeed bootstraps recent activities via `/activities?limit=20` and prepends items on `activity:new`.

Make sure the backend is configured to accept Socket.IO connections on the given URL/path/namespace and validates the Bearer token using Clerk.
