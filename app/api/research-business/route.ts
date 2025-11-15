import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { BusinessInfo } from "@/types";
import { detectBusinessType } from "@/lib/detectBusinessType";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessInfo, userType, creatorGoals, guidance } = body as { 
      businessInfo: BusinessInfo;
      userType?: 'business' | 'creator';
      creatorGoals?: string;
      guidance?: string;
    };

    if (!businessInfo) {
      return NextResponse.json(
        { error: "Missing business information" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    // Don't log API key information

    // Initialize OpenAI client lazily (only when route is called)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Only detect business type for business users, not creators
    let actualBusinessType: string = businessInfo.businessType;
    if (userType !== 'creator') {
      // CRITICAL: Use AI-powered detection to identify actual business type
      actualBusinessType = await detectBusinessType(
        businessInfo.businessName,
        businessInfo.location,
        businessInfo.businessType,
        process.env.OPENAI_API_KEY!
      ) as string;
      
      // Log business type detection without sensitive data
      console.log("Business type detection completed");
    } else {
      console.log("🎬 Creator strategy requested - skipping business type detection");
    }

    // Generate strategy based on user type (business or creator)
    // If guidance is provided, incorporate it into the prompt
    const researchPrompt = userType === 'creator'
      ? buildCreatorStrategyPrompt(businessInfo, creatorGoals, guidance)
      : buildActionableStrategyPrompt(businessInfo, actualBusinessType, guidance);
    
    const systemMessage = userType === 'creator'
      ? guidance 
        ? "You are a content creator expert who helps creators grow their audience and engagement. Focus on viral trends, audience retention, storytelling techniques, and content optimization. Be specific to their content category and goals. CRITICAL: When the user provides guidance on how to adjust video ideas, you MUST prioritize their guidance above all else and incorporate it into every single idea. Always respond with valid JSON."
        : "You are a content creator expert who helps creators grow their audience and engagement. Focus on viral trends, audience retention, storytelling techniques, and content optimization. Be specific to their content category and goals. Always respond with valid JSON."
      : guidance
        ? "You are a social media expert who gives simple, actionable advice. Focus on what works: consistency, engagement, and authentic content. Keep it practical and easy to implement. CRITICAL: When the user provides guidance on how to adjust video ideas, you MUST prioritize their guidance above all else and incorporate it into every single idea. The user's guidance takes priority over generic simplicity requirements. Still keep ideas relevant to the business type. Always respond with valid JSON."
        : "You are a social media expert who gives simple, actionable advice. Focus on what works: consistency, engagement, and authentic content. Keep it practical and easy to implement. CRITICAL: Generate SIMPLE, GENERIC video ideas that are EASY TO EXECUTE - don't overthink it! Ideas should be flexible and adaptable, not requiring specific items or complicated setups. Make ideas that can be filmed anytime with simple actions like 'walk through', 'show', 'tour', 'share tips'. Still keep them relevant to the business type. Always respond with valid JSON.";
    
    // Increase temperature when guidance is provided to allow more variation and creativity
    const temperature = guidance ? 0.85 : 0.75;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: researchPrompt
        }
      ],
      temperature: temperature,
      max_tokens: 2500,
      response_format: { type: "json_object" }
    });

    const researchText = completion.choices[0].message.content || "{}";
    
    // Better error handling for JSON parsing
    let research;
    try {
      research = JSON.parse(researchText);
    } catch (parseError) {
      console.error("❌ JSON parsing error:", parseError);
      console.error("Raw response:", researchText);
      throw new Error(`Failed to parse AI response as JSON. Response: ${researchText.substring(0, 200)}...`);
    }

    // Validate the research response has all required fields (be flexible with counts)
    const isValid = research && 
      research.headlineSummary && 
      Array.isArray(research.keyPrinciples) && research.keyPrinciples.length >= 4 &&
      Array.isArray(research.postingTimes) && research.postingTimes.length >= 3 &&
      Array.isArray(research.contentIdeas) && research.contentIdeas.length >= 5;

    if (!isValid) {
      console.error("❌ CRITICAL: Invalid research response structure:", research);
      console.log("Received:", JSON.stringify(research, null, 2));
      
      // NEVER return invalid data - throw error to force retry or proper error handling
      throw new Error("AI generated incomplete research data. This should never use generic fallback templates.");
    }

    // Additional validation: ensure contentIdeas have proper structure
    const hasValidIdeas = research.contentIdeas.every((idea: any) => 
      idea.title && idea.description && idea.angle
    );

    if (!hasValidIdeas) {
      console.error("❌ CRITICAL: Content ideas missing required fields");
      throw new Error("Content ideas are malformed. Cannot use generic fallback.");
    }

    // CRITICAL: Check for generic template ideas - only for business users, not creators
    if (userType !== 'creator') {
      const genericTemplates = [
        "educational tip",
        "team introduction",
        "special offer",
        "customer testimonial",
        "behind-the-scenes look",
        "product showcase",
        "service showcase",
        "community involvement",
        "fun moment"
      ];

      const hasGenericIdeas = research.contentIdeas.some((idea: any) => {
        const titleLower = idea.title.toLowerCase();
        return genericTemplates.some(template => titleLower.includes(template));
      });

      if (hasGenericIdeas) {
        console.error("❌ CRITICAL: AI generated generic template ideas instead of contextual ones");
        console.error("Ideas received:", research.contentIdeas.map((i: any) => i.title));
        throw new Error("AI generated generic ideas instead of business-specific contextual ideas. This is unacceptable.");
      }
    }

    // Log validation success without sensitive data
    console.log("Research data validated successfully");

    return NextResponse.json({ 
      research,
      detectedBusinessType: actualBusinessType 
    });
  } catch (error: any) {
    console.error("❌ Business research error:", error);
    console.error("Error details:", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
      stack: error?.stack,
      name: error?.name
    });
    
    // Check if it's an OpenAI API authentication error
    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: "Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable." },
        { status: 401 }
      );
    }
    
    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }

    // Check for model not found or unavailable errors
    if (error?.status === 404 || error?.code === 'model_not_found' || error?.message?.includes('model')) {
      return NextResponse.json(
        { error: "AI model unavailable. Please contact support if this issue persists." },
        { status: 500 }
      );
    }

    // Return detailed error message for debugging (but sanitize for production)
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? "Failed to generate strategy. Please try again."
      : error?.message || "Failed to research business";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'production' ? undefined : `${error?.name}: ${error?.message}`,
        code: process.env.NODE_ENV === 'production' ? undefined : error?.code
      },
      { status: 500 }
    );
  }
}

