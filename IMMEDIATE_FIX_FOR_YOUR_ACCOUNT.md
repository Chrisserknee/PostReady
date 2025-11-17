# Immediate Fix: Manually Upgrade Your Account

Since you just paid but the webhook wasn't set up yet, your account wasn't automatically upgraded. Here's how to fix it immediately:

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on **Table Editor** → **user_profiles**
3. Find your user record (search by your email)
4. Click to edit the row
5. Set these fields:
   - `is_pro` = `true` ✅
   - `plan_type` = `pro`
   - `updated_at` = (current timestamp - will auto-update)
6. Save the changes
7. Refresh your PostReady app page

Your Pro features should now be active!

---

## Option 2: Via SQL (Fast)

If you know your user ID, run this in Supabase SQL Editor:

```sql
UPDATE user_profiles
SET is_pro = true, 
    plan_type = 'pro',
    upgraded_at = NOW(),
    updated_at = NOW()
WHERE email = 'your-email@example.com';
```

Replace `your-email@example.com` with your actual email.

---

## Option 3: Use the App's Dev Console (Advanced)

1. Open your PostReady app
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Paste this code:

```javascript
// This will manually trigger the upgrade
fetch('/api/manual-upgrade', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}).then(r => r.json()).then(console.log);
```

5. Refresh the page

---

## For Future Users

After you complete the Stripe webhook setup (see `STRIPE_SETUP.md`), all future payments will automatically upgrade users to Pro. No manual intervention needed!

---

## Verify Pro Status

After upgrading, you should see:
- ✅ "Pro Member: Unlimited generations" in Sora Prompt Generator
- ✅ Unlimited access to all Pro features
- ✅ No usage limits

If you still see limits, try:
1. Sign out and sign back in
2. Clear browser cache
3. Check the browser console for errors

