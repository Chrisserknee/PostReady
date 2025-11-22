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
      usageCount = userProgress?.randomExcuseCount ?? 0;
    } else {
      const usageCookie = request.cookies.get('re_usage');
      usageCount = usageCookie ? parseInt(usageCookie.value) : 0;
    }

    if (!isPro && usageCount >= FREE_LIMIT) {
      return NextResponse.json({ 
        error: "You've used your free generation. Upgrade to Pro for unlimited access!",
        requiresUpgrade: true 
      }, { status: 403 });
    }

    const body = await request.json();
    const { situation, believability, count } = body;

    const systemPrompt = `You are a Random Excuse Generator - an expert at creating creative, believable (or hilariously unbelievable) excuses for various situations. You can generate both realistic excuses and over-the-top, funny excuses.`;

    const userPrompt = `Generate ${count || 5} excuses${situation ? ` for: ${situation}` : ''}${believability ? ` with ${believability} believability` : ''}.

Each excuse should:
- Be creative and unique
- Match the requested believability level
- Be appropriate for the situation
- Sound like something someone might actually say
${believability === 'unbelievable' || believability === 'hilarious' ? '- Be hilariously over-the-top and unbelievable' : '- Be believable and realistic'}

Format as JSON:
{
  "excuses": [
    "excuse 1",
    "excuse 2",
    ...
  ]
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
        const { data: currentProgress } = await loadUserProgress(user.id);
        await saveUserProgress(user.id, {
          ...currentProgress,
          randomExcuseCount: newCount,
          currentStep: currentProgress?.currentStep || 'form',
        });
      } else {
        finalResponse.cookies.set('re_usage', newCount.toString(), {
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: false,
          sameSite: 'lax',
          path: '/',
        });
      }
    }

    return finalResponse;
  } catch (error: any) {
    console.error('Random Excuse API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate excuses', details: error.message },
      { status: 500 }
    );
  }
}

