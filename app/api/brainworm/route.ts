import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { BrainwormRequest, BrainwormResponse, BrainwormItem } from '@/types';
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

    if (user) {
      // User is logged in - check Pro status and user_progress table
      console.log('🧠 Brainworm API: User found:', user.id, user.email);
      
      // Try to get Pro status directly from user_profiles using the same supabase client
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_pro, plan_type')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('🧠 Brainworm API: Error fetching profile:', profileError);
      }
      
      isPro = profile?.is_pro === true;
      console.log('🧠 Brainworm API: Direct Pro check:', { 
        isPro, 
        is_pro_value: profile?.is_pro, 
        plan_type: profile?.plan_type,
        profileError: profileError?.message 
      });
      
      // Also try verifyProAccess as fallback
      if (!isPro) {
        const proCheck = await verifyProAccess(request);
        if (proCheck.isPro) {
          isPro = true;
          console.log('🧠 Brainworm API: verifyProAccess returned Pro status');
        }
      }
      
      const { data: userProgress, error: progressError } = await loadUserProgress(user.id);
      if (progressError) {
        console.error('Error loading user progress:', progressError);
      }
      usageCount = userProgress?.brainwormCount ?? 0;
      console.log('🧠 Brainworm API: Usage count:', usageCount, 'isPro:', isPro);
    } else {
      // User is NOT logged in - check cookie usage
      const usageCookie = request.cookies.get('bw_usage');
      usageCount = usageCookie ? parseInt(usageCookie.value) : 0;
    }

    // 2. Check Usage Limit
    console.log('🧠 Brainworm API: Checking limit - isPro:', isPro, 'usageCount:', usageCount, 'FREE_LIMIT:', FREE_LIMIT);
    if (!isPro && usageCount >= FREE_LIMIT) {
      console.log('🧠 Brainworm API: Limit reached, blocking request');
      return NextResponse.json({ 
        error: "You've used your free generation. Upgrade to Pro for unlimited access!",
        requiresUpgrade: true 
      }, { status: 403 });
    }
    console.log('🧠 Brainworm API: Limit check passed, proceeding with generation');

    const body: BrainwormRequest = await request.json();
    const { context, vibe, count } = body;

    // Construct the system prompt
    const systemPrompt = `You are an expert in viral psychology and compelling storytelling. Your goal is to generate "Brainworm Phrases" — irresistibly engaging, sticky lines that make viewers pause and want to watch more.

    CRITICAL INSTRUCTIONS FOR MAXIMUM ENGAGEMENT:
    - Phrases must be SHORT (2-6 words) and COMPELLING. Every word should create intrigue.
    - Use sophisticated psychological hooks: curiosity gaps, open loops, social proof, subtle FOMO, exclusivity, relatability.
    - Create phrases that spark CURIOSITY rather than demand attention — make viewers WANT to know more.
    - Use INTRIGUING STATEMENTS: "This changed everything", "Nobody talks about this", "The detail everyone missed"
    - Leverage SOCIAL PROOF subtly: "Real ones know", "Everyone's doing this", "This is why people..."
    - Create GENTLE URGENCY: "Before you scroll", "Wait until you see", "This part though"
    - Use EMOTIONAL CONNECTION: Relatability, intrigue, mystery, insider knowledge
    - Tone should match the requested vibe: ${vibe}, but make it COMPELLING and IRRESISTIBLE.
    - Context: ${context ? `Tailor to: ${context}, but keep it universally engaging.` : 'Generic viral hooks that work on any content.'}
    
    ENGAGING EXAMPLES (use these as inspiration for compelling phrasing):
    - "This detail changes everything."
    - "Nobody talks about this part."
    - "Real ones know what's coming."
    - "Wait until you see this."
    - "This is why people stay."
    - "The part everyone skips."
    - "This changed my perspective."
    - "You'll want to see this."
    - "The detail that matters."
    - "This is the moment."
    - "Why this actually works."
    - "The thing nobody mentions."
    - "This is what changed it."
    - "Wait for this part."
    - "The detail that explains it."

    FOCUS ON ENGAGEMENT, NOT AGGRESSION. These phrases should feel IRRESISTIBLE and CURIOUS, not demanding.
    Make viewers feel intrigued and compelled to watch, like they're discovering something valuable.

    Return ONLY a JSON object with an "items" array containing objects with:
    - "id" (string)
    - "text" (string): The phrase itself (MUST be engaging and curiosity-driven).
    - "vibeTag" (string): The vibe category (e.g. Suspense, Secret, Urgency).
    - "explanation" (string): A very short (3-5 words) note on the psychological hook used (e.g. "Curiosity gap", "Open loop", "Social proof").`;

    const userPrompt = `Generate ${count} highly engaging and compelling brainworm phrases for a ${context || 'general'} video with a "${vibe}" vibe. Make them irresistibly curious and intriguing. Use sophisticated psychological hooks that make viewers want to watch. Focus on engagement through curiosity, not aggression.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.9, // High creativity for engaging, compelling hooks
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content generated from OpenAI");
    }

    const parsedContent = JSON.parse(content);
    
    const items: BrainwormItem[] = parsedContent.items.map((item: any, index: number) => ({
      id: item.id || `bw-${Date.now()}-${index}`,
      text: item.text,
      vibeTag: item.vibeTag || vibe,
      explanation: item.explanation
    }));

    const jsonResponse: BrainwormResponse = {
      items,
      metadata: {
        context,
        vibe,
        count
      }
    };

    // 3. Increment Usage Count (if not Pro)
    const finalResponse = NextResponse.json(jsonResponse);

    if (!isPro) {
      const newCount = usageCount + 1;

      if (user) {
        // Update user progress table
        const { data: userProgress, error: loadError } = await loadUserProgress(user.id);
        if (!loadError && userProgress) {
          await saveUserProgress(user.id, {
            ...userProgress,
            brainwormCount: newCount,
          });
        } else {
          // If no existing progress, create one
          await saveUserProgress(user.id, {
            businessInfo: null, strategy: null, selectedIdea: null, postDetails: null, currentStep: 'form',
            brainwormCount: newCount,
          });
        }
      } else {
        // Update cookie
        finalResponse.cookies.set('bw_usage', newCount.toString(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 365, // 1 year
          path: '/',
        });
      }
    }

    return finalResponse;

  } catch (error: any) {
    console.error('Error in Brainworm Generator:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate brainworms' },
      { status: 500 }
    );
  }
}

