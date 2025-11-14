# 🚀 Deploy PostReady in 10 Minutes

Quick guide to get your app live!

## ✅ Pre-Deployment Checklist

Make sure you have:
- [x] Supabase configured (database tables created)
- [x] Stripe test keys working (optional, but recommended)
- [ ] Stripe LIVE keys (for production payments)

## Step 1: Configure Git (30 seconds)

Double-click `deploy.bat` and follow the prompts:
- Enter your email
- Enter your name
- Script will configure git and commit your code

**OR** manually run:
```powershell
cd C:\Users\SR115\social-manager
git config user.email "your.email@example.com"
git config user.name "Your Name"
git commit -m "Initial commit: PostReady"
```

## Step 2: Create GitHub Repository (1 minute)

1. Go to: https://github.com/new
2. Repository name: `postready`
3. **Private** (recommended)
4. **DON'T** add README
5. Click "Create repository"

## Step 3: Push to GitHub (30 seconds)

GitHub will show you commands. Run them:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/postready.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username!

## Step 4: Deploy to Vercel (3 minutes)

### 4a. Sign Up / Sign In
1. Go to: https://vercel.com/signup
2. **Sign in with GitHub** (easiest)
3. Authorize Vercel

### 4b. Import Project
1. Click "Add New..." → "Project"
2. Find your `postready` repository
3. Click "Import"

### 4c. Add Environment Variables

Click "Environment Variables" and add these **one by one**:

**OpenAI:**
```
Name: OPENAI_API_KEY
Value: [Paste from your .env.local]
```

**Supabase:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://sgxpynobjbqnfhnqpnre.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Paste from your .env.local]
```

**Stripe (IMPORTANT - Use LIVE keys!):**

Go to https://dashboard.stripe.com/apikeys and **toggle to LIVE mode**:

```
Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_live_... [Your LIVE publishable key]

Name: STRIPE_SECRET_KEY
Value: sk_live_... [Your LIVE secret key]
```

Skip `STRIPE_WEBHOOK_SECRET` for now (we'll add after deployment)

**App URL (skip for now):**
```
Name: NEXT_PUBLIC_APP_URL
Value: (leave empty, we'll add this in Step 6)
```

### 4d. Deploy!
Click **"Deploy"**

Wait 2-3 minutes... ☕

You'll get a URL like: `https://postready-xxx.vercel.app`

## Step 5: Set Up Stripe Production Webhook (5 minutes)

**This is CRITICAL for payments to work!**

1. Copy your Vercel URL (e.g., `https://postready-xxx.vercel.app`)

2. Go to: https://dashboard.stripe.com/webhooks

3. Make sure you're in **LIVE MODE** (toggle at top)

4. Click "+ Add endpoint"

5. Endpoint URL: `https://YOUR-VERCEL-URL.vercel.app/api/stripe-webhook`

6. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

7. Click "Add endpoint"

8. **Copy the Signing Secret** (starts with `whsec_...`)

9. Go back to Vercel → Settings → Environment Variables

10. Add new variable:
    ```
    Name: STRIPE_WEBHOOK_SECRET
    Value: whsec_... [paste the secret]
    ```

11. Add another variable:
    ```
    Name: NEXT_PUBLIC_APP_URL
    Value: https://your-vercel-url.vercel.app
    ```

12. Go to Deployments tab → Click ⋯ on latest deployment → **Redeploy**

## Step 6: Update Supabase URLs (2 minutes)

1. Go to: https://supabase.com/dashboard

2. Select your project

3. Go to: Authentication → URL Configuration

4. Update:
   - **Site URL**: `https://your-vercel-url.vercel.app`
   - **Redirect URLs**: Add `https://your-vercel-url.vercel.app/**`

5. Click "Save"

## Step 7: Test Your Live App! (2 minutes)

1. Visit your Vercel URL

2. **Create a test account** (use real email)

3. **Test the features:**
   - ✅ Sign up works
   - ✅ Business research works
   - ✅ Video ideas generate
   - ✅ Captions generate

4. **Test Pro upgrade:**
   - Click "Upgrade to Pro"
   - Use a REAL credit card (it will charge!)
   - Complete checkout
   - Verify you're upgraded to Pro

**IMPORTANT:** This will create a real subscription. Cancel it immediately in Stripe Dashboard if you don't want to be charged!

---

## 🎉 You're Live!

Your app is now:
- ✅ Live on the internet
- ✅ Accepting real payments
- ✅ Auto-deploying when you push to GitHub

**Share your app:** `https://your-app.vercel.app`

---

## Next Steps

### Add Custom Domain (Optional)
1. Buy domain (e.g., `postready.com`)
2. Vercel → Settings → Domains
3. Follow instructions
4. SSL auto-configured! ✅

### Monitor Your App
- **Vercel Dashboard**: Analytics, logs, deployments
- **Stripe Dashboard**: Payments, customers, revenue
- **Supabase Dashboard**: Users, database, API usage

### Future Updates
When you make changes:
```powershell
git add .
git commit -m "Description of changes"
git push
```
Vercel automatically redeploys! ✅

---

## Troubleshooting

**Deployment failed?**
- Check Vercel build logs
- Verify all environment variables are set

**Stripe payments not working?**
- Check you're using LIVE keys (not test keys)
- Verify webhook secret is correct
- Check Stripe Dashboard → Events for errors

**Users can't sign in?**
- Update Supabase redirect URLs
- Check Supabase URL/anon key in Vercel

---

## Support

- **Full Guide**: See `GITHUB_DEPLOYMENT.md`
- **Stripe Issues**: See `STRIPE_SETUP.md`
- **Supabase Issues**: See `SUPABASE_SETUP.md`

**Questions?** Check the docs or Vercel/Stripe/Supabase support!

---

**Congratulations! Your app is live! 🚀**


