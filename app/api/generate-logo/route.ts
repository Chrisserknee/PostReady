import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { BusinessInfo, LogoRequest } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessInfo, logoRequest } = body as {
      businessInfo: BusinessInfo;
      logoRequest: LogoRequest;
    };

    if (!businessInfo || !logoRequest) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Build an ultra-precise prompt for accurate text
    const prompt = buildPreciseLogoPrompt(businessInfo, logoRequest);

    // Generate logo using DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd", // Use HD quality for better results
      style: "vivid",
    });

    const logos = response.data.map((image, index) => ({
      id: `logo-${Date.now()}-${index}`,
      url: image.url || "",
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({ logos });
  } catch (error: any) {
    console.error("Logo generation error:", error);
    
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
      { error: error?.message || "Failed to generate logo" },
      { status: 500 }
    );
  }
}

function buildPreciseLogoPrompt(info: BusinessInfo, request: LogoRequest): string {
  const businessName = info.businessName;
  const businessType = info.businessType;
  const style = request.style || "Minimal";
  const colors = request.colors || getDefaultColors(businessType);
  const userPrompt = request.prompt?.trim() || "";

  // ULTRA-PRECISE text instruction at the very start
  let prompt = `CRITICAL TEXT REQUIREMENT - THIS IS THE MOST IMPORTANT PART:\n`;
  prompt += `The logo MUST display EXACTLY this text: "${businessName}"\n`;
  prompt += `Spell it EXACTLY as: ${businessName.split('').join(' ')}\n`;
  prompt += `Count the letters: ${businessName.length} letters total\n`;
  prompt += `DO NOT add any other words or text\n`;
  prompt += `DO NOT alter, abbreviate, or rearrange the letters\n`;
  prompt += `Each letter must be clear and correctly formed\n\n`;

  // Typography requirements
  prompt += `TYPOGRAPHY REQUIREMENTS:\n`;
  prompt += `- Use a single, clean, professional font\n`;
  prompt += `- Letters should be clearly legible and properly spaced\n`;
  prompt += `- Text should be the primary focus of the logo\n`;
  prompt += `- Ensure proper kerning between all letters\n`;
  prompt += `- Make the text large enough to be the main element\n\n`;

  // Design concept based on user input or defaults
  if (userPrompt) {
    const enhancedConcept = enhanceUserPrompt(userPrompt, businessType, style);
    prompt += `DESIGN CONCEPT:\n${enhancedConcept}\n\n`;
  } else {
    prompt += `DESIGN CONCEPT:\n${getSimpleDesignGuidance(businessType, style)}\n\n`;
  }

  // Style guidance - keep it simple to avoid text issues
  prompt += `STYLE:\n${getSimplifiedStyleGuidance(style)}\n\n`;

  // Color palette
  prompt += `COLORS:\n${colors}\n\n`;

  // Layout guidance
  prompt += `LAYOUT:\n`;
  prompt += `- Text "${businessName}" should be prominently displayed\n`;
  prompt += `- Any decorative elements should COMPLEMENT the text, not compete with it\n`;
  prompt += `- Keep the design balanced and centered\n`;
  prompt += `- Logo should work at various sizes\n\n`;

  // Quality requirements
  prompt += `QUALITY STANDARDS:\n`;
  prompt += `- Professional, polished appearance\n`;
  prompt += `- High attention to detail\n`;
  prompt += `- Suitable for business use\n`;
  prompt += `- Timeless design that won't look dated\n\n`;

  // Final verification - repeat for emphasis
  prompt += `FINAL VERIFICATION:\n`;
  prompt += `Before generating, verify the text reads: "${businessName}"\n`;
  prompt += `This is a business logo, accuracy is critical.\n`;
  prompt += `The business name is: "${businessName}" - get every letter right.`;

  return prompt;
}

function enhanceUserPrompt(userPrompt: string, businessType: string, style: string): string {
  let enhanced = userPrompt;
  
  // Add professional context
  enhanced += ` Incorporate design elements that represent a ${businessType.toLowerCase()} business.`;
  
  // Add style context
  if (style === "Vintage") {
    enhanced += " Use classic, timeless design elements with vintage aesthetic.";
  } else if (style === "Luxury") {
    enhanced += " Apply sophisticated, premium design elements.";
  } else if (style === "Playful") {
    enhanced += " Include friendly, approachable design elements.";
  } else {
    enhanced += " Use modern, clean design principles.";
  }
  
  // Emphasize text importance
  enhanced += " The business name text must be the hero of the design, clearly readable and correctly spelled.";
  
  return enhanced;
}

function getSimpleDesignGuidance(businessType: string, style: string): string {
  const guidance: Record<string, string> = {
    "Restaurant": "Create a logo with the business name as the main focus. Include subtle food-related design elements like decorative lines, simple shapes, or minimalist culinary symbols that enhance but don't overshadow the text.",
    
    "Real Estate": "Design a logo with the business name prominently displayed. Add clean architectural elements like simple geometric shapes or minimalist building silhouettes as complementary design elements.",
    
    "Salon / Spa": "Create an elegant logo with the business name as the centerpiece. Include refined decorative elements like simple flowing lines or minimalist beauty symbols that frame the text.",
    
    "Café / Bakery": "Design a warm logo with the business name clearly visible. Add artisanal touches like simple coffee or bakery symbols that complement the typography.",
    
    "Gym / Fitness": "Create a bold logo with the business name taking center stage. Include dynamic elements like simple geometric shapes or minimalist fitness symbols.",
    
    "Retail Shop": "Design a stylish logo with the business name as the focal point. Add contemporary design elements that enhance the modern appeal.",
    
    "Other": "Create a professional logo with the business name as the primary element. Include complementary design elements that enhance brand recognition."
  };
  
  return guidance[businessType] || guidance["Other"];
}

function getSimplifiedStyleGuidance(style: string): string {
  const styles: Record<string, string> = {
    "Minimal": "Clean, modern design with simple typography. Use plenty of white space and avoid excessive decorative elements. Focus on clarity and readability of the text.",
    
    "Vintage": "Classic design with traditional typography. Can include subtle ornamental elements like simple borders or corner flourishes, but keep text as the main focus.",
    
    "Playful": "Friendly, approachable design with rounded typography. Include subtle playful elements but maintain professional appearance and text legibility.",
    
    "Luxury": "Sophisticated design with elegant typography. Use refined details and premium feel while ensuring the business name remains clearly readable."
  };
  
  return styles[style] || styles["Minimal"];
}

function getDefaultColors(businessType: string): string {
  const colorMap: Record<string, string> = {
    "Restaurant": "Rich red or burgundy with gold accents on white or cream background",
    "Real Estate": "Navy blue with gold accents on white or light background",
    "Salon / Spa": "Elegant purple or rose gold with white or soft pink background",
    "Café / Bakery": "Warm brown and cream tones on light background",
    "Gym / Fitness": "Bold red or orange with black accents on white background",
    "Retail Shop": "Contemporary color palette with good contrast for readability",
    "Other": "Professional color scheme with high contrast for text legibility"
  };
  
  return colorMap[businessType] || colorMap["Other"];
}
