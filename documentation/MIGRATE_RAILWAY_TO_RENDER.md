# Migrate Backend from Railway to Render

## Overview

This guide walks you through migrating your NACOS backend Node.js API from Railway to Render.

**Your Setup:**
- **Backend**: Node.js Express API
- **Database**: Supabase (PostgreSQL) - unchanged
- **Frontend**: Moving to Vercel (from Netlify)

---

## Why Migrate to Render?

### Advantages Over Railway

| Feature | Railway | Render | Winner |
|---------|---------|--------|--------|
| **Free Tier** | $5 credit/month | 750 hours/month | 🏆 Render |
| **Pricing** | Usage-based | Predictable | 🏆 Render |
| **Uptime** | Good | Excellent (99.95%) | 🏆 Render |
| **Cold Starts** | Minimal | None (on paid) | 🤝 Depends |
| **Build Time** | Fast | Fast | 🤝 Tie |
| **Deployment** | Git push | Git push | 🤝 Tie |
| **Free SSL** | ✅ Yes | ✅ Yes | 🤝 Tie |
| **Custom Domains** | ✅ Yes | ✅ Yes | 🤝 Tie |
| **Environment Variables** | ✅ Easy | ✅ Easy | 🤝 Tie |
| **Database Hosting** | ✅ Yes | ✅ Yes | 🤝 Tie |
| **Logs** | Good | Excellent | 🏆 Render |
| **Support** | Discord | Email + Discord | 🏆 Render |

### Cost Comparison

**Railway:**
- $5 free credit/month
- $0.000463/GB-hour after credit
- Unpredictable monthly cost

**Render:**
- Free tier: 750 hours/month (enough for 1 service 24/7)
- Paid tier: $7/month (fixed, no surprises)
- Includes:
  - 0.1 CPU
  - 512 MB RAM
  - Auto-deploy from Git
  - Custom domains
  - Free SSL
  - No cold starts (on paid tier)

---

## Prerequisites

✅ GitHub repository with your backend code
✅ Supabase database (stays the same)
✅ Environment variables documented
✅ Current Railway deployment working

---

## Step 1: Prepare Your Backend

### 1.1 Create render.yaml (Optional but Recommended)

Create `backend/render.yaml`:

```yaml
services:
  - type: web
    name: nacos-backend
    runtime: node
    region: oregon # or your preferred region
    plan: free # or 'starter' for $7/month
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: FRONTEND_URL
        sync: false # Set in Render dashboard
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: RESEND_API_KEY
        sync: false
      - key: EMAIL_FROM
        sync: false
      - key: TRUST_PROXY
        value: true
    healthCheckPath: /api/health
```

### 1.2 Verify package.json Start Script

Check your `backend/package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

✅ You already have this!

### 1.3 Update PORT Handling

Your `server.js` should use Render's PORT (usually 10000):

```javascript
const PORT = process.env.PORT || 5000;
```

✅ You already have this pattern!

### 1.4 Ensure TRUST_PROXY is Configured

Check your `backend/server.js` or `config/security.js`:

```javascript
// Render uses proxy, so trust it
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}
```

✅ You already have this!

---

## Step 2: Deploy to Render

### Option A: Deploy via Render Dashboard (Recommended)

#### 1. Create Render Account

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with GitHub
4. Authorize Render to access your repositories

#### 2. Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Click **"Connect a repository"**
3. Find your repository
4. Click **"Connect"**

#### 3. Configure Service

**Basic Settings:**
- **Name**: `nacos-backend` (or your choice)
- **Region**: Oregon (or closest to your users)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- **Free** (750 hours/month) or
- **Starter** ($7/month, no cold starts)

#### 4. Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add each of these:

```bash
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-project.vercel.app
SUPABASE_URL=https://pnusmlckowqagnlzjqbv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-jwt-secret
RESEND_API_KEY=your-resend-key
EMAIL_FROM=onboarding@resend.dev
TRUST_PROXY=true
GLOBAL_RATE_LIMIT=100
```

**Important**: 
- Copy values from your Railway environment variables
- Don't lose your secrets! Save them somewhere secure

#### 5. Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Run `npm install`
   - Run `npm start`
   - Assign a URL: `https://nacos-backend.onrender.com`
3. Wait 2-3 minutes for first deployment

### Option B: Deploy via render.yaml

If you created `render.yaml`:

1. Push the file to your repository:
   ```bash
   cd backend
   git add render.yaml
   git commit -m "chore: add Render configuration"
   git push origin main
   ```

2. In Render Dashboard:
   - Click **"New +"** → **"Blueprint"**
   - Select your repository
   - Render auto-detects `render.yaml`
   - Fill in environment variables
   - Click **"Apply"**

---

## Step 3: Verify Deployment

### 3.1 Check Deployment Status

