-- Add comment_bait_count column to user_progress table
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS comment_bait_count INTEGER DEFAULT 0;

