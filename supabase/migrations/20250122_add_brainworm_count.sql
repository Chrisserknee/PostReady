-- Add brainworm_count column to user_progress table
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS brainworm_count INTEGER DEFAULT 0;

