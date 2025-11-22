import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { CommentBaitRequest, CommentBaitResponse, CommentBaitItem } from '@/types';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body: CommentBaitRequest = await request.json();
    const { topic, platform, engagementStyle, customStyle, audience, count } = body;

    // Construct the system prompt
    const systemPrompt = `You are a master of social media engagement. Your goal is to generate "first comments" (comment bait) designed to be pinned under a video to spark replies, arguments, and massive engagement.

    CRITICAL INSTRUCTIONS FOR REALISM:
    - DO NOT sound like an AI or a marketing bot. No perfect punctuation, no capitalization unless necessary for emphasis.
    - mimic REAL internet comments: use lowercase, slang (rn, bc, tbh, imo), and casual phrasing.
    - intentionally be imperfect: drop commas, use "u" instead of "you" sometimes, maybe a typo or two if it feels authentic.
    - Be direct and visceral. Avoid "What do you think?" generic questions. Instead use statements that force a reaction.
    
    Tone Guidelines:
    - Requested Style: ${engagementStyle === 'Custom' ? customStyle : engagementStyle}
    - Platform: ${platform} (Use platform-specific vibes, e.g., TikTok is chaotic/funny, LinkedIn is professional but spicy, Twitter is argumentative).
    - Audience: ${audience || 'General social media users'}
    
    Types of Bait to Generate:
    1. The "Unpopular Opinion" (stated as fact).
    2. The "Confused" comment (makes others explain it to you).
    3. The "I bet 99% of people missed this" (even if they didn't).
    4. The "Choose a side" ultimatum.
    
    STRICTLY PROHIBITED: slurs, hate speech, harassment, calls for violence or self-harm.

    Return ONLY a JSON object with an "items" array containing objects with "id" (string), "text" (string), and "styleTag" (string matching the engagement style).`;

    const userPrompt = `Generate ${count} extremely real, unfiltered-sounding first comments for a post about: "${topic}".
    Make them sound like a real human typing on their phone in a hurry. Varied capitalization (mostly lowercase).`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using a fast, cost-effective model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8, // Slightly higher creativity for engaging comments
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content generated from OpenAI");
    }

    const parsedContent = JSON.parse(content);
    
    // Ensure the response matches our expected structure
    const items: CommentBaitItem[] = parsedContent.items.map((item: any, index: number) => ({
      id: item.id || `cb-${Date.now()}-${index}`,
      text: item.text,
      styleTag: item.styleTag || engagementStyle
    }));

    const response: CommentBaitResponse = {
      items,
      metadata: {
        topic,
        platform,
        engagementStyle,
        audience,
        count
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error in Comment Bait Generator:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate comment bait' },
      { status: 500 }
    );
  }
}

