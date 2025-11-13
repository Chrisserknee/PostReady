import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { BusinessInfo, ContentIdea } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessInfo, selectedIdea } = body as {
      businessInfo: BusinessInfo;
      selectedIdea: ContentIdea;
    };

    if (!businessInfo || !selectedIdea) {
      return NextResponse.json(
        { error: "Missing required information" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Initialize OpenAI client lazily (only when route is called)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = buildCaptionPrompt(businessInfo, selectedIdea);

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert social media copywriter who creates engaging, authentic, and high-converting captions for local businesses. Your writing feels natural, warm, and human - never robotic or formulaic."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 800,
    });

    const caption = completion.choices[0].message.content || "";

    return NextResponse.json({ caption: caption.trim() });
  } catch (error: any) {
    console.error("Caption generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate caption" },
      { status: 500 }
    );
  }
}

function buildCaptionPrompt(info: BusinessInfo, idea: ContentIdea): string {
  const locationClean = info.location.toLowerCase().replace(/\s+/g, '').replace(/,/g, '');
  
  return `
Create a compelling ${info.platform} caption for ${info.businessName}, a ${info.businessType} in ${info.location}.

VIDEO CONTENT: "${idea.title}"
Description: ${idea.description}
Content Angle: ${idea.angle}

YOUR TASK:
Write a natural, engaging caption that feels like it's written by a real person who's passionate about their business.

CAPTION REQUIREMENTS:
1. **Length**: 50-100 words (short and punchy)
2. **Tone**: Warm, authentic, conversational - like talking to a friend
3. **Structure**:
   - Start with a hook that grabs attention
   - Share ONE key detail or insight
   - End with a call-to-action (question or invitation)

4. **Content Elements to Include**:
   - ONE specific detail (not generic statements)
   - Emojis (2-3 strategically placed, not excessive)
   - Line breaks for readability (2-3 short paragraphs max)

5. **Avoid**:
   - Corporate/formal language
   - Clichés like "We're excited to share"
   - Being too wordy or verbose
   - Feeling salesy or pushy

6. **Platform-Specific**:
${getPlatformGuidance(info.platform)}

7. **Hashtags**: Include 8-12 relevant hashtags at the END of the caption
   - Mix of: local (#${locationClean}, #${locationClean}business)
   - Business type specific
   - Platform-specific
   - Community hashtags
   - Separate hashtags with spaces

EXAMPLE STYLE (do NOT copy, just use as a tone reference):
"Just found this vintage record player from a Monterey DJ in the 70s 🎵 Still has his initials carved in the side!

These are the treasures that make thrift shopping special. Priced at $45 and it plays beautifully.

What's the coolest thing YOU'VE found thrifting? 💬

#${locationClean} #thriftstorefinds #vintagestyle #sustainableshopping #secondhandtreasure #supportlocal #thriftingcommunity #vintagerecords"

NOW CREATE THE CAPTION:
Make it feel real, specific to ${info.businessName}, and genuinely interesting to read.
`;
}

function getPlatformGuidance(platform: string): string {
  const guidance: Record<string, string> = {
    "Instagram": `
   - Instagram loves storytelling and visual descriptions
   - Use line breaks strategically (every 2-3 lines)
   - Ask engaging questions to boost comments
   - Emojis work well but don't overdo it`,
    
    "TikTok": `
   - TikTok captions can be shorter (100-150 words)
   - More casual and trend-aware
   - Call out viewers directly ("If you're in [location]...")
   - Include trending language when appropriate`,
    
    "Facebook": `
   - Facebook audiences appreciate longer, detailed stories
   - Community-focused language works best
   - Invite conversation and engagement
   - Local references resonate strongly`,
    
    "YouTube Shorts": `
   - Brief but descriptive
   - Include timestamps if relevant
   - Encourage viewers to subscribe
   - Ask questions to boost comments`
  };

  return guidance[platform] || guidance["Instagram"];
}

