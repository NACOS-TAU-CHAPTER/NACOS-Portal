# 🧪 Testing Your Selar Integration

## ✅ What's Ready to Test

1. **Voting Form** (`voting_form.html`) - Updated with dropdowns and Selar integration
2. **Webhook Function** (`functions/selar_webhook.js`) - Handles GET requests from Selar redirect
3. **Test Page** (`test-selar-redirect.html`) - Simulates Selar redirect for testing

## 🚀 Two Ways to Test

### Option 1: Test with Live Netlify Function (Easiest)

1. **Open the test page in your browser:**
   ```
   test-selar-redirect.html
   ```

2. **Select "Live Test" option** (radio button)

3. **Fill in test data:**
   - Transaction Reference: (auto-generated)
   - Customer Email: test@nacos.com
   - Select candidates and vote amounts

4. **Click "Simulate Selar Redirect"**
   - You'll be redirected to your live Netlify function
   - Should see a success page with vote breakdown
   - Check your Supabase database to verify votes were recorded

### Option 2: Test Locally with Netlify Dev

1. **Start Netlify Dev server:**
   ```cmd
   netlify dev
   ```
   This will start a local server at `http://localhost:8888`

2. **Open the test page:**
   ```
   http://localhost:8888/test-selar-redirect.html
   ```

3. **Select "Local Test" option** (radio button)

4. **Fill in test data and click "Simulate Selar Redirect"**

5. **Check the terminal** for function logs

## 🔍 What to Check After Testing

### 1. Success Page
You should see a beautiful page with:
- ✓ Green checkmark
- "Your Votes Have Been Recorded!"
- Breakdown of all your votes
- Transaction reference
- Auto-redirect to leaderboard after 5 seconds

### 2. Database (Supabase)
Go to your Supabase dashboard and check the `votes` table:
- Should have new rows for each vote
- Each row should have:
  - `category` (e.g., "tech-innovator")
  - `candidate` (e.g., "Akinlotan Victor")
  - `vote_amount` (e.g., 5)
  - `payment_reference` (unique transaction ID)
  - `voter_email`
  - `created_at` timestamp

### 3. Leaderboard
Visit `voting_leaderboard.html` to see if votes are reflected

## 🎯 Testing the Real Flow (with Selar)

Once you've set the redirect URL in Selar:

1. **Go to your voting form:**
   ```
   https://nacos-tau.netlify.app/voting_form.html
   ```

2. **Select candidates and vote amounts**

3. **Click "Proceed to Payment"**
   - Confirm the vote breakdown
   - Click "Proceed to Payment"

4. **Complete payment on Selar**
   - Use a test card or small amount
   - Complete the checkout

5. **After payment:**
   - Selar redirects you to your webhook
   - You see the success page
   - Votes are recorded in database
   - Auto-redirect to leaderboard

## ⚠️ Common Issues & Solutions

### Issue: "No voting data found"
**Solution:** Make sure Selar is passing `custom_notes` parameter in the redirect URL

### Issue: "Missing transaction reference"
**Solution:** Selar should pass `reference` or `transaction_reference` parameter

### Issue: Votes not appearing in database
**Solutions:**
1. Check Netlify function logs for errors
2. Verify Supabase credentials in Netlify environment variables
3. Check if `votes` table exists with correct schema
4. Verify Supabase service role key has write permissions

### Issue: "Already processed" message
**Solution:** This is normal! It means the same transaction reference was used twice (prevents duplicate votes)

## 📊 Expected URL Format from Selar

When Selar redirects after payment, the URL should look like:
```
https://nacos-tau.netlify.app/.netlify/functions/selar_webhook?reference=SELAR_REF_123&email=voter@email.com&custom_notes=%7B%22tech-innovator%22%3A%22Akinlotan%20Victor%22%2C%22tech-innovator-amount%22%3A%225%22%7D
```

The `custom_notes` parameter contains URL-encoded JSON with vote data.

## 🎉 Success Indicators

✅ Voter sees success page after payment  
✅ Votes appear in Supabase database  
✅ Leaderboard updates with new votes  
✅ Duplicate payments show "already processed" message  
✅ No errors in Netlify function logs  

## 🆘 Need Help?

1. Check Netlify function logs: https://app.netlify.com → Functions → selar_webhook
2. Check browser console for JavaScript errors
3. Verify environment variables are set in Netlify
4. Test with the test page first before using real Selar payments

---

**Ready to test?** Start with the test page (`test-selar-redirect.html`) to verify everything works before making real payments!
