import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get all page analyses with screenshots
    const { data, error } = await supabase
      .from('page_analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching page analyses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analyses' },
        { status: 500 }
      );
    }

    // For each analysis with a screenshot, get the signed URL
    const analysesWithUrls = await Promise.all(
      data.map(async (analysis) => {
        if (analysis.screenshot_url) {
          try {
            const { data: signedUrlData } = await supabase.storage
              .from('page-screenshots')
              .createSignedUrl(analysis.screenshot_url, 3600); // 1 hour expiry

            return {
              ...analysis,
              screenshot_signed_url: signedUrlData?.signedUrl || null,
            };
          } catch (urlError) {
            console.error('Error creating signed URL:', urlError);
            return analysis;
          }
        }
        return analysis;
      })
    );

    return NextResponse.json({
      success: true,
      count: analysesWithUrls.length,
      analyses: analysesWithUrls,
    });

  } catch (error: any) {
    console.error('Error in admin page-analyses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}

// Get a specific screenshot
export async function POST(request: NextRequest) {
  try {
    const { screenshotUrl } = await request.json();

    if (!screenshotUrl) {
      return NextResponse.json(
        { error: 'Screenshot URL required' },
        { status: 400 }
      );
    }

    // Get signed URL for the screenshot
    const { data: signedUrlData, error } = await supabase.storage
      .from('page-screenshots')
      .createSignedUrl(screenshotUrl, 3600); // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json(
        { error: 'Failed to get screenshot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: signedUrlData.signedUrl,
    });

  } catch (error: any) {
    console.error('Error getting screenshot:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get screenshot' },
      { status: 500 }
    );
  }
}

// Delete an analysis and its screenshot
export async function DELETE(request: NextRequest) {
  try {
    const { analysisId } = await request.json();

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID required' },
        { status: 400 }
      );
    }

    // First, get the analysis to find the screenshot URL
    const { data: analysis, error: fetchError } = await supabase
      .from('page_analyses')
      .select('screenshot_url')
      .eq('id', analysisId)
      .single();

    if (fetchError) {
      console.error('Error fetching analysis:', fetchError);
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Delete the screenshot from storage if it exists
    if (analysis.screenshot_url) {
      try {
        const { error: storageError } = await supabase.storage
          .from('page-screenshots')
          .remove([analysis.screenshot_url]);

        if (storageError) {
          console.error('Error deleting screenshot:', storageError);
          // Continue anyway - we still want to delete the database record
        }
      } catch (storageError) {
        console.error('Error deleting screenshot:', storageError);
      }
    }

    // Delete the analysis record from database
    const { error: deleteError } = await supabase
      .from('page_analyses')
      .delete()
      .eq('id', analysisId);

    if (deleteError) {
      console.error('Error deleting analysis:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Analysis and screenshot deleted successfully',
    });

  } catch (error: any) {
    console.error('Error in delete operation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete analysis' },
      { status: 500 }
    );
  }
}


