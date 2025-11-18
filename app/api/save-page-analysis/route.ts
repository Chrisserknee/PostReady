import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, userInfo, analysis, screenshotData } = await request.json();

    let screenshotUrl = null;

    // Upload screenshot to Supabase Storage if provided
    if (screenshotData) {
      try {
        // Convert base64 to buffer
        const base64Data = screenshotData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const timestamp = Date.now();
        const filename = `screenshot-${timestamp}-${Math.random().toString(36).substring(7)}.png`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('page-screenshots')
          .upload(filename, buffer, {
            contentType: 'image/png',
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Error uploading screenshot:', uploadError);
        } else {
          // Get public URL (even though bucket is private, we store the path)
          screenshotUrl = filename;
          console.log('Screenshot uploaded successfully:', filename);
        }
      } catch (uploadError) {
        console.error('Error processing screenshot upload:', uploadError);
      }
    }

    // Save page analysis data with screenshot URL
    const { data, error } = await supabase
      .from('page_analyses')
      .insert({
        user_id: userId || null,
        username: userInfo.username,
        full_name: userInfo.fullName,
        bio_links: userInfo.bioLinks,
        follower_count: userInfo.followerCount,
        post_count: userInfo.postCount,
        social_link: userInfo.socialLink,
        analysis_text: analysis,
        screenshot_url: screenshotUrl,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving page analysis:', error);
      return NextResponse.json(
        { error: 'Failed to save analysis data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Analysis and screenshot saved successfully',
      screenshotUrl: screenshotUrl
    });

  } catch (error: any) {
    console.error('Error in save-page-analysis:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save analysis' },
      { status: 500 }
    );
  }
}

