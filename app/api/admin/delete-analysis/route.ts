import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    const { analysisId, screenshotUrl } = await request.json();

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID required' },
        { status: 400 }
      );
    }

    // Delete screenshot from storage if it exists
    if (screenshotUrl) {
      try {
        const { error: storageError } = await supabase.storage
          .from('page-screenshots')
          .remove([screenshotUrl]);

        if (storageError) {
          console.error('Error deleting screenshot:', storageError);
        }
      } catch (storageError) {
        console.error('Error deleting screenshot:', storageError);
      }
    }

    // Delete analysis record from database
    const { error: dbError } = await supabase
      .from('page_analyses')
      .delete()
      .eq('id', analysisId);

    if (dbError) {
      console.error('Error deleting analysis:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Analysis and screenshot permanently deleted'
    });

  } catch (error: any) {
    console.error('Error in delete-analysis:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete analysis' },
      { status: 500 }
    );
  }
}

