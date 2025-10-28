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

Copy `.env.example` to `.env` and set values:

- `REACT_APP_API_URL=http://localhost:4000`
- `REACT_APP_SOCKET_URL=http://localhost:4000` (optional; defaults to API URL)

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
