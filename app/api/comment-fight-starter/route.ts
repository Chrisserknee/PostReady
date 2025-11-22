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
      usageCount = userProgress?.commentFightStarterCount ?? 0;
    } else {
      const usageCookie = request.cookies.get('cfs_usage');
      usageCount = usageCookie ? parseInt(usageCookie.value) : 0;
    }

    if (!isPro && usageCount >= FREE_LIMIT) {
      return NextResponse.json({ 
        error: "You've used your free generation. Upgrade to Pro for unlimited access!",
        requiresUpgrade: true 
      }, { status: 403 });
    }

    const body = await request.json();
    const { topic, platform, tone, count } = body;

    const systemPrompt = `You are a Comment Fight Starter Generator - an expert at creating controversial, debate-provoking comments designed to spark arguments and engagement in social media comment sections. These comments should be provocative but not hateful, designed to get people talking and debating.`;

    const userPrompt = `Generate ${count || 5} comment fight starters${topic ? ` about: ${topic}` : ''}${platform ? ` for ${platform}` : ''}${tone ? ` with a ${tone} tone` : ''}.

Each comment should:
- Be controversial or provocative
- Spark debate and discussion
- Get people to respond and argue
- Be engaging but not hateful
- Sound like a real comment someone would post

Format as JSON:
{
  "comments": [
    "comment 1",
    "comment 2",
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
            commentFightStarterCount: newCount,
          });
        } else {
          await saveUserProgress(user.id, {
            businessInfo: null, strategy: null, selectedIdea: null, postDetails: null, currentStep: 'form',
            commentFightStarterCount: newCount,
          });
        }
      } else {
        finalResponse.cookies.set('cfs_usage', newCount.toString(), {
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: false,
          sameSite: 'lax',
          path: '/',
        });
      }
    }

    return finalResponse;
  } catch (error: any) {
    console.error('Comment Fight Starter API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate comments', details: error.message },
      { status: 500 }
    );
  }
}

