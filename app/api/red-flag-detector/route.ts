import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabaseClient, verifyProAccess } from '@/lib/auth-utils';
import { loadUserProgress, saveUserProgress } from '@/lib/userProgress';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Check Pro status FIRST, before anything else
    console.log('🚩 Red Flag Detector API: ========== START ==========');
    console.log('🚩 Red Flag Detector API: Request headers:', {
      cookie: request.headers.get('cookie')?.substring(0, 200),
      authorization: request.headers.get('authorization')?.substring(0, 50),
    });
    
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🚩 Red Flag Detector API: Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
    });

    let isPro = false;
    let usageCount = 0;
    const FREE_LIMIT = 1;

    // FIRST: Check Pro status using verifyProAccess (PRIMARY METHOD - most reliable)
    if (user) {
      console.log('🚩 Red Flag Detector API: User found:', user.id, user.email);
      
      // PRIMARY METHOD: Use verifyProAccess with the SAME supabase client to avoid session issues
      console.log('🚩 Red Flag Detector API: Checking Pro status with verifyProAccess (PRIMARY CHECK)...');
      const proCheck = await verifyProAccess(request, supabase);
      console.log('🚩 Red Flag Detector API: verifyProAccess result:', {
        isPro: proCheck.isPro,
        userId: proCheck.userId,
        error: proCheck.error
      });
      
      // TRUST verifyProAccess, but also check database directly as fallback
      isPro = proCheck.isPro;
      
      // FALLBACK: Also check directly from database - if verifyProAccess fails, trust database
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_pro, plan_type')
        .eq('id', user.id)
        .maybeSingle();
      
      console.log('🚩 Red Flag Detector API: Direct database check:', {
        hasProfile: !!profile,
        is_pro: profile?.is_pro,
        is_pro_type: typeof profile?.is_pro,
        plan_type: profile?.plan_type,
        profileError: profileError?.message,
        verifyProAccess_isPro: proCheck.isPro,
        CURRENT_isPro: isPro
      });
      
      // If verifyProAccess says false but database says true, trust database
      if (!isPro && profile) {
        const isProValue = profile.is_pro;
        const dbIsPro = isProValue === true || 
                        isProValue === 'true' || 
                        isProValue === 1 || 
                        isProValue === '1' ||
                        String(isProValue).toLowerCase() === 'true';
        
        if (dbIsPro) {
          console.log('⚠️ 🚩 Red Flag Detector API: verifyProAccess returned false but database says Pro - TRUSTING DATABASE');
          isPro = true;
        }
      }
      
      if (isPro) {
        console.log('✅ ✅ ✅ 🚩 Red Flag Detector API: Pro status CONFIRMED');
      } else {
        console.log('❌ ❌ ❌ 🚩 Red Flag Detector API: Non-Pro user confirmed. verifyProAccess error:', proCheck.error);
      }
      
      // Only check usage if NOT Pro
      if (!isPro) {
        const { data: userProgress, error: progressError } = await loadUserProgress(user.id);
        if (progressError) {
          console.error('Error loading user progress:', progressError);
        }
        usageCount = userProgress?.redFlagTranslatorCount ?? 0;
        console.log('🚩 Red Flag Detector API: Non-Pro user, usage count:', usageCount);
      } else {
        console.log('🚩 Red Flag Detector API: Pro user confirmed, skipping usage check');
      }
    } else {
      // Not logged in - check cookie usage
      const usageCookie = request.cookies.get('rfd_usage');
      usageCount = usageCookie ? parseInt(usageCookie.value) : 0;
      console.log('🚩 Red Flag Detector API: Not logged in, cookie usage:', usageCount);
    }

    // Check Usage Limit - ONLY block if we're CERTAIN user is NOT Pro
    console.log('🚩 Red Flag Detector API: Final check - isPro:', isPro, 'usageCount:', usageCount, 'FREE_LIMIT:', FREE_LIMIT, 'user:', user?.id);
    
    // CRITICAL: If isPro is true, NEVER block - allow unlimited access
    if (isPro) {
      console.log('✅ 🚩 Red Flag Detector API: Pro user confirmed, allowing unlimited access');
    } else if (!user) {
      // Not logged in - check cookie usage
      if (usageCount >= FREE_LIMIT) {
        console.log('🚩 Red Flag Detector API: Guest user limit reached, blocking request');
        return NextResponse.json({ 
          error: "You've used your free generation. Upgrade to Pro for unlimited access!",
          requiresUpgrade: true 
        }, { status: 403 });
      }
    } else if (usageCount >= FREE_LIMIT) {
      // Logged in but not Pro - block only if we're CERTAIN
      console.log('🚩 Red Flag Detector API: Logged-in non-Pro user limit reached');
      console.log('🚩 Red Flag Detector API: Double-checking Pro status one more time...');
      
      // One final Pro check before blocking - use SAME supabase client
      const finalCheck = await verifyProAccess(request, supabase);
      console.log('🚩 Red Flag Detector API: Final Pro check result:', finalCheck);
      
      if (finalCheck.isPro) {
        isPro = true;
        console.log('✅ 🚩 Red Flag Detector API: Final check confirmed Pro status, allowing request');
      } else {
        console.log('🚩 Red Flag Detector API: Confirmed non-Pro, blocking request');
        return NextResponse.json({ 
          error: "You've used your free generation. Upgrade to Pro for unlimited access!",
          requiresUpgrade: true 
        }, { status: 403 });
      }
    }
    
    console.log('✅ 🚩 Red Flag Detector API: Proceeding with generation. Final isPro:', isPro);

    const body = await request.json();
    const { text, context } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a Red Flag Detector - an expert at decoding hidden meanings, passive-aggressive language, and subtle warning signs in text messages, social media posts, and conversations. Your job is to translate what people REALLY mean when they say things that seem innocent but are actually red flags.`;

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
        const { data: userProgress, error: loadError } = await loadUserProgress(user.id);
        if (!loadError && userProgress) {
          await saveUserProgress(user.id, {
            ...userProgress,
            redFlagTranslatorCount: newCount,
          });
        } else {
          await saveUserProgress(user.id, {
            businessInfo: null, strategy: null, selectedIdea: null, postDetails: null, currentStep: 'form',
            redFlagTranslatorCount: newCount,
          });
        }
      } else {
        finalResponse.cookies.set('rfd_usage', newCount.toString(), {
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: false,
          sameSite: 'lax',
          path: '/',
        });
      }
    }

    return finalResponse;
  } catch (error: any) {
    console.error('Red Flag Detector API error:', error);
    return NextResponse.json(
      { error: 'Failed to detect red flags', details: error.message },
      { status: 500 }
    );
  }
}

