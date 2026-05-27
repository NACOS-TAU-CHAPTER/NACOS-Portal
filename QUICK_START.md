# 🚀 Quick Start - Selar Integration

## ⚡ 3 Steps to Go Live

### 1️⃣ Set Redirect URL in Selar
```
Go to: https://selar.co/6977977p71
Click: Edit Product
Find: "Thank You Page URL" or "Redirect URL"
Paste: https://nacos-tau.netlify.app/.netlify/functions/selar_webhook
Save: Product
```

### 2️⃣ Test It
```
Open: test-selar-redirect.html
Select: Live Test
Click: Simulate Selar Redirect
Verify: Success page appears
Check: Supabase database for votes
```

### 3️⃣ Go Live!
```
Share: voting_form.html with your community
Monitor: Netlify function logs
Watch: Votes come in on the leaderboard!
```

## 📋 Quick Checklist

- [ ] Redirect URL set in Selar ← **MOST IMPORTANT!**
- [ ] Environment variables set in Netlify
- [ ] Test completed successfully
- [ ] Database receiving votes
- [ ] Leaderboard updating

## 🔗 Important URLs

**Voting Form:**
```
https://nacos-tau.netlify.app/voting_form.html
```

**Webhook URL (for Selar):**
```
https://nacos-tau.netlify.app/.netlify/functions/selar_webhook
```

**Leaderboard:**
```
https://nacos-tau.netlify.app/voting_leaderboard.html
```

**Test Page:**
```
test-selar-redirect.html (local file)
```

## 🎯 What Happens When Someone Votes

1. User selects candidates → Clicks "Proceed to Payment"
2. Redirected to Selar → Completes payment
3. Selar redirects back → Your function processes votes
4. Success page shown → Auto-redirect to leaderboard
5. Votes recorded → Visible immediately

## ⚠️ If Something Goes Wrong

**Votes not recording?**
→ Check Netlify function logs

**Success page not showing?**
→ Verify redirect URL is set in Selar

**Duplicate vote error?**
→ Normal! Same transaction can't vote twice

**Database error?**
→ Check Supabase credentials in Netlify

## 📞 Quick Help

**Netlify Logs:**
https://app.netlify.com → Functions → selar_webhook

**Supabase Dashboard:**
Check `votes` table for new entries

**Test First:**
Always test with `test-selar-redirect.html` before real payments

---

**You're all set! Just set that redirect URL in Selar and you're live! 🎉**
