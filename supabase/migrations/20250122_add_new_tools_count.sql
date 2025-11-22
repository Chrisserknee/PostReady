-- Add columns for new tools to user_progress table
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

