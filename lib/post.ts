import { BusinessInfo, PostingTime, PostDetails } from "@/types";

export async function generatePostDetailsWithAI(
  info: BusinessInfo,
  ideaTitle: string | null,
  videoDescription: string | null,
  postingTimes: PostingTime[]
): Promise<PostDetails> {
  const title = generateTitle(info, ideaTitle, videoDescription);
  const hashtags = generateHashtags(info);
  const bestPostTime = selectBestPostTime(postingTimes, info.platform);

  // Try to generate AI caption
  let caption: string;
  try {
    const response = await fetch('/api/generate-caption', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessInfo: info,
        ideaTitle,
        videoDescription,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      caption = data.caption;
      console.log('✅ Using AI-generated caption');
    } else {
      console.warn('⚠️ AI caption failed, using template');
      caption = generateCaption(info, ideaTitle, videoDescription);
    }
  } catch (error) {
    console.warn('⚠️ AI caption error, using template:', error);
    caption = generateCaption(info, ideaTitle, videoDescription);
  }

  return {
    title,
    caption,
    hashtags,
    bestPostTime,
  };
}

export function generatePostDetails(
  info: BusinessInfo,
  ideaTitle: string | null,
  videoDescription: string | null,
  postingTimes: PostingTime[]
): PostDetails {
  const title = generateTitle(info, ideaTitle, videoDescription);
  const caption = generateCaption(info, ideaTitle, videoDescription);
  const hashtags = generateHashtags(info);
  const bestPostTime = selectBestPostTime(postingTimes, info.platform);

  return {
    title,
    caption,
    hashtags,
    bestPostTime,
  };
}

function generateTitle(
  info: BusinessInfo,
  ideaTitle: string | null,
  videoDescription: string | null
): string {
  if (ideaTitle) {
    // Simplify overly long AI-generated titles
    const title = ideaTitle;
    
    // If title is too long, simplify it
    if (title.length > 60) {
      // Remove extra descriptive phrases and parentheticals
      let simplified = title
        .replace(/\(.*?\)/g, '') // Remove parentheses content
        .replace(/\s*[-–—:]\s*.*/g, '') // Remove everything after dash or colon
        .trim();
      
      // If still too long, take first meaningful part
      if (simplified.length > 60) {
        const words = simplified.split(' ');
        simplified = words.slice(0, 7).join(' ');
        if (words.length > 7) simplified += '...';
      }
      
      return simplified;
    }
    
    return title;
  }

  if (videoDescription) {
    const desc = videoDescription.toLowerCase();
    
    if (desc.includes("behind") || desc.includes("making") || desc.includes("process")) {
      return `Behind the Scenes`;
    } else if (desc.includes("customer") || desc.includes("review") || desc.includes("testimonial")) {
      return `Customer Love`;
    } else if (desc.includes("new") || desc.includes("special") || desc.includes("offer")) {
      return `Something Special`;
    } else if (desc.includes("tip") || desc.includes("how to") || desc.includes("learn")) {
      return `Pro Tips`;
    } else {
      return `A Day With Us`;
    }
  }

  return `Check This Out`;
}

function generateCaption(
  info: BusinessInfo,
  ideaTitle: string | null,
  videoDescription: string | null
): string {
  const location = info.location;
  const businessName = info.businessName;
  
  // More natural caption templates that work better with video titles
  const captionTemplates = [
    `Hope you enjoyed this! 😊 We love being part of the ${location} community.\n\nWhat would you like to see next? Drop a comment below!`,
    
    `Thanks for watching! ✨ This is what we do every day here at ${businessName}.\n\nHave you visited us in ${location} yet? We'd love to see you!`,
    
    `A little behind-the-scenes for you! 🎥 This is how we do things at ${businessName}.\n\nTag someone who needs to see this!`,
    
    `Thought you might find this interesting! We're proud to serve the ${location} community.\n\nAny questions? Drop them below! 👇`,
    
    `This is what we love doing. 💙 Just another day at ${businessName} in ${location}.\n\nLet us know what you think in the comments!`,
    
    `Pretty cool, right? 😎 We put our heart into everything we do here.\n\nVisit us at ${businessName} in ${location}!`,
  ];

  const randomIndex = Math.floor(Math.random() * captionTemplates.length);
  return captionTemplates[randomIndex];
}

