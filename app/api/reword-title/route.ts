import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { BusinessInfo, ContentIdea } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessInfo, selectedIdea, currentTitle } = body as {
      businessInfo: BusinessInfo;
      selectedIdea: ContentIdea;
      currentTitle: string;
    };

    if (!businessInfo || !selectedIdea || !currentTitle) {
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

    const prompt = buildRewordPrompt(businessInfo, selectedIdea, currentTitle);

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert social media copywriter who creates engaging, attention-grabbing post titles. You specialize in creating multiple creative variations of the same concept."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 1.0, // High creativity for variety
      max_tokens: 100,
    });

    const newTitle = completion.choices[0].message.content?.trim() || currentTitle;

    return NextResponse.json({ title: newTitle });
  } catch (error: any) {
    console.error("Title reword error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to reword title" },
      { status: 500 }
    );
  }
}

function buildRewordPrompt(info: BusinessInfo, idea: ContentIdea, currentTitle: string): string {
  return `
You are rewording a social media post title for ${info.businessName}, a ${info.businessType} in ${info.location}.

CURRENT TITLE:
"${currentTitle}"

VIDEO CONTENT:
"${idea.title}"
Description: ${idea.description}

YOUR TASK:
Create ONE completely new, fresh variation of this title that:

1. **Says the same thing differently** - Keep the core message but change the wording
2. **Sounds natural and engaging** - Like a real person wrote it
3. **Grabs attention** - Make people want to watch
4. **Is concise** - Keep it under 80 characters if possible
5. **Feels fresh** - Don't just rearrange words, actually rewrite it

EXAMPLES OF GOOD REWORDING:

Original: "Watch Us Plate Tonight's Special: Seared Salmon with Lemon Butter"
Reworded: "Behind the Scenes: Our Chef Prepares the Salmon Special"

Original: "Meet Sarah: Why She's Been Coming Here for 10 Years"
Reworded: "A Decade of Loyalty: One Customer's Story"

Original: "Quick Tour of Our New Outdoor Patio Space"
Reworded: "Check Out Where You'll Be Dining This Summer"

NOW CREATE YOUR REWORDED TITLE:
Only return the new title, nothing else. No quotes, no explanations.
`;
}

