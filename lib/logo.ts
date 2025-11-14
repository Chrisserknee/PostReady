import { BusinessInfo, LogoRequest, LogoResult } from "@/types";

export async function generateLogos(
  info: BusinessInfo,
  request: LogoRequest
): Promise<LogoResult[]> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const logoCount = Math.floor(Math.random() * 2) + 2;
  const logos: LogoResult[] = [];

  for (let i = 0; i < logoCount; i++) {
    const logo: LogoResult = {
      id: `logo-${Date.now()}-${i}`,
      url: generateMockLogoUrl(info, request, i),
      createdAt: new Date().toISOString(),
    };
    logos.push(logo);
  }

  return logos;
}

function generateMockLogoUrl(
  info: BusinessInfo,
  request: LogoRequest,
  index: number
): string {
  const colors = request.colors || getDefaultColors(info.businessType);
  const style = request.style || "minimal";
  const seed = encodeURIComponent(`${info.businessName}-${style}-${index}`);
  
  const services = [
    `https://ui-avatars.com/api/?name=${encodeURIComponent(info.businessName)}&size=400&background=${getColorHex(colors, 0)}&color=${getColorHex(colors, 1)}&bold=true&format=svg`,
    `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=${getColorHex(colors, 0)}`,
    `https://placehold.co/400x400/${getColorHex(colors, 0).replace('#', '')}/${getColorHex(colors, 1).replace('#', '')}/png?text=${encodeURIComponent(info.businessName.substring(0, 2).toUpperCase())}`,
  ];

  return services[index % services.length];
}

function getDefaultColors(businessType: string): string {
  const colorSchemes: Record<string, string> = {
    Restaurant: "red, orange",
    "Real Estate": "navy, gold",
    "Salon / Spa": "purple, pink",
    "Café / Bakery": "brown, cream",
    "Gym / Fitness": "red, black",
    "Retail Shop": "pink, blue",
    Other: "blue, white",
  };

  return colorSchemes[businessType] || "blue, white";
}

function getColorHex(colorsString: string, index: number): string {
  const colorMap: Record<string, string> = {
    red: "#EF4444",
    orange: "#F97316",
    yellow: "#EAB308",
    green: "#22C55E",
    blue: "#3B82F6",
    indigo: "#6366F1",
    purple: "#A855F7",
    pink: "#EC4899",
    navy: "#1E3A8A",
    gold: "#FCD34D",
    brown: "#92400E",
    cream: "#FEF3C7",
    black: "#1F2937",
    white: "#F9FAFB",
  };

  const colors = colorsString.toLowerCase().split(/[,\s]+/).filter(c => c.trim());
  const color = colors[index % colors.length] || "blue";
  
  return colorMap[color.trim()] || "#3B82F6";
}


