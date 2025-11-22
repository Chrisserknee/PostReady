import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { loadUserProgress } from '@/lib/userProgress';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let usageCount = 0;

    if (user) {
      // User is logged in - check user_progress table
      const { data: progress } = await loadUserProgress(user.id);
      usageCount = progress?.sugarDaddyCount || 0;
    } else {
      // User is NOT logged in - check cookie
      const usageCookie = request.cookies.get('sd_usage');
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
