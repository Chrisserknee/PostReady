import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SugarDaddyMessageRequest, SugarDaddyMessageResponse, SugarDaddyMessageItem } from '@/types';
import { createServerSupabaseClient, verifyProAccess } from '@/lib/auth-utils';
import { loadUserProgress, saveUserProgress } from '@/lib/userProgress';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.next();
    
    // 1. Check Authentication (Optional)
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let isPro = false;
    let usageCount = 0;
    const FREE_LIMIT = 1;
    let userProgressData: any = null;

    if (user) {
      // User is logged in - check Pro status and user_progress table
      const proCheck = await verifyProAccess(request);
      isPro = proCheck.isPro;
      
      const { data: progress } = await loadUserProgress(user.id);
      userProgressData = progress;
      usageCount = progress?.sugarDaddyCount || 0;
    } else {
      // User is NOT logged in - check cookie usage
      const usageCookie = request.cookies.get('sd_usage');
      usageCount = usageCookie ? parseInt(usageCookie.value) : 0;
    }

    // 2. Check Usage Limit
    if (!isPro && usageCount >= FREE_LIMIT) {
      return NextResponse.json({ 
        error: "You've used your free generation. Upgrade to Pro for unlimited access!",
        requiresUpgrade: true 
      }, { status: 403 });
    }

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

    const jsonResponse = {
      items,
      metadata: {
        situation,
        tone,
        relationship,
        amount,
        count
      }
    };

    // 3. Increment Usage Count (if not Pro)
    const finalResponse = NextResponse.json(jsonResponse);

    if (!isPro) {
      const newCount = usageCount + 1;
      
      if (user) {
        // Update user_progress table
        const updatedProgress = {
          ...(userProgressData || {}),
          sugarDaddyCount: newCount,
          currentStep: userProgressData?.currentStep || 'tool_usage' // Ensure required field
        };
        await saveUserProgress(user.id, updatedProgress);
      } else {
        // Update cookie
        finalResponse.cookies.set('sd_usage', newCount.toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 365, // 1 year
          path: '/',
        });
      }
    }

    return finalResponse;

  } catch (error: any) {
    console.error('Error in Sugar Daddy Message Generator:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate messages' },
      { status: 500 }
    );
  }
}
