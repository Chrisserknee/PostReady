"use client";

import React, { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BusinessInfo, StrategyResult, PostDetails, ContentIdea } from "@/types";
import { generateStrategyAndIdeas } from "@/lib/strategy";
import { generatePostDetailsWithAI, generatePostDetails } from "@/lib/post";
import { SectionCard } from "@/components/SectionCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/InputField";
import { SelectField } from "@/components/SelectField";
import { TextAreaField } from "@/components/TextAreaField";
import { Badge } from "@/components/Badge";
import { AuthModal } from "@/components/AuthModal";
import { Modal } from "@/components/Modal";
import { Notification } from "@/components/Notification";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { saveUserProgress, loadUserProgress } from "@/lib/userProgress";
import { saveBusiness, loadSavedBusinesses, saveCompletedPost, loadPostHistory, saveVideoIdea, loadSavedVideoIdeas, deleteSavedVideoIdea, SavedVideoIdea } from "@/lib/userHistory";
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';

import { CommentBaitGenerator } from "@/components/CommentBaitGenerator";
import { SugarDaddyMessageGenerator } from "@/components/SugarDaddyMessageGenerator";
import { BrainwormGenerator } from "@/components/BrainwormGenerator";

type WizardStep = "form" | "researching" | "principles" | "choose-idea" | "record-video" | "generating-caption" | "post-details" | "premium" | "history" | "businesses" | "hashtag-research";

// Loading Progress Component with animated status messages
const LOADING_STATUSES = [
  { icon: "✍️", text: "Crafting your caption", emoji: "✨" },
  { icon: "📅", text: "Determining best posting time", emoji: "⏰" },
  { icon: "#️⃣", text: "Generating hashtags", emoji: "🎯" },
];

