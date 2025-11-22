import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth-utils';
import { loadUserProgress } from '@/lib/userProgress';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let usageCount = 0;
    const FREE_LIMIT = 1;

    if (user) {
      // User is logged in - check user_progress table
      const { data: userProgress, error: progressError } = await loadUserProgress(user.id);
      if (progressError) {
        console.error('Error loading user progress:', progressError);
      }
      usageCount = userProgress?.trendRadarCount ?? 0;
    } else {
      // User is NOT logged in - check cookie usage
      const usageCookie = request.cookies.get('tr_usage');
      usageCount = usageCookie ? parseInt(usageCookie.value) : 0;
    }

    return NextResponse.json({
      usageCount,
      limit: FREE_LIMIT,
      remaining: Math.max(0, FREE_LIMIT - usageCount),
    });
  } catch (error: any) {
    console.error('Error fetching trend radar usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage', details: error.message },
      { status: 500 }
    );
  }
}

