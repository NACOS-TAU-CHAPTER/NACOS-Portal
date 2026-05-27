# 🗄️ Create the Votes Table in Supabase

## 🎯 The Problem

The database error you're seeing is because the `votes` table doesn't exist in your Supabase database yet.

## ✅ The Solution (2 Minutes)

### Step 1: Go to Supabase SQL Editor

1. Open https://supabase.com/dashboard
2. Select your **NACOS project**
3. Click **SQL Editor** in the left sidebar (or the database icon)

### Step 2: Run the SQL Script

1. Click **New query** (or the + button)
2. Copy the entire content from `database/votes_table.sql`
3. Paste it into the SQL editor
4. Click **Run** (or press Ctrl+Enter)

**Or copy this SQL directly:**

```sql
-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id BIGSERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    candidate TEXT NOT NULL,
    vote_amount INTEGER NOT NULL DEFAULT 1,
    payment_reference TEXT UNIQUE NOT NULL,
    voter_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_votes_payment_reference ON votes(payment_reference);
CREATE INDEX IF NOT EXISTS idx_votes_category ON votes(category);
CREATE INDEX IF NOT EXISTS idx_votes_candidate ON votes(candidate);

-- Enable Row Level Security
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read votes (for leaderboard)
CREATE POLICY "Anyone can view votes" ON votes
    FOR SELECT USING (true);

-- Create leaderboard view
CREATE OR REPLACE VIEW vote_leaderboard AS
SELECT 
    category,
    candidate,
    SUM(vote_amount) as total_votes,
    COUNT(DISTINCT payment_reference) as number_of_voters,
    MAX(created_at) as last_vote_at
FROM votes
GROUP BY category, candidate
ORDER BY category, total_votes DESC;

-- Grant access to the view
GRANT SELECT ON vote_leaderboard TO anon, authenticated;
```

### Step 3: Verify Table Was Created

1. In Supabase, click **Table Editor** in the left sidebar
2. You should see a new table called **votes**
3. Click on it to see the columns:
   - `id` (bigint)
   - `category` (text)
   - `candidate` (text)
   - `vote_amount` (integer)
   - `payment_reference` (text, unique)
   - `voter_email` (text)
   - `created_at` (timestamp)

### Step 4: Test Again!

1. Go back to `test-webhook-simple.html`
2. Click **"Test Webhook Now"**
3. You should now see: **✓ Your Votes Have Been Recorded!**

## 🎉 Success Indicators

### Before Creating Table:
- ❌ Database Error
- ❌ No votes table in Supabase

### After Creating Table:
- ✅ Success page appears
- ✅ Votes table exists in Supabase
- ✅ Test votes appear in the table
- ✅ Leaderboard view available

## 🔍 Check Your Votes

After testing, you can view the votes in Supabase:

1. Go to **Table Editor** → **votes**
2. You should see test votes like:
   - Category: `tech-innovator`
   - Candidate: `Akinlotan Victor`
   - Vote Amount: `5`
   - Payment Reference: `TEST_REF_...`
   - Voter Email: `test@nacos.com`

## 📊 Bonus: View Leaderboard Data

The SQL also creates a `vote_leaderboard` view for easy querying:

```sql
SELECT * FROM vote_leaderboard;
```

This shows:
- Category
- Candidate
- Total votes
- Number of voters
- Last vote timestamp

## 🆘 Troubleshooting

### Error: "permission denied for table votes"
**Solution:** Make sure you're using the service_role key in Netlify (not anon key)

### Error: "relation votes does not exist"
**Solution:** The SQL didn't run. Try running it again in SQL Editor

### Table created but still getting errors?
**Solutions:**
1. Check if RLS policies are enabled
2. Verify service_role key is correct in Netlify
3. Check function logs for specific error message

## 📋 Quick Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Copied SQL from votes_table.sql
- [ ] Ran the SQL script
- [ ] Verified votes table exists in Table Editor
- [ ] Tested with test-webhook-simple.html
- [ ] Saw success page
- [ ] Checked votes table for test data

---

**Once the table is created, your webhook will work perfectly!**

**Next:** After seeing success, set the redirect URL in Selar and go live!
