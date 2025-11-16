import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced trend categories with subcategories
const TREND_CATEGORIES = {
  'Social Media': ['TikTok Trends', 'Instagram Reels', 'YouTube Shorts', 'Twitter/X Viral', 'LinkedIn Content'],
  'Technology': ['AI & ML', 'Apps & Tools', 'Gadgets', 'Web3 & Crypto', 'Tech News'],
  'Entertainment': ['Movies & TV', 'Music', 'Gaming', 'Celebrities', 'Memes & Culture'],
  'Lifestyle': ['Fashion', 'Health & Fitness', 'Food & Recipes', 'Travel', 'Home & DIY'],
  'Business': ['Marketing', 'Entrepreneurship', 'Side Hustles', 'Personal Branding', 'E-commerce'],
  'Creative': ['Art & Design', 'Photography', 'Video Editing', 'Content Creation', 'Animation']
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET endpoint for categories and metadata
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      { 
        categories: Object.keys(TREND_CATEGORIES),
        subcategories: TREND_CATEGORIES,
        platforms: ['TikTok', 'Instagram', 'YouTube', 'Twitter/X', 'LinkedIn', 'Facebook'],
        engagementLevels: ['Viral 🚀', 'Hot 🔥', 'Rising 📈', 'Steady ⭐', 'Emerging 🌱'],
        version: '2.0',
        features: [
          'Advanced trend analysis',
          'Platform-specific insights',
          'Hashtag recommendations',
          'Content angle suggestions',
          'Viral potential scoring',
          'Demographic insights',
          'Competitor analysis',
          'Trending sounds/audio',
          'Best posting times',
          'Content ideas generator'
        ]
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Enhanced Trend Radar API called');
    
    const body = await request.json();
    const { 
      category = 'Social Media', 
      platform = 'All', 
      subcategory = null,
      trendCount = 12,
      includeHashtags = true,
      includeContentIdeas = true,
      includeCompetitorAnalysis = false,
      includeAudioTrends = true,
      targetAudience = 'general'
    } = body;
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      weekday: 'long'
    });

    const systemPrompt = `You are an elite social media trend analyst with deep expertise in viral content, platform algorithms, and cultural moments. You have comprehensive knowledge of what's trending RIGHT NOW across all major platforms including TikTok, Instagram, YouTube, Twitter/X, and LinkedIn. You understand engagement patterns, demographic preferences, and viral mechanics.`;
    
    const userPrompt = `Today is ${currentDate}. Generate ${trendCount} highly relevant, current trending topics for the "${category}" category${subcategory ? ` (specifically "${subcategory}")` : ''}${platform !== 'All' ? ` with focus on ${platform}` : ''}.

TARGET AUDIENCE: ${targetAudience}

For each trend, provide comprehensive analysis:

1. **title**: Catchy, engaging title (5-10 words max)
2. **description**: Detailed explanation of what it is and why it's trending (2-3 sentences)
3. **engagementLevel**: Current momentum - choose from:
   - "Viral 🚀" (exploding right now, millions of views)
   - "Hot 🔥" (very popular, high engagement)
   - "Rising 📈" (gaining traction quickly)
   - "Steady ⭐" (consistent performance)
   - "Emerging 🌱" (just starting to trend)

4. **reachPotential**: Realistic percentage (0-100) based on current momentum
5. **platforms**: Array of platforms where this is trending (e.g., ["TikTok", "Instagram"])
6. **primaryPlatform**: The main platform driving this trend
${includeHashtags ? `7. **hashtags**: Array of 5-8 relevant, trending hashtags (include the # symbol)` : ''}
8. **viralScore**: Score from 1-100 indicating viral potential
9. **demographics**: Object with targetAge (e.g., "18-34"), targetGender (e.g., "All"), mainRegions (array)
10. **contentAngles**: Array of 3-4 content approach suggestions (e.g., ["Tutorial style", "Behind the scenes", "Humor-based"])
${includeAudioTrends ? `11. **trendingAudio**: If applicable, mention trending sounds/music (or null)` : ''}
12. **bestPostingTimes**: Array of 2-3 optimal times to post (e.g., ["7-9 AM", "5-7 PM"])
13. **estimatedViews**: Object with min and max expected views (e.g., {"min": 10000, "max": 500000})
${includeContentIdeas ? `14. **quickContentIdeas**: Array of 2-3 specific content ideas leveraging this trend` : ''}
15. **durationPrediction**: How long this trend will likely last (e.g., "2-3 weeks", "1-2 months")
16. **competitionLevel**: "Low", "Medium", or "High"
17. **keywords**: Array of 5-7 SEO keywords related to this trend
18. **relatedTrends**: Array of 2-3 related trending topics

Focus on:
✅ REAL, CURRENT trends happening RIGHT NOW
✅ Platform-specific features (TikTok effects, IG filters, YT formats)
✅ Viral challenges, sounds, memes, formats
✅ Current events and cultural moments
✅ Seasonal relevance (current month/season)
✅ Demographic-specific interests
✅ Actionable insights for content creators
✅ Authentic engagement opportunities

Format as JSON array with objects containing all fields above.

CRITICAL: Return ONLY valid JSON, no markdown, no explanations, no additional text. The response must be parseable as JSON immediately.`;

    console.log('🤖 Calling OpenAI with enhanced prompts...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Upgraded to GPT-4 for better analysis
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content?.trim() || '{"trends": []}';
    console.log('✅ Enhanced trends generated');

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
      
      // Handle both direct array and nested object responses
      let trends = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.trends || [];
      
      // Validate and enrich trend data
      trends = trends.map((trend: any, index: number) => ({
        id: `trend-${Date.now()}-${index}`,
        title: trend.title || 'Untitled Trend',
        description: trend.description || 'No description available',
        engagementLevel: trend.engagementLevel || 'Steady ⭐',
        reachPotential: trend.reachPotential || '50',
        platforms: trend.platforms || ['All Platforms'],
        primaryPlatform: trend.primaryPlatform || 'TikTok',
        hashtags: trend.hashtags || [],
        viralScore: trend.viralScore || 50,
        demographics: trend.demographics || { targetAge: '18-45', targetGender: 'All', mainRegions: ['Global'] },
        contentAngles: trend.contentAngles || ['Educational', 'Entertaining'],
        trendingAudio: trend.trendingAudio || null,
        bestPostingTimes: trend.bestPostingTimes || ['9-11 AM', '7-9 PM'],
        estimatedViews: trend.estimatedViews || { min: 5000, max: 50000 },
        quickContentIdeas: trend.quickContentIdeas || [],
        durationPrediction: trend.durationPrediction || '2-4 weeks',
        competitionLevel: trend.competitionLevel || 'Medium',
        keywords: trend.keywords || [],
        relatedTrends: trend.relatedTrends || [],
        timestamp: new Date().toISOString()
      }));

      // Sort by viral score
      trends.sort((a: any, b: any) => b.viralScore - a.viralScore);

      return NextResponse.json(
        { 
          success: true,
          trends,
          metadata: {
            category,
            platform,
            subcategory,
            trendCount: trends.length,
            generatedAt: new Date().toISOString(),
            targetAudience,
            version: '2.0'
          },
          insights: {
            topEngagementLevel: trends[0]?.engagementLevel || 'N/A',
            averageViralScore: trends.length > 0 
              ? Math.round(trends.reduce((sum: number, t: any) => sum + t.viralScore, 0) / trends.length)
              : 0,
            mostCommonPlatform: getMostCommonPlatform(trends),
            trendingHashtags: getTopHashtags(trends, 10)
          }
        },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );

    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Raw response:', responseText);
      return NextResponse.json(
        { 
          error: 'Failed to parse trends',
          details: 'The AI response could not be parsed as valid JSON',
          rawResponse: responseText.substring(0, 500)
        },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
      { 
        success: false,
        error: 'Failed to fetch trends', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

// Helper function to find most common platform
function getMostCommonPlatform(trends: any[]): string {
  const platformCounts: { [key: string]: number } = {};
  
  trends.forEach(trend => {
    const platform = trend.primaryPlatform || 'Unknown';
    platformCounts[platform] = (platformCounts[platform] || 0) + 1;
  });

  let maxCount = 0;
  let mostCommon = 'TikTok';
  
  for (const [platform, count] of Object.entries(platformCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = platform;
    }
  }

  return mostCommon;
}

// Helper function to get top hashtags
function getTopHashtags(trends: any[], limit: number = 10): string[] {
  const hashtagCounts: { [key: string]: number } = {};
  
  trends.forEach(trend => {
    if (trend.hashtags && Array.isArray(trend.hashtags)) {
      trend.hashtags.forEach((tag: string) => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    }
  });

  return Object.entries(hashtagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([tag]) => tag);
}


