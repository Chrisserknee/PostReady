import { BusinessInfo, StrategyResult, PostingTime, ContentIdea } from "@/types";

export function generateStrategyAndIdeas(info: BusinessInfo): StrategyResult {
  const headlineSummary = generateHeadline(info);
  const keyPrinciples = generatePrinciples(info);
  const postingTimes = generatePostingTimes(info);
  const contentIdeas = generateContentIdeas(info);

  return {
    headlineSummary,
    keyPrinciples,
    postingTimes,
    contentIdeas,
  };
}

function generateHeadline(info: BusinessInfo): string {
  const location = info.location || "your area";
  const platform = info.platform.toLowerCase();

  const headlines: Record<string, string> = {
    Restaurant: `For a neighborhood restaurant in ${location}, we'll focus on behind-the-scenes videos, staff moments, and daily specials to stay top-of-mind on ${info.platform}.`,
    "Real Estate": `For a real estate business in ${location}, we'll showcase property tours, local market insights, and success stories to build trust on ${info.platform}.`,
    "Salon / Spa": `For a salon and spa in ${location}, we'll highlight transformations, self-care tips, and behind-the-scenes styling to attract clients on ${info.platform}.`,
    "Café / Bakery": `For a cozy café in ${location}, we'll share morning rituals, baking processes, and customer favorites to create a warm community on ${info.platform}.`,
    "Gym / Fitness": `For a fitness center in ${location}, we'll post workout tips, member transformations, and motivational content to inspire action on ${info.platform}.`,
    "Retail Shop": `For a retail shop in ${location}, we'll showcase new arrivals, styling tips, and customer stories to drive foot traffic via ${info.platform}.`,
    Other: `For ${info.businessName} in ${location}, we'll create engaging ${platform} content that highlights your unique value and connects with your local community.`,
  };

  return headlines[info.businessType] || headlines.Other;
}

function generatePrinciples(info: BusinessInfo): string[] {
  const principlesMap: Record<string, string[]> = {
    Restaurant: [
      "Show your daily specials in quick, mouth-watering clips — people eat with their eyes first.",
      "Highlight your team's personality — people buy from people, not logos.",
      "Share the 'why' behind your dishes or recipes to create an emotional connection.",
      "Post consistently during meal planning hours when people are deciding where to eat.",
      "Engage with your community by responding to comments and featuring customer reviews.",
    ],
    "Real Estate": [
      "Give virtual tours that highlight unique features — save buyers time and build interest.",
      "Share local market updates and neighborhood spotlights to position yourself as the expert.",
      "Post client testimonials and success stories to build trust and social proof.",
      "Use high-quality visuals — real estate is a visual business.",
      "Be consistent and authentic — buyers want to work with someone they can trust.",
    ],
    "Salon / Spa": [
      "Show dramatic before-and-after transformations — visual results sell services.",
      "Share quick beauty tips and tutorials to provide value beyond bookings.",
      "Highlight your stylists' personalities and expertise to build personal connections.",
      "Post client testimonials (with permission) to showcase real results.",
      "Use trending audio and effects to increase discoverability on the platform.",
    ],
    "Café / Bakery": [
      "Capture the sensory experience — steam rising, fresh bakes, the first pour.",
      "Share your baking process and 'secret' techniques to build intrigue.",
      "Feature regular customers and their favorite orders to create community.",
      "Post during morning hours when people are planning their coffee run.",
      "Show the human side — your baristas, your suppliers, your local ingredients.",
    ],
    "Gym / Fitness": [
      "Post workout tips and form corrections to provide immediate value.",
      "Share member transformation stories (with permission) to inspire prospects.",
      "Go behind the scenes with trainers and their own fitness journeys.",
      "Create challenge content that encourages engagement and participation.",
      "Post when people are most motivated — early morning and evening hours.",
    ],
    "Retail Shop": [
      "Showcase new arrivals with quick styling tips to spark imagination.",
      "Share the story behind your products or suppliers to create emotional connections.",
      "Post 'outfit of the day' or product combinations to show versatility.",
      "Feature happy customers (with permission) wearing or using your products.",
      "Use platform-specific features like shopping tags to make purchases easy.",
    ],
  };

  const principles = principlesMap[info.businessType] || [
    `Create authentic content that showcases what makes ${info.businessName} special.`,
    "Post consistently to stay top-of-mind with your local community.",
    "Engage with your audience by responding to comments and messages promptly.",
    "Use high-quality visuals that represent your brand professionally.",
    "Tell stories that create emotional connections with potential customers.",
  ];

  return principles;
}

