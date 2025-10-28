# Authentication Flow

This document describes the end-to-end authentication and real-time data flow in the Live User Analytics Dashboard.

## Architecture Overview

### Frontend Authentication (Clerk)
- **Clerk React SDK** (`@clerk/clerk-react`) provides authentication UI and token management
- `ClerkProvider` wraps the entire app in `src/index.js`
- `AuthContext` enhances Clerk state with backend role information
- API client (`src/api/client.js`) automatically attaches Clerk JWT to all requests

### Backend Authentication (Clerk JWT Verification)
- **Clerk Node SDK** (`@clerk/clerk-sdk-node`) verifies JWT tokens
- `clerkAuthMiddleware` validates tokens and maps user to role based on ADMIN_EMAILS
- Protected endpoints require valid Clerk JWT in `Authorization: Bearer <token>` header

### Real-time Updates (Socket.io + MongoDB Change Streams)
- MongoDB Change Streams watch `ActivityEvent` and `Session` collections
- On insert/update, backend computes fresh stats and emits via Socket.io
- Frontend subscribes to `stats:update` events and updates dashboard in real-time

## Environment Variables

### Backend (.env)
```bash
CLERK_SECRET_KEY=sk_test_...          # Clerk backend secret key
ADMIN_EMAILS=admin@example.com        # Comma-separated admin emails
MONGODB_URI=mongodb+srv://...         # MongoDB Atlas connection (replica set required)
CORS_ORIGIN=http://localhost:3000     # Frontend origin(s)
PORT=4000
NODE_ENV=development
```

### Frontend (.env)
```bash
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_...  # Clerk frontend publishable key
REACT_APP_ADMIN_EMAILS=admin@example.com     # Must match backend
REACT_APP_API_URL=http://localhost:4000      # Backend API URL (optional in dev)
REACT_APP_SOCKET_URL=http://localhost:4000   # Backend Socket URL (optional in dev)
```

## Authentication Flow

### 1. User Sign-In
1. User visits `/sign-in` and enters credentials via Clerk UI
2. Clerk authenticates and redirects to `/` (dashboard)
3. Frontend calls `trackLogin()` to post login activity event
4. Backend receives `POST /api/activities/activity` with `type: 'login'`
5. Activity is saved to MongoDB, triggering change stream
6. Backend emits `activity:new` and `stats:update` via Socket.io

### 2. API Request Flow
1. Frontend component calls `api.get('/stats/overview')`
2. API client requests Clerk token via `getToken()`
3. Token is attached as `Authorization: Bearer <token>` header
4. Backend `clerkAuthMiddleware` verifies token with Clerk SDK
5. Backend checks if user email is in `ADMIN_EMAILS` to determine role
6. User object is attached to `req.user` for use in route handlers
7. Response is returned to frontend

### 3. Real-time Updates Flow
1. Frontend connects to Socket.io namespace `/realtime` with Clerk token
2. Backend verifies JWT token in socket middleware
3. On MongoDB change (activity insert, session update):
   - Backend computes fresh stats (overview, timeseries, devices, locations)
   - Backend emits `stats:update` event with full data
4. Frontend `useSocket` hook receives update
5. Dashboard state is updated, causing re-render with live data

## Activity Tracking

### Automatic Tracking
- `useActivityTracking` hook in `AppRouter` tracks all navigation
- Every route change posts a `page_view` activity

### Manual Tracking
- `trackLogin()` - Called on successful sign-in
- `trackPageView(path)` - Track specific page view
- `trackClick(metadata)` - Track user interactions

### Activity Payload
```javascript
{
  type: 'login' | 'logout' | 'page_view' | 'click' | 'navigation',
  page: '/dashboard',
  device: {
    os: 'macOS',
    browser: 'Chrome',
    deviceType: 'desktop'
  },
  metadata: { /* optional */ }
}
```

## Protected Endpoints

### Requires Authentication (any role)
- `GET /api/stats/overview`
- `GET /api/stats/timeseries`
- `GET /api/stats/devices`
- `GET /api/stats/locations`
- `GET /api/activities/recent`
- `POST /api/activities/activity` (posts user's own activity)
- `GET /api/auth/me`

### Requires Admin Role
- `POST /api/activities` (create synthetic activity)
- `POST /api/activities/seed` (seed test data)
- `GET /api/users` (list all users)
- `PATCH /api/users/:id` (update user)
- `DELETE /api/users/:id` (delete user)

## Development Mode

In development (`NODE_ENV !== 'production'`):
- Frontend gracefully handles missing Clerk config with dev mocks
- API client falls back to mock data on 401/blocked requests
- Backend logs detailed auth debug info
- CORS allows localhost origins by default

## Deployment Checklist

1. Set `CLERK_SECRET_KEY` in backend environment
2. Set `REACT_APP_CLERK_PUBLISHABLE_KEY` in frontend environment
3. Ensure `ADMIN_EMAILS` matches on both backend and frontend
4. Set `CORS_ORIGIN` to include frontend production URL
5. Set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` to backend production URL
6. Ensure MongoDB is using a replica set (required for change streams)
7. Test authentication flow end-to-end
8. Verify Socket.io connects and real-time updates work
