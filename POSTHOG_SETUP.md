# PostHog Setup Guide

PostHog has been installed and integrated into PostReady for product analytics and user tracking.

## Setup Instructions

### 1. Create a PostHog Account

1. Go to [https://posthog.com](https://posthog.com)
2. Sign up for a free account (or log in if you already have one)
3. Create a new project for PostReady

### 2. Get Your PostHog API Key

1. In your PostHog dashboard, go to **Project Settings**
2. Find your **Project API Key** (it looks like `phc_xxxxxxxxxxxxxxxxxxxx`)
3. Copy this key

### 3. Determine Your PostHog Host URL

The host URL is **not found in the dashboard** - it's determined by which PostHog instance you're using:

**To find out which one you're using:**
- Look at your PostHog dashboard URL in your browser
- If it's `app.posthog.com` → Use **US Cloud**: `https://us.i.posthog.com`
- If it's `eu.posthog.com` → Use **EU Cloud**: `https://eu.i.posthog.com`
- If it's a custom domain → Use your custom PostHog instance URL

**Most users (default):**
- **US Cloud**: `https://us.i.posthog.com` ← Use this if unsure
- **EU Cloud**: `https://eu.i.posthog.com` (only if your dashboard URL contains "eu")

### 4. Add Environment Variables

Add these to your `.env.local` file (create it if it doesn't exist):

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_your_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**For Production (Vercel):**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - `NEXT_PUBLIC_POSTHOG_KEY` = `phc_your_api_key_here`
   - `NEXT_PUBLIC_POSTHOG_HOST` = `https://us.i.posthog.com` (or your region)

### 5. Deploy

After adding the environment variables, redeploy your application. PostHog will automatically start tracking:

- Page views
- User identification (when users sign in)
- User properties (email, Pro status)
- Custom events (can be added throughout the app)

## Features Enabled

✅ **Automatic Page View Tracking** - Tracks all page navigation  
✅ **User Identification** - Identifies users when they sign in  
✅ **User Properties** - Tracks email and Pro status  
✅ **Session Tracking** - Tracks user sessions automatically  

## Adding Custom Events

You can track custom events anywhere in your app:

```typescript
import posthog from 'posthog-js';

// Track a custom event
posthog.capture('tool_used', {
  tool_name: 'red-flag-detector',
  user_type: 'pro',
});
```

## Viewing Analytics

1. Go to your PostHog dashboard
2. Navigate to **Insights** to see:
   - Page views
   - User activity
   - Custom events
   - User properties

## Privacy & GDPR

PostHog respects user privacy:
- IP addresses are anonymized by default
- Users can opt out via browser settings
- All data is stored securely in PostHog's infrastructure

## Troubleshooting

**PostHog not tracking?**
- Check that environment variables are set correctly
- Verify the API key is valid
- Check browser console for any errors
- Ensure `NEXT_PUBLIC_` prefix is used for environment variables

**Events not showing up?**
- Wait a few minutes for events to process
- Check PostHog dashboard filters
- Verify you're looking at the correct project


- Ensure `NEXT_PUBLIC_` prefix is used for environment variables

**Events not showing up?**
- Wait a few minutes for events to process
- Check PostHog dashboard filters
- Verify you're looking at the correct project

