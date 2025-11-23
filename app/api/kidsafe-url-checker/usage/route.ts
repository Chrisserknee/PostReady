import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth-utils';
import { loadUserProgress } from '@/lib/userProgress';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: userProgress } = await loadUserProgress(user.id);
      const usageCount = userProgress?.kidsafeUrlCheckerCount ?? 0;
      
      return NextResponse.json({
        usageCount,
        limit: 1
      });
    } else {
      const usageCookie = request.cookies.get('ksuc_usage');
      const usageCount = usageCookie ? parseInt(usageCookie.value) || 0 : 0;
      
      return NextResponse.json({
        usageCount,
        limit: 1
      });
    }
  } catch (error: any) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}

