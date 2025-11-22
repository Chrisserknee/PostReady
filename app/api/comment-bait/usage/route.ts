import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { loadUserProgress } from '@/lib/userProgress';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let usageCount = 0;

    if (user) {
      // User is logged in - fetch from user_progress
      const { data: userProgress, error: progressError } = await loadUserProgress(user.id);
      if (!progressError && userProgress) {
        usageCount = userProgress.commentBaitCount ?? 0;
      } else if (progressError && progressError.code !== 'PGRST116') { // PGRST116 means no row found
        console.error('Error loading user progress for usage:', progressError);
      }
    } else {
      // User is NOT logged in - check cookie
      const usageCookie = request.cookies.get('cb_usage');
      usageCount = usageCookie ? parseInt(usageCookie.value) : 0;
    }

    return NextResponse.json({
      usageCount,
      limit: 1,
      isLoggedIn: !!user
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

