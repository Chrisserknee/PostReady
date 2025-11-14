# Password Reset "Load Failed" Error - Debugging Guide

## 🔍 What I Just Deployed

I've added improved error handling and logging to help diagnose the "load failed" error:

### Changes Made:
1. **Better error messages** in `contexts/AuthContext.tsx`
2. **Console logging** to track what's happening
3. **Supabase configuration warnings** in `lib/supabase.ts`

**Commit**: `08eeb8a`  
**Status**: Deploying to Vercel now (2-3 minutes)

---

## 🧪 How to Debug (After Deployment)

### Step 1: Open Browser Console

1. Go to https://postready.app
2. Press **F12** (or right-click → Inspect)
3. Click the **Console** tab
4. Keep it open

### Step 2: Try Password Reset

1. Click "Sign In"
2. Click "Forgot password?"
3. Enter your email
4. Click "Send Reset Link"
5. **Watch the console for messages**

### Step 3: Check Console Messages

You should see one of these:

#### ✅ Success Case:
```
Password reset email sent successfully
```
**Action**: Check your email!

#### ❌ Configuration Error:
```
⚠️ Supabase is not configured! Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.
```
**Action**: Check Vercel environment variables (see below)

#### ❌ Supabase Error:
```
Password reset error: { message: "..." }
```
**Action**: The error message will tell you what's wrong

#### ❌ Network Error:
```
Password reset exception: Failed to fetch
```
**Action**: Check Supabase URL and keys in Vercel

---

## 🔧 Most Likely Issues & Fixes

### Issue 1: Missing Environment Variables in Vercel

**Symptoms**: 
- "Load failed" error
- Console shows: "Supabase is not configured"

**Fix**:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your PostReady project
3. Go to **Settings** → **Environment Variables**
4. Verify these exist:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
5. If missing, add them
6. **Redeploy**: Deployments tab → ⋯ menu → Redeploy

### Issue 2: Wrong Supabase URL/Key

**Symptoms**:
- "Load failed" error
- Console shows: "Invalid API key" or "Project not found"

**Fix**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the correct values:
   - **Project URL** (starts with https://...supabase.co)
   - **anon public** key
5. Update in Vercel environment variables
6. Redeploy

### Issue 3: CORS or Network Issue

**Symptoms**:
- "Load failed" error
- Console shows: "Failed to fetch" or "Network error"

**Fix**:
1. Check Supabase project is active (not paused)
2. Verify Supabase URL is accessible:
   - Open: `https://your-project.supabase.co/rest/v1/`
   - Should show: "The page you are looking for could not be found" (this is normal)
   - Should NOT show: Connection timeout or DNS error
3. Check browser network tab for blocked requests

### Issue 4: Email Provider Not Configured

**Symptoms**:
- No "load failed" error
- Console shows: "Password reset email sent successfully"
- But email never arrives

**Fix**:
1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Verify "Reset Password" template is enabled
3. Check Supabase logs: **Authentication** → **Logs**
4. For production, configure SMTP (see PASSWORD_RESET_SETUP.md)

---

## 📊 Vercel Environment Variables Check

Your Vercel environment variables should look like this:

```
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SUPABASE_URL=https://sgxpynobjbqnfhnqpnre.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://postready.app
```

**Critical**: The `NEXT_PUBLIC_` prefix is required for browser-side access!

---

## 🔄 If You Need to Update Environment Variables

1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Update the variable
4. **Important**: Go to Deployments tab
5. Click ⋯ menu on latest deployment
6. Click **Redeploy**
7. Wait 2-3 minutes

**Note**: Just updating environment variables doesn't automatically redeploy!

---

## 🆘 Still Not Working?

### Check These:

1. **Supabase Project Status**
   - Go to Supabase Dashboard
   - Check if project is paused (free tier pauses after inactivity)
   - If paused, click "Resume"

2. **Browser Console Errors**
   - Any red errors in console?
   - Screenshot them and check the message

3. **Network Tab**
   - Open browser DevTools → Network tab
   - Try password reset
   - Look for failed requests (red)
   - Click on them to see error details

4. **Supabase Logs**
   - Go to Supabase Dashboard
   - Authentication → Logs
   - Check for errors when you try password reset

---

## 📝 Quick Test Script

Open browser console on https://postready.app and paste this:

```javascript
// Test Supabase connection
console.log('Testing Supabase...');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Try to get session (should work even if not logged in)
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  'YOUR_SUPABASE_URL_HERE',
  'YOUR_ANON_KEY_HERE'
);
const { data, error } = await supabase.auth.getSession();
console.log('Session test:', error ? 'ERROR: ' + error.message : 'SUCCESS');
```

Replace `YOUR_SUPABASE_URL_HERE` and `YOUR_ANON_KEY_HERE` with your actual values.

---

## ✅ Expected Behavior (When Working)

1. User enters email
2. Console shows: "Password reset email sent successfully"
3. UI shows: "Password reset email sent! Check your inbox."
4. Email arrives within 1-5 minutes
5. User clicks link → redirected to /reset-password
6. User sets new password → Success!

---

## 📞 Next Steps

1. **Wait for deployment** (2-3 minutes)
2. **Open browser console** (F12)
3. **Try password reset**
4. **Read console messages**
5. **Report back** what you see in the console

The console logs will tell us exactly what's wrong!

---

**Last Updated**: November 14, 2024

