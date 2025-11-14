import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { BusinessInfo } from "@/types";
import { detectBusinessType } from "@/lib/detectBusinessType";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessInfo, mode = 'business' } = body as { businessInfo: BusinessInfo, mode?: 'business' | 'creator' };

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

    console.log("✅ OpenAI API key found, length:", process.env.OPENAI_API_KEY.length);

    // Initialize OpenAI client lazily (only when route is called)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // CRITICAL: Use AI-powered detection to identify actual business type
    const actualBusinessType = await detectBusinessType(
      businessInfo.businessName,
      businessInfo.location,
      businessInfo.businessType,
      process.env.OPENAI_API_KEY!,
      mode
    );
    
    console.log("📊 Final Type Decision:", {
      mode,
      userSelected: businessInfo.businessType,
      aiDetected: actualBusinessType,
      usingForContent: actualBusinessType
    });

    // Generate simple, actionable strategy with CORRECTED type
    const researchPrompt = buildActionableStrategyPrompt(businessInfo, actualBusinessType, mode);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: mode === 'creator' 
            ? "You are a social media expert who gives simple, actionable advice for content creators. Focus on what works: consistency, audience engagement, and authentic personal branding. Keep it practical and easy to implement. CRITICAL: You MUST generate creator-specific, contextual video ideas that reflect the creator's niche and style. NEVER use generic templates. Always be specific about what content to create. Always respond with valid JSON."
            : "You are a social media expert who gives simple, actionable advice. Focus on what works: consistency, engagement, and authentic content. Keep it practical and easy to implement. CRITICAL: You MUST generate business-specific, contextual video ideas that reflect the actual business type and location. NEVER use generic templates like 'Educational Tip' or 'Behind-the-Scenes Look'. Always be specific and filmable. Always respond with valid JSON."
        },
        {
          role: "user",
          content: researchPrompt
        }
      ],
      temperature: 0.75,
      max_tokens: 2500,
      response_format: { type: "json_object" }
    });

    const researchText = completion.choices[0].message.content || "{}";
    const research = JSON.parse(researchText);

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

    // CRITICAL: Check for generic template ideas - reject if found
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

    console.log("✅ Research data validated successfully:", {
      headlineSummary: !!research.headlineSummary,
      principlesCount: research.keyPrinciples.length,
      timesCount: research.postingTimes.length,
      ideasCount: research.contentIdeas.length,
      businessType: actualBusinessType
    });

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

    // Return detailed error message for debugging
    return NextResponse.json(
      { 
        error: error?.message || "Failed to research business",
        details: `${error?.name}: ${error?.message}`,
        code: error?.code
      },
      { status: 500 }
    );
  }
}

