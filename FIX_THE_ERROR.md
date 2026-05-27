# 🔧 Fix the Internal Server Error

## 🎯 The Problem

You're getting an "Internal Server Error" when testing the webhook. This is **99% likely** because your Supabase environment variables aren't set in Netlify.

## ✅ The Solution (5 Minutes)

### Step 1: Get Your Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your NACOS project
3. Click **Settings** (gear icon) → **API**
4. You'll see two things you need:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **service_role key** (starts with `eyJ...`)

**⚠️ Important:** Copy the **service_role** key, NOT the anon key!

### Step 2: Add Variables to Netlify

1. Go to https://app.netlify.com
2. Click on your site: **nacos-tau**
3. Go to **Site settings** → **Environment variables**
4. Click **Add a variable** (or **Add environment variable**)

**Add Variable 1:**
```
Key: SUPABASE_URL
Value: [paste your Project URL here]
Scopes: All scopes (or at least Functions)
```

**Add Variable 2:**
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: [paste your service_role key here]
Scopes: All scopes (or at least Functions)
```

5. Click **Save**

### Step 3: Redeploy Your Site

**Option A: Trigger Deploy (Fastest)**
1. In Netlify, go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait 1-2 minutes for deployment to complete

**Option B: Push a Change**
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

### Step 4: Test Again

1. Wait for Netlify deployment to finish (check the Deploys tab)
2. Open `test-webhook-simple.html` in your browser
3. Click "Test Webhook Now"
4. You should see a SUCCESS message!

## 🔍 How to Know It's Fixed

### Before Fix:
- ❌ Internal Server Error
- ❌ Function logs show missing credentials
- ❌ No votes in database

### After Fix:
- ✅ Beautiful success page appears
- ✅ Function logs show "Inserting votes: [...]"
- ✅ Votes appear in Supabase `votes` table
- ✅ Test page shows green success message

## 📊 Check Function Logs

To see what's happening:

1. Go to Netlify dashboard
2. Click **Functions** in sidebar
3. Click **selar_webhook**
4. View recent invocations
5. Look for these log messages:
   ```
   SUPABASE_URL exists: true
   SUPABASE_SERVICE_ROLE_KEY exists: true
   Processing vote data...
   Inserting votes: [...]
   ```

## 🆘 Still Not Working?

### Error: "Configuration Error"
**Cause:** Environment variables not set or not deployed
**Fix:** 
1. Double-check variables are saved in Netlify
2. Make sure you redeployed after adding them
3. Check variable names are EXACTLY: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Error: "Database Error"
**Cause:** Table doesn't exist or wrong permissions
**Fix:**
1. Check if `votes` table exists in Supabase
2. Verify service_role key (not anon key)
3. Check table schema matches expected format

### Error: "Missing Transaction Reference"
**Cause:** Test URL not formatted correctly
**Fix:** Use the test pages provided (`test-webhook-simple.html`)

## 📋 Quick Checklist

- [ ] Got Supabase URL from dashboard
- [ ] Got service_role key (NOT anon key)
- [ ] Added SUPABASE_URL to Netlify
- [ ] Added SUPABASE_SERVICE_ROLE_KEY to Netlify
- [ ] Saved variables in Netlify
- [ ] Triggered redeploy
- [ ] Waited for deployment to complete
- [ ] Tested with test-webhook-simple.html
- [ ] Saw success page
- [ ] Checked Supabase for votes

## 🎉 Once It's Working

After you see the success page:

1. ✅ Your webhook is working!
2. ✅ Set the redirect URL in Selar (see QUICK_START.md)
3. ✅ Test with real payment
4. ✅ Go live!

---

**The fix is simple: Add those 2 environment variables to Netlify and redeploy. That's it!**

**Need the exact URLs?**
- Supabase Dashboard: https://supabase.com/dashboard
- Netlify Dashboard: https://app.netlify.com
- Test Page: Open `test-webhook-simple.html` in your browser
