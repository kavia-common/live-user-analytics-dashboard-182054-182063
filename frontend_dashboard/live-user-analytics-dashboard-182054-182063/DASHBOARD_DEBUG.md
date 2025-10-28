# Dashboard Debugging Guide

## Changes Made

### Frontend Changes
1. **Fixed activity endpoint** - Changed from `/activities/activity` to `/activities`
2. **Added DebugBanner component** - Shows non-intrusive warnings for auth/connection issues
3. **Added EmptyState component** - Displays when no data exists with seed button for admins
4. **Enhanced logging** - Console logs for API requests, socket events, and activity tracking
5. **Added /analytics/* fallback** - Client retries blocked /stats/* requests with /analytics/*

### Backend Changes
1. **Added /api/analytics/* routes** - Aliases for /stats/* to bypass ad-blockers
2. **Fixed activity POST route** - Removed admin-only restriction, now returns 204
3. **Enhanced Clerk auth middleware** - Better token debugging and error messages
4. **Added seed endpoint** - POST /api/activities/seed (admin only) creates sample data
5. **Improved env configuration** - CLERK_SECRET_KEY used as JWT_SECRET fallback

## Debugging Steps

### 1. Check Backend Status
```bash
curl http://localhost:4000/api/health
# Should return: {"status":"ok","env":"development","time":"..."}
```

### 2. Check Frontend Environment Variables
Open browser console and check:
- REACT_APP_API_URL should point to backend (http://localhost:4000)
- REACT_APP_SOCKET_URL should point to backend (http://localhost:4000)
- REACT_APP_CLERK_PUBLISHABLE_KEY should be set

### 3. Check Browser Console Logs
Look for these log patterns:
- `[api] Attached Authorization header` - Token is being attached
- `[socket] ✓ Connected to realtime namespace` - Socket connected
- `[activity] 📤 Posting activity` - Activities being tracked
- `[Dashboard] Data fetched` - Stats loaded successfully

### 4. Common Issues

#### Issue: 401 Unauthorized
**Symptoms:** All API requests return 401
**Check:** 
- Is Clerk token being generated? Look for `[AuthProvider] getToken` logs
- Is Authorization header present? Look for `[api] Attached Authorization header`
**Fix:** Ensure CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY match

#### Issue: Empty Dashboard
**Symptoms:** Dashboard shows EmptyState component
**Check:**
- Are there events in the database? Check with seed button
- Is backend returning data? Check `/api/stats/overview` directly
**Fix:** Click "Generate Sample Data" button (dev/admin only)

#### Issue: Ad Blocker Blocking
**Symptoms:** DebugBanner shows "Ad blocker detected"
**Check:** Look for `[api] Request blocked by client` in console
**Fix:** Frontend automatically retries with `/analytics/*` endpoints

#### Issue: Socket Not Connecting
**Symptoms:** No real-time updates, socket error in console
**Check:** 
- Look for `[socket] Connection error` in console
- Is JWT_SECRET set in backend .env?
**Fix:** Ensure backend JWT_SECRET matches CLERK_SECRET_KEY

### 5. Seed Sample Data
If dashboard is empty:
1. Ensure you're logged in as admin (check REACT_APP_ADMIN_EMAILS)
2. Dashboard will show "Generate Sample Data" button
3. Click to create 1 session + 48 activity events
4. Dashboard refreshes automatically

Alternatively, use API directly:
```bash
curl -X POST http://localhost:4000/api/activities/seed \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

### 6. Check Backend Logs
Backend should show:
- `[clerk:auth] getAuth() called` for each request
- `[clerk:auth] Authenticated via Clerk` on success
- `[activities:create] Created` when activities posted

### 7. Manual API Test
Test stats endpoint manually:
```bash
curl http://localhost:4000/api/stats/overview?sinceMinutes=60 \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

## Environment Variables Checklist

### Frontend (.env)
- ✅ REACT_APP_API_URL=http://localhost:4000
- ✅ REACT_APP_SOCKET_URL=http://localhost:4000
- ✅ REACT_APP_SOCKET_PATH=/socket.io
- ✅ REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_...
- ✅ REACT_APP_ADMIN_EMAILS=your@email.com

### Backend (.env)
- ✅ MONGODB_URI=mongodb+srv://...
- ✅ CLERK_SECRET_KEY=sk_test_...
- ✅ JWT_SECRET=sk_test_... (same as CLERK_SECRET_KEY)
- ✅ CORS_ORIGIN=http://localhost:3000
- ✅ ADMIN_EMAILS=your@email.com
- ✅ PORT=4000

## Next Steps if Still Blank

1. **Open browser DevTools** (F12) and check Console and Network tabs
2. **Look for 401 errors** - Auth issue
3. **Look for CORS errors** - Backend CORS config issue
4. **Check if requests are being made** - Network tab should show /api/stats/* calls
5. **Try seeding data** - Use the seed button if you're admin
6. **Check backend is running** - Visit http://localhost:4000/api/health

## Success Indicators

When everything works:
- Dashboard shows 4 stat cards with numbers
- Line chart shows activity over time
- Bar chart shows devices/browsers
- Pie chart shows countries
- Live activity feed shows events
- Real-time updates work (socket connected)
