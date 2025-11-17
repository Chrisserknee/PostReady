-- =====================================================
-- AUTO-CREATE USER PROFILES ON SIGNUP
-- =====================================================
-- This trigger automatically creates a user_profiles record
-- whenever a new user signs up in auth.users
-- Run this in your Supabase SQL Editor

-- First, create the function that will create the profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, is_pro, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists (to avoid errors on re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that fires when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SYNC EXISTING USERS (One-time migration)
-- =====================================================
-- This will create profiles for any existing auth users
-- who don't have profiles yet

INSERT INTO public.user_profiles (id, email, is_pro, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  false,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Show how many profiles were created
SELECT 
  COUNT(*) as total_auth_users,
  (SELECT COUNT(*) FROM public.user_profiles) as total_profiles,
  COUNT(*) - (SELECT COUNT(*) FROM public.user_profiles) as newly_created
FROM auth.users;

