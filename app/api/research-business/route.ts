import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { BusinessInfo } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessInfo } = body as { businessInfo: BusinessInfo };

    if (!businessInfo) {
      return NextResponse.json(
        { error: "Missing business information" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // CRITICAL: Detect actual business type from name BEFORE calling AI
    const detectedType = detectBusinessTypeFromName(businessInfo.businessName);
    const actualBusinessType = detectedType || businessInfo.businessType;
    
    console.log("Business Detection:", {
      name: businessInfo.businessName,
      userSelected: businessInfo.businessType,
      detected: detectedType,
      using: actualBusinessType
    });

    // Generate simple, actionable strategy with CORRECTED business type
    const researchPrompt = buildActionableStrategyPrompt(businessInfo, actualBusinessType);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a social media expert who gives simple, actionable advice. Focus on what works: consistency, engagement, and authentic content. Keep it practical and easy to implement. Always respond with valid JSON."
        },
        {
          role: "user",
          content: researchPrompt
        }
      ],
      temperature: 0.7,
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
      console.error("Invalid research response structure:", research);
      // Don't throw error, just log it and let frontend use fallback
      console.log("Received:", JSON.stringify(research, null, 2));
    }

    return NextResponse.json({ research });
  } catch (error: any) {
    console.error("Business research error:", error);
    
    if (error?.status === 401) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key" },
        { status: 401 }
      );
    }
    
    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to research business" },
      { status: 500 }
    );
  }
}

// FOOLPROOF BUSINESS TYPE DETECTION
function detectBusinessTypeFromName(businessName: string): string | null {
  const name = businessName.toLowerCase();
  
  // Thrift/Resale (check first - high priority)
  if (name.includes('resale') || name.includes('thrift') || name.includes('secondhand') || 
      name.includes('consignment') || name.includes('vintage store') || name.includes('used goods')) {
    return "Thrift/Resale Store";
  }
  
  // Food & Dining
  if (name.includes('restaurant') || name.includes('cafe') || name.includes('café') || 
      name.includes('bakery') || name.includes('bistro') || name.includes('eatery') || 
      name.includes('diner') || name.includes('grill') || name.includes('kitchen') ||
      name.includes('pizza') || name.includes('burger') || name.includes('taco') ||
      name.includes('sushi') || name.includes('bar & grill')) {
    return "Restaurant/Cafe";
  }
  
  // Beauty & Wellness
  if (name.includes('salon') || name.includes('spa') || name.includes('beauty') || 
      name.includes('barbershop') || name.includes('barber') || name.includes('hair') ||
      name.includes('nails') || name.includes('massage')) {
    return "Salon/Spa";
  }
  
  // Fitness
  if (name.includes('gym') || name.includes('fitness') || name.includes('yoga') || 
      name.includes('crossfit') || name.includes('training') || name.includes('pilates')) {
    return "Gym/Fitness";
  }
  
  // Real Estate
  if (name.includes('real estate') || name.includes('realty') || name.includes('properties') || 
      name.includes('realtor') || name.includes('homes') || name.includes('property group')) {
    return "Real Estate";
  }
  
  // Retail
  if (name.includes('shop') || name.includes('store') || name.includes('boutique') || 
      name.includes('mart') || name.includes('market')) {
    return "Retail Shop";
  }
  
  return null; // Use user-selected type
}

function buildActionableStrategyPrompt(info: BusinessInfo, actualBusinessType: string): string {
  return `
🚨 MANDATORY: THIS BUSINESS TYPE HAS BEEN VERIFIED 🚨

Business Name: "${info.businessName}"
Location: "${info.location}"
Platform: "${info.platform}"
CONFIRMED BUSINESS TYPE: "${actualBusinessType}"

⛔ DO NOT SECOND-GUESS THE BUSINESS TYPE ⛔
The business type "${actualBusinessType}" has been verified through name analysis.
You MUST create content for a "${actualBusinessType}" business.

If "${actualBusinessType}" = "Thrift/Resale Store":
- This is NOT a restaurant, cafe, or food business
- Focus on: diverse product finds (furniture, books, electronics, clothing, home decor, toys, etc.)

If "${actualBusinessType}" = "Restaurant/Cafe":
- This IS a food business
- Focus on: food, dining, menu items, culinary experiences

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
✅ "The 5 AM Morning: Watch Us Pull Fresh Croissants from the Oven"
✅ "Decorating a 3-Tier Wedding Cake from Start to Finish"
✅ "Customer Tries Our Best-Selling Cinnamon Roll for the First Time"
✅ "How We Make Our Signature Sourdough (72-Hour Process in 60 Seconds)"
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
- If Thrift/Resale: NO food/dining mentions
- If Restaurant: NO thrift/resale mentions
- Are you using "your", "you" (not "our", "we")?
- These are instructions TO the business owner, not FROM the business
- Stay consistent with the business type!
`;
}

function getBusinessTypeGuidance(businessType: string): string {
  const guidance: Record<string, string> = {
    "Thrift/Resale Store": `
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

    "Restaurant/Cafe": `
This is a FOOD business.

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

    "Salon/Spa": `
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

    "Gym/Fitness": `
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

    "Café / Bakery": `
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

Focus on baking processes, decorating, morning routines, taste tests`
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
