# Minimal E2E Checks (single-host)

Run backend_api on :4000 and frontend_dashboard on :3000 (CRA proxy to :4000).

1) Health
- curl -i http://localhost:3000/api/health → 200 JSON { status: "ok", ... }
- curl -i http://localhost:4000/api/health → 200 JSON

2) Signup
- Unique email each run:
  EMAIL="user$(date +%s)@example.com"
  curl -i -X POST http://localhost:3000/api/auth/signup \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"secret123\",\"name\":\"Test\"}"

Expect: 201 JSON with { token, user }

3) Login
- curl -i -X POST http://localhost:3000/api/auth/login \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"secret123\"}"

Expect: 200 JSON with { token, user }

4) Me
- TOKEN="(token from signup or login)"
  curl -i http://localhost:3000/api/auth/me -H "Authorization: Bearer $TOKEN"

Expect: 200 JSON with { user }

If MongoDB is unavailable in development, use dev-only in-memory fallback:
- POST /api/e2e/dev/signup → 201 JSON { token, user }
- POST /api/e2e/dev/login → 200 JSON { token, user }

Notes:
- All auth routes set Content-Type: application/json and include detailed debug logs in development.
- Duplicate email returns 400 { error: "Email already in use" } (handles E11000).