function buildActionableStrategyPrompt(info: BusinessInfo, actualBusinessType: string, mode: 'business' | 'creator' = 'business'): string {
  if (mode === 'creator') {
    return `
🚨 MANDATORY: THIS IS A CONTENT CREATOR 🚨

Creator Name: "${info.businessName}"
Location: "${info.location}"
Platform: "${info.platform}"
CONTENT TYPE: "${actualBusinessType}"

⛔ THIS IS FOR A CONTENT CREATOR, NOT A BUSINESS ⛔
Create a strategy for a content creator who makes "${actualBusinessType}" content.
Focus on personal branding, audience growth, and authentic creator content.

THINK ABOUT "${info.businessName}" as a creator:
- What makes THIS creator unique?
- What's their content style and niche?
- Who is their target audience?
- What value do they provide to their followers?
- How can they build their personal brand?

Now create a comprehensive ${info.platform} strategy for this content creator.

FOCUS ON WHAT WORKS FOR CREATORS:
1. Post consistently to build audience trust
2. Engage authentically with your community
3. Show your personality and be yourself
4. Create value-driven content
5. Build genuine connections with followers

YOUR TASK:
Provide practical creator advice they can implement TODAY.

PROVIDE:

1. HEADLINE SUMMARY (1-2 sentences max)
   - Keep it motivating and creator-focused
   - Focus on building their personal brand through consistent, authentic content
   - Mention the value they provide to their audience

2. KEY STRATEGIES (Exactly 5 strategies)
   - Make each one ACTIONABLE for creators
   - Focus on audience growth and engagement tactics
   - Keep language simple and direct
   - **CRITICAL: Use second person ("your", "you") - these are instructions TO the creator**
   - DO NOT use "our", "we", "us"
   
   **CRITICAL: ONE strategy MUST be platform-specific for ${info.platform}:**
   ${getPlatformSpecificAdvice(info.platform)}

3. POSTING TIMES (4 optimal times)
   - When does ${info.platform} audience engage most?
   - Consider when followers are most active
   - Keep explanations brief and practical

4. CONTENT IDEAS (Exactly 6 video ideas)
   
⚠️ CRITICAL: These ideas must be HYPER-SPECIFIC to "${info.businessName}" as a ${actualBusinessType} CREATOR!

Generate creator-specific content ideas like:

For LIFESTYLE VLOGGER:
✅ "My Real Morning Routine (No Filter, No BS)"
✅ "Day in the Life: Balancing Content Creation with Real Life"
✅ "Things I Stopped Buying That Changed My Life"
✅ "Why I Quit My 9-5 to Create Content Full-Time"
✅ "Trying Viral Life Hacks for a Week - Here's What Actually Works"

For FITNESS / WELLNESS:
✅ "My 30-Day Transformation Challenge - Week 1 Results"
✅ "5 Exercises I Do Every Morning (Takes 10 Minutes)"
✅ "What I Actually Eat in a Day to Stay Fit"
✅ "Responding to Your Fitness Questions While Working Out"
✅ "Trying the Hardest Workout Challenge on YouTube"

For FOOD & COOKING:
✅ "Making My Grandma's Secret Recipe for the First Time"
✅ "I Tried Cooking Like a Michelin Star Chef for a Week"
✅ "Turning Your Recipe Requests into Reality"
✅ "Budget Meal Prep: $50 for the Entire Week"
✅ "Rating Viral TikTok Recipes - Which Ones Are Worth It?"

YOUR TASK FOR "${info.businessName}":
Generate 6 ideas that are:
1. SPECIFIC to ${actualBusinessType} creators
2. AUTHENTIC and personal - show the real creator
3. ENGAGING - hooks that make people want to watch
4. DIVERSE angles: mix of day-in-life, educational, challenges, Q&A, authentic moments
5. REAL - actual creator content concepts, not generic templates

RESPOND WITH VALID JSON:
{
  "headlineSummary": "1-2 sentence motivating summary for creators",
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

Keep it SIMPLE, ACTIONABLE, and MOTIVATING for CONTENT CREATORS!
`;
  }
  
  return `
🚨 MANDATORY: THIS BUSINESS TYPE HAS BEEN VERIFIED 🚨

Business Name: "${info.businessName}"
Location: "${info.location}"
Platform: "${info.platform}"
CONFIRMED BUSINESS TYPE: "${actualBusinessType}"

⛔ DO NOT SECOND-GUESS THE BUSINESS TYPE ⛔
The business type "${actualBusinessType}" has been verified through name analysis.
You MUST create content for a "${actualBusinessType}" business.

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
   
⚠️ CRITICAL: These ideas must be HYPER-SPECIFIC to "${info.businessName}" as a ${actualBusinessType}!

DO NOT give generic templates like "Behind-the-Scenes Look" or "Customer Testimonial"
INSTEAD give SPECIFIC, ACTIONABLE ideas like:

BAD Examples (too generic):
❌ "Behind-the-Scenes Look - Show what happens behind the scenes"
❌ "Educational Tip - Share valuable knowledge"
❌ "Product Showcase - Highlight what makes your offering special"

GOOD Examples (specific and actionable):

For a BAKERY/CAFÉ:
✅ "The 5 AM Morning: Watch the Baker Pull Fresh Croissants from the Oven"
✅ "Decorating a 3-Tier Wedding Cake from Start to Finish"
✅ "Customer Tries Our Best-Selling Cinnamon Roll for the First Time"
✅ "How the Baker Makes Our Signature Sourdough (72-Hour Process in 60 Seconds)"
✅ "Guess the Secret Ingredient in Our Award-Winning Chocolate Chip Cookies"

For a THRIFT STORE:
✅ "Found a 1970s Vintage Camera for $12 - Let's Test It Out!"
✅ "Transforming This $5 Chair with a Quick Paint Job"
✅ "Customer Finds Designer Jeans with Tags Still On - Paid $8!"
✅ "Tour Our New Furniture Section - Everything Under $100"
✅ "Opening Mystery Donation Boxes - You Won't Believe What's Inside"

For a RESTAURANT:
✅ "Chef's Knife Skills: Chopping 50 Onions in 5 Minutes"
✅ "Making Our Famous [Signature Dish Name] That Sells Out Every Day"
✅ "Customer Ordered Our Spiciest Dish - Watch Their Reaction"
✅ "Friday Night Rush Hour in the Kitchen - Controlled Chaos"
✅ "How We Prepare 100 Steaks for Saturday Night Service"

YOUR TASK FOR "${info.businessName}":
Generate 6 ideas that are:
1. SPECIFIC to ${actualBusinessType} - mention actual activities, products, or processes
2. VISUAL and filmable - someone can immediately imagine what to record
3. ENGAGING - hooks that make people want to watch
4. DIVERSE angles: mix of educational, behind-the-scenes, testimonial, funny, offer
5. REAL - not generic templates but actual video concepts
6. ⚠️ DO NOT use specific people's names (like "John", "Sarah", "Mike") - use generic terms like "the baker", "our chef", "a customer", "the owner"

Think about:
- What specific processes happen at a ${actualBusinessType}?
- What unique products/services does "${info.businessName}" offer?
- What would customers be curious to see?
- What daily activities are visually interesting?
- What makes THIS business different from competitors?

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
`;
}

