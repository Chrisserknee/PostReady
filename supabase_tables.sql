-- Create saved_businesses table
CREATE TABLE IF NOT EXISTS saved_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_info JSONB NOT NULL,
  strategy JSONB NOT NULL,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, business_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_businesses_user_id ON saved_businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_businesses_last_used ON saved_businesses(last_used DESC);

-- Enable Row Level Security
ALTER TABLE saved_businesses ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own businesses
CREATE POLICY "Users can view their own businesses"
  ON saved_businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own businesses"
  ON saved_businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own businesses"
  ON saved_businesses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own businesses"
  ON saved_businesses FOR DELETE
  USING (auth.uid() = user_id);

-- Create post_history table
CREATE TABLE IF NOT EXISTS post_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  video_idea JSONB NOT NULL,
  post_details JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_post_history_user_id ON post_history(user_id);
CREATE INDEX IF NOT EXISTS idx_post_history_completed_at ON post_history(completed_at DESC);

-- Enable Row Level Security
ALTER TABLE post_history ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own post history
CREATE POLICY "Users can view their own post history"
  ON post_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own post history"
  ON post_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post history"
  ON post_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create user_progress table for storing workflow state and usage limits
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_info JSONB,
  strategy JSONB,
  selected_idea JSONB,
  post_details JSONB,
  current_step TEXT DEFAULT 'form',
  generate_ideas_count INTEGER DEFAULT 0,
  rewrite_count INTEGER DEFAULT 0,
  regenerate_count INTEGER DEFAULT 0,
  reword_title_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- Enable Row Level Security
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own progress
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON user_progress FOR DELETE
  USING (auth.uid() = user_id);
