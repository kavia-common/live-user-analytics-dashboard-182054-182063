# Minimal E2E Checks (single-host)

Run backend_api on :4000 and frontend_dashboard on :3000 (CRA proxy to :4000).

1) Health
- curl -i http://localhost:3000/api/health → 200 JSON { status: "ok", ... }
- curl -i http://localhost:4000/api/health → 200 JSON

2) Clerk Sign-in
- Visit http://localhost:3000/sign-up and create an account (Clerk hosted UI)
- Set ADMIN_EMAILS on backend for your email to gain admin role.

3) Me
- After signing in on the frontend, the browser attaches Clerk token.
- curl -i http://localhost:3000/api/auth/me -H "Authorization: Bearer <Clerk JWT>"
  Expect: 200 JSON with { user: { id, email, role } }

If MongoDB is unavailable in development, use dev-only in-memory fallback:
- POST /api/e2e/dev/signup → 201 JSON { token, user }
- POST /api/e2e/dev/login → 200 JSON { token, user }

Notes:
- Legacy local `/api/auth/signup` and `/api/auth/login` are disabled by default. Enable with `LOCAL_JWT_AUTH=true` for dev.
- All endpoints return JSON and include debug logs in development.
- Some ad blockers may block `/api/stats/*`. If you see ERR_BLOCKED_BY_CLIENT, set REACT_APP_API_URL to your backend host or disable the blocker. The client will attempt an `/api/analytics/*` fallback automatically.
