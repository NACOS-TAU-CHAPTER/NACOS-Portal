# Migrate from Netlify to Vercel

## Overview

This guide walks you through migrating your NACOS frontend from Netlify to Vercel. Your setup includes:
- **Frontend**: Static HTML/CSS/JS files
- **Backend**: Node.js API on Railway
- **Database**: Supabase (PostgreSQL)

## Why Migrate to Vercel?

- Better performance and edge network
- Improved developer experience
- Seamless GitHub integration
- Better preview deployments
- Free tier includes more features

## Prerequisites

✅ GitHub repository with your frontend code
✅ Railway backend already deployed
✅ Supabase database configured

---

## Step 1: Prepare Your Project

### 1.1 Update Configuration Files

**Create `vercel.json`** in your frontend directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "**/*.html",
      "use": "@vercel/static"
    },
    {
      "src": "**/*.js",
      "use": "@vercel/static"
    },
    {
      "src": "**/*.css",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 1.2 Check Your .gitignore

Ensure your `.gitignore` includes:

```
# Environment variables
.env
.env.local
.env.production

# Vercel
.vercel

# Node modules (if any)
node_modules/

# Logs
*.log
```

### 1.3 Update Backend CORS Configuration

**In Railway**, update your backend environment variables:

```bash
# Current
FRONTEND_URL=https://nacos-tau-portal.netlify.app

# Change to (or add both during migration)
FRONTEND_URL=https://your-project.vercel.app
# Or for testing both:
FRONTEND_URL=https://nacos-tau-portal.netlify.app,https://your-project.vercel.app
```

Then restart your Railway backend service.

---

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Sign up/Login to Vercel**
   - Go to https://vercel.com
   - Sign in with GitHub

2. **Import Your Repository**
   - Click **"Add New Project"**
   - Select **"Import Git Repository"**
   - Choose your GitHub repository
   - Select the **frontend folder** as the root directory

3. **Configure Project Settings**
   
   **Framework Preset**: Other (or leave as is)
   
   **Root Directory**: 
   ```
   frontend
   ```
   
   **Build Command**: Leave empty or use:
   ```bash
   # Leave empty - no build needed for static files
   ```
   
   **Output Directory**: 
   ```
   .
   ```
   (Current directory - your HTML files are already in root)

4. **Add Environment Variables** (if needed)
   
   Click **"Environment Variables"** and add:
   ```
   # Only if you have environment-specific configs
   # Most likely you don't need any for static frontend
   ```

5. **Deploy**
   - Click **"Deploy"**
   - Wait 30-60 seconds
   - You'll get a URL like: `https://your-project.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to Frontend Directory**
   ```bash
   cd "c:\Users\HP\Documents\nacos website\frontend"
   ```

3. **Login to Vercel**
   ```bash
   vercel login
   ```

4. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (first time)
   - What's your project name? `nacos-portal` (or your choice)
   - In which directory is your code? **./`** (current directory)
   - Want to override settings? **N**

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

---

## Step 3: Update Backend CORS Settings

### 3.1 Update Railway Environment Variable

1. Go to Railway dashboard: https://railway.app
2. Select your backend service
3. Go to **Variables** tab
4. Update `FRONTEND_URL`:
   ```
   https://your-project.vercel.app
   ```
5. Click **Save** (service will auto-restart)

### 3.2 Verify Backend Config

Check your `backend/config/security.js` or `backend/server.js`:

```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
```

This should already work with the new URL.

---

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Domain in Vercel

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Domains**
3. Click **"Add"**
4. Enter your domain: `nacos.yourdomain.com`
5. Follow DNS configuration instructions

### 4.2 Update DNS Records

Add these records to your domain provider:

**For Apex Domain** (yourdomain.com):
```
Type: A
Name: @
Value: 76.76.21.21
```

**For Subdomain** (nacos.yourdomain.com):
```
Type: CNAME
Name: nacos
Value: cname.vercel-dns.com
```

### 4.3 Update Backend CORS

Update Railway's `FRONTEND_URL` to your custom domain:
```
FRONTEND_URL=https://nacos.yourdomain.com
```

---

## Step 5: Testing

### 5.1 Test Deployment

1. **Visit your Vercel URL**: `https://your-project.vercel.app`
2. **Check browser console** (F12):
   ```javascript
   console.log('API URL:', window.API_URL);
   // Should show your Railway backend URL
   ```

### 5.2 Test API Connection

Open browser console on your Vercel site:

```javascript
// Test health endpoint
fetch(window.API_URL + '/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend connected:', d))
  .catch(e => console.error('❌ Connection failed:', e));

// Test events endpoint
fetch(window.API_URL + '/events/upcoming')
  .then(r => r.json())
  .then(d => console.log('✅ Events loaded:', d.length))
  .catch(e => console.error('❌ Events failed:', e));
```

### 5.3 Test Key Features

- ✅ Homepage loads
- ✅ Events display correctly
- ✅ Student login works
- ✅ Admin login works
- ✅ Dashboard loads
- ✅ Resource uploads work
- ✅ No CORS errors in console

### 5.4 Test on Mobile

- Visit site on mobile browser
- Check responsive design
- Test login/signup flows

---

## Step 6: Update Links & References

### 6.1 Update Documentation

Search and replace in your documentation files:
```
nacos-tau-portal.netlify.app → your-project.vercel.app
```

### 6.2 Update External Services

If you have webhooks or external integrations pointing to your frontend:
- Payment providers
- Email links
- Social media posts
- Google Search Console
- Analytics platforms

---

## Step 7: Monitor & Cleanup

### 7.1 Monitor Vercel Deployment

1. **Vercel Dashboard** → Your Project → **Analytics**
   - Check page views
   - Monitor errors
   - Check performance

2. **Check Logs** if issues occur:
   - Vercel Dashboard → Functions → Logs
   - Railway Dashboard → Deployments → Logs

### 7.2 Keep Netlify Running (Parallel Testing)

**Recommended**: Keep both running for 1-2 weeks:
- Test Vercel thoroughly
- Keep Netlify as backup
- Gradually migrate traffic

Update Railway CORS to allow both:
```bash
FRONTEND_URL=https://nacos-tau-portal.netlify.app,https://your-project.vercel.app
```

### 7.3 Disable Netlify (After Confirmation)

Once you're confident Vercel is working:

1. **Netlify Dashboard** → Your Site → **Site Settings**
2. Scroll to **"Delete site"**
3. Or just pause builds to keep the domain

---

## Step 8: Set Up Automatic Deployments

### 8.1 Configure Git Integration

Vercel automatically deploys when you push to GitHub:

**Production Deployments**:
- Push to `main` branch → Deploys to production

**Preview Deployments**:
- Push to any other branch → Creates preview URL
- Open PR → Vercel comments with preview link

### 8.2 Configure Branch Settings

Vercel Dashboard → Project Settings → Git:

- **Production Branch**: `main`
- **Deploy Previews**: Enable for all branches
- **PR Comments**: Enable

---

## Troubleshooting

### Issue: "Vercel deployment succeeds but site is blank"

**Solution**: Check root directory setting
- Vercel Dashboard → Project Settings → General
- Root Directory should be: `frontend` or `.` (if already in frontend)

### Issue: "CORS errors on Vercel"

**Causes**:
1. Railway `FRONTEND_URL` not updated
2. Backend not restarted after env change
3. Wrong Vercel URL format

**Solution**:
```bash
# Railway environment variable
FRONTEND_URL=https://your-project.vercel.app

# NO trailing slash!
# NO http (use https)
```

Then restart Railway service.

### Issue: "Assets (CSS/JS) not loading"

**Solution**: Check file paths in HTML
```html
<!-- Should be relative paths -->
<link rel="stylesheet" href="assets/css/style.css">
<script src="assets/js/main.js"></script>

<!-- NOT absolute paths like /assets/... -->
```

### Issue: "404 on page refresh"

This shouldn't happen with static HTML files, but if it does:

**Add to vercel.json**:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Issue: "Slow deployment times"

**Solution**: 
- Check build logs for warnings
- Reduce file sizes (compress images)
- Remove unused files from repository

---

## Key Differences: Netlify vs Vercel

| Feature | Netlify | Vercel |
|---------|---------|--------|
| **Deploy Speed** | ~1-2 min | ~30-60 sec |
| **Preview URLs** | Yes | Yes (better UX) |
| **Edge Network** | Good | Excellent |
| **Functions** | Netlify Functions | Vercel Functions |
| **Analytics** | Paid | Built-in (free tier) |
| **DDoS Protection** | Basic | Advanced |
| **Build Minutes** | 300/month | Unlimited on Free |

---

## Migration Checklist

- [ ] Create `vercel.json` configuration
- [ ] Commit and push changes to GitHub
- [ ] Sign up for Vercel account
- [ ] Import repository to Vercel
- [ ] Configure root directory (`frontend`)
- [ ] Deploy to Vercel
- [ ] Test deployment URL
- [ ] Update Railway `FRONTEND_URL` environment variable
- [ ] Restart Railway backend
- [ ] Test API connections (no CORS errors)
- [ ] Test all key features (login, dashboard, uploads)
- [ ] Test on mobile devices
- [ ] Update documentation
- [ ] Monitor for 1-2 weeks
- [ ] (Optional) Configure custom domain
- [ ] Disable/delete Netlify site

---

## Estimated Timeline

| Phase | Duration |
|-------|----------|
| Prepare config files | 10 min |
| Deploy to Vercel | 5 min |
| Update backend CORS | 5 min |
| Testing | 20 min |
| Update documentation | 10 min |
| **TOTAL** | **~50 minutes** |

---

## Rollback Plan

If something goes wrong:

1. **Keep Netlify running** during migration
2. **Test Vercel thoroughly** before switching
3. **Update DNS gradually** if using custom domain
4. **Can switch back** by reverting `FRONTEND_URL` in Railway

---

## Next Steps After Migration

1. ✅ Set up Vercel Analytics
2. ✅ Configure Web Vitals monitoring
3. ✅ Set up deployment notifications (Slack/Discord)
4. ✅ Implement preview deployment workflow
5. ✅ Update team documentation

---

**Status**: Ready to migrate
**Complexity**: Low (static files, no build process)
**Risk**: Low (can run both simultaneously)
**Estimated Time**: 1 hour including testing

