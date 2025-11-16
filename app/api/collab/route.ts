import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Helper function to parse follower range string into min/max numbers
function parseFollowerRange(range: string): { min: number; max: number } {
  // Handle formats like "10,000-25,000" or "500-1,000" or "5M+" 
  const cleaned = range.replace(/,/g, '');
  
  if (cleaned.includes('+')) {
    const base = parseFloat(cleaned);
    return { min: base * (cleaned.includes('M') ? 1000000 : cleaned.includes('K') ? 1000 : 1), max: 999999999 };
  }
  
  const parts = cleaned.split('-');
  if (parts.length !== 2) return { min: 0, max: 999999999 };
  
  const parseValue = (val: string) => {
    const num = parseFloat(val);
    if (val.includes('M')) return num * 1000000;
    if (val.includes('K')) return num * 1000;
    return num;
  };
  
  return { min: parseValue(parts[0]), max: parseValue(parts[1]) };
}

// Helper to format follower count
function formatFollowerCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace('.0', '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace('.0', '') + 'K';
  }
  return count.toString();
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤝 Collab Engine API called');
    
    const { username, niche, followerCount } = await request.json();
    
    console.log('📥 Request data:', { username, niche, followerCount });

    if (!username) {
      return NextResponse.json(
        { error: 'Missing required field: username' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle follower count as a single number or range
    let searchMin: number, searchMax: number;
    
    if (typeof followerCount === 'number' || !followerCount.includes('-')) {
      // Single number provided - create a wide range (±75% for better matching)
      const count = typeof followerCount === 'number' ? followerCount : parseInt(followerCount.toString().replace(/,/g, ''));
      searchMin = Math.floor(count * 0.25); // Search from 25% of the value
      searchMax = Math.ceil(count * 2);      // Up to 200% of the value
    } else {
      // Range provided - parse it with wider tolerance
      const { min, max } = parseFollowerRange(followerCount || '10,000-25,000');
      searchMin = Math.floor(min * 0.25);
      searchMax = Math.ceil(max * 2);
    }

    console.log(`🔍 Searching for collaborators with ${searchMin.toLocaleString()}-${searchMax.toLocaleString()} followers in niche: ${niche}`);

    // Query the database for matching profiles
    let query = supabase
      .from('collab_directory')
      .select('*')
      .eq('looking_for_collab', true)
      .gte('follower_count', searchMin)
      .lte('follower_count', searchMax)
      .limit(20); // Get more than needed so we can filter

    // If niche is provided, prioritize matching niche
    if (niche && niche.trim()) {
      query = query.ilike('niche', `%${niche}%`);
    }

    const { data: matches, error } = await query;

    if (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }

    console.log(`✅ Found ${matches?.length || 0} matches in database`);

    // Transform database results into the expected format
    const collaborators = (matches || []).map((profile: any) => ({
      username: profile.tiktok_username,
      displayName: profile.display_name,
      followerCount: profile.follower_count,
      niche: profile.niche,
      contentFocus: profile.content_focus,
      bio: profile.bio,
      whyPerfect: profile.bio || `Active ${profile.niche} creator with ${formatFollowerCount(profile.follower_count)} followers looking for collaborations`,
      collabIdea: `Create engaging ${profile.niche} content together that combines both of your unique styles and reaches both audiences`,
      dm: `Hey! I'm @${username} and I love your ${profile.content_focus || profile.niche} content! I think our styles would complement each other really well. Would you be interested in collaborating on a video together? 🎥`,
      isRealUser: true,
      instagram: profile.instagram_username,
      youtube: profile.youtube_username,
      email: profile.email_for_collabs,
      verified: profile.verified
    }));

    // Return real users only (no AI fallback)
    return NextResponse.json(
      { 
        collaborators: collaborators.slice(0, 6), 
        timestamp: new Date().toISOString(),
        source: 'database',
        totalInNetwork: collaborators.length
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );

  } catch (error: any) {
    console.error('❌ Collab Engine API error:', {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: 'Failed to find collaborators', details: error.message },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}
