import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Load user's module order
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's module order
    const { data, error } = await supabase
      .from('user_module_order')
      .select('module_order')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading module order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      moduleOrder: data?.module_order || null 
    }, { status: 200 });

  } catch (error: any) {
    console.error('GET module order error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Save user's module order
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { moduleOrder } = body;

    if (!Array.isArray(moduleOrder)) {
      return NextResponse.json({ error: 'Invalid module order format' }, { status: 400 });
    }

    // Upsert (insert or update) module order
    const { data, error } = await supabase
      .from('user_module_order')
      .upsert({
        user_id: user.id,
        module_order: moduleOrder,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving module order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      moduleOrder: data.module_order
    }, { status: 200 });

  } catch (error: any) {
    console.error('POST module order error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

