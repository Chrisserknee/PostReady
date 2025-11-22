-- ============================================
-- PostReady Database Migrations
-- Run these in your Supabase SQL Editor
-- ============================================

-- Migration 1: Add Trend Radar usage tracking
-- ============================================
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS trend_radar_count INTEGER DEFAULT 0;

COMMENT ON COLUMN user_progress.trend_radar_count IS 'Number of times the user has used the Trend Radar tool';

-- Migration 2: Add new tools usage tracking columns
-- ============================================
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS red_flag_translator_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cringe_couple_caption_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_fight_starter_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS poor_life_choices_advisor_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS random_excuse_count INTEGER DEFAULT 0;

-- Add comments explaining the columns
COMMENT ON COLUMN user_progress.red_flag_translator_count IS 'Number of times the user has used the Red Flag Translator tool';
COMMENT ON COLUMN user_progress.cringe_couple_caption_count IS 'Number of times the user has used the Cringe Couple Caption Generator tool';
COMMENT ON COLUMN user_progress.comment_fight_starter_count IS 'Number of times the user has used the Comment Fight Starter Generator tool';
COMMENT ON COLUMN user_progress.poor_life_choices_advisor_count IS 'Number of times the user has used the Poor Life Choices Advisor tool';
COMMENT ON COLUMN user_progress.random_excuse_count IS 'Number of times the user has used the Random Excuse Generator tool';

-- ============================================
-- Verify the columns were added:
-- ============================================
-- Run this to check:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_progress' 
-- AND column_name IN (
--   'trend_radar_count',
--   'red_flag_translator_count',
--   'cringe_couple_caption_count',
--   'comment_fight_starter_count',
--   'poor_life_choices_advisor_count',
--   'random_excuse_count'
-- );

