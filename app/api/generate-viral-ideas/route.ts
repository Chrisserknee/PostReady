import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { topic, guidance, previousIdea } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    console.log(`🎥 Generating INTELLIGENT viral video ideas for topic: ${topic}${guidance ? ' with guidance' : ''}`);

    // Step 1: Analyze the niche and audience deeply
    const analysisCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an elite social media strategist who has generated over 100 million views across TikTok, YouTube Shorts, and Instagram Reels. You understand viral mechanics at a molecular level.

Your task is to deeply analyze a topic and understand:
1. The target audience's pain points, desires, and scrolling behavior
2. Current trending formats and viral mechanics in this niche
3. Psychological triggers that make content shareable
4. Platform-specific algorithm preferences
5. Content gaps and untapped opportunities

Provide a strategic analysis that will inform highly intelligent viral video ideas.`,
        },
        {
          role: "user",
          content: `Analyze this topic for viral video creation: "${topic}"

Provide:
1. Target Audience: Demographics, psychographics, pain points, desires (3-4 sentences)
2. Viral Mechanics: What makes content go viral in this niche? (3-4 specific mechanics)
3. Content Opportunities: Untapped angles and fresh perspectives (3-4 opportunities)
4. Platform Preferences: Best platforms and why (TikTok/YouTube Shorts/Instagram Reels)
5. Emotional Triggers: What emotions drive sharing in this niche?

Be specific and strategic. Think like a viral content scientist.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const analysis = analysisCompletion.choices[0]?.message?.content || "";
    console.log(`📊 Niche analysis complete: ${analysis.substring(0, 100)}...`);

    // Step 2: Generate highly intelligent viral video ideas
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are THE BEST viral video strategist in the world. You've created content that has generated billions of views. You don't just suggest ideas - you engineer viral content with scientific precision.

CRITICAL: Generate ideas that are REALISTIC and ACHIEVABLE for regular creators. Ideas should:
- Require minimal equipment (just a phone camera is fine)
- Be filmable in one location (bedroom, kitchen, park, etc.)
- Not require special effects, actors, or expensive props
- Be doable by one person or with simple help
- Focus on storytelling, hooks, and editing rather than production value

For each video idea, you must provide:

1. **title**: A magnetic, scroll-stopping title that creates curiosity gap or emotional trigger (max 80 chars)

2. **hook**: The exact first 3 seconds that stop the scroll. This is THE MOST IMPORTANT part. Include the specific words/visual/action that hooks viewers. Must be SIMPLE to execute. (2-3 sentences)

3. **description**: Detailed content breakdown including:
   - Opening (first 3-5 seconds) - keep it SIMPLE
   - Middle structure (how to maintain engagement)
   - Climax/payoff (what keeps them watching)
   - Call-to-action
   Focus on what's EASY to film, not elaborate productions. (4-5 sentences)

4. **whyViral**: Deep analysis of viral mechanics:
   - Specific psychological triggers (curiosity, FOMO, social proof, controversy, etc.)
   - Algorithm preferences (watch time, shares, saves)
   - Shareability factors (why someone would send this to a friend)
   - Platform-specific advantages
   (4-5 sentences with SPECIFIC viral mechanics)

5. **platform**: Best platform for this idea (TikTok, YouTube Shorts, or Instagram Reels) and why

6. **targetAudience**: Specific audience segment and why they'll engage

7. **productionTips**: 2-3 specific, practical tips for filming this successfully WITH MINIMAL EQUIPMENT

8. **estimatedViralPotential**: "High", "Very High", or "Extremely High" with reasoning

Generate ideas that are:
- SIMPLE and ACHIEVABLE for solo creators with just a phone
- Novel and fresh (not generic advice everyone gives)
- Highly specific to the niche
- Built on proven viral formats but with unique twists
- Immediately actionable WITHOUT special equipment or budget
- Designed for 2024-2025 algorithm preferences
- Focused on storytelling and hooks, NOT production complexity

CONTEXT FOR THIS TOPIC:
${analysis}

Now generate 1 video idea that is MORE INTELLIGENT than generic ChatGPT responses.`,
        },
        {
          role: "user",
          content: guidance && previousIdea 
            ? `REFINE this existing video idea based on user guidance:

PREVIOUS IDEA:
Title: ${previousIdea.title}
Description: ${previousIdea.description}
Why Viral: ${previousIdea.whyViral}

USER GUIDANCE: "${guidance}"

Generate 1 REFINED video idea that incorporates the user's guidance while maintaining viral potential.

The refined idea should:
✅ Address the user's specific guidance
✅ Keep the core viral mechanics that work
✅ Improve based on the feedback
✅ Maintain or increase viral potential

Format as JSON with structure:
{
  "ideas": [
    {
      "title": "...",
      "hook": "...",
      "description": "...",
      "whyViral": "...",
      "platform": "...",
      "targetAudience": "...",
      "productionTips": "...",
      "estimatedViralPotential": "..."
    }
  ]
}`
            : `Generate 1 ULTRA-INTELLIGENT viral video idea for: "${topic}"

IMPORTANT: The idea must be SIMPLE and ACHIEVABLE:
✅ Filmable with just a phone camera
✅ Doable in one simple location (bedroom, kitchen, etc.)
✅ No special effects or expensive equipment needed
✅ Can be done by one person
✅ Backed by viral psychology and platform algorithms
✅ Novel and fresh (not generic)
✅ Immediately actionable with specific hooks
✅ Platform-optimized
✅ Designed to maximize watch time, shares, and saves

Format as JSON with structure:
{
  "ideas": [
    {
      "title": "...",
      "hook": "...",
      "description": "...",
      "whyViral": "...",
      "platform": "...",
      "targetAudience": "...",
      "productionTips": "...",
      "estimatedViralPotential": "..."
    }
  ]
}`,
        },
      ],
      temperature: 0.85,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated");
    }

    const parsed = JSON.parse(content);
    const ideas = parsed.ideas || parsed.videoIdeas || [];

    if (!Array.isArray(ideas) || ideas.length === 0) {
      throw new Error("Failed to generate ideas");
    }

    console.log(`✅ Generated ${ideas.length} INTELLIGENT viral video ideas`);

    return NextResponse.json({ ideas, analysis }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error generating viral video ideas:", error);
    return NextResponse.json(
      { error: "Failed to generate viral video ideas", details: error.message },
      { status: 500 }
    );
  }
}


