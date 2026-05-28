# Selar Integration Guide for NACOS Voting System

## ✅ What Has Been Done

### 1. Updated Webhook Function (`functions/selar_webhook.js`)
- Now handles **both GET and POST requests**
- GET requests: Selar redirect URL with query parameters
- POST requests: Future webhook support (if Selar adds it)
- Returns beautiful HTML success/error pages to voters
- Automatically redirects to leaderboard after 5 seconds

### 2. Updated Voting Form (`voting_form.html`)
- Added dropdown menus for all 10 award categories with candidates
- Improved payment confirmation dialog showing vote breakdown
- Passes vote data via `custom_notes` parameter to Selar

## 🔧 What You Need to Do in Selar Dashboard

### Step 1: Edit Your Product
1. Go to your Selar product: https://selar.co/6977977p71
2. Click **"Edit Product"** or **"Settings"**

### Step 2: Set the Redirect URL
Look for one of these fields (Selar may call it different names):
- **"Thank You Page URL"**
- **"Redirect URL after Purchase"**
- **"Success URL"**
- **"Custom Redirect"**

### Step 3: Paste Your Netlify Function URL
```
https://nacos-tau.netlify.app/.netlify/functions/selar_webhook
```

### Step 4: Save Changes
Click **Save** or **Update Product**

## 🎯 How It Works

### User Flow:
1. **Voter selects candidates** from dropdowns on voting form
2. **Clicks "Proceed to Payment"** → sees confirmation with vote breakdown
3. **Redirected to Selar** payment page with vote data in URL
4. **Completes payment** on Selar
5. **Selar redirects back** to your Netlify function with transaction details
6. **Function processes votes** and saves to Supabase database
7. **Voter sees success page** and auto-redirects to leaderboard

### Data Flow:
```
Voting Form
    ↓ (passes vote data via custom_notes)
Selar Payment Page
    ↓ (after successful payment)
Your Netlify Function (selar_webhook)
    ↓ (extracts vote data from query params)
Supabase Database (votes table)
    ↓
Success Page → Leaderboard
```

## 📋 Testing Checklist

### Before Going Live:
- [ ] Set redirect URL in Selar product settings
- [ ] Make a test purchase (use small amount)
- [ ] Verify you're redirected to success page
- [ ] Check Supabase database for vote records
- [ ] Verify leaderboard shows updated votes
- [ ] Test with duplicate payment reference (should show "already processed")

### Environment Variables Required:
Make sure these are set in Netlify:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SELAR_SECRET_KEY` (optional, for future webhook verification)

## 🔍 Troubleshooting

### If votes aren't being recorded:
1. Check Netlify function logs: https://app.netlify.com → Functions → selar_webhook
2. Verify Selar is redirecting to the correct URL
3. Check if vote data is in the URL query parameters
4. Verify Supabase credentials are correct

### If payment succeeds but no redirect:
1. Double-check the redirect URL in Selar product settings
2. Make sure there are no typos in the URL
3. Test the function URL directly in browser (should show "Method Not Allowed" for GET without params)

## 📝 Important Notes

### Vote Data Format:
The voting form sends data like this:
```json
{
  "tech-innovator": "Akinlotan Victor",
  "tech-innovator-amount": "5",
  "faculty-icon": "Hayat",
  "faculty-icon-amount": "3",
  ...
}
```

### Selar Redirect Parameters:
Selar typically includes these in the redirect:
- `reference` or `transaction_reference` - Unique payment ID
- `email` or `customer_email` - Buyer's email
- `custom_notes` - Your vote data (JSON encoded)

### Database Schema:
Votes are stored in the `votes` table with:
- `category` - Award category (e.g., "tech-innovator")
- `candidate` - Candidate name
- `vote_amount` - Number of votes purchased
- `payment_reference` - Selar transaction reference (unique)
- `voter_email` - Email of the voter
- `created_at` - Timestamp

## 🎉 Success Indicators

When everything is working correctly:
1. ✅ Voter completes payment on Selar
2. ✅ Sees beautiful success page with vote breakdown
3. ✅ Auto-redirects to leaderboard after 5 seconds
4. ✅ Votes appear in database immediately
5. ✅ Leaderboard updates in real-time

## 🆘 Need Help?

If you encounter issues:
1. Check Netlify function logs for errors
2. Verify Selar redirect URL is set correctly
3. Test with a small payment first
4. Check browser console for JavaScript errors
5. Verify Supabase connection and permissions

---

**Last Updated:** May 27, 2026
**Integration Status:** Ready for testing
