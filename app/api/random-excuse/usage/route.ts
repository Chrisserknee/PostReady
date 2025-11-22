import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth-utils';
import { loadUserProgress } from '@/lib/userProgress';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    let usageCount = 0;
    const FREE_LIMIT = 1;

    if (user) {
      const { data: userProgress } = await loadUserProgress(user.id);
      usageCount = userProgress?.randomExcuseCount ?? 0;
    } else {
      const usageCookie = request.cookies.get('re_usage');
      usageCount = usageCookie ? parseInt(usageCookie.value) : 0;
    }

    return NextResponse.json({
      usageCount,
      limit: FREE_LIMIT,
      remaining: Math.max(0, FREE_LIMIT - usageCount),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch usage', details: error.message },
      { status: 500 }
    );
  }
}

