-- SQL script to create tables for user history and saved businesses
-- Run this in your Supabase SQL Editor

-- Table for saved businesses
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

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_businesses_user_id ON saved_businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_businesses_last_used ON saved_businesses(last_used DESC);

-- Enable Row Level Security
ALTER TABLE saved_businesses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own saved businesses
CREATE POLICY "Users can view their own saved businesses"
  ON saved_businesses FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved businesses
CREATE POLICY "Users can insert their own saved businesses"
  ON saved_businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own saved businesses
CREATE POLICY "Users can update their own saved businesses"
  ON saved_businesses FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own saved businesses
CREATE POLICY "Users can delete their own saved businesses"
  ON saved_businesses FOR DELETE
  USING (auth.uid() = user_id);

-- Table for post history
CREATE TABLE IF NOT EXISTS post_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  video_idea JSONB NOT NULL,
  post_details JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_post_history_user_id ON post_history(user_id);
CREATE INDEX IF NOT EXISTS idx_post_history_completed_at ON post_history(completed_at DESC);

-- Enable Row Level Security
ALTER TABLE post_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own post history
CREATE POLICY "Users can view their own post history"
  ON post_history FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own post history
CREATE POLICY "Users can insert their own post history"
  ON post_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own post history
CREATE POLICY "Users can delete their own post history"
  ON post_history FOR DELETE
  USING (auth.uid() = user_id);