1. Render Dashboard → Your Service
2. Check **"Logs"** tab
3. Look for:
   ```
   🚀 NACOS API Server running on port 10000
   📡 Environment: production
   ```

### 3.2 Test Health Endpoint

```bash
curl https://nacos-backend.onrender.com/api/health
```

**Expected**:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-19T...",
  "environment": "production"
}
```

### 3.3 Test CORS

From your browser console on your Vercel frontend:

```javascript
fetch('https://nacos-backend.onrender.com/api/events/upcoming')
  .then(r => r.json())
  .then(d => console.log('✅ Render backend working!', d))
  .catch(e => console.error('❌ Error:', e));
```

---

## Step 4: Update Frontend

### 4.1 Update API URL

Check your frontend configuration files:

**If you have `frontend/assets/js/api-config.js`** or similar:

```javascript
// Update this
const API_URL = 'https://nacos-backend.onrender.com/api';
```

**If you use environment-based config**:

```javascript
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://nacos-backend.onrender.com/api'
  : 'http://localhost:5000/api';
```

### 4.2 Deploy Frontend with New URL

1. Commit the change:
   ```bash
   cd frontend
   git add .
   git commit -m "chore: update API URL to Render"
   git push origin main
   ```

2. Vercel will auto-deploy (30-60 seconds)

### 4.3 Test End-to-End

1. Visit your Vercel frontend
2. Check homepage loads events
3. Test login
4. Test admin dashboard
5. Check browser console for errors

---

## Step 5: Configure Custom Domain (Optional)

### 5.1 Add Custom Domain in Render

1. Render Dashboard → Your Service
2. Click **"Settings"** → **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter: `api.yourdomain.com` (or subdomain of choice)

### 5.2 Update DNS

Add CNAME record to your domain provider:

```
Type: CNAME
Name: api
Value: nacos-backend.onrender.com
TTL: 3600
```

### 5.3 Wait for SSL

- Render automatically provisions SSL (Let's Encrypt)
- Usually takes 5-10 minutes
- Green checkmark when ready

### 5.4 Update Frontend URL

Update frontend to use custom domain:
```javascript
const API_URL = 'https://api.yourdomain.com/api';
```

---

## Step 6: Performance & Monitoring

### 6.1 Enable Persistent Disk (If Needed)

If you upload files locally (not just Supabase storage):

1. Render Dashboard → Your Service
2. **Settings** → **Disks**
3. Click **"Add Disk"**
4. Mount path: `/app/uploads`
5. Size: 1GB (free) or more

**Note**: You use Supabase storage, so this is likely NOT needed.

### 6.2 Configure Health Checks

Render automatically uses your `/api/health` endpoint.

Verify it returns 200 status:
```javascript
// In your server.js (you already have this)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});
```

### 6.3 Set Up Notifications

1. Render Dashboard → Your Service
2. **Settings** → **Notifications**
3. Add email or Slack webhook
4. Get alerted for:
   - Deploy failures
   - Service crashes
   - Health check failures

---

## Step 7: Monitor & Test

### 7.1 Check Logs

Render Dashboard → Your Service → **Logs**

Watch for:
- ✅ Successful requests
- ✅ No CORS errors
- ✅ No crashes
- ❌ Any error messages

### 7.2 Test All Features

- [ ] Student signup
- [ ] Student login
- [ ] Student dashboard
- [ ] Admin login
- [ ] Admin dashboard
- [ ] Events CRUD
- [ ] Resources upload/download
- [ ] Voting functionality
- [ ] Payment verification
- [ ] Past questions access
- [ ] Timetable viewing

### 7.3 Monitor Performance

Render Dashboard → **Metrics**:
- CPU usage
- Memory usage
- Response times
- Request count

---

## Step 8: Cleanup Railway (After Confirmation)

### Wait 1-2 Weeks

Keep Railway running in parallel during testing:

1. Both backends can run simultaneously
2. Frontend points to Render
3. Railway is backup if issues arise
4. Monitor Render stability

### Disable Railway Service

Once confident:

1. Railway Dashboard → Your Project
2. **Settings** → **Danger Zone**
3. Either:
   - **Pause** service (can restart later)
   - **Delete** service (permanent)

---

## Troubleshooting

### Issue: "Application failed to respond"

**Causes:**
- Wrong start command
- Port mismatch
- App crashed on startup

**Solutions:**
1. Check Render logs for errors
2. Verify `npm start` works locally
3. Ensure `PORT` env var is used: `process.env.PORT`
4. Check health endpoint responds

### Issue: "Build failed"

**Causes:**
- Missing dependencies
- Invalid package.json
- Build command error

**Solutions:**
1. Check Render build logs
2. Verify `package.json` is valid
3. Test `npm install` locally
4. Ensure all dependencies are listed

### Issue: CORS errors

**Causes:**
- `FRONTEND_URL` not set
- Wrong frontend URL
- CORS not configured

**Solutions:**
1. Verify Render environment variable:
   ```
   FRONTEND_URL=https://your-project.vercel.app
   ```
2. No trailing slashes!
3. Restart Render service after env var change
4. Check server logs for CORS messages

### Issue: Cold starts (Free tier only)

**Behavior:**
- Free tier services sleep after 15 min of inactivity
- First request after sleep takes 30-60s

**Solutions:**
1. **Upgrade to Starter plan** ($7/month) - no cold starts
2. **Keep-alive service**: Ping your API every 10 minutes
3. **Accept cold starts** if traffic is low

**Keep-Alive Example** (external service):
- Use cron-job.org or similar
- Ping `https://nacos-backend.onrender.com/api/health` every 10 min
- Keeps service warm

