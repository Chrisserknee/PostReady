import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Create a server-side Supabase client with cookies for authentication
 */
function createServerSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Extract access token from cookies or Authorization header
  // Supabase stores tokens in cookies with various names depending on version
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies: Record<string, string> = {};
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });

  // Try to find Supabase access token in cookies
  const accessToken = cookies['sb-access-token'] || 
                      cookies['supabase-auth-token'] ||
                      cookies[`sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`] ||
                      request.headers.get('authorization')?.replace('Bearer ', '');

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`,
      } : {},
    },
  });

  return client;
}

/**
 * Verify that a user is authenticated
 */
export async function verifyAuth(request: NextRequest): Promise<{ userId: string | null; error: string | null }> {
  try {
    const supabase = createServerSupabaseClient(request);
    
    // Try to get user from session
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { userId: null, error: 'Unauthorized' };
    }

    return { userId: user.id, error: null };
  } catch (error) {
    return { userId: null, error: 'Authentication failed' };
  }
}

/**
 * Verify that a userId matches the authenticated user
 * SECURITY: This prevents users from accessing other users' data
 * 
 * IMPORTANT: This function MUST be called before any operation that accesses user-specific data
 * to prevent unauthorized access to other users' payment information, subscriptions, etc.
 */
export async function verifyUserOwnership(request: NextRequest, targetUserId: string): Promise<boolean> {
  try {
    // Sanitize targetUserId to prevent injection
    const sanitizedTargetId = String(targetUserId).trim().substring(0, 100);
    
    // Verify user is authenticated
    const { userId, error } = await verifyAuth(request);
    
    if (error || !userId) {
      return false;
    }

    // Strict comparison to prevent any bypass attempts
    // This ensures users can only access their own resources
    return userId === sanitizedTargetId;
  } catch (error) {
    // Fail securely - if anything goes wrong, deny access
    return false;
  }
}

