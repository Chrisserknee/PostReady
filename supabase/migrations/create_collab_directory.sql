-- Create collab_directory table for user-powered collaboration network
CREATE TABLE IF NOT EXISTS collab_directory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tiktok_username TEXT NOT NULL,
  display_name TEXT,
  niche TEXT NOT NULL,
  follower_count INTEGER NOT NULL,
  follower_range TEXT NOT NULL, -- e.g., "10,000-25,000"
  content_focus TEXT,
  bio TEXT,
  looking_for_collab BOOLEAN DEFAULT true,
  instagram_username TEXT,
  youtube_username TEXT,
  email_for_collabs TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX idx_collab_directory_niche ON collab_directory(niche);
CREATE INDEX idx_collab_directory_follower_count ON collab_directory(follower_count);
CREATE INDEX idx_collab_directory_user_id ON collab_directory(user_id);
CREATE INDEX idx_collab_directory_looking_for_collab ON collab_directory(looking_for_collab);

-- Enable Row Level Security
ALTER TABLE collab_directory ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read profiles that are looking for collabs
CREATE POLICY "Anyone can view active collab profiles"
  ON collab_directory
  FOR SELECT
  USING (looking_for_collab = true);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can create their own collab profile"
  ON collab_directory
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own collab profile"
  ON collab_directory
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete their own collab profile"
  ON collab_directory
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collab_directory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_collab_directory_updated_at
  BEFORE UPDATE ON collab_directory
  FOR EACH ROW
  EXECUTE FUNCTION update_collab_directory_updated_at();


