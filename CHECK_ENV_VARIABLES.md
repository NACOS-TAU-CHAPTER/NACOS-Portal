# 🔧 Check & Set Environment Variables in Netlify

## ⚠️ The Error You're Seeing

The "Internal Server Error" is likely because your Supabase credentials aren't set in Netlify's environment variables.

## ✅ How to Fix It

### Step 1: Go to Netlify Dashboard
1. Open https://app.netlify.com
2. Click on your site: **nacos-tau**
3. Go to **Site settings**

### Step 2: Navigate to Environment Variables
1. In the left sidebar, click **Environment variables**
2. Or go directly to: Site settings → Build & deploy → Environment

### Step 3: Add Required Variables

You need to add these 2 variables:

#### Variable 1: SUPABASE_URL
```
Key: SUPABASE_URL
Value: Your Supabase project URL (looks like: https://xxxxx.supabase.co)
```

**Where to find it:**
- Go to https://supabase.com/dashboard
- Select your project
- Go to Settings → API
- Copy the "Project URL"

#### Variable 2: SUPABASE_SERVICE_ROLE_KEY
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: Your Supabase service role key (starts with: eyJ...)
```

**Where to find it:**
- Same place: Settings → API
- Under "Project API keys"
- Copy the **service_role** key (NOT the anon key!)
- ⚠️ This is a secret key - never share it publicly

#### Variable 3: SELAR_SECRET_KEY (Optional)
```
Key: SELAR_SECRET_KEY
Value: Your Selar secret key (if you have one)
```

This is optional for now. Only needed if Selar provides webhook signature verification.

### Step 4: Save and Redeploy

1. After adding the variables, click **Save**
2. Go to **Deploys** tab
3. Click **Trigger deploy** → **Deploy site**
4. Wait for deployment to complete (usually 1-2 minutes)

### Step 5: Test Again

Once deployed:
1. Open `test-selar-redirect.html`
2. Select "Live Test"
3. Click "Simulate Selar Redirect"
4. You should now see the success page!

## 🔍 How to Verify Variables Are Set

After setting the variables, you can check the function logs:

1. Go to Netlify dashboard
2. Click **Functions** in the left sidebar
3. Click **selar_webhook**
4. Look at recent invocations
5. You should see logs like:
   ```
   SUPABASE_URL exists: true
   SUPABASE_SERVICE_ROLE_KEY exists: true
   ```

## 📋 Quick Checklist

- [ ] SUPABASE_URL is set in Netlify
- [ ] SUPABASE_SERVICE_ROLE_KEY is set in Netlify
- [ ] Site has been redeployed after adding variables
- [ ] Test page works without errors
- [ ] Votes appear in Supabase database

## 🆘 Still Getting Errors?

### Error: "Configuration Error - Supabase credentials not configured"
**Solution:** Environment variables aren't set. Follow steps above.

### Error: "Database Error"
**Solutions:**
1. Check if `votes` table exists in Supabase
2. Verify service role key has write permissions
3. Check table schema matches expected format

### Error: "Missing Transaction Reference"
**Solution:** Make sure the test page is passing the `reference` parameter

## 📊 Expected Supabase Table Schema

Your `votes` table should have these columns:

```sql
CREATE TABLE votes (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  candidate TEXT NOT NULL,
  vote_amount INTEGER NOT NULL DEFAULT 1,
  payment_reference TEXT UNIQUE NOT NULL,
  voter_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎉 Success Indicators

When everything is working:
- ✅ Test page shows success page (not error)
- ✅ Function logs show "Inserting votes: [...]"
- ✅ Supabase `votes` table has new rows
- ✅ No errors in Netlify function logs

---

**Next:** After setting environment variables and redeploying, test again with `test-selar-redirect.html`
