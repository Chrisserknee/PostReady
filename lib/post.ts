import { BusinessInfo, PostingTime, PostDetails } from "@/types";

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
    return ideaTitle;
  }

  if (videoDescription) {
    const desc = videoDescription.toLowerCase();
    
    if (desc.includes("behind") || desc.includes("making") || desc.includes("process")) {
      return `Behind the Scenes at ${info.businessName}`;
    } else if (desc.includes("customer") || desc.includes("review") || desc.includes("testimonial")) {
      return `What Our Customers Are Saying`;
    } else if (desc.includes("new") || desc.includes("special") || desc.includes("offer")) {
      return `Exciting News from ${info.businessName}!`;
    } else if (desc.includes("tip") || desc.includes("how to") || desc.includes("learn")) {
      return `Pro Tips from ${info.businessName}`;
    } else {
      return `A Day at ${info.businessName}`;
    }
  }

  return `Check Out ${info.businessName}!`;
}

function generateCaption(
  info: BusinessInfo,
  ideaTitle: string | null,
  videoDescription: string | null
): string {
  const location = info.location;
  const businessName = info.businessName;
  const content = ideaTitle || videoDescription || "this amazing content";

  const captionTemplates = [
    `We're so excited to share ${content} with you! 🎉\n\nAt ${businessName}, we believe in creating memorable experiences for our ${location} community. Drop a ❤️ if you'd like to see more content like this!\n\n#LocalBusiness #${location.replace(/\s+/g, '')}`,
    
    `Here's a little peek at what makes ${businessName} special! ✨\n\nWe're proud to serve ${location} and bring you ${content}. Tag someone who needs to see this!\n\n#SupportLocal #SmallBusiness`,
    
    `${content} 🙌\n\nServing ${location} with pride! Have you visited ${businessName} yet? We'd love to see you soon. Comment below if you have questions!\n\n#Local #Community`,
    
    `Loving every moment of bringing you ${content}! 💙\n\n${businessName} is here for the ${location} community. What would you like to see next? Let us know in the comments!\n\n#ShopLocal #SupportSmallBusiness`,
  ];

  const randomIndex = Math.floor(Math.random() * captionTemplates.length);
  return captionTemplates[randomIndex];
}

function generateHashtags(info: BusinessInfo): string[] {
  const generalTags = ["#supportlocal", "#smallbusiness", "#shoplocal", "#localbusiness"];
  
  const locationClean = info.location.toLowerCase().replace(/\s+/g, '').replace(/,/g, '');
  const locationTags = [
    `#${locationClean}`,
    `#${locationClean}business`,
  ];

  const businessTypeTags: Record<string, string[]> = {
    Restaurant: ["#foodie", "#restaurant", "#localfood", `#${locationClean}food`, `#${locationClean}restaurant`, "#eats"],
    "Real Estate": ["#realestate", "#realtor", "#homeforsale", `#${locationClean}realestate`, `#${locationClean}homes`, "#homebuying"],
    "Salon / Spa": ["#salon", "#spa", "#beauty", "#hair", `#${locationClean}salon`, `#${locationClean}beauty`, "#selflove"],
    "Café / Bakery": ["#cafe", "#coffee", "#bakery", "#coffeeshop", `#${locationClean}cafe`, `#${locationClean}coffee`, "#coffeelover"],
    "Gym / Fitness": ["#fitness", "#gym", "#workout", "#health", `#${locationClean}fitness`, `#${locationClean}gym`, "#fitfam"],
    "Retail Shop": ["#retail", "#shopping", "#boutique", "#style", `#${locationClean}shopping`, `#${locationClean}boutique`, "#fashion"],
  };

  const typeTags = businessTypeTags[info.businessType] || ["#business", "#local", "#community"];

  const platformTags: Record<string, string[]> = {
    Instagram: ["#instadaily", "#instagood"],
    TikTok: ["#fyp", "#foryou"],
    Facebook: ["#localbusiness", "#community"],
    "YouTube Shorts": ["#shorts", "#youtube"],
  };

  const platTags = platformTags[info.platform] || [];

  const allTags = [...generalTags, ...locationTags, ...typeTags, ...platTags];
  
  const shuffled = allTags.sort(() => 0.5 - Math.random());
  const count = Math.floor(Math.random() * 5) + 8;
  
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

