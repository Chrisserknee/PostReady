-- Create user_profiles table for storing subscription info
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_pro BOOLEAN DEFAULT FALSE,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'creator')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_subscription ON user_profiles(stripe_subscription_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

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
  hashtag_count INTEGER DEFAULT 0,
  guide_ai_count INTEGER DEFAULT 0,
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

-- Create contact_messages table for support inquiries
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own messages
CREATE POLICY "Users can view their own messages"
  ON contact_messages FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Create policy for anyone to insert messages (for anonymous users)
CREATE POLICY "Anyone can insert contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- Create saved_video_ideas table for saving video ideas
CREATE TABLE IF NOT EXISTS saved_video_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_info JSONB NOT NULL,
  video_idea JSONB NOT NULL,
  strategy_id UUID, -- Optional reference to strategy if available
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_video_ideas_user_id ON saved_video_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_video_ideas_saved_at ON saved_video_ideas(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_video_ideas_business_name ON saved_video_ideas(business_name);

-- Enable Row Level Security
ALTER TABLE saved_video_ideas ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own saved ideas
CREATE POLICY "Users can view their own saved ideas"
  ON saved_video_ideas FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own saved ideas
CREATE POLICY "Users can insert their own saved ideas"
  ON saved_video_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own saved ideas
CREATE POLICY "Users can delete their own saved ideas"
  ON saved_video_ideas FOR DELETE
  USING (auth.uid() = user_id);
