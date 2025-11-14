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
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a skilled copywriter who refines social media titles with grace and precision. You keep the core meaning intact but make the wording more elegant, concise, and compelling. You never change the message - just polish the delivery."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7, // Balanced creativity for refinement
      max_tokens: 80,
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
  // Use detected business type if available, otherwise fall back to user selection
  const actualBusinessType = info.detectedBusinessType || info.businessType;
  
  console.log("✏️ Title Reword:", {
    businessName: info.businessName,
    userSelected: info.businessType,
    detected: info.detectedBusinessType,
    usingForTitle: actualBusinessType
  });
  
  return `
Refine this social media post title for ${info.businessName}, a ${actualBusinessType} in ${info.location}.

CURRENT TITLE:
"${currentTitle}"

VIDEO CONTENT:
"${idea.title}"
${idea.description}

YOUR TASK:
Polish this title with MORE GRACEFUL wording while keeping the same core message. Think of this as editing, not rewriting.

REFINEMENT PRINCIPLES:
1. **Keep the essence** - Don't change what the title is about
2. **Improve the flow** - Make it read more smoothly and naturally
3. **Simplify if needed** - Remove unnecessary words or awkward phrasing
4. **Add elegance** - Choose more refined, polished word choices
5. **Stay concise** - Ideally under 60 characters

EXAMPLES OF GRACEFUL REFINEMENT:

Original: "Watch Us Plate Tonight's Special: Seared Salmon with Lemon Butter"
Refined: "Plating Our Signature Salmon Special"

Original: "A Quick Look at How We Make Our Famous Chocolate Cake"
Refined: "How We Make Our Famous Chocolate Cake"

Original: "Come See What's Inside Our Brand New Kitchen Space"
Refined: "Inside Our New Kitchen"

Original: "Here's A Behind-the-Scenes Look at Our Morning Routine"
Refined: "Behind the Scenes: Our Morning Routine"

IMPORTANT:
- Make small, intelligent adjustments
- Keep the video subject clear
- Don't drastically change the meaning
- Just make it sound better

Return ONLY the refined title. No quotes. No explanations.
`;
}


