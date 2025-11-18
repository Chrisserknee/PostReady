-- Create table for page analyses
CREATE TABLE IF NOT EXISTS page_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  full_name TEXT,
  bio_links TEXT,
  follower_count TEXT,
  post_count TEXT,
  social_link TEXT,
  analysis_text TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_page_analyses_user_id ON page_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_page_analyses_created_at ON page_analyses(created_at);

-- Enable Row Level Security
ALTER TABLE page_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies (only service role can access - admin only)
CREATE POLICY "Allow service role full access" ON page_analyses
  FOR ALL USING (true);

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('page-screenshots', 'page-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (only service role can access - admin only)
CREATE POLICY "Service role can upload screenshots" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'page-screenshots');

CREATE POLICY "Service role can read screenshots" ON storage.objects
  FOR SELECT USING (bucket_id = 'page-screenshots');

CREATE POLICY "Service role can delete screenshots" ON storage.objects
  FOR DELETE USING (bucket_id = 'page-screenshots');

