# Render.com Deployment Guide

## Prerequisites
- GitHub account with your repository pushed
- Render account (sign up at render.com)

## Step 1: Create GitHub Repository

```bash
# Add your remote (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 2: Create Services on Render

### A. PostgreSQL Database
1. Go to https://dashboard.render.com/
2. Click "Create" → "PostgreSQL"
3. Configure:
   - **Name:** trading-db
   - **Database:** trading_platform
   - **User:** postgres
   - **Region:** Choose closest to you
4. Copy the internal connection string (looks like: `postgresql://user:pass@host:5432/db`)

### B. Redis Cache
1. Click "Create" → "Redis"
2. Configure:
   - **Name:** trading-cache
   - **Region:** Same as PostgreSQL
3. Copy the connection URL

### C. Backend Web Service
1. Click "Create" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - **Name:** trading-backend
   - **Environment:** Node
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm run start`
   - **Root Directory:** ./
   - **Region:** Same as database
4. Add Environment Variables (click "Advanced"):

```
NODE_ENV=production
PORT=5000
DB_HOST=[PostgreSQL internal host]
DB_PORT=5432
DB_NAME=trading_platform
DB_USER=postgres
DB_PASSWORD=[PostgreSQL password]
DB_SSL=true
REDIS_URL=[Redis connection URL]
JWT_SECRET=[Generate secure key: openssl rand -hex 32]
JWT_EXPIRY=7d
REFRESH_TOKEN_SECRET=[Generate another: openssl rand -hex 32]
REFRESH_TOKEN_EXPIRY=30d
DERIV_API_URL=wss://ws.derivws.com/websockets/v3
DERIV_APP_ID=33eUdlaPLj4gee5BGCXvd
ENCRYPTION_KEY=[Generate: openssl rand -hex 16]
ENCRYPTION_IV=[Generate: openssl rand -hex 8]
SESSION_SECRET=[Generate: openssl rand -hex 32]
CLIENT_URL=[Your frontend URL - will get after deploying frontend]
API_URL=[Will be your Render backend URL]
```

5. Click "Create Web Service" → Wait for deployment

### D. Frontend Static Site
1. Click "Create" → "Static Site"
2. Connect GitHub repository
3. Configure:
   - **Name:** trading-frontend
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
   - **Root Directory:** ./
4. Once deployed, update backend's `CLIENT_URL` environment variable with this URL
5. Add Frontend Environment Variables:

```
VITE_API_URL=[Your Render backend service URL]
VITE_WS_URL=[Your Render backend service URL]
```

## Step 3: Verify Deployment

1. Visit your frontend URL
2. The app should load
3. Create an account and start trading!

## Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify all environment variables are set
- Check database is accepting connections

### Frontend can't connect to backend
- Ensure `VITE_API_URL` and `VITE_WS_URL` are correct
- Check CORS settings in backend

### Database migration issues
- Migrations run automatically on backend startup
- Check backend logs for SQL errors

## Costs
- PostgreSQL: ~$12/month
- Redis: ~$7/month
- Backend: Free tier (if under 750 hours/month) or ~$7/month
- Frontend: Free static hosting

**Total: ~$25-30/month for full production deployment**

## Custom Domain
1. In Render dashboard, go to your service
2. Click "Settings"
3. Add custom domain under "Custom Domain"
4. Update DNS records as instructed
