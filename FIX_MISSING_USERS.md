# Fix Missing User Profiles

## 🚨 **The Problem**
Users are signing up successfully, but their profiles aren't showing in the `user_profiles` table. They exist in `auth.users` but not in `user_profiles`.

---

## ✅ **The Fix - Run This SQL**

### **Step 1: Go to Supabase SQL Editor**
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your PostReady project
3. Click **SQL Editor** (left sidebar)
4. Click **New query**

### **Step 2: Copy and Run This SQL**

Open the file `supabase-migrations/create-profile-trigger.sql` and copy ALL the SQL code.

Paste it into the SQL Editor and click **Run**.

This will:
- ✅ Create a trigger to auto-create profiles for ALL new signups
- ✅ Sync all existing auth users to user_profiles
- ✅ Show you how many users were synced

---

## 📊 **What You'll See**

After running the SQL, you should see a result like:

| total_auth_users | total_profiles | newly_created |
|------------------|----------------|---------------|
| 15               | 15             | 14            |

This means:
- **total_auth_users**: How many users signed up
- **total_profiles**: How many profiles now exist
- **newly_created**: How many were just created by the migration

---

## ✅ **Verify It Worked**

1. Go back to **Table Editor** → **user_profiles**
2. You should now see ALL your users
3. Check that the count matches your auth.users count

---

## 🎯 **Upgrade Your Account to Pro**

If you're the user `siandyhouse@gmail.com` (the one visible in the screenshot):

1. In **Table Editor** → **user_profiles**
2. Find your row
3. Click the **pencil icon** to edit
4. Change `is_pro` from `FALSE` to `TRUE`
5. Click **Save**
6. Refresh https://postready.app

---

## 🔮 **Future Signups**

Going forward, the trigger will automatically create a profile for every new user signup. No more missing profiles!

---

## 🔍 **Check How Many Users You Actually Have**

Run this query to see the real count:

```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM public.user_profiles) as profile_users,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.user_profiles) as missing_profiles;
```

If `missing_profiles` is > 0, run the migration again!