function generateHashtags(info: BusinessInfo): string[] {
  // Clean location for hashtags (remove spaces, commas, special chars)
  const locationClean = info.location.toLowerCase().replace(/\s+/g, '').replace(/,/g, '');
  
  // Use detected business type if available for better accuracy
  const actualBusinessType = (info as any).detectedBusinessType || info.businessType;
  
  // High-quality, specific hashtags by business type
  const businessTypeTags: Record<string, string[]> = {
    "Restaurant": [
      "#foodie", "#restaurant", "#foodporn", "#instafood", "#yum",
      "#delicious", "#foodstagram", "#dining", "#eatlocal", 
      `#${locationClean}food`, `#${locationClean}eats`, "#localfood"
    ],
    "Cafe / Bakery": [
      "#bakery", "#cafe", "#coffee", "#coffeeshop", "#pastrychef",
      "#coffeelover", "#bakedgoods", "#freshbaked", "#coffeetime",
      `#${locationClean}cafe`, `#${locationClean}coffee`, "#pastry"
    ],
    "Real Estate": [
      "#realestate", "#realtor", "#homeforsale", "#realtorlife", "#homebuying",
      "#dreamhome", "#property", "#househunting", "#realty",
      `#${locationClean}realestate`, `#${locationClean}homes`, "#realestateagent"
    ],
    "Salon / Spa": [
      "#salon", "#spa", "#beauty", "#hair", "#hairstyle",
      "#beautysalon", "#haircare", "#skincare", "#wellness",
      `#${locationClean}salon`, `#${locationClean}beauty`, "#selfcare"
    ],
    "Gym / Fitness": [
      "#fitness", "#gym", "#workout", "#fitfam", "#training",
      "#health", "#fitlife", "#exercise", "#motivation",
      `#${locationClean}fitness`, `#${locationClean}gym`, "#healthylifestyle"
    ],
    "Retail Shop": [
      "#retail", "#shopping", "#boutique", "#fashion", "#style",
      "#shopsmall", "#boutiqueshopping", "#retailtherapy", "#shopaholic",
      `#${locationClean}shopping`, `#${locationClean}boutique`, "#retailstore"
    ],
    "Thrift Store / Resale": [
      "#thrifting", "#thriftstore", "#secondhand", "#vintage", "#thriftshop",
      "#thriftfinds", "#resale", "#sustainable", "#vintagestyle",
      `#${locationClean}thrift`, "#thriftstorefinds", "#thrifthaul"
    ],
    "Movie Theater": [
      "#movies", "#cinema", "#theater", "#film", "#movienight",
      "#movietime", "#theatre", "#entertainment", "#nowplaying",
      `#${locationClean}movies`, "#movietheater", "#filmlovers"
    ],
    "Other": [
      "#business", "#local", "#community", "#entrepreneur", "#shopsmall",
      `#${locationClean}business`, "#supportsmallbusiness", "#localbiz"
    ]
  };

  // General community tags (high engagement)
  const communityTags = [
    "#supportlocal", "#smallbusiness", "#shoplocal", "#localbusiness",
    `#${locationClean}`, `#${locationClean}business`, "#local", "#community"
  ];

  // Platform-specific trending tags
  const platformTags: Record<string, string[]> = {
    "Instagram": ["#instagood", "#instadaily", "#reels", "#reelsinstagram"],
    "TikTok": ["#fyp", "#foryou", "#foryoupage", "#viral"],
    "Facebook": ["#fbpost", "#facebookpost", "#socialmedia"],
    "YouTube Shorts": ["#shorts", "#youtubeshorts", "#shortsvideo"],
  };

  // Get business-specific tags
  const typeTags = businessTypeTags[actualBusinessType] || businessTypeTags["Other"];
  const platTags = platformTags[info.platform] || [];

  // Combine all tags
  const allTags = [...communityTags, ...typeTags, ...platTags];
  
  // Remove duplicates by converting to Set and back to array
  const uniqueTags = Array.from(new Set(allTags.map(tag => tag.toLowerCase())));
  
  // Shuffle for variety
  const shuffled = uniqueTags.sort(() => 0.5 - Math.random());
  
  // Select 10-12 high-quality tags
  const count = Math.floor(Math.random() * 3) + 10;
  
  return shuffled.slice(0, count);
}

function selectBestPostTime(postingTimes: PostingTime[], platform: string): string {
  // Platform-specific optimal posting times based on engagement data
  const platformTimes: Record<string, string[]> = {
    "Instagram": [
      "Tuesday at 11:30 AM",
      "Wednesday at 3:30 PM", 
      "Thursday at 1:45 PM",
      "Friday at 5:30 PM"
    ],
    "TikTok": [
      "Tuesday at 6:00 PM",
      "Wednesday at 9:30 AM",
      "Thursday at 7:30 PM",
      "Friday at 5:00 PM"
    ],
    "Facebook": [
      "Tuesday at 10:30 AM",
      "Wednesday at 1:00 PM",
      "Thursday at 6:30 PM",
      "Friday at 12:15 PM"
    ],
    "YouTube Shorts": [
      "Tuesday at 2:00 PM",
      "Wednesday at 5:30 PM",
      "Thursday at 12:30 PM",
      "Friday at 3:00 PM"
    ]
  };
  
  const optimalTimes = platformTimes[platform] || platformTimes["Instagram"];
  
  // Randomly select one as the primary suggestion
  const primaryTime = optimalTimes[Math.floor(Math.random() * optimalTimes.length)];
  const otherTimes = optimalTimes.filter(t => t !== primaryTime);
  
  return `Once your video is ready to post, post it ${primaryTime} (or whenever you think is best for engagement).\n\nOther great times: ${otherTimes.join(', ')}`;
}

