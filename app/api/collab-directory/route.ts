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
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    const authHeader = request.headers.get('authorization');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let user = null;

    // Try to authenticate if header is provided
    if (authHeader) {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      
      if (!authError && authUser) {
        user = authUser;
      }
    }

    // In development, allow unauthenticated submissions
    if (!isDevelopment && !user) {
      return NextResponse.json(
        { error: 'Authentication required in production mode' },
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
      has_email: !!email_for_collabs,
      authenticated: !!user
    });

    // Validate required fields
    if (!email_for_collabs) {
      return NextResponse.json(
        { error: 'Email is required for collaboration contact' },
        { status: 400 }
      );
    }

    // Check if profile already exists (by user_id if authenticated, or by email if not)
    let existingQuery = supabase.from('collab_directory').select('id');
    
    if (user) {
      existingQuery = existingQuery.eq('user_id', user.id);
    } else {
      // In development, use email as unique identifier
      existingQuery = existingQuery.eq('email_for_collabs', email_for_collabs).is('user_id', null);
    }
    
    const { data: existing } = await existingQuery.single();

    let result;
    const profileData = {
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
    };

    if (existing) {
      // Update existing profile
      let updateQuery = supabase
        .from('collab_directory')
        .update(profileData);
      
      if (user) {
        updateQuery = updateQuery.eq('user_id', user.id);
      } else {
        updateQuery = updateQuery.eq('email_for_collabs', email_for_collabs).is('user_id', null);
      }
      
      const { data, error } = await updateQuery.select().single();

      if (error) throw error;
      result = data;
      console.log('✅ Profile updated');
    } else {
      // Create new profile
      const insertData = user 
        ? { ...profileData, user_id: user.id }
        : profileData;
      
      const { data, error } = await supabase
        .from('collab_directory')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('✅ Profile created (authenticated:', !!user, ')');
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
    console.log('🔍 GET /api/collab-directory called');
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ No auth header provided');
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.log('❌ Auth error or no user:', authError?.message);
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    console.log('✅ User authenticated:', user.id, 'Email:', user.email);
    console.log('🔎 Querying collab_directory for user_id:', user.id);

    let { data: profile, error: queryError } = await supabase
      .from('collab_directory')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (queryError) {
      console.log('⚠️ Query error:', queryError);
    }

    // If no profile found by user_id, check if there's an unlinked profile with this email
    if (!profile && user.email) {
      console.log('\n' + '='.repeat(70));
      console.log('🔗 ATTEMPTING TO LINK UNLINKED PROFILE');
      console.log('User Email:', user.email);
      console.log('User ID:', user.id);
      console.log('='.repeat(70));
      
      const { data: unlinkedProfiles, error: unlinkedError } = await supabase
        .from('collab_directory')
        .select('*')
        .eq('email_for_collabs', user.email)
        .is('user_id', null)
        .order('created_at', { ascending: false });

      if (unlinkedError) {
        console.error('❌ Error querying unlinked profiles:', unlinkedError);
      }

      console.log('📊 Query Results:');
      console.log('  - Unlinked profiles found:', unlinkedProfiles?.length || 0);
      if (unlinkedProfiles && unlinkedProfiles.length > 0) {
        unlinkedProfiles.forEach((p, i) => {
          console.log(`  - Profile ${i + 1}:`, {
            id: p.id,
            tiktok: p.tiktok_username,
            email: p.email_for_collabs,
            user_id: p.user_id,
            created: p.created_at
          });
        });
      }

      if (unlinkedProfiles && unlinkedProfiles.length > 0) {
        // Take the most recent unlinked profile
        const unlinkedProfile = unlinkedProfiles[0];
        console.log('\n🔧 LINKING PROFILE...');
        console.log('Profile ID:', unlinkedProfile.id);
        console.log('TikTok Username:', unlinkedProfile.tiktok_username);
        
        // Link the profile to the user
        const { data: updatedProfile, error: updateError } = await supabase
          .from('collab_directory')
          .update({ user_id: user.id })
          .eq('id', unlinkedProfile.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ UPDATE FAILED:', updateError);
          console.error('Error Code:', updateError.code);
          console.error('Error Message:', updateError.message);
          console.error('Error Details:', updateError.details);
          console.error('Error Hint:', updateError.hint);
        }

        if (!updateError && updatedProfile) {
          profile = updatedProfile;
          console.log('✅ PROFILE SUCCESSFULLY LINKED!');
          console.log('Linked Profile:', {
            id: updatedProfile.id,
            tiktok: updatedProfile.tiktok_username,
            user_id: updatedProfile.user_id,
            email: updatedProfile.email_for_collabs
          });
          
          // Delete any other unlinked profiles with the same email
          if (unlinkedProfiles.length > 1) {
            const otherIds = unlinkedProfiles.slice(1).map(p => p.id);
            console.log('🗑️ Cleaning up', otherIds.length, 'duplicate profiles');
            await supabase
              .from('collab_directory')
              .delete()
              .in('id', otherIds);
          }
        }
      } else {
        console.log('⚠️ NO UNLINKED PROFILES FOUND');
        console.log('Possible reasons:');
        console.log('  1. Profile was already linked');
        console.log('  2. Email mismatch');
        console.log('  3. Profile doesn\'t exist yet');
      }
      console.log('='.repeat(70) + '\n');
    }

    if (profile) {
      console.log('✅ Profile found:', profile.tiktok_username);
    } else {
      console.log('❌ No profile found for user_id:', user.id);
    }

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

