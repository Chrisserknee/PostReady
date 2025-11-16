-- Create table for storing user module order preferences
CREATE TABLE IF NOT EXISTS public.user_module_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_module_order ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own module order
CREATE POLICY "Users can view own module order"
  ON public.user_module_order
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own module order
CREATE POLICY "Users can insert own module order"
  ON public.user_module_order
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own module order
CREATE POLICY "Users can update own module order"
  ON public.user_module_order
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_module_order_user_id ON public.user_module_order(user_id);

-- Add comment
COMMENT ON TABLE public.user_module_order IS 'Stores user preferences for module ordering on the homepage';