function buildActionableStrategyPrompt(info: BusinessInfo, actualBusinessType: string, guidance?: string): string {
  return `
🚨 MANDATORY: THIS BUSINESS TYPE HAS BEEN VERIFIED 🚨

Business Name: "${info.businessName}"
Location: "${info.location}"
Platform: "${info.platform}"
CONFIRMED BUSINESS TYPE: "${actualBusinessType}"

⛔ DO NOT SECOND-GUESS THE BUSINESS TYPE ⛔
The business type "${actualBusinessType}" has been verified through name analysis.
You MUST create content for a "${actualBusinessType}" business.

If "${actualBusinessType}" = "Thrift Store / Resale":
- This is NOT a restaurant, cafe, bakery, or food business
- Focus on: diverse product finds (furniture, books, electronics, clothing, home decor, toys, etc.)

If "${actualBusinessType}" = "Restaurant":
- This IS a restaurant/dining business
- Focus on: full meals, dining experience, chef skills, kitchen operations

If "${actualBusinessType}" = "Cafe / Bakery":
- This IS a bakery/cafe business
- Focus on: baking, pastries, coffee, morning routines, decorating

NOW CREATE STRATEGY FOR: "${actualBusinessType}"

${getBusinessTypeGuidance(actualBusinessType)}

THINK ABOUT "${info.businessName}" specifically:
- What makes THIS business unique in ${info.location}?
- What variety of products/services do they likely offer?
- Who is their target customer?
- What problems do they solve?

Now create a comprehensive, dynamic ${info.platform} strategy that reflects the FULL SCOPE of what ${info.businessName} offers.

FOCUS ON WHAT WORKS:
1. Post consistently 
2. Make it engaging
3. Be informative
4. Add humor when appropriate
5. Show authenticity

YOUR TASK:
Provide practical advice they can implement TODAY for their ACTUAL business.

PROVIDE:

1. HEADLINE SUMMARY (1-2 sentences max)
   - Keep it simple and motivating
   - Focus on the key to success: consistent, engaging content
   - Reflect what "${info.businessName}" ACTUALLY does based on your analysis
   - Be broad and inclusive (e.g., thrift stores = "unique finds and treasures", not just "fashion")
   - Mention the real value they provide to customers

2. KEY STRATEGIES (Exactly 5 strategies)
   - Make each one ACTIONABLE (they can do it right now)
   - Focus on proven tactics that work for the ACTUAL business type you identified
   - Keep language simple and direct
   - MUST be specific to the real business (e.g., for resale shops: talk about finds, styling, sustainability)
   - **CRITICAL: Use second person ("your", "you") - these are instructions TO the business owner**
   - DO NOT use "our", "we", "us" - the business owner is reading this as advice
   
   **CRITICAL: ONE strategy MUST be platform-specific for ${info.platform}:**
   
   ${getPlatformSpecificAdvice(info.platform)}
   
   - Examples of good strategies (note the use of "your", not "our"):
     ✅ "Post 3-5 times per week at the same times to build YOUR audience expectations"
     ✅ "Start every video with a hook in the first 3 seconds to stop the scroll"
     ✅ "Show YOUR face and personality - people connect with people, not logos"
     ✅ "Reply to every comment within 24 hours to build YOUR community"
     ✅ "Mix educational content with entertainment to keep YOUR feed balanced"
     
   - WRONG examples (do NOT write like this):
     ❌ "Post Instagram Stories daily featuring OUR latest arrivals"
     ❌ "Showcase OUR ever-changing inventory"
     ❌ "Keep OUR community engaged"

3. POSTING TIMES (4 optimal times)
   - When does ${info.platform} audience engage most?
   - Consider the ACTUAL business type's customer behavior (not the stated type)
   - Keep explanations brief and practical
   - Think about when customers would be thinking about THIS type of business

4. CONTENT IDEAS (Exactly 6 video ideas)
   
⚠️ CRITICAL: Create SIMPLE, GENERIC ideas that are EASY TO EXECUTE!

The goal is to make it EASY for the business owner to create content - don't overthink it!
Ideas should be flexible and adaptable, not requiring specific items or complicated setups.

BAD Examples (too specific/complicated):
❌ "Found a 1970s Vintage Camera for $12 - Let's Test It Out!" (requires finding specific item)
❌ "Transforming This $5 Chair with a Quick Paint Job" (requires specific furniture)
❌ "Customer Finds Designer Jeans with Tags Still On - Paid $8!" (requires specific customer interaction)
❌ "Making Our Famous Signature Dish That Sells Out Every Day" (requires specific dish)
❌ "Decorating a 3-Tier Wedding Cake from Start to Finish" (requires specific order)

GOOD Examples (simple, generic, easy to execute):

For a THRIFT STORE / RESALE SHOP:
✅ "Walk through the store and show items that catch your eye - post to your story or feed"
✅ "Quick tour of different sections - furniture, clothing, accessories"
✅ "Show a few unique finds from today's inventory"
✅ "Before and after: Quick styling tips using items from the store"
✅ "Share what makes thrift shopping sustainable and fun"
✅ "Quick tips for finding great deals at thrift stores"

For a RESTAURANT:
✅ "Show what's cooking in the kitchen right now"
✅ "Quick tour of the menu - what's popular today"
✅ "Behind the scenes: What happens during prep time"
✅ "Share a simple cooking tip or technique"
✅ "Show the atmosphere - what makes dining here special"
✅ "Quick look at today's specials or fresh ingredients"

For a BAKERY/CAFÉ:
✅ "Show what's fresh out of the oven today"
✅ "Quick tour of the display case - what's available"
✅ "Behind the counter: What happens during morning prep"
✅ "Share a simple baking tip or coffee fact"
✅ "Show the cozy atmosphere - what makes this place special"
✅ "Quick look at today's specials or new items"

YOUR TASK FOR "${info.businessName}":
Generate 6 ideas that are:
1. SIMPLE and GENERIC - easy to execute without finding specific items
2. FLEXIBLE - can be filmed anytime, anywhere in the business
3. QUICK to create - don't require complicated setups or specific scenarios
4. RELEVANT to ${actualBusinessType} - still connected to what the business does
5. ACTIONABLE - clear instruction like "show", "walk through", "share", "tour"
6. DIVERSE angles: mix of educational, behind_the_scenes, testimonial, funny, offer

Think about:
- What can they film RIGHT NOW without preparation?
- What simple activities happen daily at a ${actualBusinessType}?
- What would be easy to show with a quick walk-through or tour?
- What simple tips or insights can they share?
- What makes the business atmosphere or process interesting?

Remember: The goal is "Create a video of [simple action], then post it to your story or feed - don't overthink it!"

${guidance ? `\n\n🚨🚨🚨 CRITICAL USER GUIDANCE - THIS TAKES PRIORITY 🚨🚨🚨\n\nThe user has provided specific feedback on how they want the video ideas adjusted:\n\n"${guidance}"\n\n⚠️ MANDATORY REQUIREMENTS:\n1. You MUST incorporate this guidance into ALL 6 video ideas\n2. The user's guidance takes PRIORITY over the "simple/generic" requirement\n3. If the guidance asks for more complexity, add complexity while keeping ideas executable\n4. If the guidance asks for specific angles/styles, prioritize those angles/styles\n5. Make sure EVERY idea reflects the user's guidance\n6. The ideas should still be actionable, but they should FIRST AND FOREMOST match what the user is asking for\n\nExamples of how to apply guidance:\n- If user says "more complex": Add more detailed setups, multiple steps, or deeper storytelling\n- If user says "more casual": Use casual language, relaxed formats, everyday scenarios\n- If user says "focus on behind-the-scenes": Prioritize behind_the_scenes angles\n- If user says "more educational": Add tips, facts, and teaching moments\n- If user says "shorter": Keep descriptions concise but still complete\n\nRemember: USER GUIDANCE > Generic simplicity. Follow the user's instructions!` : ''}

RESPOND WITH VALID JSON:
{
  "headlineSummary": "1-2 sentence motivating summary",
  "keyPrinciples": [
    "Actionable strategy 1",
    "Actionable strategy 2",
    "Actionable strategy 3",
    "Actionable strategy 4",
    "Actionable strategy 5"
  ],
  "postingTimes": [
    {
      "day": "Tuesday",
      "timeRange": "6:00 PM - 8:00 PM",
      "reason": "Brief, practical reason"
    }
  ],
  "contentIdeas": [
    {
      "title": "Clear, actionable title",
      "description": "Simple description of what to film",
      "angle": "funny" (one of: funny, behind_the_scenes, educational, testimonial, offer)
    }
  ]
}

Keep it SIMPLE, ACTIONABLE, and MOTIVATING!

FINAL VALIDATION:
- Does your strategy match "${actualBusinessType}"?
- If Thrift Store / Resale: NO food/dining/baking mentions
- If Restaurant: NO bakery/pastry mentions (unless it's a bakery-restaurant hybrid)
- If Cafe / Bakery: Focus on BAKING and coffee, not full restaurant meals
- Are you using "your", "you" (not "our", "we")?
- These are instructions TO the business owner, not FROM the business
- Stay consistent with the business type!
${guidance ? `\n- ⚠️ CRITICAL: Did you incorporate the user's guidance "${guidance}" into ALL 6 video ideas?\n- Double-check that each idea reflects what the user asked for!` : ''}
`;
}

function getBusinessTypeGuidance(businessType: string): string {
  const guidance: Record<string, string> = {
    "Thrift Store / Resale": `
This is a THRIFT/RESALE business.

SIMPLE, GENERIC VIDEO IDEAS SHOULD BE:
- "Walk through the store and show items that catch your eye"
- "Quick tour of different sections - furniture, clothing, accessories"
- "Show a few unique finds from today's inventory"
- "Share styling tips using items from the store"
- "Quick tips for finding great deals at thrift stores"
- "Show what makes thrift shopping sustainable and fun"
- "Tour different sections - what's new this week"
- "Share why people love shopping secondhand"

Keep ideas SIMPLE and GENERIC - don't require finding specific items or complicated setups.
Focus on easy walk-throughs, tours, and simple tips that can be filmed anytime.`,

    "Restaurant": `
This is a RESTAURANT business.

SIMPLE, GENERIC VIDEO IDEAS SHOULD BE:
- "Show what's cooking in the kitchen right now"
- "Quick tour of the menu - what's popular today"
- "Behind the scenes: What happens during prep time"
- "Share a simple cooking tip or technique"
- "Show the atmosphere - what makes dining here special"
- "Quick look at today's specials or fresh ingredients"
- "Walk through the dining area - show the vibe"
- "Share what makes this place unique"

Keep ideas SIMPLE - don't require specific dishes or complicated setups.
Focus on easy walk-throughs, quick tours, and simple behind-the-scenes content.`,

    "Cafe / Bakery": `
This is a CAFÉ/BAKERY business.

SIMPLE, GENERIC VIDEO IDEAS SHOULD BE:
- "Show what's fresh out of the oven today"
- "Quick tour of the display case - what's available"
- "Behind the counter: What happens during morning prep"
- "Share a simple baking tip or coffee fact"
- "Show the cozy atmosphere - what makes this place special"
- "Quick look at today's specials or new items"
- "Walk through the space - show the vibe"
- "Share what makes your coffee or pastries special"

Keep ideas SIMPLE - don't require specific pastries or complicated processes.
Focus on easy tours, quick behind-the-scenes, and simple tips.`,

    "Salon / Spa": `
This is a BEAUTY/WELLNESS business.

SPECIFIC VIDEO IDEAS SHOULD INCLUDE:
- "Hair transformation: [specific color] to [specific color]"
- "Watch this [length] cut transform into a [style name]"
- "Applying [number]-step [service name] treatment"
- "[Service] before & after reveal - Client's reaction"
- "How we achieve the perfect [specific technique]"
- "Client asks for [celebrity name]'s hairstyle - Here's the result"
- "[Time]-minute express [service] time-lapse"
- "Fixing a [color/cut] disaster from another salon"

Focus on transformations, techniques, before/after, client reactions`,

    "Gym / Fitness": `
This is a FITNESS business.

SPECIFIC VIDEO IDEAS SHOULD INCLUDE:
- "[Exercise name]: Common mistakes and how to fix them"
- "Member's [timeframe] transformation - From [weight/condition] to [goal]"
- "Our [class name] class in 60 seconds - Pure energy"
- "Trainer demonstrates [specific workout] - Try this at home"
- "[Day] morning at [time]: The dedicated early birds"
- "New [equipment name] - How to use it properly"
- "Member achieves [specific goal] - Their emotional reaction"
- "[Number]-minute [body part] blast workout"

Focus on specific exercises, transformations, classes, techniques`,

    "Real Estate": `
This is a REAL ESTATE business.

SPECIFIC VIDEO IDEAS SHOULD INCLUDE:
- "First-time buyers react to their dream home in [neighborhood]"
- "Tour this $[price] [property type] in [location] - [key features]"
- "SOLD in [timeframe]! Here's how we did it for [client type]"
- "What $[price] gets you in [neighborhood] vs [neighborhood]"
- "This home has [unique feature] - You won't believe it"
- "Home inspection finds [issue] - Negotiation saves client $[amount]"
- "Before listing: Staging this [property type] to sell fast"
- "Market update: [neighborhood] home prices [trend]"

Focus on specific properties, pricing, neighborhoods, success stories`,

    "Retail Shop": `
This is a RETAIL business.

SPECIFIC VIDEO IDEAS SHOULD INCLUDE:
- "Just arrived: [specific product/brand] unboxing and first look"
- "Style this [item] [number] different ways"
- "Customer finds the perfect [product] after [timeframe] of searching"
- "Restock day: Unpacking [brand/category] shipment"
- "Our top [number] best-sellers this week - Here's why"
- "How to choose the right [product type] for your [use case]"
- "[Season] collection reveal - [number] new pieces"
- "Found the last [popular item] in [size/color] - Customer's reaction"

Focus on specific products, styling, restocks, trends, customer finds`,

    "Movie Theater": `
This is a MOVIE THEATER business.

SPECIFIC VIDEO IDEAS SHOULD INCLUDE:
- "Setting up Theater [number] for tonight's premiere - Behind the scenes"
- "Staff member tries every snack combo - Finding the best deal"
- "Opening week's movie shipment - What's coming next"
- "Cleaning and prepping all [number] theaters before opening"
- "Customer reactions leaving [popular movie name]"
- "How we make fresh popcorn - [number] pounds per day"
- "Projectionist shows how movies are loaded and played"
- "Our secret menu hacks that regulars know about"

Focus on behind-the-scenes, premiere events, concessions, customer experiences`
  };

  return guidance[businessType] || `
This is a ${businessType} business. Create content that showcases their products/services,
builds community, and demonstrates their expertise.`;
}

function getPlatformSpecificAdvice(platform: string): string {
  const platformAdvice: Record<string, string> = {
    "Instagram": `
   For Instagram specifically:
   ✅ "Post Instagram Stories daily to stay top-of-mind - Stories keep your community engaged between posts and show authenticity"
   ✅ "Use all Story features: polls, questions, countdowns - these drive engagement and make followers feel involved"
   OR create a strategy around Instagram Reels, hashtags, or carousel posts.`,
    
    "TikTok": `
   For TikTok specifically:
   ✅ "Jump on trending sounds within 24 hours - TikTok's algorithm heavily favors content using trending audio"
   ✅ "Post at least once per day - TikTok rewards consistency more than any other platform"
   OR create a strategy around TikTok's For You Page algorithm, duets/stitches, or hashtag challenges.`,
    
    "Facebook": `
   For Facebook specifically:
   ✅ "Engage in local community groups and respond to every comment - Facebook's algorithm prioritizes meaningful conversations"
   ✅ "Go live at least once a week - Facebook Live gets 6x more engagement than regular videos"
   OR create a strategy around Facebook Groups, local community building, or event promotion.`,
    
    "YouTube Shorts": `
   For YouTube Shorts specifically:
   ✅ "Hook viewers in the first 1-2 seconds - YouTube Shorts are all about stopping the scroll instantly"
   ✅ "Keep Shorts between 15-45 seconds - this length performs best for watch time and retention"
   OR create a strategy around vertical video optimization, YouTube's recommendation algorithm, or cross-promotion with regular videos.`
  };

  return platformAdvice[platform] || platformAdvice["Instagram"];
}

