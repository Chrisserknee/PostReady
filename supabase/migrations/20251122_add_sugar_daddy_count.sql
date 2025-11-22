-- Add sugar_daddy_count to user_progress table
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS sugar_daddy_count INTEGER DEFAULT 0;