function generatePostingTimes(info: BusinessInfo): PostingTime[] {
  const timesMap: Record<string, PostingTime[]> = {
    Restaurant: [
      { day: "Tuesday", timeRange: "5:00 PM - 7:00 PM", reason: "Peak dinner planning time when people decide where to eat." },
      { day: "Wednesday", timeRange: "5:30 PM - 7:30 PM", reason: "Mid-week engagement is high as people look for dining options." },
      { day: "Thursday", timeRange: "6:00 PM - 8:00 PM", reason: "Pre-weekend planning starts — capture the weekend crowd." },
      { day: "Saturday", timeRange: "11:00 AM - 1:00 PM", reason: "Brunch and lunch crowd is actively browsing for meal ideas." },
      { day: "Sunday", timeRange: "4:00 PM - 6:00 PM", reason: "Weekend winding down — perfect for dinner inspiration." },
    ],
    "Real Estate": [
      { day: "Tuesday", timeRange: "7:00 PM - 9:00 PM", reason: "Buyers browse after work when they have time to research." },
      { day: "Wednesday", timeRange: "7:30 PM - 9:00 PM", reason: "Mid-week evenings see high engagement from serious buyers." },
      { day: "Thursday", timeRange: "6:00 PM - 8:00 PM", reason: "People start planning weekend property viewings." },
      { day: "Sunday", timeRange: "2:00 PM - 5:00 PM", reason: "Peak browsing time — buyers have leisure time to explore listings." },
    ],
    "Salon / Spa": [
      { day: "Monday", timeRange: "6:00 PM - 8:00 PM", reason: "People plan their self-care week and book appointments." },
      { day: "Wednesday", timeRange: "7:00 PM - 9:00 PM", reason: "Mid-week boost — clients looking for Thursday/Friday slots." },
      { day: "Friday", timeRange: "12:00 PM - 2:00 PM", reason: "Lunch break browsing for weekend appointments." },
      { day: "Sunday", timeRange: "5:00 PM - 7:00 PM", reason: "Planning the week ahead — perfect for Monday/Tuesday bookings." },
    ],
    "Café / Bakery": [
      { day: "Monday", timeRange: "6:30 AM - 8:30 AM", reason: "Morning commute — catch people planning their coffee stop." },
      { day: "Wednesday", timeRange: "7:00 AM - 9:00 AM", reason: "Mid-week coffee ritual — high engagement with regulars." },
      { day: "Friday", timeRange: "7:30 AM - 9:30 AM", reason: "Friday treat mentality — people are more willing to indulge." },
      { day: "Saturday", timeRange: "8:00 AM - 10:00 AM", reason: "Weekend brunch planning time." },
    ],
    "Gym / Fitness": [
      { day: "Monday", timeRange: "5:00 AM - 7:00 AM", reason: "Motivation is highest — start-of-week energy boost." },
      { day: "Wednesday", timeRange: "6:00 AM - 8:00 AM", reason: "Mid-week warriors need that extra push to stay consistent." },
      { day: "Thursday", timeRange: "5:30 PM - 7:30 PM", reason: "After-work crowd planning their evening workouts." },
      { day: "Sunday", timeRange: "6:00 PM - 8:00 PM", reason: "Week-ahead planning — perfect for promoting Monday classes." },
    ],
    "Retail Shop": [
      { day: "Tuesday", timeRange: "12:00 PM - 2:00 PM", reason: "Lunch break browsing — impulse shopping mindset." },
      { day: "Wednesday", timeRange: "7:00 PM - 9:00 PM", reason: "Evening relaxation time — people browse while unwinding." },
      { day: "Thursday", timeRange: "6:00 PM - 8:00 PM", reason: "Pre-weekend shopping planning begins." },
      { day: "Saturday", timeRange: "10:00 AM - 12:00 PM", reason: "Peak weekend shopping time — high intent to visit stores." },
    ],
  };

  const times = timesMap[info.businessType] || [
    { day: "Tuesday", timeRange: "6:00 PM - 8:00 PM", reason: "High engagement time after work hours." },
    { day: "Wednesday", timeRange: "7:00 PM - 9:00 PM", reason: "Mid-week peak browsing time." },
    { day: "Thursday", timeRange: "6:00 PM - 8:00 PM", reason: "Pre-weekend planning and high social media activity." },
    { day: "Sunday", timeRange: "3:00 PM - 6:00 PM", reason: "Relaxed weekend browsing with high engagement rates." },
  ];

  return times;
}

