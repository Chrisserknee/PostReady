import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '@/lib/auth-utils';
import { loadUserProgress, saveUserProgress } from '@/lib/userProgress';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Trend Radar API called');
    
    const response = NextResponse.next();
    
    // 1. Check Authentication (Optional)
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let isPro = false;
    let usageCount = 0;
    const FREE_LIMIT = 1;

    if (user) {
      // User is logged in - check Pro status and user_progress table
      console.log('📊 Trend Radar API: User found:', user.id, user.email);
      
      // Try to get Pro status directly from user_profiles using the same supabase client
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_pro, plan_type')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('📊 Trend Radar API: Error fetching profile:', profileError);
      }
      
      isPro = profile?.is_pro === true;
      console.log('📊 Trend Radar API: Direct Pro check:', { 
        isPro, 
        is_pro_value: profile?.is_pro, 
        plan_type: profile?.plan_type
      });
      
      const { data: userProgress, error: progressError } = await loadUserProgress(user.id);
      if (progressError) {
        console.error('Error loading user progress:', progressError);
      }
      usageCount = userProgress?.trendRadarCount ?? 0;
      console.log('📊 Trend Radar API: Usage count:', usageCount, 'isPro:', isPro);
    } else {
      // User is NOT logged in - check cookie usage
      const usageCookie = request.cookies.get('tr_usage');
      usageCount = usageCookie ? parseInt(usageCookie.value) : 0;
    }

    // 2. Check Usage Limit
    console.log('📊 Trend Radar API: Checking limit - isPro:', isPro, 'usageCount:', usageCount, 'FREE_LIMIT:', FREE_LIMIT);
    if (!isPro && usageCount >= FREE_LIMIT) {
      console.log('📊 Trend Radar API: Limit reached, blocking request');
      return NextResponse.json({ 
        error: "You've used your free analysis. Upgrade to Pro for unlimited access!",
        requiresUpgrade: true 
      }, { 
        status: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }
    console.log('📊 Trend Radar API: Limit check passed, proceeding with generation');
    
    const body = await request.json();
    const { category } = body;
    console.log('📊 Category received:', category);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
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
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    const systemPrompt = `You are an expert social media trend analyst with deep knowledge of viral content, trending topics, platform algorithms, audience behavior, and content strategy. You provide comprehensive, actionable insights based on real-time data across TikTok, Instagram, YouTube, Twitter/X, and other platforms.`;
    
    const userPrompt = `Today is ${currentDate}. Generate 5 trending topics for "${category}" category.

Return JSON: { "trends": [array] }

Each trend object structure:
{
  "title": "Trend name",
  "description": "2-3 sentence explanation",
  "engagementLevel": "Hot 🔥" | "Rising 📈" | "Steady ⭐",
  "reachPotential": "85",
  "platforms": ["TikTok", "Instagram"],
  "primaryPlatform": "TikTok",
  "metrics": {
    "estimatedViews": "45.2M",
    "growthRate": "+234%",
    "postCount": "1.2M",
    "avgEngagementRate": "8.5%",
    "peakEngagementTime": "7-9 PM EST"
  },
  "demographics": {
    "ageRange": "18-34",
    "genderSplit": "60% Female, 40% Male",
    "geographicFocus": "US, UK, Canada",
    "interests": ["fitness", "lifestyle"]
  },
  "contentFormats": ["15-30 second quick cuts", "Carousel posts"],
  "hashtags": ["#trendname", "#viral"],
  "keywords": ["keyword1", "keyword2"],
  "monetizationPotential": "High" | "Medium" | "Low",
  "monetizationNotes": "Brief monetization explanation",
  "longevity": "Days" | "Weeks" | "Months",
  "longevityReason": "Brief reason",
  "competitorAnalysis": "Brief competitor insight",
  "contentStrategy": "Brief strategy",
  "risks": "Brief risks",
  "bestPractices": ["Practice 1", "Practice 2"]
}

Focus on REAL current trends. Keep descriptions concise. Return ONLY valid JSON.`;

    console.log('🤖 Calling OpenAI for trends...');
    console.log('📝 Prompt length:', userPrompt.length);

    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const endTime = Date.now();
    console.log(`✅ OpenAI call completed in ${endTime - startTime}ms`);

    const responseText = completion.choices[0].message.content?.trim() || '{}';
    console.log('✅ Trends generated, response length:', responseText.length);
    console.log('📄 Response preview:', responseText.substring(0, 200));

    let trendsData;
    try {
      trendsData = JSON.parse(responseText);
      console.log('✅ JSON parsed successfully');
      
      // Handle both { trends: [...] } and direct array formats
      const trends = trendsData.trends || (Array.isArray(trendsData) ? trendsData : []);
      
      console.log('📊 Trends count:', trends.length);
      
      if (!Array.isArray(trends) || trends.length === 0) {
        console.error('❌ Invalid trends format:', trendsData);
        throw new Error('No trends found in response');
      }
      
      // 3. Increment Usage Count
      const finalResponse = NextResponse.json(
        { trends, category, timestamp: new Date().toISOString() },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
      
      if (!isPro) {
        const newCount = usageCount + 1;
        
        if (user) {
          // Logged in user - update user_progress table
          const { data: userProgress, error: loadError } = await loadUserProgress(user.id);
          if (!loadError && userProgress) {
            await saveUserProgress(user.id, {
              ...userProgress,
              trendRadarCount: newCount,
            });
          } else {
            await saveUserProgress(user.id, {
              businessInfo: null, strategy: null, selectedIdea: null, postDetails: null, currentStep: 'form',
              trendRadarCount: newCount,
            });
          }
          console.log('📊 Trend Radar API: Updated usage count for user:', newCount);
        } else {
          // Not logged in - set cookie
          finalResponse.cookies.set('tr_usage', newCount.toString(), {
            maxAge: 60 * 60 * 24 * 365, // 1 year
            httpOnly: false,
            sameSite: 'lax',
            path: '/',
          });
          console.log('📊 Trend Radar API: Updated cookie usage count:', newCount);
        }
      }
      
      return finalResponse;
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Raw response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse trends', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
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


  } catch (error: any) {
    console.error('❌ Trends API error:', {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: 'Failed to fetch trends', details: error.message },
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


