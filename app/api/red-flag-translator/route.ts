import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabaseClient } from '@/lib/auth-utils';
import { loadUserProgress, saveUserProgress } from '@/lib/userProgress';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let isPro = false;
    let usageCount = 0;
    const FREE_LIMIT = 1;

    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_pro')
        .eq('id', user.id)
        .maybeSingle();
      
      isPro = profile?.is_pro === true;
      
      const { data: userProgress } = await loadUserProgress(user.id);
      usageCount = userProgress?.redFlagTranslatorCount ?? 0;
    } else {
      const usageCookie = request.cookies.get('rft_usage');
      usageCount = usageCookie ? parseInt(usageCookie.value) : 0;
    }

    if (!isPro && usageCount >= FREE_LIMIT) {
      return NextResponse.json({ 
        error: "You've used your free generation. Upgrade to Pro for unlimited access!",
        requiresUpgrade: true 
      }, { status: 403 });
    }

    const body = await request.json();
    const { text, context } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a Red Flag Translator - an expert at decoding hidden meanings, passive-aggressive language, and subtle warning signs in text messages, social media posts, and conversations. Your job is to translate what people REALLY mean when they say things that seem innocent but are actually red flags.`;

    const userPrompt = `Translate this text and reveal the red flags: "${text}"
${context ? `Context: ${context}` : ''}

Provide a translation that:
1. Explains what they REALLY mean
2. Identifies the red flags
3. Explains why it's problematic
4. Suggests how to respond (optional)

Format as JSON:
{
  "original": "original text",
  "translation": "what they really mean",
  "redFlags": ["flag 1", "flag 2"],
  "explanation": "why this is problematic",
  "response": "suggested response"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0].message.content?.trim() || '{}';
    const result = JSON.parse(responseText);

    const finalResponse = NextResponse.json(result);

    if (!isPro) {
      const newCount = usageCount + 1;
      
      if (user) {
        const { data: currentProgress } = await loadUserProgress(user.id);
        await saveUserProgress(user.id, {
          ...currentProgress,
          redFlagTranslatorCount: newCount,
          currentStep: currentProgress?.currentStep || 'form',
        });
      } else {
        finalResponse.cookies.set('rft_usage', newCount.toString(), {
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: false,
          sameSite: 'lax',
          path: '/',
        });
      }
    }

    return finalResponse;
  } catch (error: any) {
    console.error('Red Flag Translator API error:', error);
    return NextResponse.json(
      { error: 'Failed to translate red flags', details: error.message },
      { status: 500 }
    );
  }
}

