import OpenAI from "openai";

// Quick keyword-based detection (fast path)
function detectBusinessTypeFromKeywords(businessName: string): string | null {
  const name = businessName.toLowerCase();
  
  // Thrift/Resale (check first - high priority)
  if (name.includes('resale') || name.includes('thrift') || name.includes('secondhand') || 
      name.includes('consignment') || name.includes('vintage store') || name.includes('used goods')) {
    return "Thrift Store / Resale";
  }
  
  // Cafe/Bakery (check BEFORE restaurant - more specific)
  if (name.includes('bakery') || name.includes('boulangerie') || name.includes('patisserie') ||
      name.includes('cafe') || name.includes('café') || name.includes('coffee') || 
      name.includes('coffeehouse') || name.includes('espresso')) {
    return "Cafe / Bakery";
  }
  
  // Restaurant (broader category)
  if (name.includes('restaurant') || name.includes('bistro') || name.includes('eatery') || 
      name.includes('diner') || name.includes('grill') || name.includes('kitchen') ||
      name.includes('pizza') || name.includes('burger') || name.includes('taco') ||
      name.includes('sushi') || name.includes('bar & grill') || name.includes('steakhouse') ||
      name.includes('bbq') || name.includes('ramen') || name.includes('noodle')) {
    return "Restaurant";
  }
  
  // Beauty & Wellness
  if (name.includes('salon') || name.includes('spa') || name.includes('beauty') || 
      name.includes('barbershop') || name.includes('barber') || name.includes('hair') ||
      name.includes('nails') || name.includes('massage')) {
    return "Salon / Spa";
  }
  
  // Fitness
  if (name.includes('gym') || name.includes('fitness') || name.includes('yoga') || 
      name.includes('crossfit') || name.includes('training') || name.includes('pilates') ||
      name.includes('health club') || name.includes('workout')) {
    return "Gym / Fitness";
  }
  
  // Real Estate
  if (name.includes('real estate') || name.includes('realty') || name.includes('properties') || 
      name.includes('realtor') || name.includes('homes') || name.includes('property group')) {
    return "Real Estate";
  }
  
  // Movie Theater
  if (name.includes('cinema') || name.includes('theater') || name.includes('theatre') || 
      name.includes('movie') || name.includes('picture')) {
    return "Movie Theater";
  }
  
  // Retail (check last - very broad)
  if (name.includes('shop') || name.includes('store') || name.includes('boutique') || 
      name.includes('mart') || name.includes('market') || name.includes('emporium')) {
    return "Retail Shop";
  }
  
  return null; // Inconclusive, need AI analysis
}

// AI-powered intelligent detection using GPT-4
export async function detectBusinessType(
  businessName: string,
  location: string,
  userSelectedType: string,
  openaiApiKey: string
): Promise<string> {
  console.log("🔍 Business Type Detection Started:", {
    businessName,
    location,
    userSelectedType
  });

  // Step 1: Try fast keyword matching
  const keywordDetection = detectBusinessTypeFromKeywords(businessName);
  
  if (keywordDetection) {
    console.log("✅ Keyword Detection Success:", {
      detected: keywordDetection,
      method: "keyword-matching"
    });
    return keywordDetection;
  }

  // Step 2: Use GPT-4 for intelligent analysis
  console.log("🤖 Using GPT-4 for intelligent detection (keywords inconclusive)...");

  try {
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a business classification expert. Analyze business names and locations to determine their actual business type. Be precise and return ONLY the business type category, nothing else."
        },
        {
          role: "user",
          content: `
Analyze this business and determine its ACTUAL type:

Business Name: "${businessName}"
Location: "${location}"
User Selected: "${userSelectedType}"

Available Business Types:
- Restaurant
- Cafe / Bakery
- Retail Shop
- Thrift Store / Resale
- Salon / Spa
- Gym / Fitness
- Real Estate
- Movie Theater
- Other

Instructions:
1. Analyze the business name for clues about what they do
2. Consider the location context if helpful
3. Ignore the user's selection - it may be wrong
4. Return ONLY the exact business type from the list above
5. If you're unsure, return "${userSelectedType}"

What is the ACTUAL business type?
Return ONLY the type, no explanation.
`
        }
      ],
      temperature: 0.3, // Lower temperature for consistent classification
      max_tokens: 50,
    });

    const detectedType = completion.choices[0].message.content?.trim() || userSelectedType;

    console.log("✅ GPT-4 Detection Complete:", {
      detected: detectedType,
      method: "ai-analysis"
    });

    return detectedType;
  } catch (error) {
    console.error("❌ GPT-4 Detection Failed:", error);
    console.log("⚠️ Falling back to user selection:", userSelectedType);
    return userSelectedType;
  }
}

