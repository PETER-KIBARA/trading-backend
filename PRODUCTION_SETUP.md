# Production Setup: Render Backend + Firebase Frontend

## Your URLs (Fill these in)

```
Firebase Frontend: https://YOUR_FIREBASE_APP.web.app
Render Backend:   https://YOUR_BACKEND_SERVICE.onrender.com
Deriv App ID:     YOUR_APP_ID_FROM_DERIV
```

---

## ✅ Quick Setup Checklist

### 1. Deriv App Configuration
- [ ] Visit https://app.deriv.com/account/settings/apps
- [ ] Create/find your app
- [ ] Set Redirect URL to: `https://YOUR_FIREBASE_APP.web.app/oauth-redirect`
- [ ] Copy your App ID (example: `12345`)

### 2. Render Backend Environment Variables

In **Render Dashboard → Your Backend Service → Environment**, set these:

```env
# Basic
NODE_ENV=production
API_URL=https://YOUR_BACKEND_SERVICE.onrender.com
CLIENT_URL=https://YOUR_FIREBASE_APP.web.app

# Database (provided by Render if using their PostgreSQL)
DATABASE_URL=postgres://user:pass@host:5432/db

# OAuth (from step 1)
DERIV_APP_ID=YOUR_APP_ID_FROM_DERIV
DERIV_API_URL=wss://ws.derivws.com/websockets/v3
OAUTH_REDIRECT_URI=https://YOUR_FIREBASE_APP.web.app/oauth-redirect

# JWT (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=[32_RANDOM_HEX_CHARS]
REFRESH_TOKEN_SECRET=[32_RANDOM_HEX_CHARS]
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d

# Encryption (generate with same command above)
ENCRYPTION_KEY=[32_RANDOM_HEX_CHARS]
ENCRYPTION_IV=[16_RANDOM_HEX_CHARS]

# Session
SESSION_SECRET=[RANDOM_SECRET]
```

### 3. Firebase Frontend Environment

Create `frontend/.env.production.local`:

```env
VITE_API_URL=https://YOUR_BACKEND_SERVICE.onrender.com/api
VITE_DERIV_APP_ID=YOUR_APP_ID_FROM_DERIV
```

Or update `firebase.json`:

```json
{
  "hosting": {
    "site": "your-site-id",
    "public": "dist",
    "env": [
      {
        "regex": ".*",
        "env": [
          "VITE_API_URL=https://YOUR_BACKEND_SERVICE.onrender.com/api",
          "VITE_DERIV_APP_ID=YOUR_APP_ID_FROM_DERIV"
        ]
      }
    ]
  }
}
```

### 4. Deploy Backend

```bash
cd backend
git add .
git commit -m "Configure OAuth for production"
git push
# Render auto-deploys if GitHub is connected
```

**Monitor:**
- Render Dashboard → Logs (watch for deployment errors)
- Look for OAuth initialization messages

### 5. Deploy Frontend

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

**Monitor:**
- Check Firebase Console → Hosting → Deployments
- Visit your Firebase URL

### 6. Test the OAuth Flow

1. Open: `https://YOUR_FIREBASE_APP.web.app/connect-deriv`
2. Click **"Connect with Deriv OAuth"**
3. Should redirect to Deriv login page
4. Log in with your Deriv account
5. Should redirect back to your Firebase app
6. Should show success message
7. Should redirect to dashboard
8. Should see connected account

---

## 🔧 Generate Random Keys

Run these commands in your terminal to generate secure keys:

```bash
# JWT Secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Refresh Token Secret  
node -e "console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Encryption IV
node -e "console.log('ENCRYPTION_IV=' + require('crypto').randomBytes(16).toString('hex'))"

# Session Secret
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Copy each value into Render environment variables.

---

## 🐛 Troubleshooting

### OAuth redirects back to Deriv login instead of your app
- ❌ **Cause**: Redirect URI doesn't match
- ✅ **Fix**: Check that `OAUTH_REDIRECT_URI` in Render exactly matches Deriv app redirect URL
  - Both should be: `https://YOUR_FIREBASE_APP.web.app/oauth-redirect`

### "CORS error" in browser console
- ❌ **Cause**: `CLIENT_URL` isn't set correctly
- ✅ **Fix**: Make sure `CLIENT_URL` in Render is set to exactly: `https://YOUR_FIREBASE_APP.web.app`

### Firebase shows blank page
- ❌ **Cause**: `VITE_API_URL` doesn't match backend
- ✅ **Fix**: Check that Firebase env has `VITE_API_URL=https://YOUR_BACKEND_SERVICE.onrender.com/api`

### "Invalid Deriv token" error
- ❌ **Cause**: Wrong App ID
- ✅ **Fix**: Verify `DERIV_APP_ID` matches the one from https://app.deriv.com/account/settings/apps

### Backend shows 401 errors
- ❌ **Cause**: JWT tokens not configured
- ✅ **Fix**: Ensure `JWT_SECRET` is set in Render (not default value)

### Can't see account after connecting
- ❌ **Cause**: Database connection issue
- ✅ **Fix**: Check Render logs for database errors. Verify `DATABASE_URL` is correct.

---

## 📋 Verification Checklist

After deployment, verify:

- [ ] Can access Firebase URL without errors
- [ ] Can access Render API: `https://YOUR_BACKEND.onrender.com/api` (should get 404 or error, not CORS error)
- [ ] OAuth button on `/connect-deriv` page works
- [ ] Redirects to Deriv OAuth page
- [ ] Can log in to Deriv
- [ ] Redirects back to Firebase app
- [ ] Shows success message
- [ ] Redirects to dashboard
- [ ] Can see connected accounts
- [ ] Render logs show no errors
- [ ] Firebase console shows no errors

---

## 🚀 Next Steps

1. Get your Deriv App ID
2. Generate secure keys (see above)
3. Set all Render env variables
4. Set all Firebase env variables
5. Deploy backend: `git push`
6. Deploy frontend: `npm run build && firebase deploy`
7. Test OAuth flow
8. Monitor logs for errors
9. Adjust as needed

---

## 📞 Support

If you hit issues:

1. **Check Render Logs** - Most errors are shown there
   - Render Dashboard → Your Service → Logs
2. **Check Firebase Console** - Build/deployment errors
   - Firebase Console → Hosting → Deployments
3. **Check Browser Console** - Frontend errors
   - Open DevTools (F12) → Console tab
4. **Test API** - Make sure backend is responding
   - Try: `curl https://YOUR_BACKEND.onrender.com/api/health`

---

**Status**: Ready for production deployment 🚀
