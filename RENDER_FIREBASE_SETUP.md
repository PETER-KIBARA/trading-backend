# OAuth 2.0 Setup: Render Backend + Firebase Frontend

## 🎯 Configuration Checklist

### Step 1: Get Your Production URLs

**Firebase Frontend:**
- Check your `firebase.json` or Hosting settings
- Format: `https://your-project-name.web.app` or `https://your-custom-domain.com`
- Example: `https://trading-platform-f1a2b3.web.app`

**Render Backend:**
- Format: `https://your-service-name.onrender.com`
- Example: `https://trading-backend-abc123.onrender.com`

---

### Step 2: Set Render Environment Variables

Go to **Render Dashboard → Your Backend Service → Environment**

Set these variables:

```env
# Server config
PORT=5000
NODE_ENV=production
API_URL=https://your-service-name.onrender.com
CLIENT_URL=https://your-firebase-app.web.app

# Database (if using Render PostgreSQL)
DATABASE_URL=postgres://user:pass@host:port/db_name

# JWT (Generate with: openssl rand -hex 32)
JWT_SECRET=your_random_32_char_hex_string
REFRESH_TOKEN_SECRET=your_random_32_char_hex_string
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d

# Deriv OAuth
DERIV_APP_ID=your_deriv_app_id_from_app.deriv.com
DERIV_API_URL=wss://ws.derivws.com/websockets/v3
DERIV_OAUTH_URL=https://oauth.deriv.com/oauth2/authorize
OAUTH_REDIRECT_URI=https://your-firebase-app.web.app/oauth-redirect

# Encryption (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_random_32_char_hex_string
ENCRYPTION_IV=your_random_16_char_hex_string

# Session
SESSION_SECRET=your_random_session_secret
```

---

### Step 3: Get/Create Deriv App ID

1. Go to [Deriv Developer Apps](https://app.deriv.com/account/settings/apps)
2. Click **"Create New App"**
3. Fill in:
   - **App name**: Your Platform Name
   - **Redirect URL**: `https://your-firebase-app.web.app/oauth-redirect`
   - **Scope**: `trade`
4. Copy the **App ID** (looks like: `12345`)
5. Paste it in Render as `DERIV_APP_ID`

---

### Step 4: Set Firebase Environment Variables

Create/update `frontend/.env.production` or in Firebase hosting:

```env
VITE_API_URL=https://your-service-name.onrender.com/api
VITE_DERIV_APP_ID=your_deriv_app_id
```

Or set in `firebase.json`:

```json
{
  "hosting": {
    "env": [
      {
        "regex": ".*",
        "env": [
          "VITE_API_URL=https://your-service-name.onrender.com/api",
          "VITE_DERIV_APP_ID=your_deriv_app_id"
        ]
      }
    ]
  }
}
```

---

### Step 5: Update CORS in Backend

The backend already has CORS configured for `.onrender.com`. Verify [middleware/security.ts](backend/src/middleware/security.ts) includes:

```typescript
const allowedOrigins = [
  /^https:\/\/.*\.web\.app$/,           // Firebase hosting
  /^https:\/\/.*\.firebaseapp\.com$/,   // Firebase hosting alternate
  /^https:\/\/trading-platform.*\.web\.app$/, // Your specific Firebase app
];
```

---

### Step 6: Deploy Backend to Render

1. Commit and push your code:
```bash
git add .
git commit -m "Fix OAuth redirect and production setup"
git push
```

2. Render will auto-deploy if connected to GitHub
3. Check logs: **Render Dashboard → Logs** for any errors

---

### Step 7: Deploy Frontend to Firebase

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

---

### Step 8: Test OAuth Flow

1. Open your Firebase URL: `https://your-firebase-app.web.app`
2. Go to login/connect page
3. Click **"Connect with Deriv OAuth"**
4. Should redirect to Deriv login
5. After login, should redirect back to your Firebase app
6. Should see "Successfully connected" message
7. Should redirect to dashboard

---

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Redirect URI mismatch** | Make sure `OAUTH_REDIRECT_URI` in Render exactly matches the Deriv app settings |
| **CORS errors** | Verify `CLIENT_URL` in Render is set to your Firebase app exact URL |
| **Firebase shows blank page** | Check browser console for errors. Verify `VITE_API_URL` points to Render backend |
| **OAuth token invalid** | Check `DERIV_APP_ID` is set correctly on both Render and Firebase |
| **Not redirecting after OAuth** | Check Render logs for errors. Verify JWT tokens are being generated |
| **Accounts not appearing** | Check Render backend logs for database errors. Verify `DATABASE_URL` is correct |

---

## 🔐 Security Checklist

- [x] `JWT_SECRET` is unique and strong (32+ chars)
- [x] `ENCRYPTION_KEY` is unique (32 hex chars)
- [x] `DERIV_APP_ID` is from official Deriv developer account
- [x] `OAUTH_REDIRECT_URI` matches Deriv app settings exactly
- [x] `CLIENT_URL` is only your Firebase domain
- [x] Database uses SSL in production
- [x] API uses HTTPS only
- [x] Tokens never logged or exposed

---

## 📋 Environment Variables Summary

| Variable | Render | Firebase | Type |
|----------|--------|----------|------|
| `VITE_API_URL` | N/A | ✅ | Frontend |
| `VITE_DERIV_APP_ID` | N/A | ✅ | Frontend |
| `CLIENT_URL` | ✅ | N/A | Backend |
| `API_URL` | ✅ | N/A | Backend |
| `DATABASE_URL` | ✅ | N/A | Backend |
| `JWT_SECRET` | ✅ | N/A | Backend |
| `DERIV_APP_ID` | ✅ | N/A | Backend |
| `ENCRYPTION_KEY` | ✅ | N/A | Backend |
| `OAUTH_REDIRECT_URI` | ✅ | N/A | Backend |

---

## 📱 OAuth Flow with Production URLs

```
User on Firebase
    ↓
Clicks "Connect with Deriv"
    ↓
Redirected to: https://oauth.deriv.com/oauth2/authorize?
  app_id=YOUR_ID&
  redirect_uri=https://your-firebase-app.web.app/oauth-redirect&
  scope=trade
    ↓
User logs in at Deriv
    ↓
Deriv redirects to: https://your-firebase-app.web.app/oauth-redirect?token1=XXX&...
    ↓
Firebase calls: https://your-render-backend.onrender.com/api/accounts/oauth/connect
    ↓
Backend creates user + accounts + returns JWT
    ↓
Frontend stores JWT + redirects to /dashboard ✅
```

---

## 🚀 Quick Start Commands

Generate random keys:
```bash
# JWT Secret (32 char hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key (32 char hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption IV (16 char hex)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Test Firebase deployment:
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

Monitor Render logs:
```bash
# Via SSH (if configured)
ssh render@your-service.onrender.com
tail -f /var/log/application.log
```

---

## ✅ Final Verification

Before going live, verify:

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Firebase
- [ ] All Render env variables set
- [ ] Firebase env variables set (.env.production)
- [ ] Deriv App ID created with correct redirect URI
- [ ] Can access Firebase URL in browser
- [ ] Can access Render API in browser (`/api/health` or similar)
- [ ] OAuth flow works end-to-end
- [ ] Can see accounts in database after OAuth
- [ ] Dashboard loads after redirect
- [ ] Can trade with connected account

---

**Last updated**: Production setup for Render + Firebase
