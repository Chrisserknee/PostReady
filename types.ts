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

// Comment Bait Generator Types
export type CommentBaitItem = {
  id: string;
  text: string;
  styleTag: string; // short label like "Spicy", "Debate", "Poll", etc.
};

export type CommentBaitResponse = {
  items: CommentBaitItem[];
  metadata: {
    topic: string;
    platform: string;
    engagementStyle: string;
    audience?: string;
    count: number;
  };
};

export type CommentBaitRequest = {
  topic: string;
  platform: string;
  engagementStyle: string;
  customStyle?: string;
  audience?: string;
  count: number;
};

// Brainworm Phrase Generator Types
export type BrainwormRequest = {
  context: string; // e.g. "Cooking video", "Coding tutorial", "Storytime"
  vibe: string;    // e.g. "Suspense", "Secret", "Urgency"
  count: number;
};

export type BrainwormItem = {
  id: string;
  text: string;
  vibeTag: string;
  explanation?: string; // Optional brief "why it works"
};

export type BrainwormResponse = {
  items: BrainwormItem[];
  metadata: {
    context: string;
    vibe: string;
    count: number;
  };
};

// Sugar Daddy Message Generator Types
export type SugarDaddyMessageRequest = {
  situation: string; // e.g. "Bills due", "Emergency", "Shopping", "Rent"
  tone: string;      // e.g. "Sweet", "Desperate", "Playful", "Grateful"
  relationship: string; // e.g. "New", "Long-term", "Casual"
  amount?: string;   // Optional amount to mention
  count: number;
};

export type SugarDaddyMessageItem = {
  id: string;
  text: string;
  toneTag: string;
};

export type SugarDaddyMessageResponse = {
  items: SugarDaddyMessageItem[];
  metadata: {
    situation: string;
    tone: string;
    relationship: string;
    amount?: string;
    count: number;
  };
};
