import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { advancedMode = false } = await request.json();

    // Get current date for context
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });

    // Use AI to analyze and provide real trending data
    const aiPrompt = advancedMode 
      ? `You are a social media trend analyst. Today is ${currentDate}. Identify the TOP 8 ACTUAL REAL trending topics RIGHT NOW across TikTok, Instagram, and YouTube based on your latest knowledge.

For ADVANCED MODE, provide extremely detailed analysis for each trend with:
1. The exact trend name (must be real and current from November 2024)
2. Realistic view count estimates based on current viral trends
3. Growth rate percentage (based on momentum)
4. Number of active posts/videos
5. Primary platform (TikTok, Instagram, or YouTube)
6. A detailed 2-3 sentence description of WHY this is trending and what makes it viral
7. Key demographics (age range, primary audience)
8. Content format recommendations (e.g., "15-30 second quick cuts", "carousel posts with text overlays")
9. Monetization potential (High/Medium/Low)
10. Predicted longevity (Days/Weeks/Months)

Return ONLY a JSON array with this structure:
[
  {
    "topic": "exact trend name",
    "views": 45200000,
    "growth": 234,
    "posts": 1240000,
    "platform": "TikTok",
    "description": "detailed description of why trending",
    "demographics": "primary age range and audience",
    "contentFormat": "recommended format",
    "monetization": "High/Medium/Low",
    "longevity": "Days/Weeks/Months"
  }
]

Be accurate and realistic. Focus on what's ACTUALLY trending right now in late 2024 - things like specific dance challenges, sounds, memes, topics that are genuinely viral.`
      : `You are a social media trend analyst. Today is ${currentDate}. Identify the TOP 6 ACTUAL REAL trending topics RIGHT NOW across TikTok, Instagram, and YouTube.

For SIMPLE MODE, provide:
1. The exact trend name (must be real and current from November 2024)
2. Estimated view count (be realistic, in format like "45.2M")
3. Growth percentage (in format like "+234%")
4. Primary platform (TikTok, Instagram, or YouTube)

Return ONLY a JSON array:
[
  {
    "topic": "exact trend name",
    "views": "45.2M",
    "growth": "+234%",
    "platform": "TikTok"
  }
]

Be accurate and current. Focus on what's ACTUALLY trending right now in late 2024.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert social media trend analyst with deep knowledge of current viral trends, memes, challenges, and content across TikTok, Instagram, and YouTube. You provide accurate, actionable insights based on real trending topics.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 3000
      })
    });

    if (!aiResponse.ok) {
      throw new Error('Failed to analyze trends');
    }

    const aiData = await aiResponse.json();
    const trendsText = aiData.choices[0].message.content;
    
    // Extract JSON from the response
    const jsonMatch = trendsText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse trend data');
    }

    const trends = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      trends,
      timestamp: new Date().toISOString(),
      advancedMode
    });

  } catch (error: any) {
    console.error('Error detecting trends:', error);
    return NextResponse.json(
      { error: 'Failed to detect trends', details: error.message },
      { status: 500 }
    );
  }
}