### Issue: Environment variables not working

**Solutions:**
1. Render Dashboard → Service → **Environment**
2. Verify all variables are set
3. No quotes around values (Render adds them)
4. Click **"Save Changes"**
5. Service auto-restarts

### Issue: Database connection errors

**Solutions:**
1. Verify `SUPABASE_URL` is correct
2. Check `SUPABASE_SERVICE_ROLE_KEY` is valid
3. Test Supabase connection locally
4. Supabase might have IP restrictions (unlikely)

---

## Key Differences: Railway vs Render

### Deployment

| Aspect | Railway | Render |
|--------|---------|--------|
| **Git Push** | ✅ Auto-deploy | ✅ Auto-deploy |
| **Manual Deploy** | ✅ CLI/Dashboard | ✅ Dashboard |
| **Deploy Time** | 1-2 min | 2-3 min |
| **Logs** | Good | Excellent |

### Pricing

| Feature | Railway | Render |
|---------|---------|--------|
| **Free Tier** | $5 credit | 750 hours |
| **Predictability** | ❌ Usage-based | ✅ Fixed price |
| **Overage Risk** | ⚠️ Yes | ❌ No |

### URLs

| Service | URL Pattern |
|---------|-------------|
| **Railway** | `project-name.up.railway.app` |
| **Render** | `service-name.onrender.com` |

### Port

| Service | Default Port |
|---------|-------------|
| **Railway** | Any (usually 5000) |
| **Render** | 10000 (must use `process.env.PORT`) |

---

## Migration Checklist

### Pre-Migration
- [ ] Read this guide completely
- [ ] Document Railway environment variables
- [ ] Test current Railway deployment
- [ ] Create Render account
- [ ] Verify backend code is in GitHub

### Migration
- [ ] Create `render.yaml` (optional)
- [ ] Create Render web service
- [ ] Configure root directory: `backend`
- [ ] Set all environment variables
- [ ] Deploy to Render
- [ ] Verify health endpoint
- [ ] Test CORS from frontend

### Post-Migration
- [ ] Update frontend API URL
- [ ] Deploy frontend to Vercel
- [ ] Test all features end-to-end
- [ ] Monitor logs for errors
- [ ] Keep Railway running for 1-2 weeks
- [ ] Disable Railway after confirmation

---

## Timeline

| Phase | Duration |
|-------|----------|
| Preparation | 15 min |
| Render setup | 10 min |
| First deployment | 5 min |
| Environment variables | 5 min |
| Testing | 20 min |
| Frontend update | 10 min |
| **TOTAL** | **~65 min** |

---

## Comparison with Other Platforms

| Platform | Free Tier | Cold Starts | Pricing | Best For |
|----------|-----------|-------------|---------|----------|
| **Render** | 750 hrs | Yes (free) | $7/mo | Most projects |
| **Railway** | $5 credit | Minimal | Usage | Scaling apps |
| **Heroku** | None | N/A | $7/mo min | Legacy apps |
| **Fly.io** | Limited | Minimal | Usage | Global apps |
| **Vercel** | Good | No | Usage | Serverless |

**Recommendation for NACOS**: ✅ **Render** (predictable costs, good free tier)

---

## Cost Estimate

### Render Free Tier
- **750 hours/month** = 31.25 days = **Enough for 1 service 24/7**
- Perfect for your use case
- **Cost**: $0/month

### Render Starter ($7/month)
- No cold starts
- Faster response
- Better for production
- **Cost**: $7/month (fixed)

### Railway Current
- Depends on usage
- Can exceed $5/month
- Unpredictable

**Savings**: Potentially $5-10/month

---

## Next Steps

1. ✅ **Read this guide**
2. ✅ **Create Render account**
3. ✅ **Deploy backend to Render**
4. ✅ **Test thoroughly**
5. ✅ **Update frontend**
6. ✅ **Monitor for 1-2 weeks**
7. ✅ **Disable Railway**

---

**Status**: Ready to migrate
**Complexity**: Medium
**Risk**: Low (can run both in parallel)
**Estimated Time**: 1 hour

