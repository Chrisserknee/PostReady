# Stripe Webhook Setup Instructions

## Problem
After payment, users weren't automatically upgraded to Pro because there was no webhook handler to process successful payments.

## Solution
We've added a Stripe webhook handler that automatically upgrades users to Pro when they complete payment.

---

## Setup Steps

### 1. Update Supabase Database Schema

Run the SQL script in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase-migrations/add-stripe-fields.sql`
4. Copy and run the SQL commands

This adds the following columns to `user_profiles`:
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Active subscription ID
- `upgraded_at` - When user first became Pro

### 2. Configure Stripe Webhook

#### For Development (localhost):

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_...`)
5. Add to your `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here
   ```

#### For Production (Vercel/Live Site):

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed` ✅ (Required - upgrades user to Pro)
   - `customer.subscription.updated` ✅ (Required - handles subscription changes)
   - `customer.subscription.deleted` ✅ (Required - handles cancellations)
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add to Vercel environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here
   ```
8. Redeploy your application

### 3. Verify Setup

1. Make a test payment using Stripe test mode
2. Check your server logs for webhook events
3. Verify the user's `is_pro` status updated in Supabase

---

## How It Works

1. **User initiates checkout** → `/api/create-checkout` creates a Stripe session with user metadata
2. **User completes payment** → Stripe sends `checkout.session.completed` webhook
3. **Webhook handler** → `/api/webhooks/stripe` receives event and updates database:
   - Sets `is_pro = true`
   - Stores `stripe_customer_id` and `stripe_subscription_id`
   - Records `upgraded_at` timestamp
4. **User's Pro status updates automatically** → AuthContext polls database and reflects Pro status

---

## Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Upgrade user to Pro |
| `customer.subscription.updated` | Update Pro status based on subscription state |
| `customer.subscription.deleted` | Downgrade user to free tier |

---

## Testing

### Test the webhook locally:
```bash
# Terminal 1: Start your dev server
npm run dev

# Terminal 2: Forward Stripe webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3: Trigger a test event
stripe trigger checkout.session.completed
```

### Check webhook logs:
- **Development**: Check your terminal/console logs
- **Production**: Check Vercel function logs or Stripe Dashboard → Webhooks → Events

---

## Troubleshooting

### "User not upgraded after payment"
1. Check webhook endpoint is configured in Stripe
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
3. Check webhook event logs in Stripe Dashboard
4. Look for errors in your server logs

### "Webhook signature verification failed"
- Make sure you're using the correct webhook secret
- The secret should start with `whsec_`
- Development and production use different secrets

### "User profile not found"
- Ensure user profile was created during signup
- Check `userId` is correctly passed to checkout session metadata
- Verify the `user_profiles` table has the user record

---

## Security Notes

- ✅ Webhook signature verification prevents unauthorized updates
- ✅ User ownership is verified during checkout creation
- ✅ Subscription status is synced automatically
- ✅ Failed payments automatically downgrade users
