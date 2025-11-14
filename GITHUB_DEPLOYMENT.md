# GitHub & Vercel Deployment Guide

Complete guide to publish PostReady to GitHub and deploy to Vercel.

## Part 1: Push to GitHub

### Step 1: Set Git Configuration (One-Time Setup)

Open PowerShell in the project folder and run:

```powershell
cd C:\Users\SR115\social-manager

# Set your Git identity for this repository
git config user.email "your.email@example.com"
git config user.name "Your Name"
```

**Important:** Replace with your actual email and name!

### Step 2: Make Initial Commit

```powershell
git commit -m "Initial commit: PostReady - AI-powered social media manager"
```

### Step 3: Create GitHub Repository

1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: `postready` (or any name you want)
3. Description: "AI-powered social media manager for local businesses"
4. **Keep it Private** (recommended - contains setup guides with API info)
5. **DO NOT** check "Add README" (we already have one)
6. Click **"Create repository"**

### Step 4: Push to GitHub

GitHub will show you commands. Run these:

```powershell
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/postready.git

# Rename branch to main (if needed)
git branch -M main

# Push code to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME`** with your GitHub username!

### Step 5: Verify

Refresh your GitHub repository page - you should see all your code! ✅

---

## Part 2: Deploy to Vercel

### Step 1: Create Vercel Account

1. Go to [https://vercel.com/signup](https://vercel.com/signup)
2. Sign up with GitHub (easiest option)
3. Authorize Vercel to access your GitHub

### Step 2: Import Project

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click "Import" next to your `postready` repository
3. Vercel will detect it's a Next.js app ✅

### Step 3: Configure Environment Variables

**CRITICAL:** Add these environment variables in Vercel:

Click "Environment Variables" and add:

```
# OpenAI API Key
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_KEY_HERE

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://sgxpynobjbqnfhnqpnre.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE

# Stripe Configuration (Use LIVE keys for production!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET

# App URL (Vercel will give you this after deployment)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Where to get these:**
- **OpenAI**: From your `.env.local` file
- **Supabase**: From your `.env.local` file
- **Stripe**: Switch to **LIVE MODE** in Stripe Dashboard and get live keys
- **App URL**: Leave blank for now, update after first deployment

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. You'll get a URL like: `https://postready.vercel.app` or `https://postready-username.vercel.app`

### Step 5: Update App URL

1. Copy your Vercel URL
2. Go back to Vercel → Settings → Environment Variables
3. Update `NEXT_PUBLIC_APP_URL` with your actual URL
4. Click "Redeploy" (Deployments tab → ⋯ menu → Redeploy)

### Step 6: Set Up Production Stripe Webhook

**CRITICAL for payments to work:**

1. Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Make sure you're in **LIVE MODE** (toggle at top)
3. Click "+ Add endpoint"
4. Endpoint URL: `https://YOUR-VERCEL-URL.vercel.app/api/stripe-webhook`
5. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
6. Click "Add endpoint"
7. Copy the **Signing secret** (starts with `whsec_...`)
8. Go to Vercel → Settings → Environment Variables
9. Update `STRIPE_WEBHOOK_SECRET` with the new secret
10. Redeploy

### Step 7: Test Your Production App

1. Visit your Vercel URL
2. Sign up with a test account
3. Try the free features
4. **Test Pro upgrade** (it will charge real card!)
5. Verify Pro upgrade works

---

## Part 3: Post-Deployment Setup

### Update Supabase Allowed URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to "Site URL"
3. Add to "Redirect URLs": `https://your-vercel-url.vercel.app/**`

### Set Up Custom Domain (Optional)

1. Buy domain (e.g., `postready.com`)
2. In Vercel: Settings → Domains → Add
3. Follow DNS configuration steps
4. SSL certificate auto-configured! ✅

### Enable Production Mode in Stripe

Make sure you're using **LIVE** Stripe keys (not test keys) in production!

Test keys start with: `pk_test_` and `sk_test_`
Live keys start with: `pk_live_` and `sk_live_`

---

## Important Notes

### 🔒 Security Checklist

✅ `.env.local` is in `.gitignore` (never pushed to GitHub)
✅ All API keys added to Vercel environment variables
✅ Supabase Row Level Security enabled
✅ Stripe webhook signatures verified
✅ Using HTTPS (auto-configured by Vercel)

### 💰 Stripe Live Mode

When using live Stripe keys:
- Real cards will be charged
- You'll receive real money (minus Stripe fees)
- Set up your bank account in Stripe to receive payouts
- Enable tax collection if required in your region

### 🔄 Future Updates

When you make changes:

```powershell
cd C:\Users\SR115\social-manager

# Check what changed
git status

# Add changes
git add .

# Commit with message
git commit -m "Description of changes"

# Push to GitHub
git push

# Vercel auto-deploys! ✅
```

Vercel automatically redeploys when you push to GitHub!

---

## Troubleshooting

### "Webhook verification failed"
- Check `STRIPE_WEBHOOK_SECRET` matches production webhook
- Make sure webhook URL is correct: `/api/stripe-webhook`

### "Cannot connect to Supabase"
- Check Supabase URL and anon key in Vercel env vars
- Add Vercel URL to Supabase allowed URLs

### "Payments not working"
- Switch to Live mode in Stripe
- Update webhook to use production URL
- Test with real credit card

### "Build failed on Vercel"
- Check build logs
- Make sure all dependencies in `package.json`
- Verify environment variables are set

---

## Monitoring & Analytics

### Vercel Analytics

1. Vercel Dashboard → Analytics tab
2. See page views, performance, errors
3. Free tier: 100k events/month

### Stripe Dashboard

1. Monitor payments, subscriptions
2. View customer lifetime value
3. Track revenue, refunds, chargebacks

### Supabase Dashboard

1. Monitor database usage
2. View active users
3. Check API usage

---

## Costs (Estimated)

### Free Tier Limits:
- **Vercel**: 100GB bandwidth, unlimited static pages
- **Supabase**: 500MB database, 2GB bandwidth
- **Stripe**: No monthly fee, 2.9% + 30¢ per transaction

### Scaling:
- **Vercel Pro**: $20/month (1TB bandwidth, priority support)
- **Supabase Pro**: $25/month (8GB database, no pausing)
- **Stripe**: No change (pay per transaction only)

---

**You're now live! 🚀**

Share your app: `https://your-app.vercel.app`