function LoadingProgress() {
  const [currentStatus, setCurrentStatus] = useState(0);
  
  useEffect(() => {
    // Cycle through statuses every 1500ms for smoother, more deliberate animation
    const interval = setInterval(() => {
      setCurrentStatus((prev) => {
        if (prev < LOADING_STATUSES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="text-center py-24">
      {/* Enhanced Spinner with glow effect */}
      <div className="inline-block mb-10">
        <div className="relative">
          <div className="w-24 h-24 border-4 rounded-full animate-spin" style={{ 
            borderColor: 'rgba(41, 121, 255, 0.2)',
            borderTopColor: '#2979FF',
            filter: 'drop-shadow(0 0 8px rgba(41, 121, 255, 0.4))'
          }}></div>
          <div className="absolute inset-0 w-24 h-24 border-4 rounded-full animate-ping opacity-20" style={{ 
            borderColor: '#2979FF'
          }}></div>
        </div>
      </div>
      
      {/* Status Messages with enhanced styling */}
      <div className="space-y-6 min-h-[160px]">
        {LOADING_STATUSES.map((status, index) => (
          <div
            key={index}
            className="transition-all duration-500 ease-in-out"
            style={{
              opacity: currentStatus === index ? 1 : currentStatus > index ? 0.3 : 0.15,
              transform: currentStatus === index ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
              filter: currentStatus === index ? 'brightness(1.1)' : 'brightness(0.9)',
            }}
          >
            <div className="flex items-center justify-center gap-4 mb-2">
              <span className="text-3xl transition-transform duration-300" style={{
                transform: currentStatus === index ? 'scale(1.2)' : 'scale(1)',
              }}>{status.icon}</span>
              <h3 
                className="text-2xl font-bold transition-all duration-500"
                style={{ 
                  color: currentStatus === index ? 'var(--secondary)' : 'var(--text-secondary)',
                  textShadow: currentStatus === index ? '0 2px 8px rgba(41, 121, 255, 0.2)' : 'none',
                }}
              >
                {status.text}
              </h3>
              {currentStatus === index && (
                <span className="text-2xl animate-pulse">{status.emoji}</span>
              )}
            </div>
            {currentStatus === index && (
              <div className="flex justify-center mt-3">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ 
                    backgroundColor: '#2979FF',
                    animationDelay: '0ms',
                    boxShadow: '0 0 8px rgba(41, 121, 255, 0.6)'
                  }}></div>
                  <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ 
                    backgroundColor: '#2979FF',
                    animationDelay: '150ms',
                    boxShadow: '0 0 8px rgba(41, 121, 255, 0.6)'
                  }}></div>
                  <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ 
                    backgroundColor: '#2979FF',
                    animationDelay: '300ms',
                    boxShadow: '0 0 8px rgba(41, 121, 255, 0.6)'
                  }}></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Enhanced completion indicator */}
      {currentStatus === LOADING_STATUSES.length - 1 && (
        <div className="mt-8 animate-fade-in">
          <p className="text-lg font-bold" style={{ 
            color: '#2979FF',
            textShadow: '0 2px 12px rgba(41, 121, 255, 0.3)'
          }}>
            Almost ready... ✓
          </p>
        </div>
      )}
    </div>
  );
}

function HomeContent() {
  console.log('🏠 HomeContent rendering...');
  const { user, isPro, signOut, upgradeToPro, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Module ID to URL slug mapping for SEO-friendly URLs
  const moduleUrlMap: Record<string, string> = {
    'digital-product-builder': 'digital-product-builder',
    'opportunity-radar': 'opportunity-radar',
    'digital-products': 'digital-products',
    'comment-bait': 'comment-bait-generator',
    'brainworm-generator': 'brainworm-phrase-generator',
    'sugar-daddy-messages': 'sugar-daddy-message-generator',
    'music-generator': 'music-generator',
    'voiceover-generator': 'voiceover-generator',
    'collab-engine': 'collab-engine',
    'trend-radar': 'trend-radar',
    'idea-generator': 'idea-generator',
    'sora-prompt': 'sora-prompt',
    'hashtag-research': 'hashtag-research',
    'page-analyzer': 'page-analyzer',
    'kidsafe-url-checker': 'kidsafe-url-checker',
    'red-flag-detector': 'red-flag-detector',
    'cringe-couple-caption': 'cringe-couple-caption-generator',
    'comment-fight-starter': 'comment-fight-starter-generator',
    'poor-life-choices-advisor': 'poor-life-choices-advisor',
    'random-excuse': 'random-excuse-generator',
  };

  const getModuleUrl = (moduleId: string): string => {
    return `/tools/${moduleUrlMap[moduleId] || moduleId}`;
  };
  
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: "",
    businessType: "Restaurant",
    location: "",
    platform: "Instagram",
  });
  const [userType, setUserType] = useState<'business' | 'creator'>('business');
  const [creatorGoals, setCreatorGoals] = useState<string>("");
  const [planType, setPlanType] = useState<'pro' | 'creator'>('pro');
  const [isPlanTransitioning, setIsPlanTransitioning] = useState<boolean>(false);
  
  // Track user plan type from database
  const [userPlanType, setUserPlanType] = useState<'free' | 'pro' | 'creator'>('free');
  
  // Check if user is a creator (from database plan_type or user_metadata)
  const isCreator = userPlanType === 'creator' || user?.user_metadata?.role === 'creator' || user?.user_metadata?.plan === 'creator';
  

  const [strategy, setStrategy] = useState<StrategyResult | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>("form");
  const [researchProgress, setResearchProgress] = useState<number>(0);
  const [researchStatus, setResearchStatus] = useState<string>("");

  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [videoDescription, setVideoDescription] = useState<string>("");
  const [postPlatform, setPostPlatform] = useState<string>("");
  const [postDetails, setPostDetails] = useState<PostDetails | null>(null);
  const [isSavedToHistory, setIsSavedToHistory] = useState<boolean>(false);
  const [isSavingToHistory, setIsSavingToHistory] = useState<boolean>(false);
  const [rewriteCount, setRewriteCount] = useState<number>(0);
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const [regenerateCount, setRegenerateCount] = useState<number>(0);
  const [rewordTitleCount, setRewordTitleCount] = useState<number>(0);
  const [isRewordingTitle, setIsRewordingTitle] = useState<boolean>(false);
  const [userNotes, setUserNotes] = useState<string>("");
  const [showGuideAI, setShowGuideAI] = useState<boolean>(false);
  const [aiGuidance, setAiGuidance] = useState<string>("");
  const [showGuideAIForIdeas, setShowGuideAIForIdeas] = useState<boolean>(false);
  const [aiGuidanceForIdeas, setAiGuidanceForIdeas] = useState<string>("");
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState<boolean>(false);
  const [hashtagCount, setHashtagCount] = useState<number>(0);
  const [guideAICount, setGuideAICount] = useState<number>(0);
  const [guideAIForIdeasCount, setGuideAIForIdeasCount] = useState<number>(0);
  
  // Close Guide AI bubble when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showGuideAI && !target.closest('.guide-ai-container')) {
        setShowGuideAI(false);
      }
      if (showGuideAIForIdeas && !target.closest('.guide-ai-ideas-container')) {
        setShowGuideAIForIdeas(false);
      }
    };
    
    if (showGuideAI || showGuideAIForIdeas) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showGuideAI, showGuideAIForIdeas]);
  const [captionAnimation, setCaptionAnimation] = useState<'idle' | 'fadeOut' | 'typing'>('idle');
  const [titleAnimation, setTitleAnimation] = useState<'idle' | 'fadeOut' | 'fadeIn'>('idle');
  const [ideasAnimation, setIdeasAnimation] = useState<'idle' | 'fadeOut' | 'fadeIn'>('idle');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState<boolean>(false);
  const [generateIdeasCount, setGenerateIdeasCount] = useState<number>(0);
  const [hasLoadedUsageCounts, setHasLoadedUsageCounts] = useState<boolean>(false);
  const [billingLoading, setBillingLoading] = useState<boolean>(false);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  
  // Hashtag Deep Research Tool State
  const [hashtagResearchNiche, setHashtagResearchNiche] = useState<string>("");
  const [hashtagResearchPlatform, setHashtagResearchPlatform] = useState<string>("Instagram");
  const [hashtagResults, setHashtagResults] = useState<any>(null);
  const [isResearchingHashtags, setIsResearchingHashtags] = useState<boolean>(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState<boolean>(false);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [generationCount, setGenerationCount] = useState<number>(0);
  const hashtagSectionRef = useRef<HTMLDivElement>(null);

  // Module Reorder State
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false);
  const [moduleOrder, setModuleOrder] = useState<string[]>([
    'digital-product-builder',
    'opportunity-radar',
    'digital-products',
    'kidsafe-url-checker',
    'red-flag-detector',
    'comment-bait',
    'brainworm-generator',
    'sugar-daddy-messages',
    'music-generator',
    'voiceover-generator',
    'collab-engine',
    'trend-radar',
    'idea-generator',
    'sora-prompt',
    'hashtag-research',
    'cringe-couple-caption',
    'comment-fight-starter',
    'poor-life-choices-advisor',
    'random-excuse'
  ]);
  const [draggedModule, setDraggedModule] = useState<string | null>(null);
  const [dragOverModule, setDragOverModule] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [hoveredFunnyGenerators, setHoveredFunnyGenerators] = useState<boolean>(false);
  const [hoveredPostReadyTools, setHoveredPostReadyTools] = useState<boolean>(false);
  const [hoveredSocialMediaTools, setHoveredSocialMediaTools] = useState<boolean>(false);

  // Tool data for expanding cards
  const toolData: Record<string, { title: string; description: string; fullDescription: string; features: string[]; icon: string; color: string }> = {
    'digital-product-builder': {
      title: 'Digital Product Builder',
      description: 'Build your digital product from idea to launch. A complete 7-step guided pathway.',
      fullDescription: 'Create your digital product from start to finish. This guided pathway takes you through product discovery, blueprint creation, content building, pricing strategy, sales copy, launch planning, and platform recommendations. Each step builds on the previous one, creating a complete product ready to launch.',
      features: ['7-step guided pathway', 'Product discovery & blueprint', 'Content generation', 'Pricing strategy', 'Sales copy', 'Launch plan', 'Platform recommendations'],
      icon: '📦',
      color: '#8B5CF6'
    },
    'opportunity-radar': {
      title: 'Niche Radar',
      description: 'Find low-competition, high-value niches. Discover untapped opportunities for maximum success.',
      fullDescription: 'Discover profitable niches with low competition but high value. See a live graph showing where competition is low and value is high - the perfect sweet spot for success. Most people compete in crowded markets - this tool helps you find underserved niches where you can stand out.',
      features: ['Live competition vs value graph', 'Sweet spot identification', 'Low competition analysis', 'Entry barrier insights'],
      icon: '🎯',
      color: '#2979FF'
    },
    'kidsafe-url-checker': {
      title: 'KidSafe URL Checker',
      description: 'Check if a website is safe for children under 13',
      fullDescription: 'Check if any website is safe for children under 13. Get instant safety ratings with clear explanations. Perfect for parents who want to verify website content safety before allowing their kids to visit.',
      features: ['Instant safety ratings', 'AI-powered content analysis', 'Color-coded results', 'Parent-friendly design'],
      icon: '🛡️',
      color: '#10B981'
    },
    'red-flag-detector': {
      title: 'Red Flag Detector',
      description: 'Detect hidden meanings and identify red flags in text messages and conversations',
      fullDescription: 'Detect hidden meanings and identify red flags in text messages, social media posts, and conversations. Understand what people REALLY mean when they say things that seem innocent but are actually warning signs.',
      features: ['Decode hidden meanings', 'Identify warning signs', 'Beautiful animated analysis', 'Context-aware detection'],
      icon: '🚩',
      color: '#ef4444'
    },
    'digital-products': {
      title: 'Premium Collection',
      description: 'Browse and access premium digital products and resources',
      fullDescription: 'Browse and access premium digital products and resources. Get exclusive content, templates, and tools to level up your social media game.',
      features: ['Curated digital products', 'Premium resources', 'Exclusive content', 'Regular updates'],
      icon: '💎',
      color: '#DAA520'
    },
    'collab-engine': {
      title: 'TikTok Collab Engine',
      description: 'Find perfect collaboration partners based on your niche, audience, and goals',
      fullDescription: 'Find perfect collaboration partners based on your niche, audience, and goals. Connect with creators who align with your brand and can help you grow.',
      features: ['Smart matching', 'Niche filtering', 'Audience analysis', 'Real user verification'],
      icon: '🤝',
      color: '#FF4F78'
    },
    'trend-radar': {
      title: 'Trend Radar',
      description: 'Discover trending topics and analyze what\'s hot in your industry',
      fullDescription: 'Discover trending topics and analyze what\'s hot in your industry. Get real-time insights, platform metrics, and actionable strategies to capitalize on trends.',
      features: ['Real-time trends', 'In-depth analysis', 'Platform metrics', 'Actionable insights'],
      icon: '📡',
      color: '#06B6D4'
    },
    'idea-generator': {
      title: 'Viral Video Idea Generator',
      description: 'Generate viral video ideas that are proven to engage and convert',
      fullDescription: 'Generate viral video ideas that are proven to engage and convert. Get multiple angles, engagement scores, and trending topics to create content that performs.',
      features: ['Viral concepts', 'Multiple angles', 'Engagement scores', 'Trending topics'],
      icon: '💡',
      color: '#F97316'
    },
    'hashtag-research': {
      title: 'Hashtag Research',
      description: 'Research and find the best hashtags for your content to maximize reach',
      fullDescription: 'Research and find the best hashtags for your content to maximize reach. Get trending hashtags, engagement metrics, competitor analysis, and optimal combinations.',
      features: ['Trending hashtags', 'Engagement metrics', 'Competitor analysis', 'Optimal combinations'],
      icon: '#️⃣',
      color: '#14B8A6'
    },
    'cringe-couple-caption': {
      title: 'Cringe Couple Caption Generator',
      description: 'Generate hilariously cringeworthy couple captions perfect for memes and parodies',
      fullDescription: 'Generate hilariously cringeworthy couple captions perfect for memes and parodies. Create entertainment content that gets laughs and engagement.',
      features: ['Cringe-worthy content', 'Multiple styles', 'Meme-ready', 'Entertainment value'],
      icon: '💑',
      color: '#EC4899'
    },
    'comment-fight-starter': {
      title: 'Comment Fight Starter Generator',
      description: 'Generate controversial, debate-provoking comments designed to spark engagement',
      fullDescription: 'Generate controversial, debate-provoking comments designed to spark engagement. Create comments that get people talking and boost your post visibility.',
      features: ['Debate starters', 'Controversial topics', 'Engagement-focused', 'Multiple tones'],
      icon: '💥',
      color: '#EF4444'
    },
    'poor-life-choices-advisor': {
      title: 'Poor Life Choices Advisor',
      description: 'Get humorous, sarcastic advice about poor life choices. Perfect for entertainment',
      fullDescription: 'Get humorous, sarcastic advice about poor life choices. Perfect for entertainment. Generate relatable, funny content that resonates with your audience.',
      features: ['Humorous advice', 'Sarcastic tone', 'Entertainment', 'Relatable content'],
      icon: '🤦',
      color: '#F59E0B'
    },
    'random-excuse': {
      title: 'Random Excuse Generator',
      description: 'Generate creative excuses for any situation - believable or hilariously unbelievable',
      fullDescription: 'Generate creative excuses for any situation - believable or hilariously unbelievable. Perfect for entertainment content and relatable humor.',
      features: ['Creative excuses', 'Believability levels', 'Situation-specific', 'Entertainment value'],
      icon: '🎭',
      color: '#F59E0B'
    },
    'comment-bait': {
      title: 'Comment Bait Generator',
      description: 'Generate engaging comments designed to spark conversations and increase engagement',
      fullDescription: 'Generate engaging comments designed to spark conversations and increase engagement on your posts. Create comments that drive visibility and interaction.',
      features: ['Engagement-focused comments', 'Multiple styles', 'Platform-specific', 'Viral potential'],
      icon: '🎣',
      color: '#2979FF'
    },
    'brainworm-generator': {
      title: 'Brainworm Phrase Generator',
      description: 'Create catchy, memorable phrases that stick in people\'s minds',
      fullDescription: 'Create catchy, memorable phrases that stick in people\'s minds. Generate viral hooks and memorable content that people can\'t forget.',
      features: ['Memorable phrases', 'Catchy hooks', 'Viral potential', 'Multiple variations'],
      icon: '🧠',
      color: '#8B5CF6'
    },
    'sugar-daddy-messages': {
      title: 'Sugar Daddy Message Generator',
      description: 'Generate professional and engaging messages for business communications',
      fullDescription: 'Generate professional and engaging messages for business communications. Create templates that are context-aware and customizable for your needs.',
      features: ['Professional tone', 'Multiple templates', 'Context-aware', 'Customizable'],
      icon: '💼',
      color: '#10B981'
    },
    'music-generator': {
      title: 'Music Generator',
      description: 'Generate music ideas, beats, and sound concepts for your content',
      fullDescription: 'Generate music ideas, beats, and sound concepts for your content. Get genre-specific inspiration and creative concepts for your videos.',
      features: ['Music ideas', 'Beat concepts', 'Genre-specific', 'Creative inspiration'],
      icon: '🎵',
      color: '#F59E0B'
    },
    'voiceover-generator': {
      title: 'Script & Voiceover Generator',
      description: 'Create scripts and generate voiceovers using AI-powered voices',
      fullDescription: 'Create scripts and generate voiceovers using AI-powered voices. Get professional quality audio with ElevenLabs integration and multiple voice options.',
      features: ['AI-generated scripts', 'Multiple voice options', 'ElevenLabs integration', 'Professional quality'],
      icon: '🎙️',
      color: '#EC4899'
    },
    'sora-prompt': {
      title: 'Sora Prompt Generator',
      description: 'Create detailed prompts for AI video generation using Sora',
      fullDescription: 'Create detailed prompts for AI video generation using Sora. Generate optimized prompts with scene descriptions and style options.',
      features: ['Detailed prompts', 'Scene descriptions', 'Style options', 'Optimized for AI'],
      icon: '🎬',
      color: '#6366F1'
    },
    'page-analyzer': {
      title: 'Page Analyzer',
      description: 'Analyze social media profiles and pages to understand performance and strategy',
      fullDescription: 'Analyze social media profiles and pages to understand performance and strategy. Get profile insights, performance metrics, and strategy recommendations.',
      features: ['Profile insights', 'Performance metrics', 'Content analysis', 'Strategy recommendations'],
      icon: '📊',
      color: '#8B5CF6'
    }
  };

  // Module Collapse State
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(
    new Set(['digital-product-builder', 'digital-products', 'kidsafe-url-checker', 'red-flag-detector', 'collab-engine', 'trend-radar', 'idea-generator', 'hashtag-research', 'sora-prompt', 'music-generator', 'voiceover-generator', 'page-analyzer', 'comment-bait', 'brainworm-generator', 'sugar-daddy-messages', 'cringe-couple-caption', 'comment-fight-starter', 'poor-life-choices-advisor', 'random-excuse'])
  );

  const toggleModuleCollapse = (moduleId: string) => {
    setCollapsedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const collapseAllModules = () => {
    const allModules = ['digital-product-builder', 'digital-products', 'kidsafe-url-checker', 'red-flag-detector', 'collab-engine', 'trend-radar', 'idea-generator', 'hashtag-research', 'sora-prompt', 'music-generator', 'voiceover-generator', 'page-analyzer', 'comment-bait', 'brainworm-generator', 'cringe-couple-caption', 'comment-fight-starter', 'poor-life-choices-advisor', 'random-excuse'];
    setCollapsedModules(new Set(allModules));
  };

  const expandAllModules = () => {
    setCollapsedModules(new Set());
  };

  const areAllModulesCollapsed = () => {
    const allModules = ['digital-products', 'kidsafe-url-checker', 'red-flag-detector', 'collab-engine', 'trend-radar', 'idea-generator', 'hashtag-research', 'sora-prompt', 'music-generator', 'voiceover-generator', 'page-analyzer', 'comment-bait', 'brainworm-generator', 'sugar-daddy-messages', 'cringe-couple-caption', 'comment-fight-starter', 'poor-life-choices-advisor', 'random-excuse'];
    return allModules.every(module => collapsedModules.has(module));
  };

  // Collab Engine State
  const [collabUsername, setCollabUsername] = useState<string>("");
  const [collabNiche, setCollabNiche] = useState<string>("");
  const [collabFollowerCount, setCollabFollowerCount] = useState<string>("");
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [isLoadingCollabs, setIsLoadingCollabs] = useState<boolean>(false);
  const [showJoinDirectory, setShowJoinDirectory] = useState<boolean>(false);
  const [directoryProfile, setDirectoryProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true); // Start as loading
  const [isSubmittingProfile, setIsSubmittingProfile] = useState<boolean>(false);
  const [copyingDmIndex, setCopyingDmIndex] = useState<number | null>(null);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState<boolean>(false);
  const [profileForm, setProfileForm] = useState({
    tiktok_username: "",
    display_name: "",
    niche: "",
    follower_count: "",
    content_focus: "",
    bio: "",
    email_for_collabs: "",
    password: "",
  });
  const collabSectionRef = useRef<HTMLDivElement>(null);

  // Trend Radar State
  const [showAdvancedTrends, setShowAdvancedTrends] = useState<boolean>(false);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [hoveredTrend, setHoveredTrend] = useState<any>(null);

  // Viral Video Idea Generator State
  const [viralTopic, setViralTopic] = useState<string>("");
  const [viralIdeas, setViralIdeas] = useState<any[]>([]);
  const [isGeneratingViralIdeas, setIsGeneratingViralIdeas] = useState<boolean>(false);
  const [viralIdeasProgress, setViralIdeasProgress] = useState<number>(0);
  const [viralIdeasUsageCount, setViralIdeasUsageCount] = useState<number>(0);
  const [showViralIdeasPaywall, setShowViralIdeasPaywall] = useState<boolean>(false);
  const [showGuideInput, setShowGuideInput] = useState<boolean>(false);
  const [guidePrompt, setGuidePrompt] = useState<string>("");
  const [isRefining, setIsRefining] = useState<boolean>(false);

  // Sora Prompt Generator State
  const [soraVideoIdea, setSoraVideoIdea] = useState<string>("");
  const [soraStyle, setSoraStyle] = useState<string>("");
  const [soraCameraMovement, setSoraCameraMovement] = useState<string>("");
  const [soraMood, setSoraMood] = useState<string>("");
  const [soraPrompts, setSoraPrompts] = useState<any[]>([]);
  const [isGeneratingSora, setIsGeneratingSora] = useState<boolean>(false);

  // Music Generator State
  const [musicPrompt, setMusicPrompt] = useState<string>("");
  const [musicDuration, setMusicDuration] = useState<number>(30);
  const [musicType, setMusicType] = useState<string>("instrumental");
  const [isGeneratingMusic, setIsGeneratingMusic] = useState<boolean>(false);
  const [musicProgress, setMusicProgress] = useState<number>(0);
  const [generatedMusic, setGeneratedMusic] = useState<any>(null);
  const [musicHistory, setMusicHistory] = useState<any[]>([]);
  const [showMusicHistory, setShowMusicHistory] = useState<boolean>(false);
  const [soraUsageCount, setSoraUsageCount] = useState<number>(0);

  // Script and Voiceover Generator State
  const [voiceoverTopic, setVoiceoverTopic] = useState<string>("");
  const [voiceoverDuration, setVoiceoverDuration] = useState<number>(30);
  const [voiceoverVoice, setVoiceoverVoice] = useState<string>("TYkIHhDWzXPHalxGXze5"); // Default voice ID (Trailer Voice)
  const [voiceoverScript, setVoiceoverScript] = useState<string>("");
  const [voiceoverGuidance, setVoiceoverGuidance] = useState<string>("");
  const [showGuidanceInput, setShowGuidanceInput] = useState<boolean>(false);
  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState<boolean>(false);
  const [voiceoverProgress, setVoiceoverProgress] = useState<number>(0);
  const [generatedVoiceover, setGeneratedVoiceover] = useState<any>(null);
  const [showVoiceoverScript, setShowVoiceoverScript] = useState<boolean>(false);

  // Digital Products State
  const [digitalProducts, setDigitalProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [showSoraPaywall, setShowSoraPaywall] = useState<boolean>(false);
  const [showVoiceoverPaywall, setShowVoiceoverPaywall] = useState<boolean>(false);
  const [showMusicPaywall, setShowMusicPaywall] = useState<boolean>(false);

  // Music generation function
  const generateMusic = async () => {
    // Check if user is Pro
    if (!isPro) {
      setShowMusicPaywall(true);
      return;
    }

    if (!musicPrompt.trim()) {
      alert('Please describe the music you want to create!');
      return;
    }

    setIsGeneratingMusic(true);
    setMusicProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setMusicProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 1;
      });
    }, (musicDuration * 1000) / 95);

    try {
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: musicPrompt,
          duration: musicDuration,
          type: musicType,
        }),
      });

      clearInterval(progressInterval);
      const data = await response.json();

      // Handle backend paywall
      if (response.status === 403 || data.requiresUpgrade) {
        setShowMusicPaywall(true);
        setMusicProgress(0);
        return;
      }

      if (response.ok) {
        const musicData = {
          ...data,
          timestamp: new Date().toISOString(),
          id: Date.now(),
        };
        setGeneratedMusic(musicData);
        setMusicHistory(prev => [musicData, ...prev].slice(0, 10)); // Keep last 10
        setMusicProgress(100);
      } else {
        alert(data.error || 'Failed to generate music');
        setMusicProgress(0);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error generating music:', error);
      alert('Failed to generate music. Please try again.');
      setMusicProgress(0);
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  // Voiceover generation function
  const generateVoiceover = async () => {
    // Check if user is Pro
    if (!isPro) {
      setShowVoiceoverPaywall(true);
      return;
    }

    if (!voiceoverTopic.trim()) {
      alert('Please enter a topic for your voiceover!');
      return;
    }

    setIsGeneratingVoiceover(true);
    setVoiceoverProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setVoiceoverProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 2;
      });
    }, 300);

    try {
      // First, generate the script
      const scriptResponse = await fetch('/api/generate-voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: voiceoverTopic,
          duration: voiceoverDuration,
          voice: voiceoverVoice,
          generateScriptOnly: true,
        }),
      });

      clearInterval(progressInterval);
      const scriptData = await scriptResponse.json();

      // Handle backend paywall
      if (scriptResponse.status === 403 || scriptData.requiresUpgrade) {
        setShowVoiceoverPaywall(true);
        setVoiceoverProgress(0);
        return;
      }

      if (scriptResponse.ok && scriptData.script) {
        setVoiceoverScript(scriptData.script);
        setVoiceoverProgress(100);
        setTimeout(() => setVoiceoverProgress(0), 500); // Clear progress after a brief moment
      } else {
        throw new Error(scriptData.error || 'Failed to generate script');
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error generating script:', error);
      alert('Failed to generate script. Please try again.');
      setVoiceoverProgress(0);
    } finally {
      setIsGeneratingVoiceover(false);
    }
  };

  const generateVoiceoverAudio = async () => {
    // Check if user is Pro
    if (!isPro) {
      setShowVoiceoverPaywall(true);
      return;
    }

    if (!voiceoverScript.trim()) {
      alert('Please generate a script first!');
      return;
    }

    setIsGeneratingVoiceover(true);
    setVoiceoverProgress(50);
    
    // Continue progress
    const progressInterval = setInterval(() => {
      setVoiceoverProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 1;
      });
    }, 200);

    try {
      const response = await fetch('/api/generate-voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: voiceoverTopic,
          duration: voiceoverDuration,
          voice: voiceoverVoice,
          generateScriptOnly: false,
        }),
      });

      clearInterval(progressInterval);
      const data = await response.json();

      // Handle backend paywall
      if (response.status === 403 || data.requiresUpgrade) {
        setShowVoiceoverPaywall(true);
        setVoiceoverProgress(0);
        return;
      }

      if (response.ok) {
        const voiceoverData = {
          ...data,
          timestamp: new Date().toISOString(),
          id: Date.now(),
        };
        setGeneratedVoiceover(voiceoverData);
        setVoiceoverProgress(100);
      } else {
        alert(data.error || 'Failed to generate voiceover');
        setVoiceoverProgress(50);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error generating voiceover:', error);
      alert('Failed to generate voiceover. Please try again.');
      setVoiceoverProgress(50);
    } finally {
      setIsGeneratingVoiceover(false);
    }
  };

  const guideVoiceoverScript = async (guidance?: string) => {
    // Check if user is Pro
    if (!isPro) {
      setShowVoiceoverPaywall(true);
      return;
    }

    const guidanceText = guidance || voiceoverGuidance;
    
    if (!guidanceText.trim()) {
      alert('Please enter guidance to refine the script!');
      return;
    }

    setIsGeneratingVoiceover(true);
    setVoiceoverProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setVoiceoverProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 2;
      });
    }, 300);

    try {
      const response = await fetch('/api/generate-voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: voiceoverTopic,
          duration: voiceoverDuration,
          voice: voiceoverVoice,
          generateScriptOnly: true,
          guidance: guidanceText,
          currentScript: voiceoverScript,
        }),
      });

      clearInterval(progressInterval);
      const scriptData = await response.json();

      if (response.ok && scriptData.script) {
        setVoiceoverScript(scriptData.script);
        setVoiceoverGuidance(''); // Clear guidance after applying
        setShowGuidanceInput(false); // Hide guidance input
        setVoiceoverProgress(100);
        setTimeout(() => setVoiceoverProgress(0), 500); // Clear progress after a brief moment
      } else {
        throw new Error(scriptData.error || 'Failed to refine script');
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error refining script:', error);
      alert('Failed to refine script. Please try again.');
      setVoiceoverProgress(0);
    } finally {
      setIsGeneratingVoiceover(false);
    }
  };

  // Page Analyzer State
  const [pageScreenshot, setPageScreenshot] = useState<File | null>(null);
  const [pageScreenshotPreview, setPageScreenshotPreview] = useState<string>("");
  const [pageAnalysis, setPageAnalysis] = useState<any>(null);
  const [isAnalyzingPage, setIsAnalyzingPage] = useState<boolean>(false);
  const [pageUserInfo, setPageUserInfo] = useState({
    username: '',
    fullName: '',
    bioLinks: '',
    followerCount: '',
    postCount: '',
    socialLink: '',
  });
  
  // Generate or retrieve a persistent device ID
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      // Create a unique device ID based on browser characteristics
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  // Load Sora usage count
  // Load digital products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('digital_products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDigitalProducts(data || []);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // Handle payment success and download
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      const sessionId = urlParams.get('session_id');
      const productId = urlParams.get('product_id');

      if (paymentStatus === 'success' && sessionId && productId) {
        try {
          const response = await fetch('/api/verify-purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, productId }),
          });

          const data = await response.json();

          if (response.ok && data.downloadUrl) {
            // Trigger download
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = data.productTitle || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show success notification
            setNotification({
              isOpen: true,
              message: `✅ Purchase successful! Your download should start automatically.`,
              type: 'success',
            });

            // Clean URL
            window.history.replaceState({}, '', '/');
          }
        } catch (error) {
          console.error('Error verifying purchase:', error);
        }
      }
    };

    handlePaymentSuccess();
  }, []);

  useEffect(() => {
    const loadSoraUsage = async () => {
      try {
        const deviceId = getDeviceId();
        
        // Check both device-based and user-based usage
        const deviceUsageKey = `sora_usage_${deviceId}`;
        const userUsageKey = user ? `sora_usage_user_${user.id}` : null;
        
        const deviceUsage = localStorage.getItem(deviceUsageKey);
        const userUsage = userUsageKey ? localStorage.getItem(userUsageKey) : null;
        
        // Use the maximum of device or user usage (whichever is higher)
        // This prevents bypassing by signing in/out
        const maxUsage = Math.max(
          deviceUsage ? parseInt(deviceUsage) : 0,
          userUsage ? parseInt(userUsage) : 0
        );
        
        setSoraUsageCount(maxUsage);
      } catch (error) {
        console.error('Error loading Sora usage:', error);
      }
    };
    
    loadSoraUsage();
  }, [user]);

  // Watch for platform changes and regenerate hashtags if results exist
  useEffect(() => {
    // Only regenerate if we have results and the platform doesn't match
    if (!hashtagResults || hashtagResults.platform === hashtagResearchPlatform) {
      return;
    }
    
    // Platform changed - regenerate with new platform using AI
    const regenerateHashtags = async () => {
      console.log('🔄 Platform changed from', hashtagResults.platform, 'to', hashtagResearchPlatform);
      
      setIsResearchingHashtags(true);
      
      try {
        const response = await fetch('/api/generate-hashtags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            niche: hashtagResults.niche,
            platform: hashtagResearchPlatform,
            batchNumber: 0
          })
        });

        if (!response.ok) {
          throw new Error('Failed to regenerate hashtags');
        }

        const data = await response.json();
        
        console.log('✅ Generated new hashtags for', hashtagResearchPlatform);
        
        setHashtagResults({
          niche: hashtagResults.niche,
          platform: hashtagResearchPlatform,
          hashtags: data.hashtags
        });
        setGenerationCount(1);
        setSelectedHashtags([]); // Clear selections when platform changes
      } catch (error) {
        console.error('Error regenerating hashtags:', error);
        showNotification('Failed to regenerate hashtags. Please try again.', 'error', 'Error');
      } finally {
        setIsResearchingHashtags(false);
      }
    };
    
    regenerateHashtags();
  }, [hashtagResearchPlatform, hashtagResults?.platform, hashtagResults?.niche]);
  
  // Notification state
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isOpen: false,
    message: '',
    type: 'success',
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');
  const [redirectToCheckoutAfterAuth, setRedirectToCheckoutAfterAuth] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const signingOutRef = useRef(false);

  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'confirm' | 'success' | 'error';
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  // Celebration modal for successful subscription
  const [showCelebration, setShowCelebration] = useState(false);

  // History and Businesses state
  const [savedBusinesses, setSavedBusinesses] = useState<Array<{
    id: string;
    businessInfo: BusinessInfo;
    strategy: StrategyResult;
    lastUsed: string;
  }>>([]);
  const [completedPosts, setCompletedPosts] = useState<Array<{
    id: string;
    businessName: string;
    videoIdea: ContentIdea;
    postDetails: PostDetails;
    completedAt: string;
  }>>([]);
  const [savedVideoIdeas, setSavedVideoIdeas] = useState<SavedVideoIdea[]>([]);

  const strategyRef = useRef<HTMLDivElement>(null);
  const postPlannerRef = useRef<HTMLDivElement>(null);

  // Load user plan type when user signs in or when isPro changes
  useEffect(() => {
    const loadUserPlanType = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('plan_type, is_pro')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            setUserPlanType(data.plan_type || 'free');
          }
        } catch (error) {
          console.error('Error loading plan type:', error);
        }
      } else {
        setUserPlanType('free');
      }
    };
    
    loadUserPlanType();
  }, [user, isPro]); // Added isPro dependency to refresh when subscription status changes
  
  // Load user progress when user signs in
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // Load progress from database
        loadProgress();
        loadHistoryData();
      }
    }
  }, [user, authLoading]);

  // Load user's collab directory profile
  useEffect(() => {
    const loadCollabProfile = async () => {
      if (!user) {
        console.log('❌ No user, skipping profile load');
        setIsLoadingProfile(false); // Done loading - no user
        return;
      }
      
      setIsLoadingProfile(true); // Start loading
      
      try {
        console.log('🔄 Loading collab profile for user:', user.id);
        // Get user session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('❌ No session found');
          setIsLoadingProfile(false);
          return;
        }

        const response = await fetch('/api/collab-directory', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        console.log('📡 Profile fetch response:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Profile data received:', data);
          
          if (data.profile) {
            setDirectoryProfile(data.profile);
            console.log('✅ Profile loaded successfully:', data.profile.tiktok_username);
            // Pre-fill the form with existing data
            setProfileForm({
              tiktok_username: data.profile.tiktok_username || "",
              display_name: data.profile.display_name || "",
              niche: data.profile.niche || "",
              follower_count: data.profile.follower_range || "",
              content_focus: data.profile.content_focus || "",
              bio: data.profile.bio || "",
              email_for_collabs: data.profile.email_for_collabs || "",
              password: "", // Password is never stored or retrieved
            });
          } else {
            console.log('⚠️ No profile found in response');
          }
        } else {
          console.log('❌ Profile fetch failed:', await response.text());
        }
      } catch (error) {
        console.error('❌ Error loading collab profile:', error);
      } finally {
        setIsLoadingProfile(false); // Done loading
      }
    };
    
    if (user && !authLoading) {
      console.log('👤 User detected, loading profile...');
      loadCollabProfile();
    } else if (!authLoading) {
      // No user and auth is done loading
      setIsLoadingProfile(false);
    }
  }, [user, authLoading]);

  // Auto-save progress when data changes (but not for navigation pages)
  useEffect(() => {
    const navigationPages: WizardStep[] = ["businesses", "history", "premium", "form"];
    if (user && !navigationPages.includes(currentStep)) {
      saveProgress();
    }
  }, [user, businessInfo, strategy, selectedIdea, postDetails, currentStep]);

  // Auto-redirect to checkout after signup/signin if needed
  useEffect(() => {
    if (user && redirectToCheckoutAfterAuth && !authLoading) {
      setRedirectToCheckoutAfterAuth(false);
      initiateCheckout();
    }
  }, [user, redirectToCheckoutAfterAuth, authLoading]);


  // Handle URL parameters for navigation from portal
  useEffect(() => {
    const view = searchParams.get('view');
    const premium = searchParams.get('premium');
    const upgrade = searchParams.get('upgrade');
    
    // Skip if there are no params to process
    if (!view && !premium && !upgrade) {
      return;
    }
    
    // Process the params
    if (view === 'history') {
      setCurrentStep('history');
      // Reload history data when navigating to history page (only for real users)
      if (user) {
        loadHistoryData();
      }
      // Clear URL params after navigation
      setTimeout(() => {
        router.replace('/', { scroll: false });
      }, 100);
    } else if (view === 'businesses') {
      setCurrentStep('businesses');
      // Reload businesses data when navigating to businesses page (only for real users)
      if (user) {
        loadHistoryData();
      }
      // Clear URL params after navigation
      setTimeout(() => {
        router.replace('/', { scroll: false });
      }, 100);
    } else if (upgrade === 'success') {
      // Get session_id from URL
      const sessionId = searchParams.get('session_id');
      
      console.log('🎉 Upgrade success detected!', { sessionId, hasUser: !!user });
      
      // Call checkout success endpoint to ensure user is upgraded
      if (sessionId) {
        // Always call the endpoint if we have a session_id
        console.log('📞 Calling checkout-success endpoint...');
        
        fetch('/api/checkout-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
          .then(res => res.json())
          .then(data => {
            console.log('✅ Checkout-success response:', data);
            if (data.success) {
              // Show celebration modal
              setShowCelebration(true);
              // Don't auto-reload - let user close the modal manually
            } else {
              console.error('⚠️ Upgrade verification failed:', data);
              // Still show celebration
              setShowCelebration(true);
            }
          })
          .catch(error => {
            console.error('❌ Error verifying upgrade:', error);
            // Still show celebration
            setShowCelebration(true);
          });
        
        // Clear URL params after calling endpoint (with delay)
        setTimeout(() => {
          router.replace('/', { scroll: false });
        }, 500);
      } else {
        // No session_id - just show celebration
        console.log('⚠️ No session_id found in URL');
        setShowCelebration(true);
        
        // Clear URL params
        setTimeout(() => {
          router.replace('/', { scroll: false });
        }, 100);
      }
    } else if (premium === 'true' || upgrade === 'true') {
      // Navigate to premium section
      setCurrentStep("premium");
      // Scroll to top
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 100);
      // Clear URL params after navigation
      setTimeout(() => {
        router.replace('/', { scroll: false });
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load usage counts from localStorage for anonymous users (prevent refresh abuse)
  // Only when not signed in
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      try {
        const storedTimestamp = localStorage.getItem('postready_usageTimestamp');
        const timestamp = storedTimestamp ? parseInt(storedTimestamp, 10) : Date.now();
        
        // Check if data is fresh (within 30 days)
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        const isDataFresh = (Date.now() - timestamp) < thirtyDaysInMs;
        
        if (isDataFresh) {
          // Load all usage counts
          const counts = {
            generateIdeas: localStorage.getItem('postready_generateIdeasCount'),
            rewrite: localStorage.getItem('postready_rewriteCount'),
            hashtag: localStorage.getItem('postready_hashtagCount'),
            guideAI: localStorage.getItem('postready_guideAICount'),
            regenerate: localStorage.getItem('postready_regenerateCount'),
            rewordTitle: localStorage.getItem('postready_rewordTitleCount'),
          };
          
          // Restore each count if valid
          if (counts.generateIdeas) {
            const count = parseInt(counts.generateIdeas, 10);
            if (!isNaN(count)) setGenerateIdeasCount(count);
          }
          if (counts.rewrite) {
            const count = parseInt(counts.rewrite, 10);
            if (!isNaN(count)) setRewriteCount(count);
          }
          if (counts.hashtag) {
            const count = parseInt(counts.hashtag, 10);
            if (!isNaN(count)) setHashtagCount(count);
          }
          if (counts.guideAI) {
            const count = parseInt(counts.guideAI, 10);
            if (!isNaN(count)) setGuideAICount(count);
          }
          if (counts.regenerate) {
            const count = parseInt(counts.regenerate, 10);
            if (!isNaN(count)) setRegenerateCount(count);
          }
          if (counts.rewordTitle) {
            const count = parseInt(counts.rewordTitle, 10);
            if (!isNaN(count)) setRewordTitleCount(count);
          }
          
          console.log('✅ Loaded guest user usage counts from localStorage:', {
            generateIdeas: counts.generateIdeas || 0,
            rewrite: counts.rewrite || 0,
            hashtag: counts.hashtag || 0,
            guideAI: counts.guideAI || 0,
            regenerate: counts.regenerate || 0,
            rewordTitle: counts.rewordTitle || 0,
          });
        } else {
          // Reset all if data is too old
          console.log('⏰ Guest user usage data expired (>30 days), resetting...');
          localStorage.removeItem('postready_generateIdeasCount');
          localStorage.removeItem('postready_rewriteCount');
          localStorage.removeItem('postready_hashtagCount');
          localStorage.removeItem('postready_guideAICount');
          localStorage.removeItem('postready_regenerateCount');
          localStorage.removeItem('postready_rewordTitleCount');
          localStorage.removeItem('postready_usageTimestamp');
          // Legacy cleanup
          localStorage.removeItem('postready_generateIdeasTimestamp');
        }
      } catch (error) {
        console.error('❌ Error loading guest user usage from localStorage:', error);
      } finally {
        // Mark as loaded to prevent overwriting on initial mount
        setHasLoadedUsageCounts(true);
      }
    } else if (user) {
      // For authenticated users, mark as loaded after user data is available
      setHasLoadedUsageCounts(true);
    }
  }, [user]);

  // Save usage counts to localStorage for anonymous users (prevent refresh abuse)
  // Only when not signed in
  useEffect(() => {
    // Only save if we've loaded the initial counts (prevent overwriting on mount)
    if (!user && typeof window !== 'undefined' && hasLoadedUsageCounts) {
      try {
        // Save all usage counts
        localStorage.setItem('postready_generateIdeasCount', generateIdeasCount.toString());
        localStorage.setItem('postready_rewriteCount', rewriteCount.toString());
        localStorage.setItem('postready_hashtagCount', hashtagCount.toString());
        localStorage.setItem('postready_guideAICount', guideAICount.toString());
        localStorage.setItem('postready_regenerateCount', regenerateCount.toString());
        localStorage.setItem('postready_rewordTitleCount', rewordTitleCount.toString());
        
        // Set timestamp if not already set (for 30-day expiration)
        if (!localStorage.getItem('postready_usageTimestamp')) {
          localStorage.setItem('postready_usageTimestamp', Date.now().toString());
        }
        
        console.log('💾 Saved guest user usage counts to localStorage:', {
          generateIdeas: generateIdeasCount,
          rewrite: rewriteCount,
          hashtag: hashtagCount,
          guideAI: guideAICount,
          regenerate: regenerateCount,
          rewordTitle: rewordTitleCount,
        });
      } catch (error) {
        console.error('❌ Error saving guest user usage to localStorage:', error);
      }
    }
  }, [generateIdeasCount, rewriteCount, hashtagCount, guideAICount, regenerateCount, rewordTitleCount, user, hasLoadedUsageCounts]);

  // Save usage counts to database for authenticated users (prevent refresh abuse)
  useEffect(() => {
    if (user && !authLoading) {
      // Debounce the save to avoid too many database calls
      const timeoutId = setTimeout(() => {
        saveProgress();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [generateIdeasCount, rewriteCount, regenerateCount, rewordTitleCount, hashtagCount, guideAICount, user, authLoading]);

  // Save video idea to history when reaching post-details step (for all signed-in users: regular, pro, creator)
  // This runs immediately when the step changes, not waiting for postDetails
  useEffect(() => {
    if (currentStep === "post-details" && selectedIdea && businessInfo.businessName) {
      // Skip if no user is signed in
      if (!user) {
        console.log('⚠️ No user - video ideas cannot be saved. Sign in to save history.');
        return;
      }
      
      // Save the video idea to saved ideas
      const saveIdeaToHistory = async () => {
        try {
          if (user && user.id) {
            // Save to Supabase
            console.log('💾 Saving video idea to Supabase...', {
              userId: user.id,
              ideaTitle: selectedIdea.title,
              businessName: businessInfo.businessName
            });
            
            const result = await saveVideoIdea(user.id, businessInfo, selectedIdea);
            if (!result.error) {
              // Reload saved ideas to update state
              const updatedIdeasResult = await loadSavedVideoIdeas(user.id);
              if (!updatedIdeasResult.error && updatedIdeasResult.data) {
                setSavedVideoIdeas(updatedIdeasResult.data);
              }
              console.log('✅ Video idea saved to Supabase successfully');
            } else {
              console.error('❌ Error saving video idea:', result.error);
            }
          }
        } catch (error) {
          console.error('❌ Error saving video idea:', error);
        }
      };
      
      saveIdeaToHistory();
    }
  }, [currentStep, user, selectedIdea, postDetails, businessInfo]);

  const loadProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await loadUserProgress(user.id);
      if (!error && data) {
        // Only load usage counts - do NOT restore workflow state
        // This ensures the app always starts fresh on page load
        if (data.generateIdeasCount !== undefined) setGenerateIdeasCount(data.generateIdeasCount);
        if (data.rewriteCount !== undefined) setRewriteCount(data.rewriteCount);
        if (data.regenerateCount !== undefined) setRegenerateCount(data.regenerateCount);
        if (data.rewordTitleCount !== undefined) setRewordTitleCount(data.rewordTitleCount);
        if (data.hashtagCount !== undefined) setHashtagCount(data.hashtagCount);
        if (data.guideAICount !== undefined) setGuideAICount(data.guideAICount);
        
        console.log('✅ Usage counts loaded from database (workflow state NOT restored)');
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async () => {
    if (!user) return;

    // Save usage counts and workflow state to database
    // Note: Workflow state is saved but NOT restored on refresh (app always starts fresh)
    // Usage counts ARE restored to prevent limit bypass via refresh
    const navigationPages: WizardStep[] = ["businesses", "history", "premium"];
    const stepToSave = navigationPages.includes(currentStep) ? "form" : currentStep;

    try {
      await saveUserProgress(user.id, {
        businessInfo,
        strategy,
        selectedIdea,
        postDetails,
        currentStep: stepToSave,
        generateIdeasCount,
        rewriteCount,
        hashtagCount,
        guideAICount,
        regenerateCount,
        rewordTitleCount,
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const loadHistoryData = async () => {
    if (!user || !user.id) return;

    console.log('📂 Loading history data from Supabase for user:', user.id);
    
    try {
      const [businessesResult, postsResult, ideasResult] = await Promise.all([
        loadSavedBusinesses(user.id),
        loadPostHistory(user.id),
        loadSavedVideoIdeas(user.id)
      ]);

      console.log('📂 Businesses result:', businessesResult);
      console.log('📂 Posts result:', postsResult);
      console.log('📂 Saved ideas result:', ideasResult);

      if (!businessesResult.error && businessesResult.data) {
        console.log('✅ Setting saved businesses:', businessesResult.data.length, 'businesses');
        setSavedBusinesses(businessesResult.data);
      } else if (businessesResult.error) {
        console.error('❌ Error loading businesses:', businessesResult.error);
      }

      if (!postsResult.error && postsResult.data) {
        console.log('✅ Setting completed posts:', postsResult.data.length, 'posts');
        setCompletedPosts(postsResult.data);
      } else if (postsResult.error) {
        console.error('❌ Error loading posts:', postsResult.error);
      }

      if (!ideasResult.error && ideasResult.data) {
        console.log('✅ Setting saved video ideas:', ideasResult.data.length, 'ideas');
        setSavedVideoIdeas(ideasResult.data);
      } else if (ideasResult.error) {
        console.error('❌ Error loading saved ideas:', ideasResult.error);
      }
    } catch (error) {
      console.error('❌ Error loading history:', error);
    }
  };

  const handleSignOut = useCallback(() => {
    // Show confirmation modal
    setModalState({
      isOpen: true,
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      type: 'confirm',
      onConfirm: async () => {
        // Prevent multiple clicks using ref (instant check, no re-render needed)
        if (signingOutRef.current) {
          console.log('⚠️ Sign out already in progress, ignoring click');
          return;
        }
        
        signingOutRef.current = true;
        setIsSigningOut(true);
        console.log('🚪 Signing out...');
        
        // Add smooth fade-out effect
        document.body.style.transition = 'opacity 0.3s ease-out';
        document.body.style.opacity = '0';
        
        // Wait for fade animation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Sign out from Supabase and wait for it to complete
        await supabase.auth.signOut();
        console.log('✅ Signed out successfully');
        
        // Clear all local storage
        localStorage.clear();
        
        // Redirect
        window.location.href = '/';
      },
      confirmText: 'Sign Out',
      onCancel: () => {
        // Reset the ref if they cancel
        signingOutRef.current = false;
        setIsSigningOut(false);
      }
    });
  }, []);

  const handleManageBilling = async () => {
    if (!user) return;
    
    setBillingLoading(true);
    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session found. Please sign in again.');
      }
      
      // Create Stripe Customer Portal session
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      console.error('Portal error:', error);
      setNotification({
        isOpen: true,
        title: 'Billing Portal Error',
        message: error.message || 'Failed to open billing portal. Please make sure you have an active subscription.',
        type: 'error',
      });
    } finally {
      setBillingLoading(false);
    }
  };

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const navigateHome = async () => {
    if (isNavigating) return; // Prevent multiple clicks during animation
    
    setIsNavigating(true);
    
    // Reset to home state
    setCurrentStep("form");
    setStrategy(null);
    setSelectedIdea(null);
    setPostDetails(null);
    setIsSavedToHistory(false);
    setUserNotes("");
    setRewriteCount(0);
    setRegenerateCount(0);
    setGenerateIdeasCount(0);
    setRewordTitleCount(0);
    setHashtagCount(0);
    setGuideAICount(0);
    
    // Allow navigation again after animation completes
    setTimeout(() => setIsNavigating(false), 100);
  };

  const navigateToPortal = () => {
    console.log('navigateToPortal called', { isNavigating, user });
    
    // If no user, open auth modal
    if (!user) {
      console.log('No user found, opening auth modal');
      openAuthModal('signin');
      return;
    }
    
    // Navigate to portal for all authenticated users
    console.log('Navigating to /portal');
    // Use window.location for more reliable navigation
    window.location.href = '/portal';
  };

  const detectUserLocation = async () => {
    if (!navigator.geolocation) {
      showNotification("Geolocation is not supported by your browser", "error", "Location Error");
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get city and state
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          
          if (!response.ok) {
            throw new Error("Failed to get location details");
          }

          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.county;
          const state = data.address.state;
          
          let locationString = "";
          if (city && state) {
            // Get state abbreviation for US states
            const stateAbbrev = state.length > 2 ? state.substring(0, 2).toUpperCase() : state;
            locationString = `${city}, ${stateAbbrev}`;
          } else if (city) {
            locationString = city;
          } else {
            locationString = data.address.country;
          }

          setBusinessInfo({ ...businessInfo, location: locationString });
          showNotification("Location detected successfully!", "success", "Success");
        } catch (error) {
          console.error("Geocoding error:", error);
          showNotification("Could not determine your city. Please enter manually.", "error", "Location Error");
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        setIsDetectingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          showNotification("Location access denied. Please enable location permissions.", "warning", "Permission Denied");
        } else {
          showNotification("Could not detect location. Please enter manually.", "error", "Location Error");
        }
      }
    );
  };

  // Save business for quick access later
  const saveBusinessForLater = async (info: BusinessInfo, strat: StrategyResult) => {
    if (!user) return;

    console.log('💾 Saving business for later:', info.businessName);
    
    try {
      // Save to Supabase
      await saveBusiness(user.id, info, strat);
      console.log('✅ Business saved successfully');
      
      // Reload the businesses list
      const { data, error } = await loadSavedBusinesses(user.id);
      if (!error && data) {
        console.log('✅ Reloaded businesses list:', data.length, 'businesses');
        setSavedBusinesses(data);
      } else if (error) {
        console.error('❌ Error reloading businesses:', error);
      }
    } catch (error) {
      console.error('❌ Error saving business:', error);
    }
  };

  // Save completed post to history
  const saveCompletedPostToHistory = async (idea: ContentIdea, details: PostDetails) => {
    if (!user) {
      console.log('⚠️ Cannot save to history: User not authenticated');
      return;
    }

    console.log('💾 Saving completed post to history:', idea.title);
    
    try {
      // Save to Supabase
      const { error: saveError } = await saveCompletedPost(user.id, businessInfo.businessName, idea, details);
      
      if (saveError) {
        console.error('❌ Error saving post to history:', saveError);
        // Don't show notification to avoid interrupting user flow
        return;
      }
      
      console.log('✅ Post saved to history successfully');
      
      // Reload the post history
      const { data, error } = await loadPostHistory(user.id);
      if (!error && data) {
        console.log('✅ Reloaded post history:', data.length, 'posts');
        setCompletedPosts(data);
      } else if (error) {
        console.error('❌ Error reloading post history:', error);
      }
    } catch (error) {
      console.error('❌ Exception while saving completed post:', error);
    }
  };

  // Manual save to history handler (triggered by button click)
  const handleSaveToHistory = async () => {
    if (!user) {
      showNotification('Please sign in to save your post to history', 'error', 'Not Signed In');
      return;
    }

    if (!selectedIdea || !postDetails) {
      showNotification('No post to save', 'error', 'Error');
      return;
    }

    if (isSavedToHistory) {
      showNotification('This post is already saved to your history', 'info', 'Already Saved');
      return;
    }

    setIsSavingToHistory(true);
    try {
      // Include user notes in the postDetails before saving
      const postDetailsWithNotes = {
        ...postDetails,
        notes: userNotes || undefined // Only include notes if they exist
      };
      
      await saveCompletedPostToHistory(selectedIdea, postDetailsWithNotes);
      setIsSavedToHistory(true);
      showNotification('Post saved to history successfully!', 'success', 'Saved!');
    } catch (error) {
      console.error('Error saving to history:', error);
      showNotification('Failed to save post to history', 'error', 'Error');
    } finally {
      setIsSavingToHistory(false);
    }
  };

  // Load saved business
  const loadSavedBusiness = async (business: typeof savedBusinesses[0]) => {
    setBusinessInfo(business.businessInfo);
    setStrategy(business.strategy);
    setCurrentStep("choose-idea");
    setSelectedIdea(null);
    setPostDetails(null);
    setIsSavedToHistory(false);
    setUserNotes("");
    setRewriteCount(0);
    setRegenerateCount(0);
    
    // Update lastUsed in Supabase
    if (user) {
      await saveBusiness(user.id, business.businessInfo, business.strategy);
      // Reload businesses to get updated timestamp
      const { data, error } = await loadSavedBusinesses(user.id);
      if (!error && data) {
        setSavedBusinesses(data);
      }
    }
  };

  const initiateCheckout = async () => {
    console.log('🛒 initiateCheckout: Starting checkout process...');
    console.log('🛒 initiateCheckout: User state:', user ? `Logged in as ${user.email}` : 'Not logged in');
    
    if (!user) {
      console.log('❌ initiateCheckout: No user found');
      // User not logged in - guide them to sign up
      setRedirectToCheckoutAfterAuth(true);
      setAuthModalMode('signup');
      setAuthModalOpen(true);
      showNotification("Please create an account to subscribe to PostReady Pro", "info", "Sign Up Required");
      return;
    }

    setCheckoutLoading(true);
    console.log('✅ initiateCheckout: User found:', user.id, user.email);

    try {
      // Get the current session to include auth token
      console.log('🔑 initiateCheckout: Getting session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ initiateCheckout: Session error:', sessionError.message);
        throw new Error('Failed to get session: ' + sessionError.message);
      }
      
      if (!session?.access_token) {
        console.error('❌ initiateCheckout: No access token in session');
        throw new Error('No active session found. Please sign in again.');
      }
      
      console.log('✅ initiateCheckout: Session valid');
      
      // Determine which plan the user selected (default to pro if not specified)
      const selectedPlanType = planType || 'pro';
      console.log('📋 initiateCheckout: Plan type:', selectedPlanType);
      
      // Create Stripe checkout session
      const requestBody = {
        userId: user.id,
        userEmail: user.email,
        planType: selectedPlanType,
      };
      console.log('💳 initiateCheckout: Calling create-checkout API with body:', requestBody);
      
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      console.log('📡 initiateCheckout: Response status:', response.status, response.statusText);
      console.log('📡 initiateCheckout: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = "Failed to create checkout session";
        let errorDetails = null;
        try {
          const errorData = await response.json();
          console.error('❌ initiateCheckout: Error data:', errorData);
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData.details || null;
        } catch (parseError) {
          console.error('❌ initiateCheckout: Could not parse error response. Response text:', await response.text());
        }
        throw new Error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }

      const data = await response.json();
      console.log('✅ initiateCheckout: Response data:', data);
      console.log('✅ initiateCheckout: URL type:', typeof data.url);
      console.log('✅ initiateCheckout: URL value:', data.url);
      
      if (!data.url) {
        console.error('❌ initiateCheckout: No URL in response. Full response:', JSON.stringify(data, null, 2));
        throw new Error('No checkout URL received from server. Please check the console for details.');
      }
      
      // Redirect to Stripe checkout
      console.log('🚀 initiateCheckout: Redirecting to Stripe checkout URL:', data.url);
      if (data.url && typeof data.url === 'string' && data.url.startsWith('http')) {
        window.location.href = data.url;
      } else {
        console.error('❌ initiateCheckout: Invalid URL format:', data.url);
        throw new Error(`Invalid checkout URL format: ${data.url}`);
      }
    } catch (error: any) {
      console.error("❌ initiateCheckout: Fatal error:", error);
      console.error("❌ initiateCheckout: Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setCheckoutLoading(false);
      showNotification(error.message || "Failed to start checkout. Please try again.", "error", "Error");
    }
  };

  // Module Reorder Handlers
  const loadModuleOrder = async () => {
    console.log('🔄 loadModuleOrder called. User:', user ? 'exists' : 'null');
    
    // Always use default order if no user
    const defaultOrder = ['digital-product-builder', 'digital-products', 'kidsafe-url-checker', 'red-flag-detector', 'comment-bait', 'brainworm-generator', 'sugar-daddy-messages', 'music-generator', 'voiceover-generator', 'collab-engine', 'trend-radar', 'idea-generator', 'sora-prompt', 'hashtag-research', 'cringe-couple-caption', 'comment-fight-starter', 'poor-life-choices-advisor', 'random-excuse'];
    
    if (!user) {
      console.log('⚠️ No user, using default order:', defaultOrder);
      setModuleOrder(defaultOrder);
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('⚠️ No session, using default order:', defaultOrder);
        setModuleOrder(defaultOrder);
        return;
      }

      console.log('📡 Fetching module order from API...');
      const response = await fetch('/api/module-order', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log('📡 API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 API response data:', data);
        
        if (data.moduleOrder && Array.isArray(data.moduleOrder)) {
          const savedOrder = data.moduleOrder;
          console.log('🔄 Merging module order. Saved:', savedOrder);

          // Add any new modules from defaultOrder that aren't in savedOrder
          const mergedOrder = [...savedOrder];
          let hasChanges = false;

          defaultOrder.forEach(module => {
            if (!mergedOrder.includes(module)) {
              // Insert new modules in their default positions
              const defaultIndex = defaultOrder.indexOf(module);
              // Ensure we don't go out of bounds if savedOrder is shorter/different
              const insertIndex = Math.min(defaultIndex, mergedOrder.length);
              mergedOrder.splice(insertIndex, 0, module);
              hasChanges = true;
              console.log(`➕ Added missing module: ${module} at index ${insertIndex}`);
            }
          });
          
          setModuleOrder(mergedOrder);
          console.log('✅ Final merged module order:', mergedOrder);
          
          // If we added missing modules, save the new order
          if (hasChanges) {
             console.log('💾 Saving updated module order...');
             saveModuleOrder(mergedOrder);
          }
        } else {
          console.log('⚠️ Invalid moduleOrder in response, using default:', defaultOrder);
          setModuleOrder(defaultOrder);
        }
      } else {
        console.log('⚠️ API response not OK, using default order:', defaultOrder);
        setModuleOrder(defaultOrder);
      }
    } catch (error) {
      console.error('❌ Error loading module order:', error);
      console.log('⚠️ Using default order due to error:', defaultOrder);
      setModuleOrder(defaultOrder);
    }
  };

  const saveModuleOrder = async (newOrder: string[]) => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/module-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ moduleOrder: newOrder })
      });

      if (response.ok) {
        console.log('✅ Saved module order:', newOrder);
      }
    } catch (error) {
      console.error('Error saving module order:', error);
    }
  };

  const moveModule = (moduleId: string, direction: 'up' | 'down') => {
    const currentIndex = moduleOrder.indexOf(moduleId);
    if (currentIndex === -1) return;

    const newOrder = [...moduleOrder];
    
    if (direction === 'up' && currentIndex > 0) {
      // Swap with previous item
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
    } else if (direction === 'down' && currentIndex < newOrder.length - 1) {
      // Swap with next item
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
    } else {
      return; // Can't move
    }

    setModuleOrder(newOrder);
    saveModuleOrder(newOrder);
  };

  // Load module order when user logs in OR on initial mount
  useEffect(() => {
    console.log('🔄 useEffect for loadModuleOrder TRIGGERED. User:', user ? 'exists' : 'null', 'authLoading:', authLoading);
    if (!authLoading) {
      console.log('✅ authLoading is false, proceeding to load module order...');
      // Call loadModuleOrder directly - it's defined in the component scope
      const loadOrder = async () => {
        console.log('🔄 loadOrder function called. User:', user ? 'exists' : 'null');
        const defaultOrder = ['digital-product-builder', 'digital-products', 'kidsafe-url-checker', 'red-flag-detector', 'comment-bait', 'brainworm-generator', 'sugar-daddy-messages', 'music-generator', 'voiceover-generator', 'collab-engine', 'trend-radar', 'idea-generator', 'sora-prompt', 'hashtag-research', 'cringe-couple-caption', 'comment-fight-starter', 'poor-life-choices-advisor', 'random-excuse'];
        console.log('📋 Default order includes kidsafe-url-checker:', defaultOrder.includes('kidsafe-url-checker'), 'at index:', defaultOrder.indexOf('kidsafe-url-checker'));
        
        if (!user) {
          console.log('⚠️ No user, using default order:', defaultOrder);
          console.log('✅ Setting moduleOrder state with kidsafe-url-checker at index:', defaultOrder.indexOf('kidsafe-url-checker'));
          setModuleOrder(defaultOrder);
          console.log('✅ moduleOrder state should now be set');
          return;
        }
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.log('⚠️ No session, using default order:', defaultOrder);
            setModuleOrder(defaultOrder);
            return;
          }

          console.log('📡 Fetching module order from API...');
          const response = await fetch('/api/module-order', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });

          console.log('📡 API response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('📦 API response data:', data);
            
            if (data.moduleOrder && Array.isArray(data.moduleOrder)) {
              const savedOrder = data.moduleOrder;
              console.log('🔄 Merging module order. Saved:', savedOrder);

              const mergedOrder = [...savedOrder];
              let hasChanges = false;

              defaultOrder.forEach(module => {
                if (!mergedOrder.includes(module)) {
                  const defaultIndex = defaultOrder.indexOf(module);
                  const insertIndex = Math.min(defaultIndex, mergedOrder.length);
                  mergedOrder.splice(insertIndex, 0, module);
                  hasChanges = true;
                  console.log(`➕ Added missing module: ${module} at index ${insertIndex}`);
                }
              });
              
              setModuleOrder(mergedOrder);
              console.log('✅ Final merged module order:', mergedOrder);
              
              if (hasChanges) {
                 console.log('💾 Would save updated module order (skipping for now):', mergedOrder);
                 // Note: saveModuleOrder is defined later, but we'll call it via the API directly if needed
              }
            } else {
              console.log('⚠️ Invalid moduleOrder in response, using default:', defaultOrder);
              setModuleOrder(defaultOrder);
            }
          } else {
            console.log('⚠️ API response not OK, using default order:', defaultOrder);
            setModuleOrder(defaultOrder);
          }
        } catch (error) {
          console.error('❌ Error loading module order:', error);
          console.log('⚠️ Using default order due to error:', defaultOrder);
          setModuleOrder(defaultOrder);
        }
      };
      loadOrder();
    } else {
      console.log('⏳ Waiting for auth to finish loading...');
    }
  }, [user, authLoading]);

  // Debug: Log moduleOrder changes
  useEffect(() => {
    console.log('📊 moduleOrder state changed:', moduleOrder);
    console.log('📊 kidsafe-url-checker index:', moduleOrder.indexOf('kidsafe-url-checker'));
    console.log('📊 Total modules:', moduleOrder.length);
  }, [moduleOrder]);

  // Drag and Drop Handlers
  const handleDragStart = (moduleId: string) => {
    setDraggedModule(moduleId);
  };

  const handleDragEnd = () => {
    setDraggedModule(null);
    setDragOverModule(null);
    setDropPosition(null);
  };

  const handleDragOver = (e: React.DragEvent, moduleId: string) => {
    e.preventDefault();
    if (draggedModule && draggedModule !== moduleId) {
      setDragOverModule(moduleId);
      
      // Calculate if we should drop before or after based on mouse position
      const rect = e.currentTarget.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const mouseY = e.clientY;
      
      if (mouseY < midpoint) {
        setDropPosition('before');
      } else {
        setDropPosition('after');
      }
    }
  };

  const handleDragLeave = () => {
    setDragOverModule(null);
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent, targetModuleId: string) => {
    e.preventDefault();
    
    if (!draggedModule || draggedModule === targetModuleId) {
      setDragOverModule(null);
      setDropPosition(null);
      return;
    }

    const newOrder = [...moduleOrder];
    const draggedIndex = newOrder.indexOf(draggedModule);
    const targetIndex = newOrder.indexOf(targetModuleId);

    // Remove dragged item
    newOrder.splice(draggedIndex, 1);
    
    // Calculate insert position based on dropPosition
    let insertIndex = targetIndex;
    if (dropPosition === 'after') {
      // If dragged from before target, targetIndex is already shifted left by 1
      insertIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
    } else {
      // 'before' position
      insertIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    }
    
    // Insert at calculated position
    newOrder.splice(insertIndex, 0, draggedModule);

    setModuleOrder(newOrder);
    saveModuleOrder(newOrder);
    setDragOverModule(null);
    setDropPosition(null);
  };

  // Load module order when user logs in OR on initial mount
  useEffect(() => {
    console.log('🔄 useEffect for loadModuleOrder. User:', user ? 'exists' : 'null', 'authLoading:', authLoading);
    if (!authLoading) {
      loadModuleOrder();
    }
  }, [user, authLoading]);

  // Collab Engine Handlers
  const handleCollabSearch = async (e: React.FormEvent, overrideData?: { username: string, niche: string, followerCount: string }) => {
    e.preventDefault();
    
    // Use override data if provided (for profile-based search), otherwise use state
    const username = overrideData?.username || collabUsername;
    const niche = overrideData?.niche || collabNiche;
    const followerCount = overrideData?.followerCount || collabFollowerCount;
    
    if (!username || !niche || !followerCount) {
      showNotification("Please fill in all fields", "warning");
      return;
    }
    
    setIsLoadingCollabs(true);
    setCollaborators([]);
    
    try {
      const response = await fetch('/api/collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          niche: niche,
          followerCount: parseInt(followerCount.replace(/,/g, '')),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to find collaborators');
      }
      
      const data = await response.json();
      setCollaborators(data.collaborators || []);
      
      if (data.collaborators.length === 0) {
        showNotification("No collaborators found matching your criteria. Try adjusting your filters or join the network to help others find you!", "info", "No Matches");
      }
    } catch (error) {
      console.error('Collab search error:', error);
      showNotification("Failed to search for collaborators. Please try again.", "error");
    } finally {
      setIsLoadingCollabs(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('\n' + '='.repeat(60));
    console.log('🚀 COLLAB PROFILE SUBMISSION STARTED');
    console.log('='.repeat(60));
    console.log('User Status:', user ? `✅ SIGNED IN (${user.email})` : '❌ NOT SIGNED IN');
    console.log('Email in form:', profileForm.email_for_collabs);
    console.log('Password in form:', profileForm.password ? '✅ PROVIDED' : '❌ EMPTY');
    console.log('='.repeat(60));
    
    // Validate required fields based on authentication status
    if (!user) {
      // New user - validate all fields including email and password
      if (!profileForm.tiktok_username || !profileForm.niche || !profileForm.follower_count || !profileForm.email_for_collabs || !profileForm.password) {
        showNotification("Please fill in all required fields", "warning");
        console.error('❌ Validation failed - missing required fields');
        return;
      }
      
      // Validate password length
      if (profileForm.password.length < 6) {
        showNotification("Password must be at least 6 characters", "warning");
        console.error('❌ Validation failed - password too short');
        return;
      }
    } else {
      // Existing user - only validate TikTok fields
      if (!profileForm.tiktok_username || !profileForm.niche || !profileForm.follower_count) {
        showNotification("Please fill in all required fields", "warning");
        console.error('❌ Validation failed - missing TikTok fields');
        return;
      }
    }
    
    setIsSubmittingProfile(true);
    
    try {
      let newUserEmail = null;
      
      // Create account if user is not authenticated
      if (!user) {
        console.log('='.repeat(50));
        console.log('🔐 CREATING ACCOUNT');
        console.log('Email:', profileForm.email_for_collabs);
        console.log('='.repeat(50));
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: profileForm.email_for_collabs,
          password: profileForm.password,
          options: {
            emailRedirectTo: `${window.location.origin}`,
          }
        });
        
        console.log('\n📧 SIGNUP RESPONSE:');
        console.log('User ID:', signUpData?.user?.id);
        console.log('Email:', signUpData?.user?.email);
        console.log('Email Confirmed?:', signUpData?.user?.email_confirmed_at ? 'YES' : 'NO');
        console.log('Session Available?:', signUpData?.session ? 'YES' : 'NO');
        console.log('Error:', signUpError?.message || 'None');
        console.log('='.repeat(50));
        
        if (signUpError) {
          // Check for common error: user already exists
          if (signUpError.message.includes('already registered')) {
            throw new Error('This email is already registered. Please sign in instead.');
          }
          console.error('❌ Signup error:', signUpError);
          throw new Error(signUpError.message);
        }
        
        if (signUpData.user) {
          newUserEmail = signUpData.user.email;
          
          // Check if email confirmation is required
          if (!signUpData.session) {
            console.log('⚠️ NO SESSION - Email confirmation required!');
            console.log('📬 Check your email inbox and spam folder for verification link');
          } else {
            console.log('✅ Session established - email confirmation not required');
          }
          
          // Wait for the session to be established
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.error('⚠️ No user returned from signup');
        }
      }
      
      // Parse the follower range to get a representative follower count (use middle of range)
      const followerRange = profileForm.follower_count;
      let followerCountNum: number;
      
      if (followerRange.includes('+')) {
        // Handle "1M+" format
        followerCountNum = 1000000;
      } else if (followerRange.includes('-')) {
        // Handle "1000-5000" format - use middle of range
        const [min, max] = followerRange.split('-').map(s => parseInt(s.replace(/,/g, '')));
        followerCountNum = Math.floor((min + max) / 2);
      } else {
        // Fallback
        followerCountNum = parseInt(followerRange.replace(/[^\d]/g, '')) || 1000;
      }
      
      // Get user session token (will exist for both new and existing users at this point)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('🔑 Session check:', {
        hasSession: !!session,
        sessionError: sessionError?.message,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('✅ Authorization header added');
      } else {
        console.warn('⚠️ No session available - profile will be created without user_id');
      }

      // Prepare profile data - use user's email if authenticated
      const profileData: any = {
        tiktok_username: profileForm.tiktok_username,
        display_name: profileForm.display_name,
        niche: profileForm.niche,
        follower_count: followerCountNum,
        follower_range: followerRange,
        content_focus: profileForm.content_focus,
        bio: profileForm.bio,
        email_for_collabs: user?.email || newUserEmail || profileForm.email_for_collabs,
      };

      console.log('📤 Sending profile data:', {
        ...profileData,
        hasAuthHeader: !!headers['Authorization']
      });

      const response = await fetch('/api/collab-directory', {
        method: 'POST',
        headers,
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }
      
      const data = await response.json();
      console.log('📥 Collab profile save response:', data);
      
      // Immediately update the directory profile state
      if (data.profile) {
        setDirectoryProfile(data.profile);
        console.log('✅ Profile saved and state updated:', data.profile);
      } else {
        console.error('⚠️ No profile in response');
      }
      
      setShowJoinDirectory(false);
      
      // Show success message based on whether account was created
      const wasNewUser = !user;
      if (wasNewUser) {
        // Show email verification modal instead of notification
        setShowEmailVerificationModal(true);
      } else {
        showNotification("Successfully joined the PostReady Collab Network! 🎉", "success");
        
        // For existing users, reload their profile after a short delay to ensure it's linked
        setTimeout(async () => {
          console.log('🔄 Reloading profile for existing user...');
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          if (currentSession) {
            console.log('✅ Session still valid, reloading profile');
            const reloadResponse = await fetch('/api/collab-directory', {
              headers: {
                'Authorization': `Bearer ${currentSession.access_token}`
              }
            });
            if (reloadResponse.ok) {
              const reloadData = await reloadResponse.json();
              if (reloadData.profile) {
                setDirectoryProfile(reloadData.profile);
                console.log('✅ Profile reloaded and confirmed:', reloadData.profile.tiktok_username);
              } else {
                console.warn('⚠️ Profile not found after reload - may need manual refresh');
              }
            }
          } else {
            console.error('❌ Session lost! User was logged out');
            showNotification("Your session expired. Please sign in again.", "warning");
          }
        }, 1500);
      }
    } catch (error: any) {
      console.error('Profile submit error:', error);
      showNotification(error.message || "Failed to save profile. Please try again.", "error");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleCopyDmAndVisit = async (dm: string, username: string, index: number) => {
    try {
      setCopyingDmIndex(index);
      
      // Step 1: Copy DM
      await navigator.clipboard.writeText(dm);
      showNotification("DM copied to clipboard!", "success");
      
      // Step 2: Wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Show redirecting message
      showNotification("Redirecting you to TikTok...", "info");
      
      // Step 4: Wait 3 more seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 5: Open TikTok profile
      const cleanUsername = username.replace('@', '');
      window.open(`https://www.tiktok.com/@${cleanUsername}`, '_blank');
    } catch (error) {
      console.error('Copy/visit error:', error);
      showNotification("Failed to copy DM", "error");
    } finally {
      setCopyingDmIndex(null);
    }
  };

  const handleGenerateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessInfo.businessName || !businessInfo.location) {
      setModalState({
        isOpen: true,
        title: "Required Fields Missing",
        message: "Please fill in all required fields (Business Name and Location) before continuing.",
        type: 'info',
        confirmText: "OK"
      });
      return;
    }

    setCurrentStep("researching");
    setResearchProgress(0);
    setPostPlatform(businessInfo.platform);

    // Animate research progress
    const messages = [
      "Analyzing your business...",
      "Finding what works on " + businessInfo.platform + "...",
      "Creating your strategy...",
      "Generating content ideas...",
      "Almost ready...",
      "Finalizing..."
    ];

    let messageIndex = 0;
    setResearchStatus(messages[0]);

    const progressInterval = setInterval(() => {
      setResearchProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        
        // Update status message
        const newProgress = prev + 2;
        const newMessageIndex = Math.floor((newProgress / 100) * messages.length);
        if (newMessageIndex !== messageIndex && newMessageIndex < messages.length) {
          messageIndex = newMessageIndex;
          setResearchStatus(messages[messageIndex]);
        }
        
        return newProgress;
      });
    }, 350);


    try {
      // Call research API with userType for proper content generation
      const response = await fetch("/api/research-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          businessInfo,
          userType,
          creatorGoals: userType === 'creator' ? creatorGoals : undefined
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to research business");
      }

      const data = await response.json();
      
      clearInterval(progressInterval);
      
      // CRITICAL: Always use AI-generated research data
      // API now validates data before sending, so we can trust it
      if (!data.research || !data.research.contentIdeas || !Array.isArray(data.research.contentIdeas)) {
        console.error("❌ CRITICAL ERROR: Invalid research data received from API");
        console.error("Data received:", data);
        throw new Error("Research API returned invalid data. Please try again.");
      }
      
      console.log("✅ Using AI-generated research with", data.research.contentIdeas.length, "ideas");
      const researchResult = data.research;
      
      // CRITICAL: Update businessInfo with AI-detected business type
      if (data.detectedBusinessType) {
        const updatedBusinessInfo = {
          ...businessInfo,
          detectedBusinessType: data.detectedBusinessType
        };
        setBusinessInfo(updatedBusinessInfo);
        
        console.log("✅ Frontend: Business type updated", {
          userSelected: businessInfo.businessType,
          aiDetected: data.detectedBusinessType
        });
      }
      
      // Complete progress
      setResearchProgress(100);
      setResearchStatus("Research complete!");
      
      // Set strategy and move to next step after state updates
      setStrategy(researchResult);
      
      // Save business for quick access later (with detected type)
      if (user) {
        const businessToSave = data.detectedBusinessType 
          ? { ...businessInfo, detectedBusinessType: data.detectedBusinessType }
          : businessInfo;
        saveBusinessForLater(businessToSave, researchResult);
      }
      
      setTimeout(() => {
        setCurrentStep("principles");
      }, 400);
      
    } catch (error: any) {
      console.error("❌ Research error:", error);
      clearInterval(progressInterval);
      
      // NEVER use generic fallback - show error and let user retry
      setResearchProgress(0);
      setResearchStatus("Research failed");
      setCurrentStep("form");
      
      showNotification(
        "Failed to generate personalized strategy. Please try again. AI research ensures you get contextual, business-specific ideas - not generic templates.",
        "error",
        "Research Failed"
      );
    }
  };

  const handleNextStep = () => {
    if (currentStep === "principles") {
      setCurrentStep("choose-idea");
    } else if (currentStep === "choose-idea") {
      if (!selectedIdea) {
        setModalState({
          isOpen: true,
          title: "Video Idea Required",
          message: "Please select a video idea before continuing to the next step.",
          type: 'info',
          confirmText: "OK"
        });
        return;
      }
      setCurrentStep("record-video");
    } else if (currentStep === "record-video") {
      // INSTANT CAPTION: Skip API, use template caption immediately
      console.log("🎬 Generating instant template caption...");
      
      if (!strategy || !selectedIdea) {
        setModalState({
          isOpen: true,
          title: "Content Idea Required",
          message: "Please select a content idea first before generating your post.",
          type: 'info',
          confirmText: "OK"
        });
        return;
      }
      
      // Show loading screen FIRST
      setCurrentStep("generating-caption");
      
      // Use requestAnimationFrame to ensure loading screen renders before proceeding
      requestAnimationFrame(() => {
        requestAnimationFrame(async () => {
          // Generate caption with AI after loading screen is painted
          try {
            const result = await generatePostDetailsWithAI(
              businessInfo,
              selectedIdea.title,
              selectedIdea.description,
              strategy.postingTimes
            );
            
            const captionWithHashtags = `${result.caption}\n\n${result.hashtags.join(" ")}`;
            const newPostDetails = {
              ...result,
              caption: captionWithHashtags,
              hashtags: [],
            };
            
            setPostDetails(newPostDetails);
            console.log("✅ AI caption ready");
            
            if (user) {
              await saveCompletedPostToHistory(selectedIdea, newPostDetails);
            }
          } catch (error) {
            console.error("❌ Error generating post details:", error);
          }
          
          // Transition to post-details after full loading animation
          setTimeout(() => {
            setCurrentStep("post-details");
          }, 6000);
        });
      });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "choose-idea") {
      setCurrentStep("principles");
    } else if (currentStep === "record-video") {
      setCurrentStep("choose-idea");
    } else if (currentStep === "generating-caption") {
      setCurrentStep("record-video");
    } else if (currentStep === "post-details") {
      setCurrentStep("record-video");
    } else if (currentStep === "premium") {
      navigateHome();
    }
  };

  const scrollToPremium = () => {
    // Set plan type to 'pro' if coming from business section
    if (userType === 'business') {
      setPlanType('pro');
    }
    setCurrentStep("premium");
    
    // Scroll to top smoothly after a brief delay to ensure content is rendered
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  const handleGenerateIdeasWithGuidance = async (guidance: string) => {
    // Check if user has exceeded free limit (3 free uses)
    if (guideAIForIdeasCount >= 3 && !isPro) {
      setModalState({
        isOpen: true,
        title: userType === 'creator' ? "Upgrade to Creator" : "Upgrade to PostReady Pro",
        message: userType === 'creator' 
          ? "You've used your 3 free Guide AI uses for video ideas. Upgrade to Creator for unlimited Guide AI and more features!"
          : "You've used your 3 free Guide AI uses for video ideas. Upgrade to PostReady Pro for unlimited Guide AI and more features!",
        type: 'confirm',
        onConfirm: scrollToPremium,
        confirmText: userType === 'creator' ? "View Creator Plan" : "View Pro Plan"
      });
      return;
    }

    if (!businessInfo.businessName) {
      setModalState({
        isOpen: true,
        title: "Business Info Required",
        message: "Please provide business information first.",
        type: 'info',
        confirmText: "OK"
      });
      return;
    }

    setIsGeneratingIdeas(true);
    setIdeasAnimation('fadeOut');
    setShowGuideAIForIdeas(false);
    setAiGuidanceForIdeas(""); // Clear guidance after applying

    try {
      // Wait for fade out animation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const response = await fetch("/api/research-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          businessInfo,
          userType,
          creatorGoals,
          guidance: guidance // Pass guidance to API
        }),
      });

      if (!response.ok) {
        // Try to parse error response to get actual error message
        let errorMessage = "Failed to generate ideas with guidance";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        } catch (parseError) {
          // If we can't parse the error, use status text
          errorMessage = `Failed to generate ideas: ${response.statusText || 'Unknown error'}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Hide loading state
      setIsGeneratingIdeas(false);
      
      // CRITICAL: Validate AI-generated ideas
      if (!data.research || !data.research.contentIdeas || !Array.isArray(data.research.contentIdeas)) {
        console.error("❌ CRITICAL ERROR: Invalid ideas data received from API");
        throw new Error("API returned invalid ideas. Never use generic fallback.");
      }
      
      console.log("✅ Generated", data.research.contentIdeas.length, "new guided ideas");
      
      // Update businessInfo with detected type if available
      if (data.detectedBusinessType) {
        setBusinessInfo(prev => ({
          ...prev,
          detectedBusinessType: data.detectedBusinessType
        }));
      }
      
      // Update strategy with new AI-generated ideas
      setStrategy(data.research);
      setSelectedIdea(null);
      
      // Increment usage count for non-Pro users
      if (!isPro) {
        setGuideAIForIdeasCount(prev => prev + 1);
      }
      
      // Start fade in animation
      setIdeasAnimation('fadeIn');
      
      // Show success notification
      showNotification("New video ideas generated with your guidance!", "success", "Success");
      
      // Reset animation after fade in completes
      setTimeout(() => {
        setIdeasAnimation('idle');
      }, 500);
    } catch (error: any) {
      console.error("Error generating ideas with guidance:", error);
      // Show the actual error message from the API or a user-friendly message
      const errorMessage = error?.message || "Failed to generate ideas. Please try again.";
      showNotification(errorMessage, "error", "Error");
      setIdeasAnimation('idle');
      setIsGeneratingIdeas(false);
    } finally {
      setIsRewriting(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', title?: string) => {
    setNotification({
      isOpen: true,
      message,
      type,
      title,
    });
  };

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleSelectIdea = (idea: ContentIdea) => {
    setSelectedIdea(idea);
  };

  const handleGeneratePost = async () => {
    if (!strategy || !selectedIdea) {
      setModalState({
        isOpen: true,
        title: "Content Idea Required",
        message: "Please select a content idea first before generating your post.",
        type: 'info',
        confirmText: "OK"
      });
      return;
    }

    console.log("🎬 Starting caption generation...");
    
    try {
      // Get intelligent caption from API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch("/api/generate-caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessInfo,
          selectedIdea,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("✅ Caption API response received");

      if (!response.ok) {
        console.error("❌ Caption API error:", response.status, response.statusText);
        throw new Error("Failed to generate caption");
      }

      const data = await response.json();
      console.log("✅ Caption data parsed:", data.caption ? "Success" : "Empty");
      
      // Use fallback for title and time
      const result = generatePostDetails(
        businessInfo,
        selectedIdea.title,
        selectedIdea.description,
        strategy.postingTimes
      );

      // Add hashtags as a single block at the end
      const captionWithHashtags = `${data.caption.trim()}\n\n${result.hashtags.join(" ")}`;
      
      const newPostDetails = {
        ...result,
        caption: captionWithHashtags,
        hashtags: [], // Hashtags are in the caption block
      };
      console.log("✅ Setting post details...");
      setPostDetails(newPostDetails);
      
      // Save to history
      if (user) {
        console.log("💾 Saving to history...");
        await saveCompletedPostToHistory(selectedIdea, newPostDetails);
      }
      
      // Auto-transition to post-details step if we're on generating-caption step
      if (currentStep === "generating-caption") {
        console.log("🔄 Transitioning to post-details step...");
        setTimeout(() => {
          setCurrentStep("post-details");
        }, 800);
      }
    } catch (error: any) {
      console.error("Caption generation error:", error);
      
      // Show error notification based on error type
      if (error.name === 'AbortError') {
        showNotification("Caption generation timed out. Using a quick fallback caption.", "warning", "Timeout");
      } else {
        showNotification("AI caption generation failed. Using a fallback caption.", "info", "Using Fallback");
      }
      
      // Fallback to simple generation
      const result = generatePostDetails(
        businessInfo,
        selectedIdea.title,
        selectedIdea.description,
        strategy.postingTimes
      );
      
      // Add hashtags to caption for fallback
      const captionWithHashtags = `${result.caption}\n\n${result.hashtags.join(" ")}`;
      const newPostDetails = {
        ...result,
        caption: captionWithHashtags,
        hashtags: [],
      };
      setPostDetails(newPostDetails);
      
      // Save to history
      if (user) {
        await saveCompletedPostToHistory(selectedIdea, newPostDetails);
      }
      
      // CRITICAL: Always transition to post-details even on error
      if (currentStep === "generating-caption") {
        setTimeout(() => {
          setCurrentStep("post-details");
        }, 800);
      }
    }
  };

  const handleCopyToClipboard = () => {
    if (!postDetails) return;
    navigator.clipboard.writeText(postDetails.caption);
    showNotification("Caption copied to clipboard!", "success", "Copied!");
  };

  const handleMoreHashtags = async () => {
    if (!postDetails || !selectedIdea) return;

    // Check if user has exceeded free limit (3 free hashtag generations)
    if (hashtagCount >= 3 && !isPro) {
      setModalState({
        isOpen: true,
        title: userType === 'creator' ? "Upgrade to Creator" : "Upgrade to PostReady Pro",
        message: userType === 'creator' 
          ? "You've used your 3 free hashtag generations. Upgrade to Creator for unlimited hashtag generation and more features!"
          : "You've used your 3 free hashtag generations. Upgrade to PostReady Pro for unlimited hashtag generation and more features!",
        type: 'confirm',
        onConfirm: scrollToPremium,
        confirmText: userType === 'creator' ? "View Creator Plan" : "View Pro Plan"
      });
      return;
    }

    setIsGeneratingHashtags(true);

    try {
      // Extract existing hashtags from caption
      const captionLines = postDetails.caption.split('\n\n');
      const captionText = captionLines.filter(line => !line.trim().startsWith('#')).join('\n\n').trim();
      const existingHashtags = captionLines
        .filter(line => line.trim().startsWith('#'))
        .flatMap(line => line.trim().split(/\s+/).filter(tag => tag.startsWith('#')));

      const response = await fetch("/api/generate-hashtags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessInfo,
          caption: postDetails.caption,
          selectedIdea,
          existingHashtags,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate hashtags");
      }

      const data = await response.json();
      
      // Combine existing and new hashtags
      const allHashtags = [...existingHashtags, ...data.hashtags];
      const uniqueHashtags = Array.from(new Set(allHashtags.map(tag => tag.toLowerCase())));
      
      // Update caption with new hashtags
      const updatedCaption = `${captionText}\n\n${uniqueHashtags.join(" ")}`;
      
      const updatedPostDetails = {
        ...postDetails,
        caption: updatedCaption,
      };
      
      setPostDetails(updatedPostDetails);
      
      // Increment usage count for non-Pro users
      if (!isPro) {
        setHashtagCount(prev => prev + 1);
      }
      
      // Save updated post to history
      if (user && selectedIdea) {
        await saveCompletedPostToHistory(selectedIdea, updatedPostDetails);
      }
      
      showNotification(`Added ${data.hashtags.length} new hashtags!`, "success", "Hashtags Added");
    } catch (error) {
      console.error("Error generating hashtags:", error);
      showNotification("Failed to generate hashtags. Please try again.", "error", "Error");
    } finally {
      setIsGeneratingHashtags(false);
    }
  };

  const handleRewriteCaption = async (guidance?: string) => {
    // Check if user has exceeded free rewrite limit (2 free rewrites)
    if (rewriteCount >= 2 && !isPro) {
      setModalState({
        isOpen: true,
        title: userType === 'creator' ? "Upgrade to Creator" : "Upgrade to PostReady Pro",
        message: userType === 'creator' 
          ? "You've used your 2 free rewrites. Upgrade to Creator for unlimited rewrites and more features!"
          : "You've used your 2 free rewrites. Upgrade to PostReady Pro for unlimited rewrites and more features!",
        type: 'confirm',
        onConfirm: scrollToPremium,
        confirmText: userType === 'creator' ? "View Creator Plan" : "View Pro Plan"
      });
      return;
    }

    if (!strategy || !selectedIdea) {
      setModalState({
        isOpen: true,
        title: "Content Idea Required",
        message: "Please select a content idea first before rewriting the caption.",
        type: 'info',
        confirmText: "OK"
      });
      return;
    }

    setIsRewriting(true);
    setCaptionAnimation('fadeOut');
    setShowGuideAI(false); // Close the guide AI bubble
    if (guidance) {
      setAiGuidance(""); // Clear guidance after applying
    }

    try {
      // Wait for fade out animation
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get intelligent caption from API with timeout, using current title as context
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch("/api/generate-caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessInfo,
          selectedIdea: {
            ...selectedIdea,
            title: postDetails?.title || selectedIdea.title, // Use edited title if available
          },
          guidance: guidance || undefined, // Include user guidance if provided
          currentCaption: postDetails?.caption || undefined, // Include current caption for length comparison
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to parse error response to get actual error message
        let errorMessage = "Failed to generate caption";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        } catch (parseError) {
          // If we can't parse the error, use status text
          errorMessage = `Failed to generate caption: ${response.statusText || 'Unknown error'}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Use fallback for title and time
      const result = generatePostDetails(
        businessInfo,
        selectedIdea.title,
        selectedIdea.description,
        strategy.postingTimes
      );

      // Add hashtags as a single block at the end
      const captionWithHashtags = `${data.caption.trim()}\n\n${result.hashtags.join(" ")}`;
      
      const newPostDetails = {
        ...result,
        caption: captionWithHashtags,
        hashtags: [], // Hashtags are in the caption block
      };
      setPostDetails(newPostDetails);
      setRewriteCount(prev => prev + 1);
      
      // Save updated post to history
      if (user && selectedIdea) {
        await saveCompletedPostToHistory(selectedIdea, newPostDetails);
      }
      
      // Start typing animation
      setCaptionAnimation('typing');
      
      // Reset animation after typing completes
      setTimeout(() => {
        setCaptionAnimation('idle');
      }, 2000);
      
      showNotification("Caption rewritten successfully!", "success", "Success");
    } catch (error: any) {
      console.error("Caption rewrite error:", error);
      
      // Show error notification based on error type
      if (error.name === 'AbortError') {
        showNotification("Caption rewrite timed out. Please try again.", "error", "Timeout");
      } else {
        // Show the actual error message from the API or a user-friendly message
        const errorMessage = error?.message || "Failed to rewrite caption. Please try again.";
        showNotification(errorMessage, "error", "Error");
      }
      
      setCaptionAnimation('idle');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleRegenerateIdea = () => {
    // Check if user has exceeded free regenerate limit
    if (regenerateCount >= 2 && !isPro) {
      setModalState({
        isOpen: true,
        title: userType === 'creator' ? "Upgrade to Creator" : "Upgrade to PostReady Pro",
        message: userType === 'creator' 
          ? "You've used your free idea regenerations. Upgrade to Creator for unlimited regenerations and more features!"
          : "You've used your free idea regenerations. Upgrade to PostReady Pro for unlimited regenerations and more features!",
        type: 'confirm',
        onConfirm: scrollToPremium,
        confirmText: userType === 'creator' ? "View Creator Plan" : "View Pro Plan"
      });
      return;
    }

    if (!strategy || !strategy.contentIdeas || strategy.contentIdeas.length <= 1) {
      setModalState({
        isOpen: true,
        title: "No Other Ideas",
        message: "There are no other video ideas available to switch to.",
        type: 'info',
        confirmText: "OK"
      });
      return;
    }

    // Get a different random idea
    const availableIdeas = strategy.contentIdeas.filter(
      idea => idea.title !== selectedIdea?.title
    );
    
    if (availableIdeas.length === 0) {
      setModalState({
        isOpen: true,
        title: "No Other Ideas",
        message: "There are no other video ideas available to switch to.",
        type: 'info',
        confirmText: "OK"
      });
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableIdeas.length);
    const newIdea = availableIdeas[randomIndex];
    
    setSelectedIdea(newIdea);
    setPostDetails(null); // Reset post details so caption gets regenerated with new idea
    setIsSavedToHistory(false); // Reset saved state for new idea
    setUserNotes(""); // Reset notes for new idea
    setRegenerateCount(prev => prev + 1);
    
    showNotification(`New idea selected: "${newIdea.title}"`, "success", "Idea Updated");
  };

  const handleRewordTitle = async () => {
    // Check if user has exceeded free reword limit (3 free rewords)
    if (rewordTitleCount >= 3 && !isPro) {
      setModalState({
        isOpen: true,
        title: "Upgrade to PostReady Pro",
        message: "You've used your 3 free title rewords. Upgrade to PostReady Pro for unlimited rewords and more features!",
        type: 'confirm',
        onConfirm: scrollToPremium,
        confirmText: "View Pro Plan"
      });
      return;
    }

    if (!postDetails || !selectedIdea) {
      setModalState({
        isOpen: true,
        title: "Post Required",
        message: "Please generate a post first before rewriting the title.",
        type: 'info',
        confirmText: "OK"
      });
      return;
    }

    setIsRewordingTitle(true);
    setTitleAnimation('fadeOut');

    try {
      // Wait for fade out animation
      await new Promise(resolve => setTimeout(resolve, 300));

      // Call API to get AI-generated reworded title
      const response = await fetch("/api/reword-title", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessInfo,
          selectedIdea,
          currentTitle: postDetails.title,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reword title");
      }

      const data = await response.json();

      // Update just the title with the new AI-generated title
      const updatedPostDetails = {
        ...postDetails,
        title: data.title,
      };
      setPostDetails(updatedPostDetails);
      setRewordTitleCount(prev => prev + 1);
      
      // Save updated post to history
      if (user && selectedIdea) {
        await saveCompletedPostToHistory(selectedIdea, updatedPostDetails);
      }
      
      // Start fade in animation
      setTitleAnimation('fadeIn');
      
      // Reset animation after fade in completes
      setTimeout(() => {
        setTitleAnimation('idle');
      }, 500);
    } catch (error) {
      console.error("Title reword error:", error);
      showNotification("Failed to reword title. Please try again.", "error", "Error");
      setTitleAnimation('idle');
    } finally {
      setIsRewordingTitle(false);
    }
  };

  const scrollToPostPlanner = () => {
    postPlannerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToStrategy = () => {
    strategyRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getStepNumber = (): number => {
    const steps: Record<string, number> = { 
      form: 0, 
      researching: 1, 
      principles: 1, 
      "choose-idea": 2, 
      "record-video": 3,
      "generating-caption": 4,  // Loading screen before final step
      "post-details": 4,
      "premium": 0,  // Premium page doesn't show step progress
      "history": 0,  // History page doesn't show step progress
      "businesses": 0  // Businesses page doesn't show step progress
    };
    return steps[currentStep] || 0;
  };

  // Generate star data only on client side to prevent hydration mismatch
  const [stars, setStars] = useState<Array<{
    id: number;
    size: number;
    top: number;
    left: number;
    opacity: number;
    glowSize: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    // Generate stars only once on client side
    setStars([...Array(40)].map((_, i) => {
      const size = Math.random() * 2.5 + 0.5;
      const brightness = Math.random();
      const opacity = brightness > 0.7 ? 0.6 : 0.3;
      const glowSize = brightness > 0.7 ? 6 : 3;
      
      return {
        id: i,
        size,
        top: Math.random() * 100,
        left: Math.random() * 100,
        opacity,
        glowSize,
        duration: Math.random() * 4 + 3,
        delay: Math.random() * 2
      };
    }));
  }, []); // Empty deps = only generate once on mount

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--background)' }}>
      {/* Tiny Glowing Stars Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Generate multiple small stars scattered across the screen */}
        {stars.map((star) => (
          <div 
            key={star.id}
            className="absolute rounded-full"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              backgroundColor: `rgba(255, 255, 255, ${star.opacity})`,
              boxShadow: `0 0 ${star.glowSize}px rgba(255, 255, 255, ${star.opacity + 0.2})`,
              animation: `twinkle ${star.duration}s ease-in-out infinite`,
              animationDelay: `${star.delay}s`
            }}
          />
        ))}
      </div>
      
      {/* Purple Gradient Glow - Homepage Only, Dark Mode Only */}
      <div className="homepage-purple-glow" />
      
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-10 relative" style={{ zIndex: 1 }}>
        {/* Header with Auth - Only for signed-in users */}
        {user && !authLoading && (
          <div className="mb-8">
            {/* Mobile: Stacked layout */}
            <div className="flex sm:hidden flex-col gap-3 w-full">
              {/* Pro Badge on its own row */}
              {(isCreator || isPro) && (
                <div className="flex justify-center">
                  {isCreator ? (
                    <span 
                      className="text-white px-4 py-2 rounded-full text-sm font-bold relative overflow-hidden flex-shrink-0"
                      style={{ 
                        background: 'linear-gradient(to right, #DAA520, #F4D03F)',
                        boxShadow: '0 0 20px rgba(218, 165, 32, 0.4), 0 0 40px rgba(244, 208, 63, 0.2)'
                      }}
                    >
                      <span className="relative z-10 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        CREATOR
                      </span>
                    </span>
                  ) : (
                    <span 
                      className="text-white px-4 py-2 rounded-full text-sm font-bold relative overflow-hidden flex-shrink-0"
                      style={{ 
                        background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                        boxShadow: '0 0 20px rgba(41, 121, 255, 0.4), 0 0 40px rgba(111, 255, 210, 0.2)'
                      }}
                    >
                      <span className="relative z-10 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        PRO
                      </span>
                    </span>
                  )}
                </div>
              )}
              {/* Navigation buttons - Better mobile layout */}
              <div className="flex gap-2 w-full">
                <Button
                  onClick={navigateHome}
                  disabled={isNavigating}
                  variant={currentStep === "form" ? "default" : "outline"}
                  className={`flex-1 px-3 sm:px-4 py-2.5 h-auto min-h-[44px] text-sm font-semibold shadow-md hover:scale-105 active:scale-95 ${
                    currentStep === "form" 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "bg-card text-card-foreground border-input hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  Home
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Account button clicked', { user });
                    navigateToPortal();
                  }}
                  type="button"
                  variant="outline"
                  className="flex-1 px-3 sm:px-4 py-2.5 h-auto min-h-[44px] rounded-lg text-sm font-semibold shadow-md hover:scale-105 active:scale-95 bg-card text-card-foreground border-input"
                  title="Go to User Portal"
                >
                  Account
                </Button>
                {!isPro && (
                  <Button
                    onClick={scrollToPremium}
                    className="flex-1 px-3 sm:px-4 py-2.5 h-auto min-h-[44px] rounded-lg text-sm font-bold shadow-lg hover:scale-105 active:scale-95 text-white border-none bg-[linear-gradient(135deg,#2979FF_0%,#6FFFD2_100%)] hover:opacity-90"
                  >
                    Get Pro
                  </Button>
                )}
                <Button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  variant="outline"
                  className="flex-1 px-3 sm:px-4 py-2.5 h-auto min-h-[44px] rounded-lg text-sm font-semibold shadow-md hover:scale-105 active:scale-95 text-destructive border-destructive hover:bg-destructive/10 bg-card"
                >
                  {isSigningOut ? '...' : 'Sign Out'}
                </Button>
              </div>
            </div>
            
            {/* Desktop: Horizontal layout */}
            <div className="hidden sm:flex justify-end items-center gap-3">
              {/* Show CREATOR badge for creator users */}
              {isCreator && (
                <span 
                  className="text-white px-3 py-1 rounded-full text-xs font-bold relative overflow-hidden flex-shrink-0"
                  style={{ 
                    background: 'linear-gradient(to right, #DAA520, #F4D03F)',
                    boxShadow: '0 0 20px rgba(218, 165, 32, 0.4), 0 0 40px rgba(244, 208, 63, 0.2)'
                  }}
                >
                  <span className="relative z-10 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    CREATOR
                  </span>
                </span>
              )}
              {/* Show PRO badge for pro users (but not creators) */}
              {isPro && !isCreator && (
                <span className="badge-pro">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  PRO
                </span>
              )}
              <Button
                onClick={navigateHome}
                disabled={isNavigating}
                variant="outline"
                className="px-4 py-2.5 h-auto rounded-xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap transition-all duration-200 bg-[var(--background-secondary)] text-[var(--foreground)] border-[var(--card-border)] hover:border-[var(--primary)] hover:bg-[var(--hover-bg)]"
              >
                Home
              </Button>
              {!user && (
                <Button
                  onClick={() => {
                    if (confirm('Reset module order?')) {
                      const defaultOrder = ['digital-product-builder', 'digital-products', 'kidsafe-url-checker', 'red-flag-detector', 'comment-bait', 'brainworm-generator', 'sugar-daddy-messages', 'music-generator', 'voiceover-generator', 'collab-engine', 'trend-radar', 'idea-generator', 'sora-prompt', 'hashtag-research', 'cringe-couple-caption', 'comment-fight-starter', 'poor-life-choices-advisor', 'random-excuse'];
                      setModuleOrder(defaultOrder);
                      saveModuleOrder(defaultOrder);
                      alert('Order reset! Check for KidSafe card.');
                    }
                  }}
                  variant="outline"
                  className="px-4 py-2.5 h-auto rounded-xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap transition-all duration-200 bg-[var(--background-secondary)] text-red-400 border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10"
                >
                  Fix Order
                </Button>
              )}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigateToPortal();
                }}
                type="button"
                variant="outline"
                className="px-4 py-2.5 h-auto rounded-xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap transition-all duration-200 bg-[var(--background-secondary)] text-[var(--foreground)] border-[var(--card-border)] hover:border-[var(--primary)] hover:bg-[var(--hover-bg)]"
                title="Go to User Portal"
              >
                Account
              </Button>
              {!isPro && (
                <Button
                  onClick={scrollToPremium}
                  className="px-4 py-2.5 h-auto rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap transition-all duration-200 bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-none shadow-sm hover:shadow-md"
                >
                  ★ Get Pro
                </Button>
              )}
              <Button
                onClick={handleSignOut}
                disabled={isSigningOut}
                variant="outline"
                className="px-4 py-2.5 h-auto rounded-xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap transition-all duration-200 bg-[var(--background-secondary)] text-red-400 border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10"
              >
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </Button>
            </div>
          </div>
        )}

        {/* Sign Up CTA Banner for Non-Signed-Up Users */}
        {!user && (
          <div className="mb-8">
            <div className="rounded-xl p-5 border-2 shadow-sm overflow-visible" style={{
              background: 'linear-gradient(135deg, rgba(41, 121, 255, 0.04) 0%, rgba(111, 255, 210, 0.04) 100%)',
              borderColor: 'rgba(41, 121, 255, 0.15)'
            }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <Button
                    onClick={() => setCurrentStep('form')}
                    variant="outline"
                    className="flex items-center gap-2 px-5 py-2.5 h-auto rounded-lg font-semibold text-sm hover:scale-105 whitespace-nowrap transition-all duration-300"
                    style={{
                      background: 'var(--card-bg)',
                      color: 'var(--card-foreground)',
                      borderColor: 'var(--input)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#06B6D4';
                      e.currentTarget.style.backgroundSize = '';
                      e.currentTarget.style.animation = '';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(6, 182, 212, 0.4), 0 0 30px rgba(6, 182, 212, 0.3)';
                      e.currentTarget.style.filter = 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--card-bg)';
                      e.currentTarget.style.backgroundSize = '';
                      e.currentTarget.style.animation = '';
                      e.currentTarget.style.color = 'var(--card-foreground)';
                      e.currentTarget.style.borderColor = 'var(--input)';
                      e.currentTarget.style.boxShadow = '';
                      e.currentTarget.style.filter = '';
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Home
                  </Button>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      <svg className="w-10 h-10" style={{ color: '#2979FF' }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-lg" style={{ color: 'var(--secondary)' }}>
                        Sign Up Now!
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Sign up to get access to more features!
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center sm:justify-start">
                  <Button 
                    onClick={() => openAuthModal('signin')}
                    variant="outline"
                    className="flex-1 sm:flex-none px-2 sm:px-5 py-2 sm:py-2.5 h-auto rounded-lg font-semibold text-xs sm:text-sm hover:scale-105 whitespace-nowrap transition-all duration-300"
                    style={{
                      background: 'var(--card-bg)',
                      color: 'var(--card-foreground)',
                      borderColor: 'var(--input)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#06B6D4';
                      e.currentTarget.style.backgroundSize = '';
                      e.currentTarget.style.animation = '';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(6, 182, 212, 0.4), 0 0 30px rgba(6, 182, 212, 0.3)';
                      e.currentTarget.style.filter = 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--card-bg)';
                      e.currentTarget.style.backgroundSize = '';
                      e.currentTarget.style.animation = '';
                      e.currentTarget.style.color = 'var(--card-foreground)';
                      e.currentTarget.style.borderColor = 'var(--input)';
                      e.currentTarget.style.boxShadow = '';
                      e.currentTarget.style.filter = '';
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => openAuthModal('signup')}
                    className="flex-1 sm:flex-none px-2 sm:px-5 py-2 sm:py-2.5 h-auto rounded-lg font-semibold text-xs sm:text-sm hover:scale-105 text-white whitespace-nowrap border-none hover:opacity-90 relative z-10 bg-[#06B6D4] m-1 shadow-none sm:shadow-[0_0_15px_rgba(6,182,212,0.6),0_0_25px_rgba(6,182,212,0.4)] drop-shadow-none sm:drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]"
                  >
                    <span className="hidden sm:inline">Sign Up Now</span>
                    <span className="sm:hidden">Sign Up</span>
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep('premium')}
                    className="flex-1 sm:flex-none px-2 sm:px-5 py-2 sm:py-2.5 h-auto rounded-lg font-semibold text-xs sm:text-sm hover:scale-105 whitespace-nowrap flex items-center justify-center gap-1 sm:gap-2 text-white border-none hover:opacity-90 relative z-10 bg-[#06B6D4] m-1 shadow-none sm:shadow-[0_0_15px_rgba(6,182,212,0.6),0_0_25px_rgba(6,182,212,0.4)] drop-shadow-none sm:drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]"
                  >
                    <span className="hidden sm:inline">★</span>
                    Get Pro
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mini PostReady Home Button - Mobile Only, Non-Homepage */}
        {currentStep !== "form" && (
          <div className="md:hidden mb-6 flex justify-center">
            <button
              onClick={navigateHome}
              disabled={isNavigating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'var(--primary)',
                boxShadow: '0 2px 8px rgba(41, 121, 255, 0.15)'
              }}
            >
            <img 
              src="/postready-logo.svg" 
              alt="PostReady" 
              className="h-6 w-auto logo-glow"
            />
            </button>
          </div>
        )}

        <div className={`flex flex-col items-center justify-center mb-8 sm:mb-12 md:mb-16 w-full ${currentStep !== "form" ? "hidden md:flex" : "flex"}`}>
          <div 
            onClick={navigateHome}
            className="cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 mb-6 flex justify-center"
            style={{ 
              opacity: isNavigating ? 0.5 : 1,
              width: '100%'
            }}
          >
            <img 
              src="/postready-logo.svg" 
              alt="PostReady Logo" 
              className="h-16 sm:h-20 md:h-24 w-auto logo-glow block"
            />
          </div>
          <p 
            className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-center px-4 sm:drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 20%, #8B5CF6 40%, #EC4899 50%, #F59E0B 60%, #06B6D4 80%, #3B82F6 100%)',
              backgroundSize: '400% 400%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradient-shift 7s ease-in-out infinite',
              letterSpacing: '-0.02em',
              lineHeight: '1.2',
              display: 'block',
              width: '100%',
              margin: '0 auto',
              transform: 'translateX(-10px)',
              // filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.4))', // Removed outward glow
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            The Ultimate Digital Multitool
          </p>
        </div>

        {/* Modules Container - uses flex to enable reordering */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Collab Engine - Top of Homepage */}
        {false && currentStep === "form" && (
          <div 
            ref={collabSectionRef}
            draggable={!!(isReorderMode && user)}
            onDragStart={(e) => {
              if (isReorderMode && user) {
                handleDragStart('collab-engine');
              } else {
                e.preventDefault();
              }
            }}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => {
              if (isReorderMode && user) {
                handleDragOver(e, 'collab-engine');
              } else {
                e.preventDefault();
              }
            }}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              if (isReorderMode && user) {
                handleDrop(e, 'collab-engine');
              } else {
                e.preventDefault();
              }
            }}
            onMouseEnter={() => !isReorderMode && setHoveredTool('collab-engine')}
            onMouseLeave={() => setHoveredTool(null)}
            className="rounded-2xl shadow-lg border transition-all duration-500 relative overflow-hidden group"
            style={{
              marginBottom: '1rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: hoveredTool === 'collab-engine' 
                ? '#FF4F78'
                : dragOverModule === 'collab-engine' 
                  ? '#2979FF'
                  : theme === 'dark'
                    ? 'rgba(255, 79, 120, 0.3)'
                    : 'rgba(255, 79, 120, 0.25)',
              boxShadow: hoveredTool === 'collab-engine'
                ? '0 20px 60px rgba(255, 79, 120, 0.3), 0 0 0 1px rgba(255, 79, 120, 0.4)'
                : dragOverModule === 'collab-engine'
                  ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                  : theme === 'dark'
                    ? '0 8px 32px rgba(255, 79, 120, 0.2), 0 0 0 1px rgba(255, 79, 120, 0.15)'
                    : '0 4px 20px rgba(255, 79, 120, 0.15), 0 0 0 1px rgba(255, 79, 120, 0.1)',
              order: moduleOrder.indexOf('collab-engine'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'collab-engine' ? 0.5 : 1,
              transform: hoveredTool === 'collab-engine' ? 'scale(1.03)' : dragOverModule === 'collab-engine' ? 'scale(1.02)' : 'scale(1)',
              padding: hoveredTool === 'collab-engine' ? '1.5rem' : '1rem 1.5rem',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Glow effect */}
            {hoveredTool === 'collab-engine' && (
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, #FF4F78, transparent 70%)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }}
              />
            )}

            <Link 
              href={getModuleUrl('collab-engine')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              {/* Header - Always visible */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="transition-transform duration-500"
                    style={{ 
                      transform: hoveredTool === 'collab-engine' ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
                    }}
                  >
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" viewBox="0 0 448 512" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 2px rgba(0, 242, 234, 0.3))' }}>
                      <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" fill="#00f2ea" transform="translate(-3, -3)"/>
                      <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" fill="#ff0050" transform="translate(3, 3)"/>
                      <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" fill="#000000"/>
                    </svg>
                  </div>
                  <div>
                    <h3 
                      className="text-lg sm:text-xl font-bold transition-all duration-500"
                      style={{ 
                        color: hoveredTool === 'collab-engine' ? '#FF4F78' : 'var(--secondary)',
                        fontSize: hoveredTool === 'collab-engine' ? '1.5rem' : '1.25rem'
                      }}
                    >
                      TikTok Collab Engine 🤝
                    </h3>
                    <p 
                      className="text-xs mt-0.5 opacity-70 transition-opacity duration-500"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {toolData['collab-engine']?.description || 'Find perfect collaboration partners'}
                    </p>
                  </div>
                </div>
                <span 
                  className="text-sm opacity-60 transition-all duration-500"
                  style={{ 
                    color: 'var(--text-secondary)',
                    opacity: hoveredTool === 'collab-engine' ? 0 : 0.6
                  }}
                >
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>

              {/* Expanded Content - Fades in on hover */}
              {toolData['collab-engine'] && (
                <div
                  className="overflow-hidden transition-all duration-500"
                  style={{
                    maxHeight: hoveredTool === 'collab-engine' ? '500px' : '0px',
                    opacity: hoveredTool === 'collab-engine' ? 1 : 0,
                    transform: hoveredTool === 'collab-engine' ? 'translateY(0)' : 'translateY(-10px)',
                  }}
                >
                  <div className="pt-4 space-y-4 border-t" style={{ borderColor: 'rgba(255, 79, 120, 0.2)' }}>
                    {/* Full Description */}
                    <p 
                      className="text-sm leading-relaxed transition-all duration-500 delay-100"
                      style={{ 
                        color: 'var(--text-secondary)',
                        opacity: hoveredTool === 'collab-engine' ? 1 : 0,
                        transform: hoveredTool === 'collab-engine' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      {toolData['collab-engine'].fullDescription}
                    </p>

                    {/* Features List */}
                    <div 
                      className="space-y-2 transition-all duration-500 delay-200"
                      style={{
                        opacity: hoveredTool === 'collab-engine' ? 1 : 0,
                        transform: hoveredTool === 'collab-engine' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#FF4F78' }}>
                        Key Features
                      </p>
                      <ul className="space-y-1.5">
                        {toolData['collab-engine'].features.map((feature, idx) => (
                          <li 
                            key={idx} 
                            className="flex items-center gap-2 text-sm"
                            style={{
                              transitionDelay: `${300 + idx * 50}ms`,
                              opacity: hoveredTool === 'collab-engine' ? 1 : 0,
                              transform: hoveredTool === 'collab-engine' ? 'translateX(0)' : 'translateX(-10px)',
                            }}
                          >
                            <span className="text-xs font-bold" style={{ color: '#FF4F78' }}>✓</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <div 
                      className="pt-2 transition-all duration-500 delay-300"
                      style={{
                        opacity: hoveredTool === 'collab-engine' ? 1 : 0,
                        transform: hoveredTool === 'collab-engine' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      <Button
                        className="w-full font-semibold transition-all duration-300 hover:scale-105"
                        style={{
                          backgroundColor: '#FF4F78',
                          color: 'white',
                          border: 'none',
                        }}
                      >
                        Explore Collab Engine →
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Link>
          </div>
        )}

        {/* Trend Radar - Live trend tracking */}
        {false && currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('trend-radar')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'trend-radar')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'trend-radar')}
            onClick={(e) => {
              if (!isReorderMode) {
                e.preventDefault();
                router.push(getModuleUrl('trend-radar'));
              }
            }}
            onMouseEnter={() => !isReorderMode && setHoveredTool('trend-radar')}
            onMouseLeave={() => setHoveredTool(null)}
            className="rounded-2xl shadow-lg border transition-all duration-500 relative overflow-hidden group"
            style={{
              marginBottom: '1rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: hoveredTool === 'trend-radar' 
                ? '#06B6D4'
                : dragOverModule === 'trend-radar'
                  ? '#2979FF'
                  : 'var(--card-border)',
              boxShadow: hoveredTool === 'trend-radar'
                ? '0 20px 60px rgba(6, 182, 212, 0.3), 0 0 0 1px rgba(6, 182, 212, 0.4)'
                : dragOverModule === 'trend-radar'
                  ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                  : theme === 'dark'
                    ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                    : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('trend-radar'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'trend-radar' ? 0.5 : 1,
              transform: hoveredTool === 'trend-radar' ? 'scale(1.03)' : dragOverModule === 'trend-radar' ? 'scale(1.02)' : 'scale(1)',
              padding: hoveredTool === 'trend-radar' ? '1.5rem' : '1rem',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Glow effect */}
            {hoveredTool === 'trend-radar' && (
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, #06B6D4, transparent 70%)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }}
              />
            )}

            <Link 
              href={getModuleUrl('trend-radar')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              {/* Header - Always visible */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span 
                    className="text-3xl transition-transform duration-500" 
                    style={{ 
                      transform: hoveredTool === 'trend-radar' ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
                    }}
                  >
                    📡
                  </span>
                  <div>
                    <h3 
                      className="text-base sm:text-lg font-bold transition-all duration-500"
                      style={{ 
                        color: hoveredTool === 'trend-radar' ? '#06B6D4' : 'var(--secondary)',
                        fontSize: hoveredTool === 'trend-radar' ? '1.25rem' : '1rem'
                      }}
                    >
                      Trend Radar
                    </h3>
                    <p 
                      className="text-xs mt-0.5 opacity-70 transition-opacity duration-500"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {toolData['trend-radar']?.description || 'Discover trending topics and analyze what\'s hot'}
                    </p>
                  </div>
                </div>
                <span 
                  className="text-sm opacity-60 transition-all duration-500"
                  style={{ 
                    color: 'var(--text-secondary)',
                    opacity: hoveredTool === 'trend-radar' ? 0 : 0.6
                  }}
                >
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>

              {/* Expanded Content - Fades in on hover */}
              {toolData['trend-radar'] && (
                <div
                  className="overflow-hidden transition-all duration-500"
                  style={{
                    maxHeight: hoveredTool === 'trend-radar' ? '500px' : '0px',
                    opacity: hoveredTool === 'trend-radar' ? 1 : 0,
                    transform: hoveredTool === 'trend-radar' ? 'translateY(0)' : 'translateY(-10px)',
                  }}
                >
                  <div className="pt-4 space-y-4 border-t" style={{ borderColor: 'rgba(6, 182, 212, 0.2)' }}>
                    {/* Full Description */}
                    <p 
                      className="text-sm leading-relaxed transition-all duration-500 delay-100"
                      style={{ 
                        color: 'var(--text-secondary)',
                        opacity: hoveredTool === 'trend-radar' ? 1 : 0,
                        transform: hoveredTool === 'trend-radar' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      {toolData['trend-radar'].fullDescription}
                    </p>

                    {/* Features List */}
                    <div 
                      className="space-y-2 transition-all duration-500 delay-200"
                      style={{
                        opacity: hoveredTool === 'trend-radar' ? 1 : 0,
                        transform: hoveredTool === 'trend-radar' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#06B6D4' }}>
                        Key Features
                      </p>
                      <ul className="space-y-1.5">
                        {toolData['trend-radar'].features.map((feature, idx) => (
                          <li 
                            key={idx} 
                            className="flex items-center gap-2 text-sm"
                            style={{
                              transitionDelay: `${300 + idx * 50}ms`,
                              opacity: hoveredTool === 'trend-radar' ? 1 : 0,
                              transform: hoveredTool === 'trend-radar' ? 'translateX(0)' : 'translateX(-10px)',
                            }}
                          >
                            <span className="text-xs font-bold" style={{ color: '#06B6D4' }}>✓</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <div 
                      className="pt-2 transition-all duration-500 delay-300"
                      style={{
                        opacity: hoveredTool === 'trend-radar' ? 1 : 0,
                        transform: hoveredTool === 'trend-radar' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      <Button
                        className="w-full font-semibold transition-all duration-300 hover:scale-105"
                        style={{
                          backgroundColor: '#06B6D4',
                          color: 'white',
                          border: 'none',
                        }}
                      >
                        Explore Trend Radar →
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Link>
          </div>
        )}

        {/* Viral Video Idea Generator */}
        {false && currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('idea-generator')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'idea-generator')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'idea-generator')}
            onClick={(e) => {
              if (!isReorderMode) {
                e.preventDefault();
                router.push(getModuleUrl('idea-generator'));
              }
            }}
            onMouseEnter={() => !isReorderMode && setHoveredTool('idea-generator')}
            onMouseLeave={() => setHoveredTool(null)}
            className="rounded-2xl shadow-lg border transition-all duration-500 relative overflow-hidden group"
            style={{
              marginBottom: '1rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: hoveredTool === 'idea-generator' 
                ? '#F97316'
                : dragOverModule === 'idea-generator'
                  ? '#2979FF'
                  : 'var(--card-border)',
              boxShadow: hoveredTool === 'idea-generator'
                ? '0 20px 60px rgba(249, 115, 22, 0.3), 0 0 0 1px rgba(249, 115, 22, 0.4)'
                : dragOverModule === 'idea-generator'
                  ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                  : theme === 'dark'
                    ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                    : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('idea-generator'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'idea-generator' ? 0.5 : 1,
              transform: hoveredTool === 'idea-generator' ? 'scale(1.03)' : dragOverModule === 'idea-generator' ? 'scale(1.02)' : 'scale(1)',
              padding: hoveredTool === 'idea-generator' ? '1.5rem' : '1rem',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Glow effect */}
            {hoveredTool === 'idea-generator' && (
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, #F97316, transparent 70%)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }}
              />
            )}

            <Link 
              href={getModuleUrl('idea-generator')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              {/* Header - Always visible */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span 
                    className="text-3xl transition-transform duration-500" 
                    style={{ 
                      transform: hoveredTool === 'idea-generator' ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
                    }}
                  >
                    💡
                  </span>
                  <div>
                    <h3 
                      className="text-base sm:text-lg font-bold transition-all duration-500"
                      style={{ 
                        color: hoveredTool === 'idea-generator' ? '#F97316' : 'var(--secondary)',
                        fontSize: hoveredTool === 'idea-generator' ? '1.25rem' : '1rem'
                      }}
                    >
                      Viral Video Idea Generator
                    </h3>
                    <p 
                      className="text-xs mt-0.5 opacity-70 transition-opacity duration-500"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {toolData['idea-generator']?.description || 'Generate viral video ideas that are proven to engage'}
                    </p>
                  </div>
                </div>
                <span 
                  className="text-sm opacity-60 transition-all duration-500"
                  style={{ 
                    color: 'var(--text-secondary)',
                    opacity: hoveredTool === 'idea-generator' ? 0 : 0.6
                  }}
                >
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>

              {/* Expanded Content - Fades in on hover */}
              {toolData['idea-generator'] && (
                <div
                  className="overflow-hidden transition-all duration-500"
                  style={{
                    maxHeight: hoveredTool === 'idea-generator' ? '500px' : '0px',
                    opacity: hoveredTool === 'idea-generator' ? 1 : 0,
                    transform: hoveredTool === 'idea-generator' ? 'translateY(0)' : 'translateY(-10px)',
                  }}
                >
                  <div className="pt-4 space-y-4 border-t" style={{ borderColor: 'rgba(249, 115, 22, 0.2)' }}>
                    {/* Full Description */}
                    <p 
                      className="text-sm leading-relaxed transition-all duration-500 delay-100"
                      style={{ 
                        color: 'var(--text-secondary)',
                        opacity: hoveredTool === 'idea-generator' ? 1 : 0,
                        transform: hoveredTool === 'idea-generator' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      {toolData['idea-generator'].fullDescription}
                    </p>

                    {/* Features List */}
                    <div 
                      className="space-y-2 transition-all duration-500 delay-200"
                      style={{
                        opacity: hoveredTool === 'idea-generator' ? 1 : 0,
                        transform: hoveredTool === 'idea-generator' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#F97316' }}>
                        Key Features
                      </p>
                      <ul className="space-y-1.5">
                        {toolData['idea-generator'].features.map((feature, idx) => (
                          <li 
                            key={idx} 
                            className="flex items-center gap-2 text-sm"
                            style={{
                              transitionDelay: `${300 + idx * 50}ms`,
                              opacity: hoveredTool === 'idea-generator' ? 1 : 0,
                              transform: hoveredTool === 'idea-generator' ? 'translateX(0)' : 'translateX(-10px)',
                            }}
                          >
                            <span className="text-xs font-bold" style={{ color: '#F97316' }}>✓</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <div 
                      className="pt-2 transition-all duration-500 delay-300"
                      style={{
                        opacity: hoveredTool === 'idea-generator' ? 1 : 0,
                        transform: hoveredTool === 'idea-generator' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      <Button
                        className="w-full font-semibold transition-all duration-300 hover:scale-105"
                        style={{
                          backgroundColor: '#F97316',
                          color: 'white',
                          border: 'none',
                        }}
                      >
                        Explore Idea Generator →
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Link>
          </div>
        )}

        {/* Hashtag Deep Research Tool - Always visible on homepage */}
        {false && currentStep === "form" && (
          <div 
            ref={hashtagSectionRef}
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('hashtag-research')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'hashtag-research')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'hashtag-research')}
            onClick={(e) => {
              if (!isReorderMode) {
                e.preventDefault();
                router.push(getModuleUrl('hashtag-research'));
              }
            }}
            onMouseEnter={() => !isReorderMode && setHoveredTool('hashtag-research')}
            onMouseLeave={() => setHoveredTool(null)}
            className="rounded-2xl shadow-lg border transition-all duration-500 relative overflow-hidden group"
            style={{
              marginBottom: '1rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: hoveredTool === 'hashtag-research' 
                ? '#14B8A6'
                : dragOverModule === 'hashtag-research'
                  ? '#2979FF'
                  : 'var(--card-border)',
              boxShadow: hoveredTool === 'hashtag-research'
                ? '0 20px 60px rgba(20, 184, 166, 0.3), 0 0 0 1px rgba(20, 184, 166, 0.4)'
                : dragOverModule === 'hashtag-research'
                  ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                  : theme === 'dark'
                    ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                    : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('hashtag-research'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'hashtag-research' ? 0.5 : 1,
              transform: hoveredTool === 'hashtag-research' ? 'scale(1.03)' : dragOverModule === 'hashtag-research' ? 'scale(1.02)' : 'scale(1)',
              padding: hoveredTool === 'hashtag-research' ? '1.5rem' : '1rem',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Glow effect */}
            {hoveredTool === 'hashtag-research' && (
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, #14B8A6, transparent 70%)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }}
              />
            )}

            <Link 
              href={getModuleUrl('hashtag-research')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              {/* Header - Always visible */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span 
                    className="text-3xl transition-transform duration-500" 
                    style={{ 
                      transform: hoveredTool === 'hashtag-research' ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
                    }}
                  >
                    #️⃣
                  </span>
                  <div>
                    <h3 
                      className="text-base sm:text-lg font-bold transition-all duration-500"
                      style={{ 
                        color: hoveredTool === 'hashtag-research' ? '#14B8A6' : 'var(--secondary)',
                        fontSize: hoveredTool === 'hashtag-research' ? '1.25rem' : '1rem'
                      }}
                    >
                      Hashtag Deep Research
                    </h3>
                    <p 
                      className="text-xs mt-0.5 opacity-70 transition-opacity duration-500"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {toolData['hashtag-research']?.description || 'Research and find the best hashtags for your content'}
                    </p>
                  </div>
                </div>
                <span 
                  className="text-sm opacity-60 transition-all duration-500"
                  style={{ 
                    color: 'var(--text-secondary)',
                    opacity: hoveredTool === 'hashtag-research' ? 0 : 0.6
                  }}
                >
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>

              {/* Expanded Content - Fades in on hover */}
              {toolData['hashtag-research'] && (
                <div
                  className="overflow-hidden transition-all duration-500"
                  style={{
                    maxHeight: hoveredTool === 'hashtag-research' ? '500px' : '0px',
                    opacity: hoveredTool === 'hashtag-research' ? 1 : 0,
                    transform: hoveredTool === 'hashtag-research' ? 'translateY(0)' : 'translateY(-10px)',
                  }}
                >
                  <div className="pt-4 space-y-4 border-t" style={{ borderColor: 'rgba(20, 184, 166, 0.2)' }}>
                    {/* Full Description */}
                    <p 
                      className="text-sm leading-relaxed transition-all duration-500 delay-100"
                      style={{ 
                        color: 'var(--text-secondary)',
                        opacity: hoveredTool === 'hashtag-research' ? 1 : 0,
                        transform: hoveredTool === 'hashtag-research' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      {toolData['hashtag-research'].fullDescription}
                    </p>

                    {/* Features List */}
                    <div 
                      className="space-y-2 transition-all duration-500 delay-200"
                      style={{
                        opacity: hoveredTool === 'hashtag-research' ? 1 : 0,
                        transform: hoveredTool === 'hashtag-research' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#14B8A6' }}>
                        Key Features
                      </p>
                      <ul className="space-y-1.5">
                        {toolData['hashtag-research'].features.map((feature, idx) => (
                          <li 
                            key={idx} 
                            className="flex items-center gap-2 text-sm"
                            style={{
                              transitionDelay: `${300 + idx * 50}ms`,
                              opacity: hoveredTool === 'hashtag-research' ? 1 : 0,
                              transform: hoveredTool === 'hashtag-research' ? 'translateX(0)' : 'translateX(-10px)',
                            }}
                          >
                            <span className="text-xs font-bold" style={{ color: '#14B8A6' }}>✓</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <div 
                      className="pt-2 transition-all duration-500 delay-300"
                      style={{
                        opacity: hoveredTool === 'hashtag-research' ? 1 : 0,
                        transform: hoveredTool === 'hashtag-research' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      <Button
                        className="w-full font-semibold transition-all duration-300 hover:scale-105"
                        style={{
                          backgroundColor: '#14B8A6',
                          color: 'white',
                          border: 'none',
                        }}
                      >
                        Explore Hashtag Research →
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Link>
          </div>
        )}

        {/* Digital Product Builder */}
        {currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('digital-product-builder')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'digital-product-builder')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'digital-product-builder')}
            onClick={(e) => {
              if (!isReorderMode) {
                e.preventDefault();
                setHoveredTool(hoveredTool === 'digital-product-builder' ? null : 'digital-product-builder');
              }
            }}
            onMouseEnter={() => !isReorderMode && setHoveredTool('digital-product-builder')}
            onMouseLeave={() => setHoveredTool(null)}
            className="rounded-xl sm:rounded-2xl shadow-lg border transition-all duration-[1148ms] relative group mobile-no-glow"
            style={{
              marginBottom: '0.75rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: hoveredTool === 'digital-product-builder' 
                ? '#8B5CF6'
                : dragOverModule === 'digital-product-builder'
                  ? '#8B5CF6'
                  : 'var(--card-border)',
              filter: hoveredTool === 'digital-product-builder' 
                ? 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.015))'
                : 'drop-shadow(0 0 25px rgba(139, 92, 246, 0.12))',
              backdropFilter: 'blur(8px)',
              boxShadow: hoveredTool === 'digital-product-builder'
                ? '0 8px 20px rgba(139, 92, 246, 0.024), 0 0 0 1px rgba(139, 92, 246, 0.045)'
                : dragOverModule === 'digital-product-builder'
                  ? '0 0 0 3px rgba(139, 92, 246, 0.4)'
                  : theme === 'dark'
                    ? '0 8px 32px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.1)'
                    : '0 4px 20px rgba(139, 92, 246, 0.12), 0 0 0 1px rgba(139, 92, 246, 0.08)',
              order: moduleOrder.indexOf('digital-product-builder') === -1 ? 0 : moduleOrder.indexOf('digital-product-builder'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'digital-product-builder' ? 0.5 : 1,
              transform: hoveredTool === 'digital-product-builder' ? 'scale(1.02)' : dragOverModule === 'digital-product-builder' ? 'scale(1.01)' : 'scale(1)',
              padding: hoveredTool === 'digital-product-builder' ? '1rem' : '0.75rem',
              transition: 'all 1.148s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Glow effect */}
            {hoveredTool === 'digital-product-builder' && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, #8B5CF6, transparent 70%)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                  opacity: 0.06,
                }}
              />
            )}

            <div 
              onClick={(e) => {
                if (!isReorderMode) {
                  e.preventDefault();
                  setHoveredTool(hoveredTool === 'digital-product-builder' ? null : 'digital-product-builder');
                }
              }}
              className="block cursor-pointer"
            >
              {/* Header - Always visible */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span 
                    className="text-2xl sm:text-3xl transition-transform duration-500 flex-shrink-0" 
                    style={{ 
                      transform: hoveredTool === 'digital-product-builder' ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
                    }}
                  >
                    📦
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-sm sm:text-base md:text-lg font-bold transition-all duration-500 break-words"
                      style={{ 
                        color: hoveredTool === 'digital-product-builder' ? '#8B5CF6' : 'var(--secondary)',
                        fontSize: hoveredTool === 'digital-product-builder' ? 'clamp(0.875rem, 1.25rem, 1.25rem)' : 'clamp(0.875rem, 1rem, 1rem)'
                      }}
                    >
                      Digital Product Builder
                    </h3>
                    <p 
                      className="text-xs sm:text-sm mt-0.5 opacity-70 transition-opacity duration-500 break-words"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {toolData['digital-product-builder']?.description || 'Build your digital product from idea to launch'}
                    </p>
                  </div>
                </div>
                <span 
                  className="text-sm opacity-60 transition-all duration-500"
                  style={{ 
                    color: 'var(--text-secondary)',
                    opacity: hoveredTool === 'digital-product-builder' ? 0 : 0.6
                  }}
                >
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>

              {/* Expanded Content - Fades in on hover */}
              {toolData['digital-product-builder'] && (
                <div
                  className="overflow-hidden transition-all duration-[1148ms] ease-out will-change-[max-height,opacity] transform-gpu"
                  style={{
                    maxHeight: hoveredTool === 'digital-product-builder' ? '500px' : '0px',
                    opacity: hoveredTool === 'digital-product-builder' ? 1 : 0,
                    transform: hoveredTool === 'digital-product-builder' ? 'translateY(0)' : 'translateY(-10px)',
                    transition: 'max-height 1.148s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.148s cubic-bezier(0.4, 0, 0.2, 1), transform 1.148s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div className="pt-4 space-y-4 border-t" style={{ borderColor: 'rgba(139, 92, 246, 0.2)' }}>
                    {/* Full Description */}
                    <p 
                      className="text-sm leading-relaxed transition-all duration-300 delay-100"
                      style={{ 
                        color: 'var(--text-secondary)',
                        opacity: hoveredTool === 'digital-product-builder' ? 1 : 0,
                        transform: hoveredTool === 'digital-product-builder' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      {toolData['digital-product-builder'].fullDescription}
                    </p>

                    {/* Features List */}
                    <div 
                      className="space-y-2 transition-all duration-300 delay-200"
                      style={{
                        opacity: hoveredTool === 'digital-product-builder' ? 1 : 0,
                        transform: hoveredTool === 'digital-product-builder' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#8B5CF6' }}>
                        Key Features
                      </p>
                      <ul className="space-y-1.5">
                        {toolData['digital-product-builder'].features.map((feature, idx) => (
                          <li 
                            key={idx} 
                            className="flex items-center gap-2 text-sm"
                            style={{
                              transitionDelay: `${300 + idx * 50}ms`,
                              opacity: hoveredTool === 'digital-product-builder' ? 1 : 0,
                              transform: hoveredTool === 'digital-product-builder' ? 'translateX(0)' : 'translateX(-10px)',
                            }}
                          >
                            <span className="text-xs font-bold" style={{ color: '#8B5CF6' }}>✓</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <div 
                      className="pt-2 transition-all duration-300 delay-300"
                      style={{
                        opacity: hoveredTool === 'digital-product-builder' ? 1 : 0,
                        transform: hoveredTool === 'digital-product-builder' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      <Link href={getModuleUrl('digital-product-builder')} className="block w-full">
                        <Button
                          className="w-full font-semibold transition-all duration-300 hover:scale-105"
                          style={{
                            backgroundColor: '#8B5CF6',
                            color: 'white',
                            border: 'none',
                          }}
                        >
                          Explore Digital Product Builder →
                        </Button>
                      </Link>
                    </div>
                    
                    {/* Mobile Minimize Button */}
                    <div className="sm:hidden pt-2 flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHoveredTool(null);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Minimize ↑
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Niche Radar */}
        {currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('opportunity-radar')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'opportunity-radar')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'opportunity-radar')}
            onClick={(e) => {
              if (!isReorderMode) {
                e.preventDefault();
                setHoveredTool(hoveredTool === 'opportunity-radar' ? null : 'opportunity-radar');
              }
            }}
            onMouseEnter={() => !isReorderMode && setHoveredTool('opportunity-radar')}
            onMouseLeave={() => setHoveredTool(null)}
            className="rounded-xl sm:rounded-2xl shadow-lg border transition-all duration-[1148ms] relative group mobile-no-glow"
            style={{
              marginBottom: '0.75rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: hoveredTool === 'opportunity-radar' 
                ? '#2979FF'
                : dragOverModule === 'opportunity-radar'
                  ? '#2979FF'
                  : 'var(--card-border)',
              filter: hoveredTool === 'opportunity-radar' 
                ? 'drop-shadow(0 0 10px rgba(41, 121, 255, 0.015))'
                : 'drop-shadow(0 0 25px rgba(41, 121, 255, 0.12))',
              backdropFilter: 'blur(8px)',
              boxShadow: hoveredTool === 'opportunity-radar'
                ? '0 8px 20px rgba(41, 121, 255, 0.024), 0 0 0 1px rgba(41, 121, 255, 0.045)'
                : dragOverModule === 'opportunity-radar'
                  ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                  : theme === 'dark'
                    ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                    : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('opportunity-radar') === -1 ? 0 : moduleOrder.indexOf('opportunity-radar'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'opportunity-radar' ? 0.5 : 1,
              transform: hoveredTool === 'opportunity-radar' ? 'scale(1.02)' : dragOverModule === 'opportunity-radar' ? 'scale(1.01)' : 'scale(1)',
              padding: hoveredTool === 'opportunity-radar' ? '1rem' : '0.75rem',
              transition: 'all 1.148s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Glow effect */}
            {hoveredTool === 'opportunity-radar' && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, #2979FF, transparent 70%)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                  opacity: 0.06,
                }}
              />
            )}

            <div 
              onClick={(e) => {
                if (!isReorderMode) {
                  e.preventDefault();
                  setHoveredTool(hoveredTool === 'opportunity-radar' ? null : 'opportunity-radar');
                }
              }}
              className="block cursor-pointer"
            >
              {/* Header - Always visible */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span 
                    className="text-2xl sm:text-3xl transition-transform duration-500 flex-shrink-0" 
                    style={{ 
                      transform: hoveredTool === 'opportunity-radar' ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
                    }}
                  >
                    🎯
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-sm sm:text-base md:text-lg font-bold transition-all duration-500 break-words"
                      style={{ 
                        color: hoveredTool === 'opportunity-radar' ? '#2979FF' : 'var(--secondary)',
                        fontSize: hoveredTool === 'opportunity-radar' ? 'clamp(0.875rem, 1.25rem, 1.25rem)' : 'clamp(0.875rem, 1rem, 1rem)'
                      }}
                    >
                      Niche Radar
                    </h3>
                    <p 
                      className="text-xs sm:text-sm mt-0.5 opacity-70 transition-opacity duration-500 break-words"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {toolData['opportunity-radar']?.description || 'Find where your skills meet real demand'}
                    </p>
                  </div>
                </div>
                <span 
                  className="text-sm opacity-60 transition-all duration-500"
                  style={{ 
                    color: 'var(--text-secondary)',
                    opacity: hoveredTool === 'opportunity-radar' ? 0 : 0.6
                  }}
                >
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>

              {/* Expanded Content - Fades in on hover */}
              {toolData['opportunity-radar'] && (
                <div
                  className="overflow-hidden transition-all duration-[1148ms] ease-out will-change-[max-height,opacity] transform-gpu"
                  style={{
                    maxHeight: hoveredTool === 'opportunity-radar' ? '500px' : '0px',
                    opacity: hoveredTool === 'opportunity-radar' ? 1 : 0,
                    transform: hoveredTool === 'opportunity-radar' ? 'translateY(0)' : 'translateY(-10px)',
                    transition: 'max-height 1.148s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.148s cubic-bezier(0.4, 0, 0.2, 1), transform 1.148s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div className="pt-4 space-y-4 border-t" style={{ borderColor: 'rgba(41, 121, 255, 0.2)' }}>
                    {/* Full Description */}
                    <p 
                      className="text-sm leading-relaxed transition-all duration-300 delay-100"
                      style={{ 
                        color: 'var(--text-secondary)',
                        opacity: hoveredTool === 'opportunity-radar' ? 1 : 0,
                        transform: hoveredTool === 'opportunity-radar' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      {toolData['opportunity-radar'].fullDescription}
                    </p>

                    {/* Features List */}
                    <div 
                      className="space-y-2 transition-all duration-300 delay-200"
                      style={{
                        opacity: hoveredTool === 'opportunity-radar' ? 1 : 0,
                        transform: hoveredTool === 'opportunity-radar' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#2979FF' }}>
                        Key Features
                      </p>
                      <ul className="space-y-1.5">
                        {toolData['opportunity-radar'].features.map((feature, idx) => (
                          <li 
                            key={idx} 
                            className="flex items-center gap-2 text-sm"
                            style={{
                              transitionDelay: `${300 + idx * 50}ms`,
                              opacity: hoveredTool === 'opportunity-radar' ? 1 : 0,
                              transform: hoveredTool === 'opportunity-radar' ? 'translateX(0)' : 'translateX(-10px)',
                            }}
                          >
                            <span className="text-xs font-bold" style={{ color: '#2979FF' }}>✓</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <div 
                      className="pt-2 transition-all duration-300 delay-300"
                      style={{
                        opacity: hoveredTool === 'opportunity-radar' ? 1 : 0,
                        transform: hoveredTool === 'opportunity-radar' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      <Link href={getModuleUrl('opportunity-radar')} className="block w-full">
                        <Button
                          className="w-full font-semibold transition-all duration-300 hover:scale-105"
                          style={{
                            backgroundColor: '#2979FF',
                            color: 'white',
                            border: 'none',
                          }}
                        >
                          Explore Niche Radar →
                        </Button>
                      </Link>
                    </div>
                    
                    {/* Mobile Minimize Button */}
                    <div className="sm:hidden pt-2 flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHoveredTool(null);
                        }}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700 py-2 flex items-center gap-1 transition-colors"
                      >
                        <span className="transform rotate-180">↓</span> Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* KidSafe URL Checker */}
        {currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('kidsafe-url-checker')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'kidsafe-url-checker')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'kidsafe-url-checker')}
            onClick={(e) => {
              if (!isReorderMode) {
                e.preventDefault();
                // Toggle expansion instead of navigating immediately
                setHoveredTool(hoveredTool === 'kidsafe-url-checker' ? null : 'kidsafe-url-checker');
              }
            }}
            onMouseEnter={() => !isReorderMode && setHoveredTool('kidsafe-url-checker')}
            onMouseLeave={() => setHoveredTool(null)}
            className="rounded-xl sm:rounded-2xl shadow-lg border transition-all duration-[1148ms] relative group mobile-no-glow"
            style={{
              marginBottom: '0.75rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: hoveredTool === 'kidsafe-url-checker' 
                ? '#10B981'
                : dragOverModule === 'kidsafe-url-checker'
                  ? '#2979FF'
                  : 'var(--card-border)',
              filter: hoveredTool === 'kidsafe-url-checker' 
                ? 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.015))'
                : 'drop-shadow(0 0 25px rgba(16, 185, 129, 0.12))',
              backdropFilter: 'blur(8px)',
              boxShadow: hoveredTool === 'kidsafe-url-checker'
                ? '0 8px 20px rgba(16, 185, 129, 0.024), 0 0 0 1px rgba(16, 185, 129, 0.045)'
                : dragOverModule === 'kidsafe-url-checker'
                  ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                  : theme === 'dark'
                    ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                    : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('kidsafe-url-checker') === -1 ? 1 : moduleOrder.indexOf('kidsafe-url-checker'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'kidsafe-url-checker' ? 0.5 : 1,
              transform: hoveredTool === 'kidsafe-url-checker' ? 'scale(1.02)' : dragOverModule === 'kidsafe-url-checker' ? 'scale(1.01)' : 'scale(1)',
              padding: hoveredTool === 'kidsafe-url-checker' ? '1rem' : '0.75rem',
              transition: 'all 1.148s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Glow effect */}
            {hoveredTool === 'kidsafe-url-checker' && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, #10B981, transparent 70%)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                  opacity: 0.06,
                }}
              />
            )}

            <div 
              onClick={(e) => {
                if (!isReorderMode) {
                  e.preventDefault();
                  // Toggle expansion instead of navigating immediately
                  setHoveredTool(hoveredTool === 'kidsafe-url-checker' ? null : 'kidsafe-url-checker');
                }
              }}
              className="block cursor-pointer"
            >
              {/* Header - Always visible */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span 
                    className="text-2xl sm:text-3xl transition-transform duration-500 flex-shrink-0" 
                    style={{ 
                      transform: hoveredTool === 'kidsafe-url-checker' ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
                    }}
                  >
                    🛡️
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-sm sm:text-base md:text-lg font-bold transition-all duration-500 break-words"
                      style={{ 
                        color: hoveredTool === 'kidsafe-url-checker' ? '#10B981' : 'var(--secondary)',
                        fontSize: hoveredTool === 'kidsafe-url-checker' ? 'clamp(0.875rem, 1.25rem, 1.25rem)' : 'clamp(0.875rem, 1rem, 1rem)'
                      }}
                    >
                      KidSafe URL Checker
                    </h3>
                    <p 
                      className="text-xs sm:text-sm mt-0.5 opacity-70 transition-opacity duration-500 break-words"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {toolData['kidsafe-url-checker']?.description || 'Check if a website is safe for children under 13'}
                    </p>
                  </div>
                </div>
                <span 
                  className="text-sm opacity-60 transition-all duration-500"
                  style={{ 
                    color: 'var(--text-secondary)',
                    opacity: hoveredTool === 'kidsafe-url-checker' ? 0 : 0.6
                  }}
                >
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>

              {/* Expanded Content - Fades in on hover */}
              {toolData['kidsafe-url-checker'] && (
                <div
                  className="overflow-hidden transition-all duration-[1148ms] ease-out will-change-[max-height,opacity] transform-gpu"
                  style={{
                    maxHeight: hoveredTool === 'kidsafe-url-checker' ? '500px' : '0px',
                    opacity: hoveredTool === 'kidsafe-url-checker' ? 1 : 0,
                    transform: hoveredTool === 'kidsafe-url-checker' ? 'translateY(0)' : 'translateY(-10px)',
                    transition: 'max-height 1.148s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.148s cubic-bezier(0.4, 0, 0.2, 1), transform 1.148s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div className="pt-4 space-y-4 border-t" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                    {/* Full Description */}
                    <p 
                      className="text-sm leading-relaxed transition-all duration-300 delay-100"
                      style={{ 
                        color: 'var(--text-secondary)',
                        opacity: hoveredTool === 'kidsafe-url-checker' ? 1 : 0,
                        transform: hoveredTool === 'kidsafe-url-checker' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      {toolData['kidsafe-url-checker'].fullDescription}
                    </p>

                    {/* Features List */}
                    <div 
                      className="space-y-2 transition-all duration-300 delay-200"
                      style={{
                        opacity: hoveredTool === 'kidsafe-url-checker' ? 1 : 0,
                        transform: hoveredTool === 'kidsafe-url-checker' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#10B981' }}>
                        Key Features
                      </p>
                      <ul className="space-y-1.5">
                        {toolData['kidsafe-url-checker'].features.map((feature, idx) => (
                          <li 
                            key={idx} 
                            className="flex items-center gap-2 text-sm"
                            style={{
                              transitionDelay: `${300 + idx * 50}ms`,
                              opacity: hoveredTool === 'kidsafe-url-checker' ? 1 : 0,
                              transform: hoveredTool === 'kidsafe-url-checker' ? 'translateX(0)' : 'translateX(-10px)',
                            }}
                          >
                            <span className="text-xs font-bold" style={{ color: '#10B981' }}>✓</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <div 
                      className="pt-2 transition-all duration-300 delay-300"
                      style={{
                        opacity: hoveredTool === 'kidsafe-url-checker' ? 1 : 0,
                        transform: hoveredTool === 'kidsafe-url-checker' ? 'translateY(0)' : 'translateY(-5px)',
                      }}
                    >
                      <Link href={getModuleUrl('kidsafe-url-checker')} className="block w-full">
                        <Button
                          className="w-full font-semibold transition-all duration-300 hover:scale-105"
                          style={{
                            backgroundColor: '#10B981',
                            color: 'white',
                            border: 'none',
                          }}
                        >
                          Explore KidSafe URL Checker →
                        </Button>
                      </Link>
                    </div>
                    
                    {/* Mobile Minimize Button */}
                    <div className="sm:hidden pt-2 flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHoveredTool(null);
                        }}
                        className="text-xs font-medium text-gray-500 hover:text-gray-700 py-2 flex items-center gap-1 transition-colors"
                      >
                        <span className="transform rotate-180">↓</span> Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PostReady Tools Hub */}
        {currentStep === "form" && (
          <div 
            onMouseEnter={() => setHoveredPostReadyTools(true)}
            onMouseLeave={() => setHoveredPostReadyTools(false)}
            onClick={() => setHoveredPostReadyTools(prev => !prev)}
            className="rounded-xl sm:rounded-2xl shadow-lg border transition-all duration-[1148ms] relative overflow-hidden group mobile-no-glow"
            style={{
              marginBottom: '0.75rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: hoveredPostReadyTools 
                ? '#2979FF'
                : 'var(--card-border)',
              borderWidth: hoveredPostReadyTools ? '2px' : '1px',
              boxShadow: hoveredPostReadyTools
                ? '0 2px 8px rgba(41, 121, 255, 0.006), 0 0 0 1px rgba(41, 121, 255, 0.024)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                  : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              filter: hoveredPostReadyTools
                ? 'drop-shadow(0 0 4px rgba(41, 121, 255, 0.0045))'
                : 'drop-shadow(0 0 25px rgba(41, 121, 255, 0.12))',
              backdropFilter: 'blur(8px)',
              order: moduleOrder.indexOf('trend-radar') === -1 ? 999 : moduleOrder.indexOf('trend-radar'),
              cursor: 'pointer',
              padding: hoveredPostReadyTools ? '1rem' : '0.75rem',
              transition: 'all 1.148s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Gradient glow effect */}
            {hoveredPostReadyTools && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, #2979FF, #06B6D4, transparent 70%)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                  opacity: 0.0015,
                }}
              />
            )}

            {/* Main Header */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <span 
                  className="text-2xl sm:text-3xl transition-transform duration-500 flex-shrink-0" 
                  style={{ 
                    transform: hoveredPostReadyTools ? 'scale(1.15) rotate(10deg)' : 'scale(1) rotate(0deg)'
                  }}
                >
                  🚀
                </span>
                <div className="flex-1 min-w-0">
                  <h3 
                    className="text-sm sm:text-base md:text-lg font-bold transition-all duration-500 break-words"
                    style={{ 
                      color: hoveredPostReadyTools ? '#2979FF' : 'var(--secondary)',
                      fontSize: hoveredPostReadyTools ? 'clamp(0.875rem, 1.25rem, 1.25rem)' : 'clamp(0.875rem, 1rem, 1rem)'
                    }}
                  >
                    PostReady Tools
                  </h3>
                  <p 
                    className="text-xs sm:text-sm mt-0.5 opacity-70 transition-opacity duration-500 break-words"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {hoveredPostReadyTools ? 'Choose a tool below ↓' : 'Professional tools for content creation and growth'}
                  </p>
                </div>
              </div>
              <span 
                className="text-sm opacity-60 transition-all duration-500"
                style={{ 
                  color: 'var(--text-secondary)',
                  opacity: hoveredPostReadyTools ? 0 : 0.6
                }}
              >
                Hover to explore →
              </span>
            </div>

            {/* Submenu - Reveals on hover */}
            <div
              className="overflow-hidden transition-all duration-[1148ms] ease-out will-change-[max-height,opacity] transform-gpu"
              style={{
                maxHeight: hoveredPostReadyTools ? '800px' : '0px',
                opacity: hoveredPostReadyTools ? 1 : 0,
                transform: hoveredPostReadyTools ? 'translateY(0)' : 'translateY(-10px)',
                transition: 'max-height 1.148s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.148s cubic-bezier(0.4, 0, 0.2, 1), transform 1.148s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div className="pt-4 space-y-2 border-t" style={{ borderColor: 'rgba(41, 121, 255, 0.2)' }}>
                {/* Tool List */}
                {[
                  { id: 'brainworm-generator', name: 'Brainworm Phrase Generator', icon: '🧠', color: '#8B5CF6' },
                  { id: 'sugar-daddy-messages', name: 'Sugar Daddy Message Generator', icon: '💼', color: '#10B981' },
                  { id: 'music-generator', name: 'Music Generator', icon: '🎵', color: '#F59E0B' },
                  { id: 'voiceover-generator', name: 'Script & Voiceover Generator', icon: '🎙️', color: '#EC4899' },
                  { id: 'sora-prompt', name: 'Sora Prompt Generator', icon: '🎬', color: '#6366F1' },
                  { id: 'digital-products', name: 'Premium Collection', icon: '💎', color: '#DAA520' },
                ].map((tool, idx) => (
                  <Link
                    key={tool.id}
                    href={getModuleUrl(tool.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="block"
                  >
                    <div
                      className="rounded-lg p-2 sm:p-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        backgroundColor: hoveredPostReadyTools ? 'rgba(41, 121, 255, 0.05)' : 'transparent',
                        border: '1px solid transparent',
                        borderColor: hoveredPostReadyTools ? 'rgba(41, 121, 255, 0.1)' : 'transparent',
                        transitionDelay: `${idx * 50}ms`,
                        minHeight: '44px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(41, 121, 255, 0.1)';
                        e.currentTarget.style.borderColor = tool.color;
                        e.currentTarget.style.transform = 'translateX(5px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = hoveredPostReadyTools ? 'rgba(41, 121, 255, 0.05)' : 'transparent';
                        e.currentTarget.style.borderColor = hoveredPostReadyTools ? 'rgba(41, 121, 255, 0.1)' : 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xl sm:text-2xl flex-shrink-0">{tool.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 
                            className="text-xs sm:text-sm font-semibold transition-colors duration-300 break-words"
                            style={{ 
                              color: hoveredPostReadyTools ? tool.color : 'var(--secondary)'
                            }}
                          >
                            {tool.name}
                          </h4>
                          <p 
                            className="text-xs mt-0.5 opacity-70 break-words line-clamp-1"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {toolData[tool.id]?.description || 'Click to use'}
                          </p>
                        </div>
                        <span 
                          className="text-xs opacity-50 transition-opacity duration-300 flex-shrink-0"
                          style={{ color: tool.color }}
                        >
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                
                {/* Mobile Minimize Button */}
                <div className="sm:hidden pt-2 flex justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setHoveredPostReadyTools(false);
                    }}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 py-2 flex items-center gap-1 transition-colors"
                  >
                    <span className="transform rotate-180">↓</span> Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Social Media Tools Hub */}
        {currentStep === "form" && (
          <div 
            onMouseEnter={() => setHoveredSocialMediaTools(true)}
            onMouseLeave={() => setHoveredSocialMediaTools(false)}
            onClick={() => setHoveredSocialMediaTools(prev => !prev)}
            className="rounded-xl sm:rounded-2xl shadow-lg border transition-all duration-[1148ms] relative overflow-hidden group mobile-no-glow"
            style={{
              marginBottom: '0.75rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: hoveredSocialMediaTools 
                ? '#06B6D4'
                : 'var(--card-border)',
              borderWidth: hoveredSocialMediaTools ? '2px' : '1px',
              boxShadow: hoveredSocialMediaTools
                ? '0 2px 8px rgba(6, 182, 212, 0.006), 0 0 0 1px rgba(6, 182, 212, 0.024)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(6, 182, 212, 0.15), 0 0 0 1px rgba(6, 182, 212, 0.1)'
                  : '0 4px 20px rgba(6, 182, 212, 0.12), 0 0 0 1px rgba(6, 182, 212, 0.08)',
              filter: hoveredSocialMediaTools
                ? 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.0045))'
                : 'drop-shadow(0 0 25px rgba(6, 182, 212, 0.12))',
              backdropFilter: 'blur(8px)',
              order: moduleOrder.indexOf('trend-radar') === -1 ? 999 : moduleOrder.indexOf('trend-radar'),
              cursor: 'pointer',
              padding: hoveredSocialMediaTools ? '1rem' : '0.75rem',
              transition: 'all 1.148s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Gradient glow effect */}
            {hoveredSocialMediaTools && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, #06B6D4, #14B8A6, transparent 70%)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                  opacity: 0.0015,
                }}
              />
            )}

            {/* Main Header */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <span 
                  className="text-2xl sm:text-3xl transition-transform duration-500 flex-shrink-0" 
                  style={{ 
                    transform: hoveredSocialMediaTools ? 'scale(1.15) rotate(10deg)' : 'scale(1) rotate(0deg)'
                  }}
                >
                  📱
                </span>
                <div className="flex-1 min-w-0">
                  <h3 
                    className="text-sm sm:text-base md:text-lg font-bold transition-all duration-500 break-words"
                    style={{ 
                      color: hoveredSocialMediaTools ? '#06B6D4' : 'var(--secondary)',
                      fontSize: hoveredSocialMediaTools ? 'clamp(0.875rem, 1.25rem, 1.25rem)' : 'clamp(0.875rem, 1rem, 1rem)'
                    }}
                  >
                    Social Media Tools
                  </h3>
                  <p 
                    className="text-xs sm:text-sm mt-0.5 opacity-70 transition-opacity duration-500 break-words"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {hoveredSocialMediaTools ? 'Choose a tool below ↓' : 'Tools for social media growth and engagement'}
                  </p>
                </div>
              </div>
              <span 
                className="text-sm opacity-60 transition-all duration-500"
                style={{ 
                  color: 'var(--text-secondary)',
                  opacity: hoveredSocialMediaTools ? 0 : 0.6
                }}
              >
                Hover to explore →
              </span>
            </div>

            {/* Submenu - Reveals on hover */}
            <div
              className="overflow-hidden transition-all duration-[1148ms] ease-out will-change-[max-height,opacity] transform-gpu"
              style={{
                maxHeight: hoveredSocialMediaTools ? '800px' : '0px',
                opacity: hoveredSocialMediaTools ? 1 : 0,
                transform: hoveredSocialMediaTools ? 'translateY(0)' : 'translateY(-10px)',
                transition: 'max-height 1.148s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.148s cubic-bezier(0.4, 0, 0.2, 1), transform 1.148s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div className="pt-4 space-y-2 border-t" style={{ borderColor: 'rgba(6, 182, 212, 0.2)' }}>
                {/* Tool List */}
                {[
                  { id: 'collab-engine', name: 'TikTok Collab Engine', icon: '🤝', color: '#FF4F78' },
                  { id: 'trend-radar', name: 'Trend Radar', icon: '📡', color: '#06B6D4' },
                  { id: 'idea-generator', name: 'Viral Video Idea Generator', icon: '💡', color: '#F97316' },
                  { id: 'hashtag-research', name: 'Hashtag Deep Research', icon: '#️⃣', color: '#14B8A6' },
                  { id: 'comment-bait', name: 'Comment Bait Generator', icon: '🎣', color: '#2979FF' },
                  { id: 'page-analyzer', name: 'Page Analyzer', icon: '📊', color: '#8B5CF6' },
                ].map((tool, idx) => (
                  <Link
                    key={tool.id}
                    href={getModuleUrl(tool.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="block"
                  >
                    <div
                      className="rounded-lg p-2 sm:p-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        backgroundColor: hoveredSocialMediaTools ? 'rgba(6, 182, 212, 0.05)' : 'transparent',
                        border: '1px solid transparent',
                        borderColor: hoveredSocialMediaTools ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                        transitionDelay: `${idx * 50}ms`,
                        minHeight: '44px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
                        e.currentTarget.style.borderColor = tool.color;
                        e.currentTarget.style.transform = 'translateX(5px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = hoveredSocialMediaTools ? 'rgba(6, 182, 212, 0.05)' : 'transparent';
                        e.currentTarget.style.borderColor = hoveredSocialMediaTools ? 'rgba(6, 182, 212, 0.1)' : 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xl sm:text-2xl flex-shrink-0">{tool.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 
                            className="text-xs sm:text-sm font-semibold transition-colors duration-300 break-words"
                            style={{ 
                              color: hoveredSocialMediaTools ? tool.color : 'var(--secondary)'
                            }}
                          >
                            {tool.name}
                          </h4>
                          <p 
                            className="text-xs mt-0.5 opacity-70 break-words line-clamp-1"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {toolData[tool.id]?.description || 'Click to use'}
                          </p>
                        </div>
                        <span 
                          className="text-xs opacity-50 transition-opacity duration-300 flex-shrink-0"
                          style={{ color: tool.color }}
                        >
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                
                {/* Mobile Minimize Button */}
                <div className="sm:hidden pt-2 flex justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setHoveredSocialMediaTools(false);
                    }}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 py-2 flex items-center gap-1 transition-colors"
                  >
                    <span className="transform rotate-180">↓</span> Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Funny Generators Hub */}
        {currentStep === "form" && (
          <div 
            onMouseEnter={() => setHoveredFunnyGenerators(true)}
            onMouseLeave={() => setHoveredFunnyGenerators(false)}
            onClick={() => setHoveredFunnyGenerators(prev => !prev)}
            className="rounded-xl sm:rounded-2xl shadow-lg border transition-all duration-[1148ms] relative overflow-hidden group mobile-no-glow"
            style={{
              marginBottom: '0.75rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: hoveredFunnyGenerators 
                ? '#EC4899'
                : 'var(--card-border)',
              borderWidth: hoveredFunnyGenerators ? '2px' : '1px',
              boxShadow: hoveredFunnyGenerators
                ? '0 2px 8px rgba(236, 72, 153, 0.006), 0 0 0 1px rgba(236, 72, 153, 0.024)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(236, 72, 153, 0.15), 0 0 0 1px rgba(236, 72, 153, 0.1)'
                  : '0 4px 20px rgba(236, 72, 153, 0.12), 0 0 0 1px rgba(236, 72, 153, 0.08)',
              filter: hoveredFunnyGenerators
                ? 'drop-shadow(0 0 4px rgba(236, 72, 153, 0.0045))'
                : 'drop-shadow(0 0 25px rgba(236, 72, 153, 0.12))',
              backdropFilter: 'blur(8px)',
              order: 9999,
              cursor: 'pointer',
              padding: hoveredFunnyGenerators ? '1rem' : '0.75rem',
              transition: 'all 1.148s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Playful gradient glow effect */}
            {hoveredFunnyGenerators && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, #EC4899, #F59E0B, transparent 70%)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                  opacity: 0.0015,
                }}
              />
            )}

            {/* Main Header */}
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <span 
                  className="text-2xl sm:text-3xl transition-transform duration-500 flex-shrink-0" 
                  style={{ 
                    transform: hoveredFunnyGenerators ? 'scale(1.15) rotate(10deg)' : 'scale(1) rotate(0deg)'
                  }}
                >
                  😂
                </span>
                <div className="flex-1 min-w-0">
                  <h3 
                    className="text-sm sm:text-base md:text-lg font-bold transition-all duration-500 break-words"
                    style={{ 
                      color: hoveredFunnyGenerators ? '#EC4899' : 'var(--secondary)',
                      fontSize: hoveredFunnyGenerators ? 'clamp(0.875rem, 1.25rem, 1.25rem)' : 'clamp(0.875rem, 1rem, 1rem)'
                    }}
                  >
                    Funny Generators
                  </h3>
                  <p 
                    className="text-xs sm:text-sm mt-0.5 opacity-70 transition-opacity duration-500 break-words"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {hoveredFunnyGenerators ? 'Choose a generator below ↓' : 'Lighthearted tools for humor and entertainment'}
                  </p>
                </div>
              </div>
              <span 
                className="text-sm opacity-60 transition-all duration-500"
                style={{ 
                  color: 'var(--text-secondary)',
                  opacity: hoveredFunnyGenerators ? 0 : 0.6
                }}
              >
                Hover to explore →
              </span>
            </div>

            {/* Submenu - Reveals on hover */}
            <div
              className="overflow-hidden transition-all duration-[1148ms] ease-out will-change-[max-height,opacity] transform-gpu"
              style={{
                maxHeight: hoveredFunnyGenerators ? '600px' : '0px',
                opacity: hoveredFunnyGenerators ? 1 : 0,
                transform: hoveredFunnyGenerators ? 'translateY(0)' : 'translateY(-10px)',
                transition: 'max-height 1.148s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.148s cubic-bezier(0.4, 0, 0.2, 1), transform 1.148s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div className="pt-4 space-y-2 border-t" style={{ borderColor: 'rgba(236, 72, 153, 0.2)' }}>
                {/* Tool List */}
                {[
                  { id: 'red-flag-detector', name: 'Red Flag Detector', icon: '🚩', color: '#ef4444' },
                  { id: 'cringe-couple-caption', name: 'Cringe Couple Caption Generator', icon: '💑', color: '#EC4899' },
                  { id: 'comment-fight-starter', name: 'Comment Fight Starter', icon: '💥', color: '#EF4444' },
                  { id: 'poor-life-choices-advisor', name: 'Poor Life Choices Generator', icon: '🤦', color: '#F59E0B' },
                  { id: 'random-excuse', name: 'Random Excuse Generator', icon: '🎭', color: '#F59E0B' },
                ].map((tool, idx) => (
                  <Link
                    key={tool.id}
                    href={getModuleUrl(tool.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="block"
                  >
                    <div
                      className="rounded-lg p-2 sm:p-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        backgroundColor: hoveredFunnyGenerators ? 'rgba(236, 72, 153, 0.05)' : 'transparent',
                        border: '1px solid transparent',
                        borderColor: hoveredFunnyGenerators ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
                        transitionDelay: `${idx * 50}ms`,
                        minHeight: '44px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.1)';
                        e.currentTarget.style.borderColor = tool.color;
                        e.currentTarget.style.transform = 'translateX(5px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = hoveredFunnyGenerators ? 'rgba(236, 72, 153, 0.05)' : 'transparent';
                        e.currentTarget.style.borderColor = hoveredFunnyGenerators ? 'rgba(236, 72, 153, 0.1)' : 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xl sm:text-2xl flex-shrink-0">{tool.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 
                            className="text-xs sm:text-sm font-semibold transition-colors duration-300 break-words"
                            style={{ 
                              color: hoveredFunnyGenerators ? tool.color : 'var(--secondary)'
                            }}
                          >
                            {tool.name}
                          </h4>
                          <p 
                            className="text-xs mt-0.5 opacity-70 break-words line-clamp-1"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {toolData[tool.id]?.description || 'Click to use'}
                          </p>
                        </div>
                        <span 
                          className="text-xs opacity-50 transition-opacity duration-300 flex-shrink-0"
                          style={{ color: tool.color }}
                        >
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                
                {/* Mobile Minimize Button */}
                <div className="sm:hidden pt-2 flex justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setHoveredFunnyGenerators(false);
                    }}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 py-2 flex items-center gap-1 transition-colors"
                  >
                    <span className="transform rotate-180">↓</span> Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Red Flag Detector - REMOVED (now in Funny Generators hub) */}
        {false && currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('red-flag-detector')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'red-flag-detector')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'red-flag-detector')}
            onClick={(e) => {
              if (!isReorderMode) {
                e.preventDefault();
                router.push(getModuleUrl('red-flag-detector'));
              }
            }}
            onMouseEnter={() => !isReorderMode && setHoveredTool('red-flag-detector')}
            onMouseLeave={() => setHoveredTool(null)}
            className="rounded-2xl shadow-lg border transition-all duration-500 relative overflow-hidden group"
            style={{
              marginBottom: '1rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: hoveredTool === 'red-flag-detector' 
                ? '#ef4444'
                : dragOverModule === 'red-flag-detector'
                  ? '#2979FF'
                  : 'var(--card-border)',
              boxShadow: hoveredTool === 'red-flag-detector'
                ? '0 20px 60px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(239, 68, 68, 0.4)'
                : dragOverModule === 'red-flag-detector'
                  ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                  : theme === 'dark'
                    ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                    : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('red-flag-detector'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'red-flag-detector' ? 0.5 : 1,
              transform: hoveredTool === 'red-flag-detector' ? 'scale(1.03)' : dragOverModule === 'red-flag-detector' ? 'scale(1.02)' : 'scale(1)',
              padding: hoveredTool === 'red-flag-detector' ? '1.5rem' : '1rem',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Glow effect */}
            {hoveredTool === 'red-flag-detector' && (
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, #ef4444, transparent 70%)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }}
              />
            )}

            <Link 
              href={getModuleUrl('red-flag-detector')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              {/* Header - Always visible */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span 
                    className="text-3xl transition-transform duration-500" 
                    style={{ 
                      transform: hoveredTool === 'red-flag-detector' ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
                    }}
                  >
                    🚩
                  </span>
                  <div>
                    <h3 
                      className="text-base sm:text-lg font-bold transition-all duration-500"
                      style={{ 
                        color: hoveredTool === 'red-flag-detector' ? '#ef4444' : 'var(--secondary)',
                        fontSize: hoveredTool === 'red-flag-detector' ? '1.25rem' : '1rem'
                      }}
                    >
                      Red Flag Detector
                    </h3>
                    <p 
                      className="text-xs mt-0.5 opacity-70 transition-opacity duration-500"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Detect hidden meanings and identify red flags in text messages and conversations
                    </p>
                  </div>
                </div>
                <span 
                  className="text-sm opacity-60 transition-all duration-500"
                  style={{ 
                    color: 'var(--text-secondary)',
                    opacity: hoveredTool === 'red-flag-detector' ? 0 : 0.6
                  }}
                >
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>

              {/* Expanded Content - Fades in on hover */}
              <div
                className="overflow-hidden transition-all duration-500"
                style={{
                  maxHeight: hoveredTool === 'red-flag-detector' ? '500px' : '0px',
                  opacity: hoveredTool === 'red-flag-detector' ? 1 : 0,
                  transform: hoveredTool === 'red-flag-detector' ? 'translateY(0)' : 'translateY(-10px)',
                }}
              >
                <div className="pt-4 space-y-4 border-t" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  {/* Full Description */}
                  <p 
                    className="text-sm leading-relaxed transition-all duration-500 delay-100"
                    style={{ 
                      color: 'var(--text-secondary)',
                      opacity: hoveredTool === 'red-flag-detector' ? 1 : 0,
                      transform: hoveredTool === 'red-flag-detector' ? 'translateY(0)' : 'translateY(-5px)',
                    }}
                  >
                    Detect hidden meanings and identify red flags in text messages, social media posts, and conversations. Understand what people REALLY mean when they say things that seem innocent but are actually warning signs.
                  </p>

                  {/* Features List */}
                  <div 
                    className="space-y-2 transition-all duration-500 delay-200"
                    style={{
                      opacity: hoveredTool === 'red-flag-detector' ? 1 : 0,
                      transform: hoveredTool === 'red-flag-detector' ? 'translateY(0)' : 'translateY(-5px)',
                    }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#ef4444' }}>
                      Key Features
                    </p>
                    <ul className="space-y-1.5">
                      {['Decode hidden meanings', 'Identify warning signs', 'Beautiful animated analysis', 'Context-aware detection'].map((feature, idx) => (
                        <li 
                          key={idx} 
                          className="flex items-center gap-2 text-sm"
                          style={{
                            transitionDelay: `${300 + idx * 50}ms`,
                            opacity: hoveredTool === 'red-flag-detector' ? 1 : 0,
                            transform: hoveredTool === 'red-flag-detector' ? 'translateX(0)' : 'translateX(-10px)',
                          }}
                        >
                          <span className="text-xs font-bold" style={{ color: '#ef4444' }}>✓</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div 
                    className="pt-2 transition-all duration-500 delay-300"
                    style={{
                      opacity: hoveredTool === 'red-flag-detector' ? 1 : 0,
                      transform: hoveredTool === 'red-flag-detector' ? 'translateY(0)' : 'translateY(-5px)',
                    }}
                  >
                    <Button
                      className="w-full font-semibold transition-all duration-300 hover:scale-105"
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                      }}
                    >
                      Explore Red Flag Detector →
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Cringe Couple Caption Generator - REMOVED (now in Funny Generators hub) */}
        {false && currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('cringe-couple-caption')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'cringe-couple-caption')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'cringe-couple-caption')}
            onClick={(e) => {
              if (!isReorderMode) {
                e.preventDefault();
                router.push(getModuleUrl('cringe-couple-caption'));
              }
            }}
            onMouseEnter={() => !isReorderMode && setHoveredTool('cringe-couple-caption')}
            onMouseLeave={() => setHoveredTool(null)}
            className="rounded-2xl shadow-lg border transition-all duration-300 relative hover:scale-[1.02]"
            style={{
              marginBottom: '1rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: dragOverModule === 'cringe-couple-caption'
                ? '#2979FF'
                : 'var(--card-border)',
              boxShadow: dragOverModule === 'cringe-couple-caption'
                ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                  : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('cringe-couple-caption'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'cringe-couple-caption' ? 0.5 : 1,
              transform: dragOverModule === 'cringe-couple-caption' ? 'scale(1.02)' : 'scale(1)',
              padding: '1rem',
            }}
          >
            <Link 
              href={getModuleUrl('cringe-couple-caption')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💑</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--secondary)' }}>
                      Cringe Couple Caption Generator
                    </h3>
                    <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Generate hilariously cringeworthy couple captions for memes and entertainment
                    </p>
                  </div>
                </div>
                <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Comment Fight Starter Generator - REMOVED (now in Funny Generators hub) */}
        {false && currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('comment-fight-starter')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'comment-fight-starter')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'comment-fight-starter')}
            onClick={(e) => {
              if (!isReorderMode) {
                e.preventDefault();
                router.push(getModuleUrl('comment-fight-starter'));
              }
            }}
            onMouseEnter={() => !isReorderMode && setHoveredTool('comment-fight-starter')}
            onMouseLeave={() => setHoveredTool(null)}
            className="rounded-2xl shadow-lg border transition-all duration-300 relative hover:scale-[1.02]"
            style={{
              marginBottom: '1rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: dragOverModule === 'comment-fight-starter'
                ? '#2979FF'
                : 'var(--card-border)',
              boxShadow: dragOverModule === 'comment-fight-starter'
                ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                  : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('comment-fight-starter'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'comment-fight-starter' ? 0.5 : 1,
              transform: dragOverModule === 'comment-fight-starter' ? 'scale(1.02)' : 'scale(1)',
              padding: '1rem',
            }}
          >
            <Link 
              href={getModuleUrl('comment-fight-starter')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💥</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--secondary)' }}>
                      Comment Fight Starter Generator
                    </h3>
                    <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Generate controversial comments designed to spark debates and boost engagement
                    </p>
                  </div>
                </div>
                <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Poor Life Choices Advisor - REMOVED (now in Funny Generators hub) */}
        {false && currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('poor-life-choices-advisor')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'poor-life-choices-advisor')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'poor-life-choices-advisor')}
            onClick={(e) => {
              if (!isReorderMode) {
                e.preventDefault();
                router.push(getModuleUrl('poor-life-choices-advisor'));
              }
            }}
            onMouseEnter={() => !isReorderMode && setHoveredTool('poor-life-choices-advisor')}
            onMouseLeave={() => setHoveredTool(null)}
            className="rounded-2xl shadow-lg border transition-all duration-300 relative hover:scale-[1.02]"
            style={{
              marginBottom: '1rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: dragOverModule === 'poor-life-choices-advisor'
                ? '#2979FF'
                : 'var(--card-border)',
              boxShadow: dragOverModule === 'poor-life-choices-advisor'
                ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                  : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('poor-life-choices-advisor'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'poor-life-choices-advisor' ? 0.5 : 1,
              transform: dragOverModule === 'poor-life-choices-advisor' ? 'scale(1.02)' : 'scale(1)',
              padding: '1rem',
            }}
          >
            <Link 
              href={getModuleUrl('poor-life-choices-advisor')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤦</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--secondary)' }}>
                      Poor Life Choices Advisor
                    </h3>
                    <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Get humorous, sarcastic advice about poor life choices for entertainment
                    </p>
                  </div>
                </div>
                <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Random Excuse Generator - REMOVED (now in Funny Generators hub) */}
        {false && currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('random-excuse')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'random-excuse')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'random-excuse')}
            onClick={(e) => {
              if (!isReorderMode) {
                e.preventDefault();
                router.push(getModuleUrl('random-excuse'));
              }
            }}
            onMouseEnter={() => !isReorderMode && setHoveredTool('random-excuse')}
            onMouseLeave={() => setHoveredTool(null)}
            className="rounded-2xl shadow-lg border transition-all duration-300 relative hover:scale-[1.02]"
            style={{
              marginBottom: '1rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: dragOverModule === 'random-excuse'
                ? '#2979FF'
                : 'var(--card-border)',
              boxShadow: dragOverModule === 'random-excuse'
                ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                  : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('random-excuse'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'random-excuse' ? 0.5 : 1,
              transform: dragOverModule === 'random-excuse' ? 'scale(1.02)' : 'scale(1)',
              padding: '1rem',
            }}
          >
            <Link 
              href={getModuleUrl('random-excuse')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎭</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--secondary)' }}>
                      Random Excuse Generator
                    </h3>
                    <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Generate creative excuses for any situation - believable or hilariously unbelievable
                    </p>
                  </div>
                </div>
                <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Digital Products Module */}
        {false && currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('digital-products')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'digital-products')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'digital-products')}
            onClick={(e) => {
              if (!isReorderMode) {
                e.preventDefault();
                router.push(getModuleUrl('digital-products'));
              }
            }}
            className="rounded-2xl shadow-lg border transition-all duration-300 relative hover:scale-[1.02]"
            style={{
              marginBottom: '1rem',
              backgroundColor: theme === 'dark' 
                ? 'rgba(218, 165, 32, 0.08)' 
                : 'rgba(218, 165, 32, 0.06)',
              borderColor: dragOverModule === 'digital-products'
                ? '#DAA520'
                : theme === 'dark'
                  ? 'rgba(218, 165, 32, 0.4)'
                  : 'rgba(218, 165, 32, 0.4)',
              boxShadow: dragOverModule === 'digital-products'
                ? '0 0 0 3px rgba(218, 165, 32, 0.4)'
                : theme === 'dark'
                  ? '0 4px 20px rgba(218, 165, 32, 0.2), 0 0 15px rgba(218, 165, 32, 0.12)'
                  : '0 4px 20px rgba(218, 165, 32, 0.25), 0 0 15px rgba(218, 165, 32, 0.15)',
              order: moduleOrder.indexOf('digital-products'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'digital-products' ? 0.5 : 1,
              transform: dragOverModule === 'digital-products' ? 'scale(1.02)' : 'scale(1)',
              padding: '1rem',
            }}
          >
            <Link 
              href={getModuleUrl('digital-products')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💎</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold" style={{ 
                      background: 'linear-gradient(135deg, #DAA520, #FFD700, #F4C430)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      Premium Collection
                    </h3>
                    <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Browse and access premium digital products and resources
                    </p>
                  </div>
                </div>
                <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Comment Bait Generator Module - Now navigates to dedicated page */}
        {false && currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={(e) => {
              if (isReorderMode && user) {
                handleDragStart('comment-bait');
              } else {
                e.preventDefault();
              }
            }}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => {
              if (isReorderMode && user) {
                handleDragOver(e, 'comment-bait');
              } else {
                e.preventDefault();
              }
            }}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              if (isReorderMode && user) {
                handleDrop(e, 'comment-bait');
              } else {
                e.preventDefault();
              }
            }}
            onMouseEnter={() => !isReorderMode && setHoveredTool('comment-bait')}
            onMouseLeave={() => setHoveredTool(null)}
            className="rounded-2xl shadow-lg border transition-all duration-300 relative hover:scale-[1.02]"
            style={{
              marginBottom: '1rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: dragOverModule === 'comment-bait'
                ? '#2979FF'
                : 'var(--card-border)',
              boxShadow: dragOverModule === 'comment-bait'
                ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                  : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('comment-bait'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'comment-bait' ? 0.5 : 1,
              transform: dragOverModule === 'comment-bait' ? 'scale(1.02)' : 'scale(1)',
              padding: '1rem',
            }}
          >
            <Link 
              href={getModuleUrl('comment-bait')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎣</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--secondary)' }}>
                      Comment Bait Generator
                    </h3>
                    <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Generate high-engagement "first comments" to pin under your videos
                    </p>
                  </div>
                </div>
                <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Brainworm Generator Module */}
        {false && currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={(e) => {
              if (isReorderMode && user) {
                handleDragStart('brainworm-generator');
              } else {
                e.preventDefault();
              }
            }}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => {
              if (isReorderMode && user) {
                handleDragOver(e, 'brainworm-generator');
              } else {
                e.preventDefault();
              }
            }}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              if (isReorderMode && user) {
                handleDrop(e, 'brainworm-generator');
              } else {
                e.preventDefault();
              }
            }}
            className="rounded-2xl shadow-lg border transition-all duration-300 relative hover:scale-[1.02]"
            style={{
              marginBottom: '1rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: dragOverModule === 'brainworm-generator'
                ? '#2979FF'
                : 'var(--card-border)',
              boxShadow: dragOverModule === 'brainworm-generator'
                ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                  : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('brainworm-generator'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'brainworm-generator' ? 0.5 : 1,
              transform: dragOverModule === 'brainworm-generator' ? 'scale(1.02)' : 'scale(1)',
              padding: '1rem',
            }}
          >
            <Link 
              href={getModuleUrl('brainworm-generator')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--secondary)' }}>
                      Brainworm Phrase Generator
                    </h3>
                    <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Create irresistibly engaging phrases that get stuck in viewers' heads
                    </p>
                  </div>
                </div>
                <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Sugar Daddy Message Generator Module - Now navigates to dedicated page */}
        {false && currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={(e) => {
              if (isReorderMode && user) {
                handleDragStart('sugar-daddy-messages');
              } else {
                e.preventDefault();
              }
            }}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => {
              if (isReorderMode && user) {
                handleDragOver(e, 'sugar-daddy-messages');
              } else {
                e.preventDefault();
              }
            }}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              if (isReorderMode && user) {
                handleDrop(e, 'sugar-daddy-messages');
              } else {
                e.preventDefault();
              }
            }}
            className="rounded-2xl shadow-lg border transition-all duration-300 relative hover:scale-[1.02]"
            style={{
              marginBottom: '1rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: dragOverModule === 'sugar-daddy-messages'
                ? '#2979FF'
                : 'var(--card-border)',
              boxShadow: dragOverModule === 'sugar-daddy-messages'
                ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                  : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('sugar-daddy-messages'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'sugar-daddy-messages' ? 0.5 : 1,
              transform: dragOverModule === 'sugar-daddy-messages' ? 'scale(1.02)' : 'scale(1)',
              padding: '1rem',
            }}
          >
            <Link 
              href={getModuleUrl('sugar-daddy-messages')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💸</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--secondary)' }}>
                      Sugar Daddy Message Generator
                    </h3>
                    <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Generate persuasive messages for requesting financial support
                    </p>
                  </div>
                </div>
                <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Music Generator */}
        {false && currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('music-generator')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'music-generator')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'music-generator')}
            onClick={(e) => {
              if (!isReorderMode) {
                e.preventDefault();
                router.push(getModuleUrl('music-generator'));
              }
            }}
            className="rounded-2xl shadow-lg border transition-all duration-300 relative hover:scale-[1.02]"
            style={{
              marginBottom: '1rem',
              backgroundColor: theme === 'dark' 
                ? 'rgba(41, 121, 255, 0.12)' 
                : 'rgba(41, 121, 255, 0.03)',
              borderColor: dragOverModule === 'music-generator'
                ? '#2979FF'
                : theme === 'dark'
                  ? 'rgba(41, 121, 255, 0.4)'
                  : 'rgba(41, 121, 255, 0.3)',
              boxShadow: dragOverModule === 'music-generator'
                ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                : theme === 'dark'
                  ? '0 4px 20px rgba(41, 121, 255, 0.25), 0 0 15px rgba(41, 121, 255, 0.15)'
                  : '0 4px 20px rgba(41, 121, 255, 0.15), 0 0 10px rgba(41, 121, 255, 0.1)',
              order: moduleOrder.indexOf('music-generator'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'music-generator' ? 0.5 : 1,
              transform: dragOverModule === 'music-generator' ? 'scale(1.02)' : 'scale(1)',
              padding: '1rem',
            }}
          >
            <Link 
              href={getModuleUrl('music-generator')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎵</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--secondary)' }}>
                      Music Generator
                    </h3>
                    <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Generate custom background music for your videos with AI-powered composition
                    </p>
                  </div>
                </div>
                <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Script & Voiceover Generator Module */}
        {false && currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('voiceover-generator')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'voiceover-generator')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'voiceover-generator')}
            onClick={(e) => {
              if (!isReorderMode) {
                e.preventDefault();
                router.push(getModuleUrl('voiceover-generator'));
              }
            }}
            className="rounded-2xl shadow-lg border transition-all duration-300 relative hover:scale-[1.02]"
            style={{
              marginBottom: '1rem',
              backgroundColor: theme === 'dark' 
                ? 'rgba(41, 121, 255, 0.12)' 
                : 'rgba(41, 121, 255, 0.03)',
              borderColor: dragOverModule === 'voiceover-generator'
                ? '#2979FF'
                : theme === 'dark'
                  ? 'rgba(41, 121, 255, 0.4)'
                  : 'rgba(41, 121, 255, 0.3)',
              boxShadow: dragOverModule === 'voiceover-generator'
                ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                : theme === 'dark'
                  ? '0 4px 20px rgba(41, 121, 255, 0.25), 0 0 15px rgba(41, 121, 255, 0.15)'
                  : '0 4px 20px rgba(41, 121, 255, 0.15), 0 0 10px rgba(41, 121, 255, 0.1)',
              order: moduleOrder.indexOf('voiceover-generator'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'voiceover-generator' ? 0.5 : 1,
              transform: dragOverModule === 'voiceover-generator' ? 'scale(1.02)' : 'scale(1)',
              padding: '1rem',
            }}
          >
            <Link 
              href={getModuleUrl('voiceover-generator')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎙️</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--secondary)' }}>
                      Script & Voiceover Generator
                    </h3>
                    <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Create professional scripts and generate AI voiceovers for your content
                    </p>
                  </div>
                </div>
                <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Sora Prompt Generator Module */}
        {false && currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={(e) => {
              if (isReorderMode && user) {
                handleDragStart('sora-prompt');
              } else {
                e.preventDefault();
              }
            }}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => {
              if (isReorderMode && user) {
                handleDragOver(e, 'sora-prompt');
              } else {
                e.preventDefault();
              }
            }}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              if (isReorderMode && user) {
                handleDrop(e, 'sora-prompt');
              } else {
                e.preventDefault();
              }
            }}
            className="rounded-2xl shadow-lg border transition-all duration-300 relative hover:scale-[1.02]"
            style={{
              marginBottom: '1rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: dragOverModule === 'sora-prompt'
                ? '#2979FF'
                : 'var(--card-border)',
              boxShadow: dragOverModule === 'sora-prompt'
                ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                  : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('sora-prompt'),
              cursor: (isReorderMode && user) ? 'move' : 'pointer',
              opacity: draggedModule === 'sora-prompt' ? 0.5 : 1,
              transform: dragOverModule === 'sora-prompt' ? 'scale(1.02)' : 'scale(1)',
              padding: '1rem',
            }}
          >
            <Link 
              href={getModuleUrl('sora-prompt')}
              onClick={(e) => {
                if (isReorderMode && user) {
                  e.preventDefault();
                }
              }}
              className="block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎬</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--secondary)' }}>
                      Sora Prompt Generator
                    </h3>
                    <p className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Generate detailed prompts for Sora AI video generation
                    </p>
                  </div>
                </div>
                <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                  {isReorderMode ? 'Drag to reorder' : 'Click to use →'}
                </span>
              </div>
            </Link>
          </div>
        )}

{/* Join Network CTA - moved inside module */}

        {/* Premium Subscription Page - Accessible from any step */}
        {currentStep === "premium" && (
          <div className="animate-fade-in">
            {isPro ? (
              <div className="max-w-3xl mx-auto mb-10">
                <div className="bg-gradient-to-br from-blue-600 to-cyan-400 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
                  {/* Premium Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full" style={{
                      background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                      filter: 'blur(40px)'
                    }}></div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-2 mb-4">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <h3 className="text-3xl font-bold">You're a Pro Member!</h3>
                      </div>
                      <p className="text-lg opacity-90">Thank you for supporting PostReady</p>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-start bg-white bg-opacity-10 rounded-lg p-4">
                        <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-bold text-lg">Unlimited Video Ideas</p>
                          <p className="text-purple-100 text-sm">Generate endless content ideas instantly</p>
                        </div>
                      </div>
                      <div className="flex items-start bg-white bg-opacity-10 rounded-lg p-4">
                        <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-bold text-lg">Unlimited Caption Rewrites & Title Rewords</p>
                          <p className="text-purple-100 text-sm">Perfect your content with unlimited edits</p>
                        </div>
                      </div>
                      <div className="flex items-start bg-white bg-opacity-10 rounded-lg p-4">
                        <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-bold text-lg">Priority Support</p>
                          <p className="text-purple-100 text-sm">Get help when you need it most</p>
                        </div>
                      </div>
                      <div className="flex items-start bg-white bg-opacity-10 rounded-lg p-4">
                        <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-bold text-lg">Premium Experience</p>
                          <p className="text-purple-100 text-sm">Enhanced interface and exclusive features</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <button
                        onClick={handleManageBilling}
                        disabled={billingLoading}
                        className="bg-white text-blue-600 rounded-lg px-8 py-3 font-bold hover:bg-gray-50 transition-all shadow-lg inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {billingLoading ? 'Loading...' : 'Manage Subscription'}
                      </button>
                      <p className="text-purple-100 text-sm mt-3">
                        Update payment method, view invoices, or cancel subscription
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto mb-10">
                <div 
                  className="rounded-2xl p-8 text-white shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                    boxShadow: '0 20px 60px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold mb-2">
                      Pro Plan
                    </h3>
                    <div className="flex items-end justify-center gap-2">
                      <span className="text-5xl font-bold">
                        $10
                      </span>
                      <span className="text-xl mb-2 opacity-80">/ month</span>
                    </div>
                    <p className="mt-2 opacity-90">
                      Everything you need to grow faster and unlock new ways to earn.
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Unlimited access to all tools on PostReady</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Built for creators, brands, and online earners</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Grow visibility, engagement, and income</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Smart automation that removes friction</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Continuous upgrades & monetization features</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Priority performance experience</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('🔘 Button clicked - calling initiateCheckout');
                      initiateCheckout();
                    }}
                    disabled={checkoutLoading}
                    className="w-full bg-white rounded-lg px-6 py-4 font-bold text-lg hover:bg-gray-50 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      color: '#2563eb'
                    }}
                  >
                    {checkoutLoading ? (
                      <>
                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-blue-600"></span>
                        Processing...
                      </>
                    ) : (
                      'Unlock Pro Access – $10/month'
                    )}
                  </button>
                  <p className="text-center text-sm mt-3 opacity-85">
                    Cancel anytime • Secure payment via Stripe
                  </p>
                </div>
              </div>
            )}

            {/* Feature Comparison */}
            <div className="max-w-4xl mx-auto mb-8">
              <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: 'var(--secondary)' }}>
                Free vs Pro Comparison
              </h3>
              <div className="rounded-lg border-2 overflow-hidden" style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)'
              }}>
                <div className="grid grid-cols-3 text-center border-b-2" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="p-5 font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Feature</div>
                  <div className="p-5 font-bold text-lg" style={{ 
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-primary)'
                  }}>Free</div>
                  <div className="p-5 font-bold text-lg" style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.1)',
                    color: 'var(--primary)'
                  }}>Pro</div>
                </div>
                <div className="grid grid-cols-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="p-5 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Tool Access</div>
                  <div className="p-5" style={{ 
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-primary)'
                  }}>Limited trial access</div>
                  <div className="p-5 font-bold" style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.1)',
                    color: 'var(--primary)'
                  }}>Unlimited access to all tools</div>
                </div>
                <div className="grid grid-cols-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="p-5 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Usage Limits</div>
                  <div className="p-5" style={{ 
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-primary)'
                  }}>Restricted</div>
                  <div className="p-5 font-bold" style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.1)',
                    color: 'var(--primary)'
                  }}>Unlimited usage</div>
                </div>
                <div className="grid grid-cols-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="p-5 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Advanced Features</div>
                  <div className="p-5" style={{ 
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-primary)'
                  }}>Locked</div>
                  <div className="p-5 font-bold" style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.1)',
                    color: 'var(--primary)'
                  }}>Fully unlocked</div>
                </div>
                <div className="grid grid-cols-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="p-5 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Performance</div>
                  <div className="p-5" style={{ 
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-primary)'
                  }}>Standard speed</div>
                  <div className="p-5 font-bold" style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.1)',
                    color: 'var(--primary)'
                  }}>Priority performance</div>
                </div>
                <div className="grid grid-cols-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="p-5 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Updates & New Tools</div>
                  <div className="p-5" style={{ 
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-primary)'
                  }}>Basic access</div>
                  <div className="p-5 font-bold" style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.1)',
                    color: 'var(--primary)'
                  }}>All current & future tools included</div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="p-5 text-left font-semibold" style={{ color: 'var(--text-primary)' }}>Support</div>
                  <div className="p-5" style={{ 
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-primary)'
                  }}>Email support</div>
                  <div className="p-5 font-bold" style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.1)',
                    color: 'var(--primary)'
                  }}>Priority support</div>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="text-center">
              <button
                onClick={handlePreviousStep}
                className="font-medium transition-colors hover:scale-105"
                style={{ color: 'var(--text-secondary)' }}
              >
                ← Back to Main Page
              </button>
            </div>
          </div>
        )}

        {/* End Modules Container */}
        </div>

        {/* Footer */}
        <div className="text-center py-8 space-y-2">
          <p className="text-sm font-semibold" style={{ 
            background: 'linear-gradient(to right, #2979FF, #6FFFD2, #2979FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 20px rgba(41, 121, 255, 0.3)',
            filter: 'drop-shadow(0 0 10px rgba(111, 255, 210, 0.2))'
          }}>
            © 2025 PostReady. Built to help creators thrive.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a
              href="/privacy"
              className="transition-colors hover:opacity-70 underline decoration-dotted"
              style={{ color: 'var(--text-secondary)' }}
            >
              Privacy Policy
            </a>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <a
              href="/terms"
              className="transition-colors hover:opacity-70 underline decoration-dotted"
              style={{ color: 'var(--text-secondary)' }}
            >
              Terms of Service
            </a>
            <span style={{ color: 'var(--text-secondary)' }}>•</span>
            <a
              href="/refund"
              className="transition-colors hover:opacity-70 underline decoration-dotted"
              style={{ color: 'var(--text-secondary)' }}
            >
              Refund Policy
            </a>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => {
            setAuthModalOpen(false);
            setRedirectToCheckoutAfterAuth(false);
          }}
          mode={authModalMode}
        />

        {/* Sign Out Confirmation Modal */}
        <Modal
          isOpen={modalState.isOpen}
          onClose={() => {
            setModalState({ ...modalState, isOpen: false });
            if (modalState.onCancel) {
              modalState.onCancel();
            }
          }}
          title={modalState.title}
          message={modalState.message}
          type={modalState.type}
          onConfirm={modalState.onConfirm}
          confirmText={modalState.confirmText || 'Confirm'}
        />

        {/* Email Verification Modal */}
        <Modal
          isOpen={showEmailVerificationModal}
          onClose={() => setShowEmailVerificationModal(false)}
          title="📧 Verify Your Email"
          message="Please check your email inbox for a message from 'Supabase Auth' and click the verification link.

Once verified, you'll be automatically signed in and can access all PostReady features!"
          type="info"
          confirmText="OK, Got It!"
        />

        {/* Notification */}
        <Notification
          isOpen={notification.isOpen}
          onClose={() => setNotification({ ...notification, isOpen: false })}
          message={notification.message}
          type={notification.type}
          title={notification.title}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p style={{ color: 'var(--text)' }}>Loading PostReady...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}