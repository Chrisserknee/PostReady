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
    const { data: { user } } = await supabase.auth.getUser();

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
      usageCount = userProgress?.poorLifeChoicesAdvisorCount ?? 0;
    } else {
      const usageCookie = request.cookies.get('plca_usage');
      usageCount = usageCookie ? parseInt(usageCookie.value) : 0;
    }

    if (!isPro && usageCount >= FREE_LIMIT) {
      return NextResponse.json({ 
        error: "You've used your free generation. Upgrade to Pro for unlimited access!",
        requiresUpgrade: true 
      }, { status: 403 });
    }

    const body = await request.json();
    const { situation, tone } = body;

    if (!situation || !situation.trim()) {
      return NextResponse.json(
        { error: 'Situation is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a Poor Life Choices Advisor - a humorous, sarcastic advisor who gives terrible but entertaining advice about poor life choices. You should be funny, relatable, and acknowledge that sometimes people make bad decisions, but do it in a way that's entertaining and not actually harmful.`;

    const userPrompt = `Someone is asking for advice about: "${situation}"
${tone ? `Tone: ${tone}` : ''}

Provide humorous, sarcastic advice that:
1. Acknowledges it's probably a bad idea
2. Gives entertaining "advice" anyway
3. Is funny and relatable
4. Doesn't actually encourage harmful behavior
5. Has a sense of humor about poor life choices

Format as JSON:
{
  "situation": "the situation",
  "advice": "humorous advice about the poor life choice",
  "warnings": ["warning 1", "warning 2"],
  "humor": "funny take on the situation"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0].message.content?.trim() || '{}';
    const result = JSON.parse(responseText);

    const finalResponse = NextResponse.json(result);

    if (!isPro) {
      const newCount = usageCount + 1;
      
      if (user) {
        const { data: userProgress, error: loadError } = await loadUserProgress(user.id);
        if (!loadError && userProgress) {
          await saveUserProgress(user.id, {
            ...userProgress,
            poorLifeChoicesAdvisorCount: newCount,
          });
        } else {
          await saveUserProgress(user.id, {
            businessInfo: null, strategy: null, selectedIdea: null, postDetails: null, currentStep: 'form',
            poorLifeChoicesAdvisorCount: newCount,
          });
        }
      } else {
        finalResponse.cookies.set('plca_usage', newCount.toString(), {
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: false,
          sameSite: 'lax',
          path: '/',
        });
      }
    }

    return finalResponse;
  } catch (error: any) {
    console.error('Poor Life Choices Advisor API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate advice', details: error.message },
      { status: 500 }
    );
  }
}

