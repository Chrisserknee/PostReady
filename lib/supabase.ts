import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type UserProfile = {
  id: string;
  email: string;
  is_pro: boolean;
  created_at: string;
  updated_at: string;
};

export type UserProgress = {
  id: string;
  user_id: string;
  business_info: any;
  strategy: any;
  selected_idea: any;
  post_details: any;
  current_step: string;
  created_at: string;
  updated_at: string;
};