function generateContentIdeas(info: BusinessInfo): ContentIdea[] {
  const ideasMap: Record<string, ContentIdea[]> = {
    Restaurant: [
      {
        title: "Customer Favorite Story",
        description: "Interview a regular about their favorite dish and why they keep coming back.",
        angle: "testimonial",
      },
      {
        title: "Behind-the-Scenes Prep",
        description: "Film a quick time-lapse of morning prep or a dish being plated.",
        angle: "behind_the_scenes",
      },
      {
        title: "Secret Menu Item",
        description: "Have your staff share their 'off-menu' favorites in a fun 10-second clip.",
        angle: "funny",
      },
      {
        title: "Daily Special Reveal",
        description: "Dramatic reveal of today's special with close-up shots and a quick description.",
        angle: "offer",
      },
      {
        title: "Meet the Chef",
        description: "Quick intro to your chef sharing their inspiration or favorite ingredient.",
        angle: "behind_the_scenes",
      },
      {
        title: "Ingredient Spotlight",
        description: "Show where you source a key ingredient and why it matters.",
        angle: "educational",
      },
      {
        title: "Staff Recommendations",
        description: "Team members share what they'd order if they were a customer.",
        angle: "funny",
      },
      {
        title: "Cooking Technique Tutorial",
        description: "Teach a simple cooking technique or recipe your customers can try at home.",
        angle: "educational",
      },
      {
        title: "Table Transformation",
        description: "Before/after of a table setup for a special event or regular service.",
        angle: "behind_the_scenes",
      },
      {
        title: "Weekend Special Announcement",
        description: "Hype up your weekend special with mouth-watering visuals and a clear call-to-action.",
        angle: "offer",
      },
    ],
    "Real Estate": [
      {
        title: "Property Tour Highlight",
        description: "60-second walkthrough of your newest listing highlighting unique features.",
        angle: "educational",
      },
      {
        title: "Buyer Success Story",
        description: "Film happy clients at their new home closing (with permission).",
        angle: "testimonial",
      },
      {
        title: "Neighborhood Spotlight",
        description: "Showcase local amenities, schools, or hidden gems in a target neighborhood.",
        angle: "educational",
      },
      {
        title: "Market Update",
        description: "Quick stats on local market trends — prices, inventory, hot areas.",
        angle: "educational",
      },
      {
        title: "Behind the Deal",
        description: "Share the journey of a recent sale from listing to closing (anonymized).",
        angle: "behind_the_scenes",
      },
      {
        title: "Home Buying Tip",
        description: "Share one actionable tip for first-time buyers or sellers.",
        angle: "educational",
      },
      {
        title: "Before & After Staging",
        description: "Show the transformation of a property after professional staging.",
        angle: "behind_the_scenes",
      },
      {
        title: "Day in the Life",
        description: "Follow your typical day as an agent — showings, calls, closings.",
        angle: "behind_the_scenes",
      },
      {
        title: "Local Business Feature",
        description: "Highlight a favorite local business near your listings to showcase the community.",
        angle: "educational",
      },
      {
        title: "Open House Invite",
        description: "Create buzz for an upcoming open house with teaser shots of the property.",
        angle: "offer",
      },
    ],
    "Salon / Spa": [
      {
        title: "Transformation Reveal",
        description: "Before/after of a dramatic hair color or cut transformation.",
        angle: "behind_the_scenes",
      },
      {
        title: "Client Testimonial",
        description: "Quick interview with a happy client about their experience.",
        angle: "testimonial",
      },
      {
        title: "Stylist Spotlight",
        description: "Introduce a team member and their specialty or style philosophy.",
        angle: "behind_the_scenes",
      },
      {
        title: "Quick Beauty Tip",
        description: "Share a 15-second tip on hair care, skin care, or styling.",
        angle: "educational",
      },
      {
        title: "Product Recommendation",
        description: "Show a favorite product and how to use it for best results.",
        angle: "educational",
      },
      {
        title: "Relaxation Moment",
        description: "Capture the calming atmosphere of your spa with soothing visuals and music.",
        angle: "behind_the_scenes",
      },
      {
        title: "Trend Alert",
        description: "Showcase the latest hair or beauty trend and how you're bringing it to clients.",
        angle: "educational",
      },
      {
        title: "Special Offer",
        description: "Announce a limited-time promotion or new service with eye-catching visuals.",
        angle: "offer",
      },
      {
        title: "Funny Client Moment",
        description: "Share a lighthearted, relatable moment from the salon (with permission).",
        angle: "funny",
      },
      {
        title: "Self-Care Reminder",
        description: "Encourage followers to prioritize self-care with a motivational message.",
        angle: "educational",
      },
    ],
    "Café / Bakery": [
      {
        title: "Morning Ritual",
        description: "Capture the first pour of coffee or the first batch of pastries coming out.",
        angle: "behind_the_scenes",
      },
      {
        title: "Baking Process",
        description: "Time-lapse of dough rising, croissants being shaped, or cakes being decorated.",
        angle: "behind_the_scenes",
      },
      {
        title: "Customer Favorite",
        description: "Interview a regular about their go-to order and why they love it.",
        angle: "testimonial",
      },
      {
        title: "Secret Recipe Hint",
        description: "Tease your 'secret ingredient' or special technique without giving it all away.",
        angle: "funny",
      },
      {
        title: "Barista Skills",
        description: "Show off latte art or a signature drink being made.",
        angle: "educational",
      },
      {
        title: "New Menu Item",
        description: "Announce and showcase a new pastry, drink, or seasonal special.",
        angle: "offer",
      },
      {
        title: "Cozy Atmosphere",
        description: "Highlight what makes your space special — the lighting, music, or reading nook.",
        angle: "behind_the_scenes",
      },
      {
        title: "Coffee Education",
        description: "Teach something about coffee — brewing methods, bean origins, or tasting notes.",
        angle: "educational",
      },
      {
        title: "Staff Picks",
        description: "Team members share their current favorite item on the menu.",
        angle: "funny",
      },
      {
        title: "Weekend Special",
        description: "Hype up your weekend brunch special or limited-time offer.",
        angle: "offer",
      },
    ],
    "Gym / Fitness": [
      {
        title: "Quick Workout Tip",
        description: "15-second demonstration of proper form for a popular exercise.",
        angle: "educational",
      },
      {
        title: "Member Transformation",
        description: "Showcase a member's fitness journey and results (with permission).",
        angle: "testimonial",
      },
      {
        title: "Trainer Spotlight",
        description: "Introduce a trainer and their specialty or training philosophy.",
        angle: "behind_the_scenes",
      },
      {
        title: "Class Preview",
        description: "Give a sneak peek of an energetic class to entice new members.",
        angle: "behind_the_scenes",
      },
      {
        title: "Nutrition Tip",
        description: "Share a quick, actionable nutrition tip or healthy recipe idea.",
        angle: "educational",
      },
      {
        title: "Motivation Monday",
        description: "Start the week with an inspiring message or workout challenge.",
        angle: "educational",
      },
      {
        title: "Equipment Tutorial",
        description: "Show how to properly use a piece of equipment that intimidates beginners.",
        angle: "educational",
      },
      {
        title: "Success Story",
        description: "Interview a member about how the gym changed their life or health.",
        angle: "testimonial",
      },
      {
        title: "Workout Challenge",
        description: "Create a simple challenge and invite followers to participate and tag you.",
        angle: "funny",
      },
      {
        title: "New Class Announcement",
        description: "Promote a new class or time slot with exciting visuals.",
        angle: "offer",
      },
    ],
    "Retail Shop": [
      {
        title: "New Arrival Showcase",
        description: "Unbox or style new products that just arrived.",
        angle: "offer",
      },
      {
        title: "Styling Tip",
        description: "Show how to style one item three different ways.",
        angle: "educational",
      },
      {
        title: "Customer Style Feature",
        description: "Showcase a customer wearing or using your products (with permission).",
        angle: "testimonial",
      },
      {
        title: "Behind-the-Scenes Sourcing",
        description: "Share where you find products or how you curate your inventory.",
        angle: "behind_the_scenes",
      },
      {
        title: "Product Story",
        description: "Tell the story behind a unique product — the maker, the materials, the inspiration.",
        angle: "educational",
      },
      {
        title: "Staff Favorites",
        description: "Team members share what they're loving in-store right now.",
        angle: "funny",
      },
      {
        title: "Restocking Day",
        description: "Film the excitement of unpacking and displaying new inventory.",
        angle: "behind_the_scenes",
      },
      {
        title: "Sale or Promotion",
        description: "Announce a special offer with clear visuals and a strong call-to-action.",
        angle: "offer",
      },
      {
        title: "Gift Idea",
        description: "Curate a gift set or showcase perfect items for upcoming occasions.",
        angle: "educational",
      },
      {
        title: "Store Tour",
        description: "Give a quick tour highlighting different sections or product categories.",
        angle: "behind_the_scenes",
      },
    ],
  };

  const ideas = ideasMap[info.businessType] || [
    {
      title: "Behind-the-Scenes Look",
      description: "Show what happens behind the scenes at your business.",
      angle: "behind_the_scenes",
    },
    {
      title: "Customer Testimonial",
      description: "Feature a happy customer sharing their experience.",
      angle: "testimonial",
    },
    {
      title: "Educational Tip",
      description: "Share valuable knowledge related to your industry.",
      angle: "educational",
    },
    {
      title: "Special Offer",
      description: "Promote a limited-time deal or new product/service.",
      angle: "offer",
    },
    {
      title: "Team Introduction",
      description: "Introduce your team members and their personalities.",
      angle: "funny",
    },
    {
      title: "Product/Service Showcase",
      description: "Highlight what makes your offering special.",
      angle: "educational",
    },
    {
      title: "Community Involvement",
      description: "Show how you're active in your local community.",
      angle: "behind_the_scenes",
    },
    {
      title: "Fun Moment",
      description: "Share a lighthearted, relatable moment from your business.",
      angle: "funny",
    },
  ];

  // Return only 6 ideas for free users
  return ideas.slice(0, 6);
}

