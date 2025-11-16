import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-loaded Supabase client
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    // During build, use dummy values if env vars are missing
    // This allows the build to succeed, but will fail at runtime if not configured
    const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
    const finalKey = supabaseAnonKey || 'placeholder-anon-key';
    
    // Warn in browser if using placeholder values
    if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
      console.error('⚠️ Supabase is not configured! Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    }
    
    supabaseInstance = createClient(finalUrl, finalKey, {
      auth: {
        persistSession: typeof window !== 'undefined', // Only persist on client
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'postready-auth-token',
        flowType: 'pkce', // More secure and mobile-friendly
      }
    });
  }
  return supabaseInstance;
};

// Export for backwards compatibility - use Proxy for lazy initialization
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  }
});

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

