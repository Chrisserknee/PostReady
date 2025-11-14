# Supabase Setup Instructions

This guide will help you set up Supabase for PostReady authentication and user progress storage.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up (it's free!)
3. Create a new project
   - Choose a project name (e.g., "postready")
   - Set a strong database password (save this!)
   - Select a region close to you
   - Click "Create new project"

## Step 2: Get Your API Keys

1. Once your project is created, go to **Settings** (gear icon in sidebar)
2. Click on **API** in the left menu
3. You'll see two important values:
   - **Project URL** (starts with https://...supabase.co)
   - **anon public** key (under "Project API keys")
4. Copy these values

## Step 3: Add Environment Variables

1. Open your `.env.local` file in the `social-manager` folder
2. Add these lines (replace with your actual values):

```
OPENAI_API_KEY=your_existing_openai_key

NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** Keep the `NEXT_PUBLIC_` prefix! This tells Next.js these values are safe to use in the browser.

## Step 4: Create Database Tables

1. In Supabase, go to **SQL Editor** (in the left sidebar)
2. Click **New Query**
3. Copy and paste this SQL code:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create user_progress table
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_info JSONB,
  strategy JSONB,
  selected_idea JSONB,
  post_details JSONB,
  current_step TEXT DEFAULT 'form',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for user_progress
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON user_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
```

4. Click **Run** (or press F5)
5. You should see "Success. No rows returned" - this means it worked!

## Step 5: Configure Email Settings (Optional but Recommended)

By default, Supabase sends email confirmations when users sign up.

### For Testing (Disable Email Confirmation):
1. Go to **Authentication** → **Providers** → **Email**
2. Toggle OFF "Confirm email"
3. Click Save

### For Production (Use Real Emails):
1. Go to **Authentication** → **Email Templates**
2. Customize your signup confirmation email
3. Configure SMTP settings in **Settings** → **Auth** → **SMTP Settings**

## Step 6: Test Your Setup

1. Restart your Next.js development server:
```bash
npm run dev
```

2. Open http://localhost:3000
3. Click "Sign Up" in the top-right corner
4. Create a test account
5. Sign in and test the app!

## Troubleshooting

### "Invalid API key" error:
- Double-check your `.env.local` file has the correct keys
- Make sure you have `NEXT_PUBLIC_` prefix on both Supabase variables
- Restart your dev server after adding env variables

### "Failed to create user profile" error:
- Make sure you ran the SQL script in Step 4
- Check that Row Level Security policies were created
- Check the Supabase logs in **Database** → **Logs**

### Users can sign up but can't save progress:
- Verify the `user_progress` table was created
- Check that RLS policies exist for `user_progress`
- Look at browser console for specific errors

## Features Now Available

✅ **User Sign Up & Sign In** - Users can create accounts
✅ **Progress Saving** - Work is automatically saved
✅ **Resume Where You Left Off** - Users can close the browser and come back
✅ **Upgrade to Pro** - Users can unlock Pro features
✅ **User Sessions** - Secure authentication with Supabase

## Next Steps

- Customize email templates in Supabase
- Add payment processing (Stripe) for actual Pro subscriptions
- Add user profile settings page
- Implement password reset functionality

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- PostReady GitHub Issues: [your-repo-url]


