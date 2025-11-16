import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Add profile to directory
export async function POST(request: NextRequest) {
  try {
    console.log('📝 Adding profile to collab directory');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📦 Request body:', body);
    
    const {
      tiktok_username,
      display_name,
      niche,
      follower_count,
      follower_range,
      content_focus,
      bio,
      instagram_username,
      youtube_username,
      email_for_collabs
    } = body;
    
    console.log('📊 Parsed data:', {
      tiktok_username,
      niche,
      follower_count,
      follower_range,
      has_email: !!email_for_collabs
    });

    // Check if user already has a profile
    const { data: existing } = await supabase
      .from('collab_directory')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (existing) {
      // Update existing profile
      const { data, error } = await supabase
        .from('collab_directory')
        .update({
          tiktok_username,
          display_name,
          niche,
          follower_count,
          follower_range,
          content_focus,
          bio,
          instagram_username,
          youtube_username,
          email_for_collabs,
          looking_for_collab: true,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('✅ Profile updated');
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('collab_directory')
        .insert({
          user_id: user.id,
          tiktok_username,
          display_name,
          niche,
          follower_count,
          follower_range,
          content_focus,
          bio,
          instagram_username,
          youtube_username,
          email_for_collabs,
          looking_for_collab: true,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('✅ Profile created');
    }

    return NextResponse.json(
      { success: true, profile: result },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error: any) {
    console.error('❌ Collab directory error:', {
      message: error.message,
      details: error,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Failed to save profile', details: error.message, fullError: String(error) },
      { status: 500 }
    );
  }
}

// Get user's own profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    const { data: profile } = await supabase
      .from('collab_directory')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json(
      { profile },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error: any) {
    console.error('❌ Get profile error:', error);
    return NextResponse.json(
      { profile: null },
      { status: 200 }
    );
  }
}

