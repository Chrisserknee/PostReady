import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerSupabaseClient, verifyProAccess } from '@/lib/auth-utils';
import { loadUserProgress, saveUserProgress } from '@/lib/userProgress';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('🛡️ KidSafe URL Checker API: ========== START ==========');
    
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🛡️ KidSafe URL Checker API: Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
    });

    let isPro = false;
    let usageCount = 0;
    const FREE_LIMIT = 1;

    if (user) {
      console.log('🛡️ KidSafe URL Checker API: User found:', user.id, user.email);
      
      const proCheck = await verifyProAccess(request, supabase);
      isPro = proCheck.isPro;
      
      if (!isPro) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_pro, plan_type')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile?.is_pro === true) {
          isPro = true;
        }
      }
      
      if (!isPro) {
        const { data: userProgress } = await loadUserProgress(user.id);
        usageCount = userProgress?.kidsafeUrlCheckerCount ?? 0;
        console.log('🛡️ KidSafe URL Checker API: Non-Pro user, usage count:', usageCount);
      }
    } else {
      const usageCookie = request.cookies.get('ksuc_usage');
      if (usageCookie) {
        usageCount = parseInt(usageCookie.value) || 0;
      }
      console.log('🛡️ KidSafe URL Checker API: Guest user, usage count:', usageCount);
    }

    if (!isPro && usageCount >= FREE_LIMIT) {
      console.log('🛡️ KidSafe URL Checker API: Usage limit exceeded');
      return NextResponse.json(
        { 
          error: 'Free usage limit reached. Please upgrade to Pro for unlimited checks.',
          requiresUpgrade: true
        },
        { status: 403 }
      );
    }

    const { url } = await request.json();

    if (!url || typeof url !== 'string' || url.length > 500) {
      return NextResponse.json(
        { error: 'Invalid URL. Please provide a valid URL (max 500 characters).' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format. Please provide a valid URL.' },
        { status: 400 }
      );
    }

    console.log('🛡️ KidSafe URL Checker API: Checking URL:', url);

    // Check for explicit adult content keywords in URL
    const urlLower = url.toLowerCase();
    const explicitKeywords = [
      'porn', 'xxx', 'adult', 'sex', 'nude', 'naked', 'erotic', 'explicit',
      'theporndude', 'pornhub', 'xvideos', 'redtube', 'xnxx', 'youporn'
    ];
    
    const hasExplicitContent = explicitKeywords.some(keyword => urlLower.includes(keyword));

    const prompt = `Analyze the following website URL for child safety (children under 13). Provide a comprehensive safety assessment.

URL: ${url}

CRITICAL SCORING GUIDELINES:
- Websites with pornography, explicit sexual content, or adult-only material MUST receive a safety score of 0 (zero)
- Websites with inappropriate adult content MUST have isSafe: false
- Only completely safe, educational, or child-appropriate content should receive scores above 0
- If the website contains ANY explicit adult content, the safety score MUST be 0

Please analyze this website and provide:
1. A safety score from 0-100 (where 100 is completely safe, 0 is extremely unsafe - USE 0 FOR ANY ADULT/EXPLICIT CONTENT)
2. Whether it's safe for children under 13 (true/false - MUST be false for adult content)
3. A list of specific safety concerns if any (e.g., inappropriate content, ads, data collection, etc.)
4. A clear explanation of why it's safe or unsafe
5. Recommendations for parents if there are concerns

Respond in JSON format:
{
  "isSafe": boolean,
  "safetyScore": number (0-100, MUST be 0 for adult/explicit content),
  "concerns": string[],
  "explanation": string,
  "recommendations": string[]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a strict child safety expert specializing in analyzing websites for age-appropriateness. You MUST assign a safety score of 0 (zero) to ANY website containing pornography, explicit sexual content, or adult-only material. Websites with such content are NEVER safe for children under 13 and MUST receive a score of 0. Be very strict and thorough in your analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    let safetyResult;
    
    try {
      // Extract JSON from response if it's wrapped in markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      safetyResult = JSON.parse(jsonText);
      
      // Force score to 0 if explicit content detected or if isSafe is false and score is low
      if (hasExplicitContent) {
        safetyResult.safetyScore = 0;
        safetyResult.isSafe = false;
        console.log('🛡️ KidSafe URL Checker API: Explicit content detected in URL, forcing score to 0');
      } else if (!safetyResult.isSafe && safetyResult.safetyScore > 0) {
        // If marked as unsafe but score is above 0, check if it should be 0
        const explanationLower = (safetyResult.explanation || '').toLowerCase();
        const concernsText = (safetyResult.concerns || []).join(' ').toLowerCase();
        const hasAdultContentKeywords = ['porn', 'explicit', 'adult content', 'sexual', 'xxx', 'inappropriate'].some(
          keyword => explanationLower.includes(keyword) || concernsText.includes(keyword)
        );
        
        if (hasAdultContentKeywords) {
          safetyResult.safetyScore = 0;
          console.log('🛡️ KidSafe URL Checker API: Adult content detected in analysis, forcing score to 0');
        }
      }
      
      // Ensure score is 0 if explicitly marked as unsafe for adult content
      if (!safetyResult.isSafe && safetyResult.safetyScore < 10) {
        // If score is already very low and marked unsafe, ensure it's 0 for adult content
        const allText = `${safetyResult.explanation} ${safetyResult.concerns.join(' ')}`.toLowerCase();
        if (allText.includes('porn') || allText.includes('explicit') || allText.includes('adult content') || allText.includes('sexual content')) {
          safetyResult.safetyScore = 0;
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback response
      safetyResult = {
        isSafe: false,
        safetyScore: hasExplicitContent ? 0 : 50,
        concerns: ['Unable to fully analyze website'],
        explanation: 'Unable to complete full safety analysis. Please verify the website manually.',
        recommendations: ['Review the website content manually', 'Check privacy policies', 'Monitor child\'s usage']
      };
    }

    const result = {
      url: url,
      ...safetyResult
    };

    // Save usage
    if (user && !isPro) {
      const { data: userProgress } = await loadUserProgress(user.id);
      await saveUserProgress(user.id, {
        businessInfo: userProgress?.businessInfo ?? null,
        strategy: userProgress?.strategy ?? null,
        selectedIdea: userProgress?.selectedIdea ?? null,
        postDetails: userProgress?.postDetails ?? null,
        currentStep: userProgress?.currentStep ?? 'form',
        generateIdeasCount: userProgress?.generateIdeasCount ?? 0,
        rewriteCount: userProgress?.rewriteCount ?? 0,
        regenerateCount: userProgress?.regenerateCount ?? 0,
        rewordTitleCount: userProgress?.rewordTitleCount ?? 0,
        hashtagCount: userProgress?.hashtagCount ?? 0,
        guideAICount: userProgress?.guideAICount ?? 0,
        sugarDaddyCount: userProgress?.sugarDaddyCount ?? 0,
        brainwormCount: userProgress?.brainwormCount ?? 0,
        commentBaitCount: userProgress?.commentBaitCount ?? 0,
        trendRadarCount: userProgress?.trendRadarCount ?? 0,
        redFlagTranslatorCount: userProgress?.redFlagTranslatorCount ?? 0,
        cringeCoupleCaptionCount: userProgress?.cringeCoupleCaptionCount ?? 0,
        commentFightStarterCount: userProgress?.commentFightStarterCount ?? 0,
        poorLifeChoicesAdvisorCount: userProgress?.poorLifeChoicesAdvisorCount ?? 0,
        randomExcuseCount: userProgress?.randomExcuseCount ?? 0,
        kidsafeUrlCheckerCount: (userProgress?.kidsafeUrlCheckerCount ?? 0) + 1
      });
    } else if (!user) {
      const response = NextResponse.json(result);
      response.cookies.set('ksuc_usage', String(usageCount + 1), {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      return response;
    }

    console.log('🛡️ KidSafe URL Checker API: Success');
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('🛡️ KidSafe URL Checker API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check URL safety. Please try again.' },
      { status: 500 }
    );
  }
}

