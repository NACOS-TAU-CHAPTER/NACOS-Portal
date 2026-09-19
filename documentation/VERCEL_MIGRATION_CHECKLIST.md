# Vercel Migration Checklist

## Pre-Migration

### Planning
- [ ] Read `MIGRATE_NETLIFY_TO_VERCEL.md`
- [ ] Read `NETLIFY_VS_VERCEL_COMPARISON.md`
- [ ] Understand benefits and risks
- [ ] Set migration timeline

### Preparation
- [ ] ✅ `vercel.json` exists in frontend folder
- [ ] ✅ `.gitignore` includes `.vercel/`
- [ ] ✅ `deploy-vercel.bat` script ready
- [ ] Commit all changes to git
- [ ] Push to GitHub

---

## Migration Steps

### 1. Vercel Account Setup
- [ ] Create Vercel account at https://vercel.com
- [ ] Connect GitHub account
- [ ] Verify email address

### 2. Project Import
- [ ] Click "Add New Project" in Vercel
- [ ] Select your GitHub repository
- [ ] Configure settings:
  - [ ] Root Directory: `frontend`
  - [ ] Framework Preset: Other
  - [ ] Build Command: (leave empty)
  - [ ] Output Directory: `.`
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete (~60 seconds)
- [ ] Copy your Vercel URL: `https://__________.vercel.app`

### 3. Backend Configuration
- [ ] Go to Railway dashboard
- [ ] Select your backend service
- [ ] Go to Variables tab
- [ ] Find `FRONTEND_URL` variable
- [ ] Update value to your Vercel URL
- [ ] Save changes
- [ ] Wait for backend to restart (~30 seconds)

### 4. Initial Testing
- [ ] Visit your Vercel URL
- [ ] Check homepage loads
- [ ] Open browser console (F12)
- [ ] Verify no CORS errors
- [ ] Check `window.API_URL` is correct
- [ ] Test navigation between pages

### 5. Feature Testing
- [ ] Test student signup
- [ ] Test student login
- [ ] Test student dashboard
- [ ] Test admin login
- [ ] Test admin dashboard
- [ ] Test events page
- [ ] Test resources page
- [ ] Test past questions page
- [ ] Test timetables page
- [ ] Test career paths page

### 6. API Testing
- [ ] Test fetching upcoming events
- [ ] Test fetching resources
- [ ] Test file upload (if applicable)
- [ ] Test authentication flow
- [ ] Test session management
- [ ] Test logout functionality

### 7. Mobile Testing
- [ ] Test on mobile browser (iOS)
- [ ] Test on mobile browser (Android)
- [ ] Test responsive design
- [ ] Test touch interactions
- [ ] Test mobile navigation

---

## Post-Migration

### Monitoring (Week 1)
- [ ] Check Vercel Analytics daily
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Check deployment success rate
- [ ] Review function logs (if any)

### Dual Running (Weeks 1-2)
- [ ] Keep both Netlify and Vercel running
- [ ] Update Railway CORS to allow both:
  ```
  FRONTEND_URL=https://nacos-tau-portal.netlify.app,https://your-project.vercel.app
  ```
- [ ] Monitor traffic on both
- [ ] Compare performance
- [ ] Identify any issues

### Documentation Updates
- [ ] Update README with new URL
- [ ] Update deployment documentation
- [ ] Update team onboarding docs
- [ ] Update API documentation (if URL changed)
- [ ] Update any external links

### External Services Updates
- [ ] Update Google Search Console
- [ ] Update Google Analytics
- [ ] Update social media links
- [ ] Update email signatures
- [ ] Update payment provider webhooks (if any)
- [ ] Update any third-party integrations

---

## Optional: Custom Domain

### Domain Configuration
- [ ] Go to Vercel → Project → Settings → Domains
- [ ] Add your custom domain
- [ ] Configure DNS records:
  - [ ] Add A record or CNAME record
  - [ ] Verify domain ownership
  - [ ] Wait for SSL certificate (automatic)
- [ ] Update Railway `FRONTEND_URL` to custom domain
- [ ] Restart Railway backend
- [ ] Test with custom domain

---

## Cleanup

### After 2 Weeks of Successful Operation
- [ ] Review all metrics and confirm stability
- [ ] Get team/stakeholder approval
- [ ] Update Railway CORS to only allow Vercel URL
- [ ] Go to Netlify dashboard
- [ ] Either:
  - [ ] Pause deployments (keep domain for backup)
  - [ ] Delete site completely
- [ ] Archive Netlify documentation
- [ ] Update final documentation

---

## Rollback Plan (If Needed)

### Emergency Rollback
- [ ] Update Railway `FRONTEND_URL` back to Netlify
- [ ] Restart Railway backend
- [ ] Verify Netlify site is still running
- [ ] Test Netlify site functionality
- [ ] Communicate to users (if needed)
- [ ] Document issues encountered
- [ ] Plan fixes before retry

---

## Success Metrics

### Performance Goals
- [ ] TTFB < 150ms (target: ~120ms)
- [ ] FCP < 1s (target: ~0.7s)
- [ ] LCP < 2s (target: ~1.4s)
- [ ] No increase in error rates
- [ ] Build time < 60s (target: ~45s)

### User Experience Goals
- [ ] No user-reported issues
- [ ] All features working
- [ ] No CORS errors
- [ ] Mobile experience good
- [ ] Page load speeds improved

### Developer Experience Goals
- [ ] Deployments faster
- [ ] No build minute limitations
- [ ] Better deployment visibility
- [ ] Easier to debug issues
- [ ] Team satisfied with change

---

## Issue Tracking

### Common Issues & Solutions

| Issue | Solution | Status |
|-------|----------|--------|
| CORS errors | Update Railway `FRONTEND_URL` | [ ] |
| Blank page | Check root directory setting | [ ] |
| Assets not loading | Verify relative paths | [ ] |
| Slow builds | Check for large files | [ ] |
| 404 errors | Check vercel.json routes | [ ] |

### Issues Encountered During Migration

| Date | Issue | Solution | Notes |
|------|-------|----------|-------|
| | | | |
| | | | |
| | | | |

---

## Team Communication

### Before Migration
- [ ] Notify team of migration plan
- [ ] Share timeline
- [ ] Explain potential downtime (none expected)
- [ ] Share testing procedures

### During Migration
- [ ] Announce migration start
- [ ] Share Vercel URL for testing
- [ ] Request testing from team
- [ ] Address any concerns

### After Migration
- [ ] Announce successful migration
- [ ] Share new production URL
- [ ] Share updated deployment procedures
- [ ] Gather feedback

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Planning & Reading | 30 min | [ ] |
| Vercel Setup | 5 min | [ ] |
| Initial Deployment | 5 min | [ ] |
| Backend Update | 5 min | [ ] |
| Testing | 30 min | [ ] |
| Documentation | 15 min | [ ] |
| **TOTAL** | **~90 min** | [ ] |
| Monitoring Week 1 | 7 days | [ ] |
| Monitoring Week 2 | 7 days | [ ] |
| Netlify Cleanup | 10 min | [ ] |

---

## Sign-off

### Migration Completed By
- **Name**: _________________
- **Date**: _________________
- **Vercel URL**: _________________

### Verified By
- **Name**: _________________
- **Date**: _________________
- **Approval**: [ ] Yes [ ] No

### Notes
```
[Add any additional notes, observations, or recommendations here]
```

---

**Status**: Ready to begin
**Last Updated**: January 2026
**Next Review**: After migration completion

