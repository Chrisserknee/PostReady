import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { step, ...stepData } = body;

    if (!step || step < 1 || step > 8) {
      return NextResponse.json(
        { error: 'Invalid step number' },
        { status: 400 }
      );
    }

    let result;
    
    switch (step) {
      case 1:
        result = await generateProductIdeas(stepData);
        break;
      case 2:
        result = await generateBlueprint(stepData);
        break;
      case 3:
        result = await generateContent(stepData);
        break;
      case 4:
        result = await generatePricing(stepData);
        break;
      case 5:
        result = await generateSalesCopy(stepData);
        break;
      case 6:
        result = await generateLaunchPlan(stepData);
        break;
      case 7:
        result = await generatePlatformSuggestions(stepData);
        break;
      case 8:
        result = await generateEmailSequence(stepData);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid step' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Digital Product Builder API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function generateProductIdeas(data: any) {
  const { niche, audience, commonRequests, strengths, effortLevel } = data;

  const prompt = `You are an expert digital product strategist. Based on the following information, generate 3-5 tailored digital product ideas:

Niche: ${niche}
Target Audience: ${audience}
Common Requests: ${commonRequests}
Strengths: ${strengths}
Effort Level: ${effortLevel}

For each product idea, provide:
- title: A compelling product name (e.g., "Beginner's Guide to ___", "30-Day Plan for ___", "Creator Toolkit for ___", "Templates for ___")
- description: 2-3 sentences explaining what it is
- targetAudience: Who it's specifically for
- problemSolved: What problem it solves
- priceRange: Suggested price range (e.g., "$9-19", "$19-49", "$49-99")
- simplicityLevel: "Beginner", "Intermediate", or "Advanced"

Return JSON: { "ideas": [array of product ideas] }
Make each idea unique and tailored to the user's niche and strengths.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert digital product strategist who creates tailored product ideas.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const response = JSON.parse(completion.choices[0].message.content || '{}');
  return { ideas: response.ideas || [] };
}

async function generateBlueprint(data: any) {
  const { productIdea } = data;

  const prompt = `Create a comprehensive product blueprint for this digital product:

Title: ${productIdea.title}
Description: ${productIdea.description}
Target Audience: ${productIdea.targetAudience}
Problem Solved: ${productIdea.problemSolved}

Generate:
- title: The product title
- promise: A compelling promise statement (what transformation it delivers)
- keyOutcome: The main outcome users will achieve
- sections: Array of 3-5 modules/sections, each with:
  - title: Module name (e.g., "Module 1: Core Basics")
  - description: What's covered in this module

Also determine the productType: "guide", "templates", "course", or "toolkit"

Return JSON: { "blueprint": {...}, "productType": "..." }
Make it detailed and actionable.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert product designer who creates detailed product blueprints.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const response = JSON.parse(completion.choices[0].message.content || '{}');
  return { blueprint: response.blueprint, productType: response.productType || 'guide' };
}

async function generateContent(data: any) {
  const { blueprint, productType } = data;

  const prompt = `Generate actual content for this digital product:

Product Type: ${productType}
Blueprint: ${JSON.stringify(blueprint)}

Based on the product type:
- If "guide" or "course": Generate page outlines, section headers, and bullet point content for each section
- If "templates": Generate example templates and fill-in-the-blank versions with usage instructions
- If "toolkit": Generate tool descriptions, usage guides, and examples

For each section in the blueprint, create:
- title: Section/module title
- content: Detailed content (outline, text, templates, etc.)
- type: "outline", "content", or "template"

Return JSON: { "content": [array of content sections] }
Make it practical and ready to use.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert content creator who generates detailed, actionable content.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  });

  const response = JSON.parse(completion.choices[0].message.content || '{}');
  return { content: response.content || [] };
}

async function generatePricing(data: any) {
  const { blueprint, productIdea } = data;

  const prompt = `Create a pricing strategy for this digital product:

Product: ${productIdea.title}
Description: ${productIdea.description}
Target Audience: ${productIdea.targetAudience}
Original Price Range: ${productIdea.priceRange}

Generate 2-3 pricing tiers with:
- name: Tier name (e.g., "Starter", "Core Value", "Premium")
- price: Dollar amount (use psychological pricing like $9, $19, $49)
- description: What's included at this tier
- features: Array of 3-5 features/benefits

Also provide:
- positioning: A 2-3 paragraph positioning strategy explaining value framing, who NOT to buy this (for clarity), and emotional positioning

Return JSON: { "pricingTiers": [...], "positioning": "..." }
Make pricing strategic and value-based.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert pricing strategist who creates value-based pricing tiers.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const response = JSON.parse(completion.choices[0].message.content || '{}');
  return { pricingTiers: response.pricingTiers || [], positioning: response.positioning || '' };
}

