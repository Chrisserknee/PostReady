# Stripe Webhook Setup for PostReady

## 🚨 IMPORTANT: You're Using LIVE Keys!

Your `.env.local` now contains **LIVE** Stripe keys. This means:
- ⚠️ **Real money** will be charged when testing
- ⚠️ Be careful when testing the checkout flow
- ✅ The subscription will actually start when a user pays
- ✅ Consider using Stripe test mode for development

---

## 🔧 Local Development Webhook Setup

To test webhooks on localhost, you need to use the **Stripe CLI**:

### 1. Install Stripe CLI

**Windows:**
```powershell
# Download from: https://github.com/stripe/stripe-cli/releases/latest
# Or use Scoop:
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

### 2. Login to Stripe
```bash
stripe login
```

### 3. Forward Webhooks to Localhost
```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

This will output something like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### 4. Copy the Webhook Secret
Update your `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 5. Keep the Stripe CLI Running
Leave the terminal open while testing. You'll see webhook events in real-time.

---

## 🌐 Production Webhook Setup (Vercel)

For your deployed app:

### 1. Go to Stripe Dashboard
https://dashboard.stripe.com/webhooks

### 2. Click "Add endpoint"

### 3. Enter Your Vercel URL
```
https://your-app.vercel.app/api/stripe-webhook
```

### 4. Select Events to Listen For
- `checkout.session.completed` ✅
- `customer.subscription.deleted` ✅
- `invoice.payment_failed` ✅

### 5. Copy the Signing Secret
After creating the webhook, copy the webhook signing secret.

### 6. Add to Vercel Environment Variables
Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 7. Redeploy
Click "Redeploy" in Vercel for the changes to take effect.

---

## 🧪 Testing the Integration

### Test the Checkout Flow:
1. Start your dev server: `npm run dev`
2. Sign up for an account
3. Click "Start Your Pro Trial - 2 Days Free"
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any billing ZIP code

### Verify Webhook Processing:
1. Watch the Stripe CLI output for webhook events
2. Check your terminal for console logs: `User {userId} upgraded to Pro`
3. Refresh the app - you should see the "PRO" badge

---

## 🔐 Switching Between Test and Live Mode

### For Development (Recommended):
Use **test mode** keys instead:

```env
# Test Mode Keys (safer for development)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

Get test keys from: https://dashboard.stripe.com/test/apikeys

### For Production:
Use the **live mode** keys you already have:

```env
# Live Mode Keys (production only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SSrNSCxUgjmk3p3bw7FU...
STRIPE_SECRET_KEY=sk_live_51SSrNSCxUgjmk3p3TbqWAV...
```

---

## 📊 What the Webhook Does

When events happen in Stripe, your webhook automatically:

1. **`checkout.session.completed`**
   - ✅ Sets `is_pro = true` in Supabase
   - ✅ Stores Stripe customer ID and subscription ID
   - ✅ User gets instant Pro access

2. **`customer.subscription.deleted`**
   - ✅ Sets `is_pro = false` in Supabase
   - ✅ Downgrades user when subscription ends

3. **`invoice.payment_failed`**
   - ✅ Logs the failure (for monitoring)
   - ✅ You can add email notifications here

---

## ✅ Quick Start Checklist

- [ ] Stripe CLI installed
- [ ] Ran `stripe listen` command
- [ ] Updated `STRIPE_WEBHOOK_SECRET` in `.env.local`
- [ ] Dev server running (`npm run dev`)
- [ ] Tested signup → upgrade → checkout flow
- [ ] Verified Pro badge appears after payment

---

## 🆘 Troubleshooting

### Webhook not receiving events?
- Make sure Stripe CLI is running
- Check the webhook secret matches `.env.local`
- Restart your dev server after updating `.env.local`

### User not getting Pro status?
- Check terminal logs for errors
- Verify Supabase `user_profiles` table exists
- Make sure user ID in checkout matches Supabase

### Test card not working?
- Use: `4242 4242 4242 4242`
- Make sure you're in test mode if using test keys

---

**Need help?** Check the Stripe docs: https://stripe.com/docs/webhooks


