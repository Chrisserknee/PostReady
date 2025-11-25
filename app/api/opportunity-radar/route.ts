import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth-utils';

// Niche opportunity data - Analyzed for competition vs value
const NICHE_OPPORTUNITIES: any[] = [
  {
    id: '1',
    niche: 'AI Tool Reviews & Comparisons',
    competitionLevel: 'Low',
    competitionScore: 25,
    valueScore: 85,
    estimatedEarning: '$2K-8K/month',
    growthTrend: 'Rising',
    description: 'Create detailed reviews and comparisons of AI tools. High demand, low competition as the space is still emerging.',
    whyLowCompetition: 'Most creators focus on general tech. AI-specific review content is underserved despite massive demand.',
    entryBarrier: 'Low - Need to test tools and write clearly. No special credentials required.',
    skillsMatch: ['Writing', 'Research', 'Technology']
  },
  {
    id: '2',
    niche: 'Sustainable Pet Products',
    competitionLevel: 'Low',
    competitionScore: 30,
    valueScore: 75,
    estimatedEarning: '$1K-5K/month',
    growthTrend: 'Rising',
    description: 'Eco-friendly pet products and accessories. Growing market with conscious pet owners willing to pay premium.',
    whyLowCompetition: 'Pet niche is crowded, but sustainable/eco-friendly sub-niche has much less competition.',
    entryBarrier: 'Medium - Need to source or create products, but market is receptive to new brands.',
    skillsMatch: ['Marketing', 'E-commerce', 'Product Development']
  },
  {
    id: '3',
    niche: 'Micro-Learning Courses for Seniors',
    competitionLevel: 'Low',
    competitionScore: 20,
    valueScore: 80,
    estimatedEarning: '$3K-10K/month',
    growthTrend: 'Rising',
    description: 'Short, simple courses teaching tech skills to seniors. Massive underserved market.',
    whyLowCompetition: 'Most course creators target millennials/gen-z. Senior market is largely ignored.',
    entryBarrier: 'Low - Just need patience and clear communication skills.',
    skillsMatch: ['Teaching', 'Video Production', 'Communication']
  },
  {
    id: '4',
    niche: 'Local Business SEO Services',
    competitionLevel: 'Medium',
    competitionScore: 45,
    valueScore: 90,
    estimatedEarning: '$5K-20K/month',
    growthTrend: 'Stable',
    description: 'Help local businesses rank on Google. High value, recurring revenue model.',
    whyLowCompetition: 'Most SEO agencies target big clients. Local businesses are underserved.',
    entryBarrier: 'Medium - Need SEO knowledge but can learn basics quickly.',
    skillsMatch: ['SEO', 'Marketing', 'Local Business']
  },
  {
    id: '5',
    niche: 'B2B SaaS Content for SMBs',
    competitionLevel: 'Low',
    competitionScore: 35,
    valueScore: 85,
    estimatedEarning: '$4K-15K/month',
    growthTrend: 'Rising',
    description: 'Create content marketing for SaaS companies targeting small businesses.',
    whyLowCompetition: 'Most SaaS content targets enterprises. SMB-focused content is less competitive.',
    entryBarrier: 'Medium - Need to understand SMB pain points and SaaS products.',
    skillsMatch: ['Content Writing', 'SaaS', 'B2B Marketing']
  },
  {
    id: '6',
    niche: 'Accessible Design Consulting',
    competitionLevel: 'Low',
    competitionScore: 25,
    valueScore: 80,
    estimatedEarning: '$3K-12K/month',
    growthTrend: 'Rising',
    description: 'Help businesses make their websites/apps accessible. Legal requirement + growing demand.',
    whyLowCompetition: 'Accessibility is often overlooked. Growing legal requirements create demand.',
    entryBarrier: 'Medium - Need accessibility knowledge but can specialize quickly.',
    skillsMatch: ['Web Design', 'Accessibility', 'Consulting']
  },
  {
    id: '7',
    niche: 'Hyperlocal Newsletters',
    competitionLevel: 'Low',
    competitionScore: 30,
    valueScore: 70,
    estimatedEarning: '$500-3K/month',
    growthTrend: 'Stable',
    description: 'Newsletters covering very specific neighborhoods or small cities. Low competition, loyal audience.',
    whyLowCompetition: 'Most newsletters are national. Hyperlocal has less competition and higher engagement.',
    entryBarrier: 'Low - Just need to cover local events and news. Can start solo.',
    skillsMatch: ['Writing', 'Local Knowledge', 'Newsletter']
  },
  {
    id: '8',
    niche: 'Niche Affiliate Reviews',
    competitionLevel: 'Low',
    competitionScore: 28,
    valueScore: 75,
    estimatedEarning: '$2K-8K/month',
    growthTrend: 'Rising',
    description: 'Deep-dive reviews in specific niches (e.g., "best tools for remote teams under 10 people").',
    whyLowCompetition: 'Generic reviews are crowded. Hyper-specific reviews rank easier and convert better.',
    entryBarrier: 'Low - Need to test products and write detailed reviews.',
    skillsMatch: ['Writing', 'Research', 'SEO']
  },
  {
    id: '9',
    niche: 'Mental Health Content for Men',
    competitionLevel: 'Low',
    competitionScore: 32,
    valueScore: 85,
    estimatedEarning: '$2K-10K/month',
    growthTrend: 'Rising',
    description: 'Mental health content specifically targeting men. Underserved but growing market.',
    whyLowCompetition: 'Most mental health content is general. Men-specific content has less competition.',
    entryBarrier: 'Medium - Need sensitivity and understanding, but no formal credentials required for content.',
    skillsMatch: ['Writing', 'Mental Health', 'Content Creation']
  },
  {
    id: '10',
    niche: 'Remote Work Tools for Teams',
    competitionLevel: 'Medium',
    competitionScore: 50,
    valueScore: 88,
    estimatedEarning: '$3K-15K/month',
    growthTrend: 'Stable',
    description: 'Tools and strategies for remote teams. High value as remote work becomes standard.',
    whyLowCompetition: 'General remote work content is crowded, but team-specific tools/content is less so.',
    entryBarrier: 'Medium - Need to understand team dynamics and remote tools.',
    skillsMatch: ['Remote Work', 'Productivity', 'Team Management']
  },
  {
    id: '11',
    niche: 'Sustainable Fashion for Plus Size',
    competitionLevel: 'Low',
    competitionScore: 22,
    valueScore: 78,
    estimatedEarning: '$1K-6K/month',
    growthTrend: 'Rising',
    description: 'Eco-friendly fashion specifically for plus-size individuals. Two underserved markets combined.',
    whyLowCompetition: 'Sustainable fashion OR plus-size fashion each have competition, but combined niche is underserved.',
    entryBarrier: 'Medium - Need fashion knowledge and sustainable sourcing.',
    skillsMatch: ['Fashion', 'Sustainability', 'E-commerce']
  },
  {
    id: '12',
    niche: 'Indie Game Marketing',
    competitionLevel: 'Low',
    competitionScore: 35,
    valueScore: 82,
    estimatedEarning: '$2K-10K/month',
    growthTrend: 'Rising',
    description: 'Marketing services specifically for indie game developers. Growing market with budget constraints.',
    whyLowCompetition: 'Most marketing agencies target big studios. Indie devs need affordable, specialized help.',
    entryBarrier: 'Medium - Need gaming knowledge and marketing skills.',
    skillsMatch: ['Gaming', 'Marketing', 'Indie Games']
  },
  {
    id: '13',
    niche: 'Micro-SaaS for Solopreneurs',
    competitionLevel: 'Low',
    competitionScore: 30,
    valueScore: 90,
    estimatedEarning: '$5K-25K/month',
    growthTrend: 'Rising',
    description: 'Small SaaS tools solving specific problems for solo entrepreneurs. High value, low competition.',
    whyLowCompetition: 'Most SaaS targets teams/enterprises. Solo-focused tools are less crowded.',
    entryBarrier: 'High - Need development skills, but can start simple.',
    skillsMatch: ['Development', 'SaaS', 'Product']
  },
  {
    id: '14',
    niche: 'Parenting Content for Dads',
    competitionLevel: 'Low',
    competitionScore: 28,
    valueScore: 75,
    estimatedEarning: '$1K-5K/month',
    growthTrend: 'Stable',
    description: 'Parenting advice and content specifically for fathers. Underserved market.',
    whyLowCompetition: 'Parenting content is dominated by mom-focused creators. Dad content has less competition.',
    entryBarrier: 'Low - Just need to share authentic parenting experiences.',
    skillsMatch: ['Content Creation', 'Parenting', 'Writing']
  },
  {
    id: '15',
    niche: 'Plant-Based Meal Prep Services',
    competitionLevel: 'Medium',
    competitionScore: 48,
    valueScore: 80,
    estimatedEarning: '$2K-8K/month',
    growthTrend: 'Rising',
    description: 'Meal prep services focusing on plant-based diets. Growing market with health-conscious consumers.',
    whyLowCompetition: 'Meal prep OR plant-based each have competition, but combined niche is less crowded.',
    entryBarrier: 'Medium - Need cooking skills and can scale with delivery.',
    skillsMatch: ['Cooking', 'Meal Prep', 'Business']
  },
  {
    id: '16',
    niche: 'B2B Content for Non-Tech Industries',
    competitionLevel: 'Low',
    competitionScore: 32,
    valueScore: 85,
    estimatedEarning: '$4K-18K/month',
    growthTrend: 'Rising',
    description: 'Content marketing for SaaS/tools targeting traditional industries (construction, healthcare, etc.).',
    whyLowCompetition: 'Most B2B content targets tech companies. Non-tech industries are underserved.',
    entryBarrier: 'Medium - Need to understand industry-specific pain points.',
    skillsMatch: ['B2B', 'Content Marketing', 'Industry Knowledge']
  },
  {
    id: '17',
    niche: 'Accessibility-First Web Design',
    competitionLevel: 'Low',
    competitionScore: 25,
    valueScore: 88,
    estimatedEarning: '$4K-20K/month',
    growthTrend: 'Rising',
    description: 'Web design services prioritizing accessibility from the start. Legal compliance + better UX.',
    whyLowCompetition: 'Most designers add accessibility as afterthought. Accessibility-first is rare.',
    entryBarrier: 'Medium - Need design skills + accessibility knowledge.',
    skillsMatch: ['Web Design', 'Accessibility', 'UX']
  },
  {
    id: '18',
    niche: 'Niche Podcast Production',
    competitionLevel: 'Low',
    competitionScore: 30,
    valueScore: 78,
    estimatedEarning: '$2K-10K/month',
    growthTrend: 'Stable',
    description: 'Podcast production services for specific niches. Less competition than general podcast services.',
    whyLowCompetition: 'General podcast services are crowded. Niche-specific production has less competition.',
    entryBarrier: 'Medium - Need audio editing skills and niche knowledge.',
    skillsMatch: ['Audio Editing', 'Podcasting', 'Production']
  },
  {
    id: '19',
    niche: 'Local SEO for Service Businesses',
    competitionLevel: 'Medium',
    competitionScore: 45,
    valueScore: 92,
    estimatedEarning: '$5K-25K/month',
    growthTrend: 'Stable',
    description: 'Local SEO services for plumbers, electricians, etc. High value, recurring revenue.',
    whyLowCompetition: 'Most SEO agencies target e-commerce. Service businesses need specialized help.',
    entryBarrier: 'Medium - Need local SEO knowledge but can learn quickly.',
    skillsMatch: ['SEO', 'Local Business', 'Marketing']
  },
  {
    id: '20',
    niche: 'Creator Economy Tools',
    competitionLevel: 'Low',
    competitionScore: 28,
    valueScore: 90,
    estimatedEarning: '$5K-30K/month',
    growthTrend: 'Rising',
    description: 'Tools and services specifically for content creators. Growing market with specific needs.',
    whyLowCompetition: 'Most tools are general-purpose. Creator-specific tools solve unique problems.',
    entryBarrier: 'High - Need development skills, but creators pay well for good tools.',
    skillsMatch: ['Development', 'Creator Economy', 'SaaS']
  }
];

