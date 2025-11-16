import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
    
    const { category } = await request.json();
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    const systemPrompt = `You are a social media trend analyst with real-time knowledge of viral content, trending topics, and cultural moments. You understand what's currently popular across TikTok, Instagram, YouTube, Twitter/X, and other platforms.`;
    
    const userPrompt = `Today is ${currentDate}. Generate 8 current trending topics for the "${category}" category.

For each trend, provide:
1. A catchy title
2. Brief description (1-2 sentences)
3. Engagement level (Hot 🔥, Rising 📈, or Steady ⭐)
4. Estimated reach potential (percentage like 85%)

Focus on:
- REAL current trends and viral moments
- Topics that are actively being discussed/created NOW
- Platform-specific trends (TikTok sounds, Instagram reels formats, etc.)
- Seasonal relevance (consider current month/season)
- Pop culture moments, challenges, memes
- News and current events driving engagement

Categories explained:
- Social Media: TikTok sounds, Instagram features, viral formats, challenges
- Technology: New apps, AI tools, tech news, gadgets
- Entertainment: Shows, movies, music, celebrities, memes
- Lifestyle: Fashion, health, wellness, productivity, home
- Business: Marketing trends, entrepreneurship, side hustles
- Gaming: New games, esports, streaming trends

Format as JSON array with objects containing:
{
  "title": "Trend name",
  "description": "What it is and why it's trending",
  "engagementLevel": "Hot" | "Rising" | "Steady",
  "reachPotential": "85"
}

Return ONLY valid JSON, no additional text.`;

    console.log('🤖 Calling OpenAI for trends...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0].message.content?.trim() || '[]';
    console.log('✅ Trends generated');

    let trends;
    try {
      trends = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Raw response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse trends' },
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

    return NextResponse.json(
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