async function generateSalesCopy(data: any) {
  const { blueprint, productIdea, pricingTiers } = data;

  const prompt = `Create professional sales copy for this digital product:

Product: ${productIdea.title}
Promise: ${blueprint.promise}
Key Outcome: ${blueprint.keyOutcome}
Pricing Tiers: ${JSON.stringify(pricingTiers)}

Generate:
- headline: 3-5 compelling headline options (return as a single string with options separated by " | ")
- description: A compelling product description (2-3 paragraphs)
- benefits: Array of 5-7 key benefits
- faq: Array of 5-7 FAQ items, each with question and answer
- objectionHandling: Array of 3-5 common objections with responses
- transformationStory: A mini story showing the transformation (2-3 paragraphs)

Return JSON: { "salesCopy": {...} }
Make it persuasive and conversion-focused.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert copywriter who creates high-converting sales copy.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const response = JSON.parse(completion.choices[0].message.content || '{}');
  return { salesCopy: response.salesCopy };
}

async function generateLaunchPlan(data: any) {
  const { blueprint, productIdea } = data;

  const prompt = `Create a 7-14 day launch plan for this digital product:

Product: ${productIdea.title}
Target Audience: ${productIdea.targetAudience}

Generate a daily launch plan with:
- day: Day number (1-14)
- action: What to do on this day
- contentIdea: Specific content idea for this day
- hook: A hook/opening line for the content
- cta: Call-to-action for this day

Return JSON: { "launchPlan": [array of daily plans] }
Make it actionable with specific content ideas, hooks, and CTAs.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert launch strategist who creates detailed launch plans.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const response = JSON.parse(completion.choices[0].message.content || '{}');
  return { launchPlan: response.launchPlan || [] };
}

async function generatePlatformSuggestions(data: any) {
  const { productType, productIdea } = data;

  const prompt = `Recommend platforms for hosting and delivering this digital product:

Product Type: ${productType}
Product: ${productIdea.title}

Consider platforms like: Gumroad, Stan Store, LemonSqueezy, Notion + Stripe, Ko-fi, Teachable, Podia, etc.

For each platform (3-5 recommendations), provide:
- name: Platform name
- description: Brief description
- pros: Array of 3-5 advantages
- cons: Array of 2-3 disadvantages
- bestFor: Who this platform is best for

Return JSON: { "platforms": [array of platform suggestions] }
Make recommendations based on the product type and target audience.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert who recommends the best platforms for digital product delivery.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const response = JSON.parse(completion.choices[0].message.content || '{}');
  return { platforms: response.platforms || [] };
}

async function generateEmailSequence(data: any) {
  const { productIdea, salesCopy, pricingTiers } = data;

  const prompt = `Create a 5-7 email marketing sequence for launching this digital product:

Product: ${productIdea.title}
Description: ${productIdea.description}
Headlines: ${salesCopy.headline}
Key Benefits: ${salesCopy.benefits.slice(0, 3).join(', ')}
Pricing: ${pricingTiers.map((t: any) => `${t.name}: $${t.price}`).join(', ')}

Generate an email sequence with:
- subject: Compelling email subject line
- preview: Preview text (first 50 chars shown in inbox)
- body: Full email body (2-4 paragraphs, conversational tone)
- dayToSend: Day number (1, 3, 5, 7, 10, etc.)
- purpose: Purpose of this email (e.g., "Introduction", "Value", "Social Proof", "Urgency", "Final Call")

Include these types of emails:
1. Welcome/Introduction email (Day 1)
2. Value-focused email with tips (Day 3)
3. Social proof/testimonials (Day 5)
4. Problem agitation (Day 7)
5. Limited time offer/urgency (Day 10)
6. Final call (Day 14)

Return JSON: { "emailSequence": [array of emails] }
Make emails personal, conversational, and persuasive.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert email copywriter who creates high-converting email sequences.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  });

  const response = JSON.parse(completion.choices[0].message.content || '{}');
  return { emailSequence: response.emailSequence || [] };
}

