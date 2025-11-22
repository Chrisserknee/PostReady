import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

/**
 * Create a server-side Supabase client with cookies for authentication
 * Uses @supabase/ssr for proper cookie handling in API routes
 * Also supports Authorization header for token-based auth
 */
export function createServerSupabaseClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Check for Authorization header first (from frontend fetch with Bearer token)
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '');

  // If we have an access token from Authorization header, use regular client with token
  if (accessToken) {
    console.log('🔑 createServerSupabaseClient: Using Authorization header token');
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }

  // Otherwise, use SSR client for cookie-based auth
  // Parse cookies from request
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies: Record<string, string> = {};
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name.trim()] = decodeURIComponent(value.trim());
    }
  });
  
  // Create Supabase client using SSR package which properly handles cookies
  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Return cookies in the format Supabase expects
        return Object.entries(cookies).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        // In API routes, cookies are managed by the response object
        // This is a no-op here as we handle cookies via NextResponse in the route handlers
        cookiesToSet.forEach(({ name, value }) => {
          // Store for potential use, but actual setting happens in route handlers
          cookies[name] = value;
        });
      },
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

/**
 * Verify that the authenticated user has Pro subscription
 * SECURITY: This prevents non-Pro users from accessing Pro features
 * 
 * @param request - NextRequest object (optional if supabaseClient is provided)
 * @param supabaseClient - Optional Supabase client to reuse (prevents session issues)
 * @returns { isPro: boolean, userId: string | null, error: string | null }
 */
export async function verifyProAccess(
  request?: NextRequest,
  supabaseClient?: ReturnType<typeof createServerSupabaseClient>
): Promise<{ 
  isPro: boolean; 
  userId: string | null; 
  error: string | null 
}> {
  try {
    // Use provided client or create new one
    const supabase = supabaseClient || (request ? createServerSupabaseClient(request) : null);
    
    if (!supabase) {
      return {
        isPro: false,
        userId: null,
        error: 'No Supabase client available'
      };
    }
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🔍 verifyProAccess: User check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    });
    
    if (authError || !user) {
      console.log('❌ verifyProAccess: No user found or auth error');
      return { 
        isPro: false, 
        userId: null, 
        error: 'Authentication required. Please sign in to access this feature.' 
      };
    }

    // Get user profile to check Pro status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_pro, plan_type')
      .eq('id', user.id)
      .maybeSingle();

    console.log('🔍 verifyProAccess: Profile check:', { 
      hasProfile: !!profile, 
      is_pro: profile?.is_pro, 
      plan_type: profile?.plan_type,
      profileError: profileError?.message 
    });

    if (profileError) {
      console.error('❌ verifyProAccess: Error fetching user profile:', profileError);
      return { 
        isPro: false, 
        userId: user.id, 
        error: 'Failed to verify subscription status' 
      };
    }

    // Check if user has Pro access - handle all possible formats
    const isProValue = profile?.is_pro;
    const isPro = isProValue === true || 
                  isProValue === 'true' || 
                  isProValue === 1 || 
                  isProValue === '1' ||
                  String(isProValue).toLowerCase() === 'true';
    
    console.log('✅ verifyProAccess: Final result:', { 
      userId: user.id, 
      isPro, 
      is_pro_value: isProValue,
      is_pro_type: typeof isProValue,
      plan_type: profile?.plan_type
    });
    
    if (!isPro) {
      return { 
        isPro: false, 
        userId: user.id, 
        error: 'This feature requires a Pro subscription. Please upgrade to continue.' 
      };
    }

    return { isPro: true, userId: user.id, error: null };
  } catch (error) {
    console.error('❌ verifyProAccess: Exception:', error);
    return { 
      isPro: false, 
      userId: null, 
      error: 'Failed to verify subscription status' 
    };
  }
}
