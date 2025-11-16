import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    console.log(`🎥 Generating viral video ideas for topic: ${topic}`);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a viral content strategist and video idea generator. Generate 10 unique, creative, and highly viral video ideas based on the given topic. Each idea should have high engagement potential and viral factors.

For each video idea, provide:
1. title: A catchy, attention-grabbing title (max 80 characters)
2. description: A brief description of the video content (2-3 sentences)
3. whyViral: An explanation of why this video could go viral, including specific viral factors like emotion, relatability, uniqueness, trending elements, or shareable moments (2-3 sentences)

Format your response as a JSON array with exactly 10 ideas.`,
        },
        {
          role: "user",
          content: `Generate 10 viral video ideas for the topic: ${topic}`,
        },
      ],
      temperature: 0.9,
      max_tokens: 2000,
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

    console.log(`✅ Generated ${ideas.length} viral video ideas`);

    return NextResponse.json({ ideas }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error generating viral video ideas:", error);
    return NextResponse.json(
      { error: "Failed to generate viral video ideas", details: error.message },
      { status: 500 }
    );
  }
}