function calculateNicheMatch(formData: any, niche: any): number {
  let score = 60; // Base score
  
  const interestsLower = formData.interests.toLowerCase();
  const skillsLower = formData.skills.toLowerCase();
  
  // Check skill matches
  niche.skillsMatch.forEach((skill: string) => {
    if (skillsLower.includes(skill.toLowerCase())) {
      score += 10;
    }
  });
  
  // Check interest matches
  const interestWords = interestsLower.split(/[,\s]+/).filter(w => w.length > 2);
  const nicheLower = niche.niche.toLowerCase();
  const descLower = niche.description.toLowerCase();
  
  interestWords.forEach(interest => {
    if (nicheLower.includes(interest) || descLower.includes(interest)) {
      score += 8;
    }
  });
  
  // Budget consideration
  if (formData.budget === '0-100' && niche.entryBarrier.toLowerCase().includes('low')) {
    score += 10; // Low budget matches low barrier
  }
  
  // Time commitment consideration
  if (formData.timeCommitment === '30+') {
    score += 5; // Full-time commitment is valuable
  }
  
  return Math.min(100, score);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Note: This tool is available to all users (free and pro)
    
    const body = await request.json();
    
    const { interests, skills, budget, timeCommitment } = body;
    
    if (!interests || !skills || !budget || !timeCommitment) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Calculate opportunity score (value score - competition score, weighted)
    // Higher opportunity score = better niche
    const scoredNiches = NICHE_OPPORTUNITIES.map(niche => {
      const matchScore = calculateNicheMatch(body, niche);
      // Opportunity score: value score minus competition score (lower competition = better)
      const opportunityScore = niche.valueScore - (niche.competitionScore * 0.5) + (matchScore * 0.3);
      
      return {
        ...niche,
        matchScore,
        opportunityScore: Math.round(Math.max(0, Math.min(100, opportunityScore)))
      };
    })
    .filter(niche => niche.matchScore >= 50) // Show niches that match user input
    .sort((a, b) => b.opportunityScore - a.opportunityScore) // Sort by opportunity score
    .slice(0, 15); // Top 15 niches
    
    return NextResponse.json({
      niches: scoredNiches
    });
    
  } catch (error: any) {
    console.error('Niche Radar API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze niches' },
      { status: 500 }
    );
  }
}