function buildCreatorStrategyPrompt(info: BusinessInfo, goals?: string, guidance?: string): string {
  const goalsSection = goals ? `\nCreator Goals: "${goals}"` : "";
  
  return `
🎬 CREATOR STRATEGY REQUEST 🎬

Creator Name: "${info.businessName}"
Content Category: "${info.businessType}"
Platform: "${info.platform}"
Location: "${info.location}"${goalsSection}

YOUR TASK:
Create a comprehensive content strategy for this ${info.platform} creator focusing on ${info.businessType} content.

IMPORTANT: This is for a CONTENT CREATOR, not a business. Focus on:
- Viral content trends in ${info.businessType}
- Audience retention and engagement techniques
- Storytelling and content structure
- Platform-specific optimization for ${info.platform}
- Building a loyal community
${goals ? `- Helping achieve their goals: ${goals}` : ''}

PROVIDE:

1. HEADLINE SUMMARY (1-2 sentences)
   - Motivating message about growing as a ${info.businessType} creator
   - Focus on authenticity, consistency, and audience connection

2. KEY STRATEGIES (Exactly 5 strategies)
   - Focus on content creation, not business operations
   - Include trending formats and techniques
   - Platform-specific algorithm tips
   - Audience engagement tactics
   - Content quality and production tips
   - Use "your" and "you" (advice TO the creator)

3. POSTING TIMES (4 optimal times)
   - When does ${info.platform} audience for ${info.businessType} content engage most?
   - Consider creator audience demographics
   - Brief, practical explanations

4. CONTENT IDEAS (Exactly 6 video ideas)
   - GENERAL and FLEXIBLE content ideas that work for most ${info.businessType} creators
   - Focus on proven formats that consistently get engagement
   - Make them adaptable to different styles and approaches
   - Keep titles broad and appealing
   - Include a mix of evergreen and trendy content types
   
   Examples of GOOD general ideas:
   ✅ "Quick Tips for [Topic]" - Share 3-5 quick actionable tips
   ✅ "Common Mistakes to Avoid" - Help viewers avoid pitfalls
   ✅ "My [Time Period] Journey" - Personal progress/story content
   ✅ "Trying [Trending Thing]" - Participate in trends
   ✅ "Beginner's Guide to [Topic]" - Educational evergreen content
   ✅ "Things I Wish I Knew About [Topic]" - Relatable experience sharing
   
   BAD (too specific):
   ❌ "Recreating My Favorite Level from Mario 64" - too narrow
   ❌ "Building a PC with Only Used Parts from eBay" - too specific
   
   Make ideas that 80% of ${info.businessType} creators could use!

${guidance ? `\n\n🚨🚨🚨 CRITICAL USER GUIDANCE - THIS TAKES PRIORITY 🚨🚨🚨\n\nThe user has provided specific feedback on how they want the video ideas adjusted:\n\n"${guidance}"\n\n⚠️ MANDATORY REQUIREMENTS:\n1. You MUST incorporate this guidance into ALL 6 video ideas\n2. The user's guidance takes PRIORITY over general/flexible requirements\n3. If the guidance asks for more complexity, add complexity while keeping ideas adaptable\n4. If the guidance asks for specific angles/styles, prioritize those angles/styles\n5. Make sure EVERY idea reflects the user's guidance\n6. The ideas should still be adaptable, but they should FIRST AND FOREMOST match what the user is asking for\n\nExamples of how to apply guidance:\n- If user says "more complex": Add more detailed setups, multiple steps, or deeper storytelling\n- If user says "more casual": Use casual language, relaxed formats, everyday scenarios\n- If user says "focus on behind-the-scenes": Prioritize behind_the_scenes angles\n- If user says "more educational": Add tips, facts, and teaching moments\n- If user says "shorter": Keep descriptions concise but still complete\n\nRemember: USER GUIDANCE > Generic flexibility. Follow the user's instructions!` : ''}

RESPONSE FORMAT (MUST be valid JSON):
{
  "headlineSummary": "string",
  "keyPrinciples": ["strategy1", "strategy2", "strategy3", "strategy4", "strategy5"],
  "postingTimes": [
    {"day": "string", "timeRange": "string", "reason": "string"},
    {"day": "string", "timeRange": "string", "reason": "string"},
    {"day": "string", "timeRange": "string", "reason": "string"},
    {"day": "string", "timeRange": "string", "reason": "string"}
  ],
  "contentIdeas": [
    {"title": "string", "description": "string", "angle": "string"},
    {"title": "string", "description": "string", "angle": "string"},
    {"title": "string", "description": "string", "angle": "string"},
    {"title": "string", "description": "string", "angle": "string"},
    {"title": "string", "description": "string", "angle": "string"},
    {"title": "string", "description": "string", "angle": "string"}
  ]
}`;
}
