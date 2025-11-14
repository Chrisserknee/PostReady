# Supabase History Tables Setup

## Overview
This guide will help you set up the database tables needed for **My Businesses** and **History** features in PostReady.

---

## 📋 What These Tables Do

### 1. **`saved_businesses`** Table
- Stores businesses that users have researched
- Allows quick access to previously researched businesses
- Automatically updates `last_used` timestamp when accessed

### 2. **`post_history`** Table
- Stores completed posts (video ideas + captions)
- Shows users their past work
- Helps users track what they've created

---

## 🚀 Setup Instructions

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project (the one you created for PostReady)
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Run the SQL Script

1. Open the file `supabase_tables.sql` in this project
2. Copy the entire contents
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)

You should see a success message: **"Success. No rows returned"**

### Step 3: Verify Tables Were Created

1. Click on **"Table Editor"** in the left sidebar
2. You should now see two new tables:
   - `saved_businesses`
   - `post_history`

---

## ✅ What Was Created

### `saved_businesses` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `user_id` | UUID | References the authenticated user |
| `business_name` | TEXT | Name of the business |
| `business_info` | JSONB | Full business information |
| `strategy` | JSONB | Generated strategy and content ideas |
| `last_used` | TIMESTAMP | When this business was last accessed |
| `created_at` | TIMESTAMP | When this business was first saved |

### `post_history` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `user_id` | UUID | References the authenticated user |
| `business_name` | TEXT | Name of the business |
| `video_idea` | JSONB | The selected video idea |
| `post_details` | JSONB | Generated post (title, caption, hashtags) |
| `completed_at` | TIMESTAMP | When this post was completed |
| `created_at` | TIMESTAMP | When this record was created |

---

## 🔒 Security (Row Level Security)

Both tables have **Row Level Security (RLS)** enabled, which means:
- ✅ Users can only see their own data
- ✅ Users can only create/update/delete their own data
- ✅ No user can access another user's businesses or post history

This is automatically enforced by Supabase!

---

## 🧪 Testing

After running the SQL script, test the features:

1. **Sign in** to PostReady
2. **Research a business** (e.g., "Joe's Pizza" in "New York, NY")
3. **Complete a post** (generate a caption)
4. Click **"My Businesses"** in the header
   - You should see "Joe's Pizza" listed
5. Click **"History"** in the header
   - You should see your completed post

---

## 🐛 Troubleshooting

### Issue: "permission denied for table saved_businesses"
**Solution:** Make sure you ran the entire SQL script, including the RLS policies.

### Issue: Tables don't appear in Table Editor
**Solution:** Refresh the page or click on "Database" → "Tables" to see all tables.

### Issue: Data isn't saving
**Solution:** 
1. Check browser console for errors (F12)
2. Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct in `.env.local`
3. Make sure you're signed in as a user

---

## 📝 Notes

- The `UNIQUE(user_id, business_name)` constraint on `saved_businesses` means each user can only have one saved entry per business name
- If a user researches the same business again, it will update the existing entry with the new strategy
- Post history allows unlimited entries (no unique constraint)

---

## 🎉 You're Done!

Your PostReady app now has full history and saved businesses functionality!

Users can:
- ✅ Save researched businesses for quick access
- ✅ View their post history
- ✅ Reload previous businesses to generate more content
- ✅ Track all their completed posts

---

## Need Help?

If you encounter any issues:
1. Check the browser console (F12) for errors
2. Check the Supabase logs in your dashboard
3. Verify all environment variables are set correctly


