-- Allow unauthenticated collab signups for development
-- This migration adds support for profiles without user_id (guest profiles)

-- Add unique constraint on email for guest profiles (where user_id is null)
-- This prevents duplicate email entries for unauthenticated users
CREATE UNIQUE INDEX idx_collab_directory_guest_email 
  ON collab_directory(email_for_collabs) 
  WHERE user_id IS NULL;

-- Make email_for_collabs required (cannot be null)
ALTER TABLE collab_directory 
  ALTER COLUMN email_for_collabs SET NOT NULL;

-- Add policy to allow service role to insert/update any profile
-- (Service role bypasses RLS, but adding this for clarity)
-- In production, you should restrict this based on your needs

-- Add comment to document the development feature
COMMENT ON COLUMN collab_directory.user_id IS 'User ID from auth.users. Can be NULL for guest profiles in development mode.';
COMMENT ON COLUMN collab_directory.email_for_collabs IS 'Required email for collaboration contact. Serves as unique identifier for guest profiles.';

