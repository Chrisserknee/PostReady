export type BusinessInfo = {
  businessName: string;
  businessType: "Restaurant" | "Cafe / Bakery" | "Retail Shop" | "Thrift Store / Resale" | "Salon / Spa" | "Gym / Fitness" | "Real Estate" | "Movie Theater" | "Other";
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
