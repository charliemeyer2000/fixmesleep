# Dashboard Authentication

## Overview
The data dashboard at `data.fixmysleep.charliemeyer.xyz` is protected with password authentication.

## Password
```
persuasion
```

Stored in the `DASHBOARD_PASSWORD` environment variable in Vercel.

## How It Works

### Flow
1. User visits dashboard → redirected to `/login`
2. User enters password
3. Server validates against `DASHBOARD_PASSWORD` env var
4. Sets secure HTTP-only cookie for 7 days
5. User can access all dashboard pages
6. Logout button in header clears the cookie

### Security Features

**Constant-Time Comparison**
- Prevents timing attacks by comparing all characters even after finding a mismatch
- Implemented in `/api/auth/login`

**HTTP-Only Cookies**
- Cookie not accessible via JavaScript
- Prevents XSS attacks from stealing session

**SameSite=Strict**
- Cookie only sent on same-site requests
- Prevents CSRF attacks

**Secure Flag**
- Cookie only sent over HTTPS in production
- Prevents man-in-the-middle attacks

**Session Expiry**
- 7-day expiration
- Automatic cleanup after inactivity

## Architecture

```
┌─────────────────┐
│   Browser       │
│                 │
│  /login page    │
└────────┬────────┘
         │ POST /api/auth/login
         │ { password: "persuasion" }
         ▼
┌─────────────────┐
│   Next.js       │
│                 │
│  Middleware     │◄───── Check cookie on every request
│  ↓              │
│  Auth API       │◄───── Validate password
│  ↓              │
│  Set Cookie     │────── HttpOnly, Secure, SameSite
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Dashboard     │
│                 │
│  All pages      │◄───── Protected routes
│  /              │
│  /chat          │
│  /logs          │
└─────────────────┘
```

## Files

### Core Auth
- `apps/data-site/src/middleware.ts` - Route protection
- `apps/data-site/src/app/api/auth/login/route.ts` - Login endpoint
- `apps/data-site/src/app/api/auth/logout/route.ts` - Logout endpoint
- `apps/data-site/src/app/login/page.tsx` - Login UI

### UI Components
- `apps/data-site/src/components/logout-button.tsx` - Logout button
- `apps/data-site/src/components/layout/site-header.tsx` - Updated header

## Changing the Password

### Via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/charliemeyer2000s-projects/fixmesleep-dashboard/settings/environment-variables
2. Find `DASHBOARD_PASSWORD`
3. Click Edit → enter new password → Save
4. Redeploy (or wait for next deployment)

### Via CLI
```bash
cd apps/data-site
vc env rm DASHBOARD_PASSWORD production
echo -n "new_password" | vc env add DASHBOARD_PASSWORD production
```

## Testing

### Successful Login
```bash
curl -X POST https://data.fixmysleep.charliemeyer.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"persuasion"}' \
  -c cookies.txt

# Should return: {"success":true}
# Cookie saved to cookies.txt
```

### Failed Login
```bash
curl -X POST https://data.fixmysleep.charliemeyer.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong"}'

# Should return: {"error":"Invalid password"} with 401 status
```

### Access Protected Page
```bash
curl https://data.fixmysleep.charliemeyer.xyz/ -b cookies.txt

# With cookie: Returns dashboard HTML
# Without cookie: Redirects to /login
```

## Notes

- API routes (`/api/*`) are not protected by authentication
- Static assets are served without authentication
- The login page itself is accessible without authentication
- Sessions last 7 days before requiring re-authentication
- No rate limiting implemented (Vercel provides some DDoS protection)

