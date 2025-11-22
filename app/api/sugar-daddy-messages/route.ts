import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SugarDaddyMessageRequest, SugarDaddyMessageResponse, SugarDaddyMessageItem } from '@/types';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body: SugarDaddyMessageRequest = await request.json();
    const { situation, tone, relationship, amount, count } = body;

    // Construct the system prompt
    const systemPrompt = `You are an expert in crafting persuasive messages for financial requests. Your goal is to generate messages that are compelling, respectful, and effective at communicating financial needs.

    Guidelines:
    - Messages should be persuasive but respectful
    - Match the requested tone: ${tone}
    - Consider the relationship dynamic: ${relationship}
    - Situation context: ${situation}
    ${amount ? `- Amount mentioned: ${amount}` : ''}
    - Messages should feel authentic and natural
    - Vary the approach and phrasing across different messages
    - Keep messages concise but compelling (1-3 sentences typically)
    - Use appropriate language for the relationship type

    Tone Guidelines:
    - Sweet: Warm, affectionate, appreciative
    - Desperate: Urgent, emotional, vulnerable
    - Playful: Light-hearted, flirty, fun
    - Grateful: Thankful, appreciative, respectful
    - Direct: Straightforward, clear, honest
    - Sexy: Alluring, seductive, sensual, suggestive. USE EMOJIS strategically (💋, 😘, 🔥, 💕, 😉, etc.) to enhance the seductive tone when appropriate

    Return ONLY a JSON object with an "items" array containing objects with:
    - "id" (string)
    - "text" (string): The message itself
    - "toneTag" (string): The tone category used`;

    const userPrompt = `Generate ${count} messages for requesting financial support. Situation: ${situation}. Tone: ${tone}. Relationship: ${relationship}.${amount ? ` Mention amount: ${amount}` : ''}${tone === 'Sexy' ? ' IMPORTANT: Use emojis strategically (💋, 😘, 🔥, 💕, 😉, 💋, 👄, etc.) to enhance the seductive and alluring tone.' : ''}`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content generated from OpenAI");
    }

    const parsedContent = JSON.parse(content);

    const items: SugarDaddyMessageItem[] = parsedContent.items.map((item: any, index: number) => ({
      id: item.id || `sd-${Date.now()}-${index}`,
      text: item.text,
      toneTag: item.toneTag || tone
    }));

    const response: SugarDaddyMessageResponse = {
      items,
      metadata: {
        situation,
        tone,
        relationship,
        amount,
        count
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error in Sugar Daddy Message Generator:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate messages' },
      { status: 500 }
    );
  }
}

