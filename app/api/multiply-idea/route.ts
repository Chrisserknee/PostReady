import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Mark route as dynamic to prevent caching
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Handle OPTIONS for CORS preflight
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
    console.log('💡 Viral Video Idea API called');
    
    const { topic } = await request.json();
    
    console.log('📥 Request data:', { topic });

    if (!topic) {
      return NextResponse.json(
        { error: 'Missing required field: topic' },
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

    const systemPrompt = `You are a viral content strategist who understands what makes videos go viral across all platforms (TikTok, Instagram Reels, YouTube Shorts, etc.). You analyze engagement patterns, psychological triggers, and trending formats.`;
    
    const userPrompt = `Generate 10 viral video ideas based on this topic: "${topic}"

For each video idea, provide:
1. A compelling title/concept
2. A brief description of the video (2-3 sentences)
3. Why it could go viral (explain the psychological triggers, engagement factors, and viral elements)

Focus on ideas that have:
- Strong hooks in the first 3 seconds
- Emotional triggers (curiosity, surprise, humor, inspiration, controversy)
- Shareability factor
- Relatability
- Unique angle or fresh perspective
- High retention potential

Format as a JSON array with objects containing:
{
  "title": "Catchy title or concept",
  "description": "Brief video description",
  "viralFactors": "Detailed explanation of why this could go viral"
}

Make each idea genuinely unique and high-potential. Consider trending formats:
- Before/After transformations
- Myth-busting
- "Things nobody tells you about..."
- Behind the scenes
- Quick hacks/tips
- Storytelling with a twist
- Relatable situations
- "Day in the life"
- Experiments/Challenges
- Educational with entertainment

Return ONLY valid JSON, no additional text.`;

    console.log('🤖 Calling OpenAI API...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.9, // Higher creativity
      max_tokens: 3000,
    });

    const responseText = completion.choices[0].message.content?.trim() || '[]';
    console.log('✅ OpenAI response received');

    // Parse the JSON response
    let content;
    try {
      content = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Raw response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
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
      { videoIdeas: content },
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
    console.error('❌ Multiply Idea API error:', {
      message: error.message,
      stack: error.stack,
      details: error
    });

    return NextResponse.json(
      { error: 'Failed to multiply idea', details: error.message },
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