function getBusinessTypeGuidance(businessType: string): string {
  const guidance: Record<string, string> = {
    "Thrift Store / Resale": `
This is a THRIFT/RESALE business.

SPECIFIC VIDEO IDEAS SHOULD INCLUDE:
- "Found a [specific vintage item] for $[price] - Here's the story behind it"
- "Watch us price these [donation category] that just came in"
- "Customer discovers [specific find] - Their reaction is priceless"
- "Before & After: Transforming this $[price] [furniture item]"
- "Tour our [specific section] - Everything under $[price]"
- "Opening today's donation boxes - Hidden treasures inside"
- "How we sort and organize [specific category] donations"
- "This [vintage item] from [decade] still works perfectly!"

Make ideas about treasure hunting, discovery, unique finds, sustainability`,

    "Restaurant": `
This is a RESTAURANT business.

SPECIFIC VIDEO IDEAS SHOULD INCLUDE:
- "Making our signature [dish name] that customers wait 30 minutes for"
- "Chef's [cooking technique] - [number] [ingredient] in [time]"
- "Customer tries our [spiciest/unique dish] for the first time - Watch their reaction"
- "5 AM prep: [specific task] before we open"
- "[Day] night rush: Kitchen during our busiest hours"
- "The secret to our famous [menu item]: [specific ingredient/technique]"
- "How we prepare [number] [dish] for [busy period]"
- "Behind the [specific station]: Where the magic happens"

Focus on actual dishes, cooking processes, kitchen action, taste tests`,

    "Cafe / Bakery": `
This is a CAFÉ/BAKERY business.

SPECIFIC VIDEO IDEAS SHOULD INCLUDE:
- "Making [signature pastry] from scratch - [time] process in 60 seconds"
- "[Time] AM: Pulling fresh [baked goods] from the oven"
- "Decorating a [number]-tier [occasion] cake step-by-step"
- "Customer's first bite of our [best-seller] - Pure joy"
- "How we make [specific item]: The [specific technique] makes it special"
- "Prepping [number] [item] for the weekend rush"
- "Latte art challenge: Creating [design] in under [time]"
- "Testing new [item] recipe - You decide if we add it to the menu"

Focus on baking processes, decorating, morning routines, taste tests, coffee art`,

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
