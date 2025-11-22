import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, verifyProAccess } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const debug: any = {
      timestamp: new Date().toISOString(),
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
    };

    if (user) {
      // Check profile directly
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_pro, plan_type')
        .eq('id', user.id)
        .maybeSingle();

      debug.profile = {
        exists: !!profile,
        is_pro: profile?.is_pro,
        is_pro_type: typeof profile?.is_pro,
        plan_type: profile?.plan_type,
        error: profileError?.message,
      };

      // Check with verifyProAccess
      const proCheck = await verifyProAccess(request);
      debug.verifyProAccess = proCheck;
    }

    return NextResponse.json(debug, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

