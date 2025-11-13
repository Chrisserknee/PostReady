import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { BusinessInfo, ContentIdea } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
1. **Length**: 150-250 words (substantial and detailed)
2. **Tone**: Warm, authentic, conversational - like talking to a friend
3. **Structure**:
   - Start with a hook that grabs attention
   - Tell a mini-story or share context about the video
   - Include personality and emotion
   - End with a call-to-action (question, invitation, or request)

4. **Content Elements to Include**:
   - Why this matters to the local community
   - Personal touch or behind-the-scenes insight
   - Specific details (not generic statements)
   - Emojis (2-4 strategically placed, not excessive)
   - Line breaks for readability

5. **Avoid**:
   - Corporate/formal language
   - Clichés like "We're excited to share"
   - Overused phrases
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
"You know that feeling when you discover something you didn't know you needed? That's exactly what happened when we found this vintage record player last week 🎵

It's got this amazing story - the original owner was a DJ in Monterey back in the 70s, and you can still see where he carved his initials into the side. These are the kinds of treasures that make thrift shopping so special. Not just buying something used, but giving new life to pieces with real history.

We've got it priced at $45, and honestly? It still plays beautifully. Come check it out before someone else snatches it up! And while you're here, ask us about the story behind the vintage cameras we just got in... 📸

What's the coolest thrift find YOU'VE ever discovered? Drop a comment - we love hearing your stories!

#${locationClean} #thriftstorefinds #vintagestyle #sustainable shopping #secondhandtreasure #${locationClean}thrift #supportlocal #thriftingcommunity #vintagerecords #montereyca"

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

