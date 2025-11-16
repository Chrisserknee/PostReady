/**
 * PostReady - Social Media Management Platform
 * 
 * PostReady researches your business, analyzes your local market, and creates 
 * tailored posts, captions, and growth strategies — automatically.
 */

export type BusinessInfo = {
  businessName: string;
  businessType: "Restaurant" | "Cafe / Bakery" | "Retail Shop" | "Thrift Store / Resale" | "Salon / Spa" | "Gym / Fitness" | "Real Estate" | "Movie Theater" | "Other";
  detectedBusinessType?: string; // AI-detected actual business type (overrides businessType if present)
  location: string;
  platform: "Instagram" | "TikTok" | "Facebook" | "YouTube Shorts";
};

export type PostingTime = {
  day: string;
  timeRange: string;
  reason: string;
};

export type ContentIdea = {
  title: string;
  description: string;
  angle: "funny" | "behind_the_scenes" | "educational" | "testimonial" | "offer";
};

export type StrategyResult = {
  headlineSummary: string;
  keyPrinciples: string[];
  postingTimes: PostingTime[];
  contentIdeas: ContentIdea[];
};

export type PostDetails = {
  title: string;
  caption: string;
  hashtags: string[];
  bestPostTime: string;
  notes?: string;
};

export type LogoRequest = {
  prompt: string;
  style?: string;
  colors?: string;
};

export type LogoResult = {
  id: string;
  url: string;
  createdAt: string;
};

export type LogoGeneratorState = {
  freeUsed: number;
  logos: LogoResult[];
  isPremium: boolean;
};

// Enhanced Trend Radar Types
export type TrendEngagementLevel = "Viral 🚀" | "Hot 🔥" | "Rising 📈" | "Steady ⭐" | "Emerging 🌱";

export type TrendPlatform = "TikTok" | "Instagram" | "YouTube" | "Twitter/X" | "LinkedIn" | "Facebook" | "All Platforms";

export type TrendDemographics = {
  targetAge: string;
  targetGender: string;
  mainRegions: string[];
};

export type TrendEstimatedViews = {
  min: number;
  max: number;
};

export type EnhancedTrend = {
  id: string;
  title: string;
  description: string;
  engagementLevel: TrendEngagementLevel;
  reachPotential: string;
  platforms: TrendPlatform[];
  primaryPlatform: TrendPlatform;
  hashtags: string[];
  viralScore: number;
  demographics: TrendDemographics;
  contentAngles: string[];
  trendingAudio: string | null;
  bestPostingTimes: string[];
  estimatedViews: TrendEstimatedViews;
  quickContentIdeas: string[];
  durationPrediction: string;
  competitionLevel: "Low" | "Medium" | "High";
  keywords: string[];
  relatedTrends: string[];
  timestamp: string;
};

export type TrendMetadata = {
  category: string;
  platform: string;
  subcategory: string | null;
  trendCount: number;
  generatedAt: string;
  targetAudience: string;
  version: string;
};

export type TrendInsights = {
  topEngagementLevel: string;
  averageViralScore: number;
  mostCommonPlatform: string;
  trendingHashtags: string[];
};

export type TrendResponse = {
  success: boolean;
  trends: EnhancedTrend[];
  metadata: TrendMetadata;
  insights: TrendInsights;
};
