-- Add Stripe-related fields to user_profiles table
-- Run this in your Supabase SQL editor

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer 
ON user_profiles(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_subscription 
ON user_profiles(stripe_subscription_id);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.stripe_customer_id IS 'Stripe customer ID for this user';
COMMENT ON COLUMN user_profiles.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN user_profiles.upgraded_at IS 'Timestamp when user first upgraded to Pro';

