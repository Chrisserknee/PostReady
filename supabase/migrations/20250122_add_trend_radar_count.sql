-- Add trend_radar_count column to user_progress table
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS trend_radar_count INTEGER DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN user_progress.trend_radar_count IS 'Number of times the user has used the Trend Radar tool';

