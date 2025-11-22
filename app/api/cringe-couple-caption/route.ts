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
      usageCount = userProgress?.cringeCoupleCaptionCount ?? 0;
    } else {
      const usageCookie = request.cookies.get('ccc_usage');
      usageCount = usageCookie ? parseInt(usageCookie.value) : 0;
    }

    if (!isPro && usageCount >= FREE_LIMIT) {
      return NextResponse.json({ 
        error: "You've used your free generation. Upgrade to Pro for unlimited access!",
        requiresUpgrade: true 
      }, { status: 403 });
    }

    const body = await request.json();
    const { style, count } = body;
    
    // Enforce max limit of 3
    const validCount = Math.min(Math.max(parseInt(count) || 3, 1), 3);

    const systemPrompt = `You are a Cringe Couple Caption Generator - an expert at creating hilariously cringeworthy couple captions for social media posts. These captions should be overly romantic, cheesy, and perfect for making fun of or creating intentionally cringe content.`;

    const userPrompt = `Generate ${validCount} cringe couple captions${style ? ` in the style of: ${style}` : ''}.

Each caption should be:
- Overly romantic and cheesy
- Use couple emojis and romantic language
- Sound like something you'd see on Instagram or TikTok
- Be intentionally cringeworthy but still recognizable

Format as JSON:
{
  "captions": [
    "caption 1",
    "caption 2",
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
        const { data: userProgress, error: loadError } = await loadUserProgress(user.id);
        if (!loadError && userProgress) {
          await saveUserProgress(user.id, {
            ...userProgress,
            cringeCoupleCaptionCount: newCount,
          });
        } else {
          await saveUserProgress(user.id, {
            businessInfo: null, strategy: null, selectedIdea: null, postDetails: null, currentStep: 'form',
            cringeCoupleCaptionCount: newCount,
          });
        }
      } else {
        finalResponse.cookies.set('ccc_usage', newCount.toString(), {
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: false,
          sameSite: 'lax',
          path: '/',
        });
      }
    }

    return finalResponse;
  } catch (error: any) {
    console.error('Cringe Couple Caption API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate captions', details: error.message },
      { status: 500 }
    );
  }
}

