import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { niche, platform, batchNumber = 0 } = body as { 
      niche: string;
      platform: string;
      batchNumber?: number;
    };

    if (!niche || !platform) {
      return NextResponse.json(
        { error: "Missing niche or platform" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build platform-specific prompt
    const prompt = `You are a social media expert. Generate 8 REAL, VERIFIED hashtags for:

Niche/Topic: ${niche}
Platform: ${platform}
Batch Number: ${batchNumber}

⚠️ CRITICAL - READ CAREFULLY:
1. NEVER create fake hashtags by mashing words together (e.g., #santarunninglovers, #foodcommunity, #fitnessgoals DO NOT EXIST)
2. ONLY suggest hashtags you KNOW are real and actively used on ${platform}
3. Break down multi-word topics into REAL, SEPARATE hashtags:
   - "Santa Running" → #santa, #running, #christmas, #run, #christmasrun (if real)
   - "Food Blogger" → #food, #foodie, #foodporn, #instafood, #cooking
   - "Fitness" → #fitness, #gym, #workout, #fit, #fitfam
4. Use BROAD, POPULAR hashtags that actually exist - not niche concatenations
5. Include platform-specific tags: ${platform === 'TikTok' ? '#fyp, #foryou, #viral' : platform === 'Instagram' ? '#reels, #explore, #instagood' : platform === 'YouTube Shorts' ? '#shorts, #youtubeshorts, #youtube' : '#facebook, #viral'}

STRATEGY:
- Split compound topics into individual, real hashtags
- Use widely-known platform tags
- Prioritize hashtags with millions of existing posts
- Avoid creative/made-up combinations

REACH LEVELS (based on actual post counts):
- "Very High": 10M+ posts
- "High": 1M-10M posts
- "Medium": 100K-1M posts
- "Low": Under 100K posts

COMPETITION LEVELS:
- "Very High": Extremely saturated, hard to rank
- "High": Highly competitive
- "Medium": Moderate competition
- "Low": Easier to rank, less saturated

Return ONLY valid JSON in this exact format:
{
  "hashtags": [
    {
      "tag": "#example",
      "reach": "High",
      "competition": "Medium"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a social media hashtag expert who only recommends real, verified hashtags that actually exist and are actively used on social platforms. Never create fake or made-up hashtags. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content || "{}";
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ JSON parsing error:", parseError);
      console.error("Raw response:", responseText);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate response structure
    if (!result.hashtags || !Array.isArray(result.hashtags)) {
      console.error("❌ Invalid response structure:", result);
      throw new Error("Invalid hashtag data received from AI");
    }

    // Add scoring to each hashtag
    const reachLevels = ['Low', 'Medium', 'High', 'Very High'];
    const competitionLevels = ['Low', 'Medium', 'High', 'Very High'];
    
    const calculateScore = (reach: string, competition: string) => {
      const reachScore = reachLevels.indexOf(reach);
      const compScore = competitionLevels.indexOf(competition);
      // High reach + Low competition = Best score
      return (reachScore * 10) + ((3 - compScore) * 8);
    };

    const hashtagsWithScores = result.hashtags.map((h: any) => ({
      tag: h.tag,
      reach: h.reach || 'Medium',
      competition: h.competition || 'Medium',
      score: calculateScore(h.reach || 'Medium', h.competition || 'Medium')
    })).sort((a: any, b: any) => b.score - a.score);

    console.log(`✅ Generated ${hashtagsWithScores.length} AI hashtags for ${niche} on ${platform}`);

    return NextResponse.json({
      hashtags: hashtagsWithScores,
      niche,
      platform
    });

  } catch (error: any) {
    console.error("❌ Hashtag generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate hashtags" },
      { status: 500 }
    );
  }
}
