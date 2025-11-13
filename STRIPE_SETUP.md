# Stripe Payment Setup Guide

This guide will help you set up Stripe to accept real credit card payments for PostReady Pro subscriptions.

## Step 1: Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click "Sign up" and create a free account
3. Complete the registration process

## Step 2: Get Your Stripe API Keys

1. Go to the Stripe Dashboard: [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. You'll see two types of keys:

   **Test Mode (for development):**
   - `Publishable key` (starts with `pk_test_...`)
   - `Secret key` (starts with `sk_test_...`)
   - Click "Reveal test key" to see the secret key

   **Live Mode (for production):**
   - Toggle "Test mode" off to see live keys
   - Only use these when ready to accept real payments!

## Step 3: Add Stripe Keys to .env.local

Open your `.env.local` file and add these lines:

```env
# Stripe Configuration (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App URL (for Stripe redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** 
- Use **test keys** during development
- Never commit these keys to Git!
- The webhook secret comes in Step 5

## Step 4: Update Supabase Database

Add Stripe fields to your `user_profiles` table:

1. Go to Supabase SQL Editor
2. Run this SQL:

```sql
-- Add Stripe fields to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer 
ON user_profiles(stripe_customer_id);
```

## Step 5: Set Up Stripe Webhook (CRITICAL!)

Webhooks let Stripe notify your app when payments succeed or fail.

### For Local Development:

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
   - Windows: Download from link above
   - Mac: `brew install stripe/stripe-cli/stripe`

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_...`)
5. Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

6. **Keep the CLI running** while testing payments!

### For Production:

1. Go to: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Click "+ Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_...`)
7. Add to production `.env.local`

## Step 6: Test the Payment Flow

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Click "Upgrade to Pro" on your site

3. Use Stripe test card numbers:
   - **Success:** `4242 4242 4242 4242`
   - **Decline:** `4000 0000 0000 0002`
   - Use any future expiry date (e.g., 12/34)
   - Use any 3-digit CVC (e.g., 123)
   - Use any ZIP code

4. Complete the checkout

5. Check your Stripe CLI - you should see the webhook event

6. Check your app - user should be upgraded to Pro!

## How the Payment Flow Works

1. **User clicks "Start Your Pro Trial"**
   → Redirects to Stripe checkout page

2. **User enters credit card**
   → Stripe securely processes the card
   → Stripe starts 2-day free trial

3. **After 2 days**
   → Stripe automatically charges $10/month
   → User keeps Pro access as long as they pay

4. **If payment fails**
   → Stripe retries automatically
   → User gets email notification
   → Subscription may be cancelled

5. **User can cancel anytime**
   → Go to Stripe Customer Portal (you can add this link)
   → Cancellation takes effect at end of billing period

## Important Stripe Settings

### Enable Customer Portal (Let users manage their subscription):

1. Go to: [https://dashboard.stripe.com/settings/billing/portal](https://dashboard.stripe.com/settings/billing/portal)
2. Click "Activate"
3. Enable: "Customers can update payment methods", "Customers can cancel subscriptions"
4. Save

### Set Up Email Notifications:

1. Go to: [https://dashboard.stripe.com/settings/emails](https://dashboard.stripe.com/settings/emails)
2. Enable: "Payment confirmed", "Payment failed", "Subscription cancelled"

## Test Scenarios

✅ **Happy Path:**
- User signs up → Enters card → 2 days free → Gets charged $10 → Stays Pro

✅ **Card Declined:**
- User enters declined card → Stripe shows error → User can try again

✅ **Cancel During Trial:**
- User cancels within 2 days → Never charged → Loses Pro access

✅ **Cancel After Trial:**
- User cancels after trial → Last payment goes through → Loses Pro at end of period

## Switching to Live Mode (Production)

When you're ready to accept real payments:

1. Complete Stripe account setup (business details, bank account)
2. Switch to Live mode in Stripe Dashboard
3. Copy **live** API keys (start with `pk_live_` and `sk_live_`)
4. Update `.env.local` with live keys
5. Set up production webhook with your live URL
6. Test with a real card (you can refund yourself)
7. You're live! 🚀

## Troubleshooting

**"Stripe is not configured" error:**
- Check `.env.local` has `STRIPE_SECRET_KEY`
- Restart dev server after adding keys

**Webhook not firing:**
- Make sure Stripe CLI is running (`stripe listen`)
- Check webhook secret matches in `.env.local`

**Payment succeeds but user not upgraded:**
- Check Supabase has `stripe_customer_id` and `stripe_subscription_id` columns
- Check webhook logs in Stripe Dashboard

**Can't test payments:**
- Make sure you're using **test mode** keys
- Use Stripe test card: `4242 4242 4242 4242`

## Costs

- **Stripe Fees:** 2.9% + 30¢ per successful charge
- Example: $10 subscription = $0.59 fee, you keep $9.41
- No monthly fees, only pay when you make money!

## Security Notes

✅ **Never expose secret keys in frontend code**
✅ **Always use HTTPS in production**
✅ **Validate webhook signatures** (already done in webhook route)
✅ **Never store full credit card numbers** (Stripe handles this)

---

**Questions?**
- Stripe Docs: https://stripe.com/docs
- Stripe Support: https://support.stripe.com

