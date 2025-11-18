"use client";

import React, { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BusinessInfo, StrategyResult, PostDetails, ContentIdea } from "@/types";
import { generateStrategyAndIdeas } from "@/lib/strategy";
import { generatePostDetailsWithAI, generatePostDetails } from "@/lib/post";
import { SectionCard } from "@/components/SectionCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
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
  const { user, isPro, signOut, upgradeToPro, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  
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
    'music-generator',
    'collab-engine',
    'trend-radar',
    'idea-generator',
    'hashtag-research'
  ]);
  const [draggedModule, setDraggedModule] = useState<string | null>(null);
  const [dragOverModule, setDragOverModule] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  // Module Collapse State
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(
    new Set(['collab-engine', 'trend-radar', 'idea-generator', 'hashtag-research', 'sora-prompt', 'music-generator', 'page-analyzer'])
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
    const allModules = ['collab-engine', 'trend-radar', 'idea-generator', 'hashtag-research', 'sora-prompt', 'music-generator', 'page-analyzer'];
    setCollapsedModules(new Set(allModules));
  };

  const expandAllModules = () => {
    setCollapsedModules(new Set());
  };

  const areAllModulesCollapsed = () => {
    const allModules = ['collab-engine', 'trend-radar', 'idea-generator', 'hashtag-research', 'sora-prompt', 'music-generator', 'page-analyzer'];
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
  const [showSoraPaywall, setShowSoraPaywall] = useState<boolean>(false);

  // Music generation function
  const generateMusic = async () => {
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
      const response = await fetch('/api/test-music', {
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
    
    if (!user) {
      console.log('❌ initiateCheckout: No user found');
      // User not logged in - guide them to sign up
      setRedirectToCheckoutAfterAuth(true);
      setAuthModalMode('signup');
      setAuthModalOpen(true);
      showNotification("Please create an account to subscribe to PostReady Pro", "info", "Sign Up Required");
      return;
    }

    console.log('✅ initiateCheckout: User found:', user.id);

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
      console.log('💳 initiateCheckout: Calling create-checkout API...');
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          planType: selectedPlanType,
        }),
      });

      console.log('📡 initiateCheckout: Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = "Failed to create checkout session";
        try {
          const errorData = await response.json();
          console.error('❌ initiateCheckout: Error data:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('❌ initiateCheckout: Could not parse error response');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ initiateCheckout: Got checkout URL');
      
      if (!data.url) {
        console.error('❌ initiateCheckout: No URL in response:', data);
        throw new Error('No checkout URL received');
      }
      
      // Redirect to Stripe checkout
      console.log('🚀 initiateCheckout: Redirecting to Stripe...');
      window.location.href = data.url;
    } catch (error: any) {
      console.error("❌ initiateCheckout: Fatal error:", error);
      console.error("❌ initiateCheckout: Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      showNotification(error.message || "Failed to start checkout. Please try again.", "error", "Error");
    }
  };

  // Module Reorder Handlers
  const loadModuleOrder = async () => {
    if (!user) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/module-order', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.moduleOrder && Array.isArray(data.moduleOrder)) {
          setModuleOrder(data.moduleOrder);
          console.log('✅ Loaded module order:', data.moduleOrder);
        }
      }
    } catch (error) {
      console.error('Error loading module order:', error);
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

  // Load module order when user logs in
  useEffect(() => {
    if (user && !authLoading) {
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
      
      <div className="max-w-5xl mx-auto px-4 py-10 relative" style={{ zIndex: 1 }}>
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
              {/* Navigation buttons */}
              <div className="grid grid-cols-4 gap-1 sm:gap-2 w-full">
                <button
                  onClick={navigateHome}
                  disabled={isNavigating}
                  className="px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-semibold transition-all disabled:opacity-50 shadow-md hover:scale-105 active:scale-95"
                  style={currentStep === "form" ? { 
                    color: 'white',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #2979FF 0%, #4A9FFF 100%)',
                    boxShadow: '0 4px 12px rgba(41, 121, 255, 0.4)'
                  } : { 
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--card-bg)',
                    border: '2px solid var(--card-border)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  Home
                </button>
              </div>
              {/* User actions */}
              <div className="flex gap-1 sm:gap-2 w-full">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Account button clicked', { user });
                    navigateToPortal();
                  }}
                  type="button"
                  className="flex-1 px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-semibold transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
                  style={{ 
                    color: 'var(--text-primary)', 
                    pointerEvents: 'auto',
                    backgroundColor: 'var(--card-bg)',
                    border: '2px solid var(--card-border)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                  title="Go to User Portal"
                >
                  Account
                </button>
                {!isPro && (
                  <button
                    onClick={scrollToPremium}
                    className="flex-1 text-white px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold transition-all shadow-lg hover:scale-105 active:scale-95"
                    style={{ 
                      background: 'linear-gradient(135deg, #2979FF 0%, #6FFFD2 100%)',
                      boxShadow: '0 4px 12px rgba(41, 121, 255, 0.4)'
                    }}
                  >
                    ★ Get Pro
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex-1 px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-semibold transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    color: '#dc2626',
                    backgroundColor: 'var(--card-bg)',
                    border: '2px solid #dc2626',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)'
                  }}
                >
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </button>
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
                <span 
                  className="text-white px-3 py-1 rounded-full text-xs font-bold relative overflow-hidden flex-shrink-0"
                  style={{ 
                    background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                    boxShadow: '0 0 20px rgba(41, 121, 255, 0.4), 0 0 40px rgba(111, 255, 210, 0.2)'
                  }}
                >
                  <span className="relative z-10 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    PRO
                  </span>
                </span>
              )}
              <button
                onClick={navigateHome}
                disabled={isNavigating}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 whitespace-nowrap hover:scale-105 active:scale-95"
                style={currentStep === "form" ? { 
                  color: 'white',
                  background: 'linear-gradient(135deg, #2979FF 0%, #4A9FFF 100%)',
                  boxShadow: '0 4px 12px rgba(41, 121, 255, 0.4)'
                } : { 
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--card-bg)',
                  border: '2px solid var(--card-border)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                Home
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Username button clicked', { user });
                  navigateToPortal();
                }}
                type="button"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                style={{ 
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--card-bg)',
                  border: '2px solid var(--card-border)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  pointerEvents: 'auto' 
                }}
                title="Go to User Portal"
              >
                Account
              </button>
              {!isPro && (
                <button
                  onClick={scrollToPremium}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0"
                  style={{ 
                    color: 'white',
                    background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                    boxShadow: '0 4px 12px rgba(41, 121, 255, 0.4)'
                  }}
                >
                  ★ Get Pro
                </button>
              )}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  color: '#dc2626',
                  backgroundColor: 'var(--card-bg)',
                  border: '2px solid #dc2626',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)'
                }}
              >
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        )}

        {/* Sign Up CTA Banner for Non-Signed-Up Users */}
        {!user && (
          <div className="mb-8">
            <div className="rounded-xl p-5 border-2 shadow-sm" style={{
              background: 'linear-gradient(135deg, rgba(41, 121, 255, 0.04) 0%, rgba(111, 255, 210, 0.04) 100%)',
              borderColor: 'rgba(41, 121, 255, 0.15)'
            }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <button
                    onClick={() => setCurrentStep('form')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 border-2 whitespace-nowrap"
                    style={{ 
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--card-bg)'
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Home
                  </button>
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
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => openAuthModal('signin')}
                    className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 whitespace-nowrap border-2"
                    style={{ 
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--card-bg)'
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 text-white whitespace-nowrap"
                    style={{ background: 'linear-gradient(to right, #2979FF, #6FFFD2)' }}
                  >
                    Sign Up Now
                  </button>
                  <button 
                    onClick={() => setCurrentStep('premium')}
                    className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 whitespace-nowrap flex items-center gap-2"
                    style={{ 
                      background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                      color: 'white',
                      boxShadow: '0 4px 15px rgba(41, 121, 255, 0.3)'
                    }}
                  >
                    <span>★</span>
                    Get Pro
                  </button>
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

        <div className={`text-center mb-16 ${currentStep !== "form" ? "hidden md:block" : ""}`}>
          <div 
            onClick={navigateHome}
            className="cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 mb-6 flex justify-center"
            style={{ 
              opacity: isNavigating ? 0.5 : 1
            }}
          >
            <img 
              src="/postready-logo.svg" 
              alt="PostReady Logo" 
              className="h-24 w-auto logo-glow"
            />
          </div>
          <p className="text-2xl font-medium tracking-wide" style={{ color: 'var(--primary)' }}>
            Your all-in-one toolkit for social media growth.
          </p>
        </div>

        {/* Modules Container - uses flex to enable reordering */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Collab Engine - Top of Homepage */}
        {currentStep === "form" && (
          <div 
            ref={collabSectionRef}
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('collab-engine')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'collab-engine')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'collab-engine')}
            onClick={() => !isReorderMode && collapsedModules.has('collab-engine') && toggleModuleCollapse('collab-engine')}
            className="rounded-2xl shadow-lg border transition-all duration-500 relative"
            style={{
              marginBottom: collapsedModules.has('collab-engine') ? '1rem' : '2.5rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: dragOverModule === 'collab-engine' 
                ? '#2979FF'
                : theme === 'dark'
                  ? 'rgba(255, 79, 120, 0.3)'
                  : 'rgba(255, 79, 120, 0.25)',
              boxShadow: dragOverModule === 'collab-engine'
                ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(255, 79, 120, 0.2), 0 0 0 1px rgba(255, 79, 120, 0.15)'
                  : '0 4px 20px rgba(255, 79, 120, 0.15), 0 0 0 1px rgba(255, 79, 120, 0.1)',
              order: moduleOrder.indexOf('collab-engine'),
              cursor: (isReorderMode && user) ? 'move' : (collapsedModules.has('collab-engine') ? 'pointer' : 'default'),
              opacity: draggedModule === 'collab-engine' ? 0.5 : 1,
              transform: dragOverModule === 'collab-engine' ? 'scale(1.02)' : 'scale(1)',
              padding: collapsedModules.has('collab-engine') ? '1rem' : '1rem 1.5rem',
            }}
          >
            {/* Collapsed Bar View */}
            {collapsedModules.has('collab-engine') ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" viewBox="0 0 448 512" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 2px rgba(0, 242, 234, 0.3))' }}>
                    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" fill="#00f2ea" transform="translate(-3, -3)"/>
                    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" fill="#ff0050" transform="translate(3, 3)"/>
                    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" fill="#000000"/>
                  </svg>
                  <h3 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--secondary)' }}>
                    TikTok Collab Engine 🤝
                  </h3>
                </div>
                <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                  {isReorderMode ? 'Drag to reorder' : 'Click to expand'}
                </span>
              </div>
            ) : (
              <>
                {/* Reorder Controls */}
                {isReorderMode && user && (
                  <div className="absolute top-4 right-16 flex gap-2 z-10">
                    <button
                      onClick={() => moveModule('collab-engine', 'up')}
                      disabled={moduleOrder.indexOf('collab-engine') === 0}
                      className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Move Up"
                    >
                      ⬆️
                    </button>
                    <button
                      onClick={() => moveModule('collab-engine', 'down')}
                      disabled={moduleOrder.indexOf('collab-engine') === moduleOrder.length - 1}
                      className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Move Down"
                    >
                      ⬇️
                    </button>
                  </div>
                )}

                {/* Minimize Button */}
                {!isReorderMode && (
                  <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleModuleCollapse('collab-engine');
                  }}
                  className="absolute top-1 right-2 sm:top-2 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl transition-all hover:scale-110 active:scale-95"
                  style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.15)',
                    border: '2px solid rgba(41, 121, 255, 0.4)',
                    color: '#2979FF',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(41, 121, 255, 0.3)'
                  }}
                  title="Minimize"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                  </svg>
                </button>
                )}

                <div className="p-0 sm:p-2 md:p-4 space-y-6">
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-3 mb-2">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 448 512" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 2px rgba(0, 242, 234, 0.3))' }}>
                  <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" fill="#00f2ea" transform="translate(-3, -3)"/>
                  <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" fill="#ff0050" transform="translate(3, 3)"/>
                  <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" fill="#000000"/>
                </svg>
                <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--secondary)' }}>
                  TikTok Collab Engine
                </h2>
                <span className="text-3xl sm:text-4xl">🤝</span>
              </div>
              <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                Find real TikTok creators in your niche with similar follower counts to collaborate with
              </p>
            </div>

            {/* Loading state while checking profile */}
            {isLoadingProfile && (
              <div 
                className="mb-6 p-4 rounded-xl border transition-all duration-500 ease-in-out"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--card-border)',
                  animation: 'fadeIn 0.5s ease-in-out'
                }}
              >
                <div className="text-center flex items-center justify-center gap-3">
                  <div 
                    className="h-5 w-5 border-2 rounded-full"
                    style={{
                      borderColor: '#FF4F78',
                      borderTopColor: 'transparent',
                      animation: 'spin 1.5s linear infinite'
                    }}
                  ></div>
                  <span style={{ color: 'var(--text-secondary)' }}>Checking network status...</span>
                </div>
              </div>
            )}

            {/* Join Network CTA - for signed in users without profile */}
            {!isLoadingProfile && !directoryProfile && user && (
              <div 
                className="mb-6 p-4 sm:p-6 rounded-xl border-2 border-dashed transition-all duration-500 ease-in-out" 
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 79, 120, 0.08)' : 'rgba(255, 79, 120, 0.05)',
                  borderColor: 'rgba(255, 79, 120, 0.4)',
                  animation: 'fadeIn 0.5s ease-in-out'
                }}
              >
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                    ✨ Join the PostReady Collab Network
                  </h3>
                  <p className="text-xs sm:text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Click join, enter your details, and instantly discover creators with similar followings in your niche ready to collaborate!
                  </p>
                  <button
                    onClick={() => {
                      // Pre-fill email if user is authenticated
                      if (user && user.email) {
                        setProfileForm(prev => ({ ...prev, email_for_collabs: user.email || '' }));
                      }
                      setShowJoinDirectory(true);
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, #FF4F78, #FF6B9D, #FF8FB3)',
                      color: 'white'
                    }}
                  >
                    Join the Network
                  </button>
                </div>
              </div>
            )}

            {/* Join Network CTA - for non-signed in users */}
            {!isLoadingProfile && !user && !directoryProfile && (
              <div 
                className="mb-6 p-4 sm:p-6 rounded-xl border-2 border-dashed transition-all duration-500 ease-in-out" 
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 79, 120, 0.08)' : 'rgba(255, 79, 120, 0.05)',
                  borderColor: 'rgba(255, 79, 120, 0.4)',
                  animation: 'fadeIn 0.5s ease-in-out'
                }}
              >
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                    ✨ Join the PostReady Collab Network
                  </h3>
                  <p className="text-xs sm:text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Click join, enter your details, and instantly discover creators with similar followings in your niche ready to collaborate!
                  </p>
                  <button
                    onClick={() => setShowJoinDirectory(true)}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, #FF4F78, #FF6B9D, #FF8FB3)',
                      color: 'white'
                    }}
                  >
                    Join the Network
                  </button>
                </div>
              </div>
            )}

            {/* Join Directory Form Modal */}
            {showJoinDirectory && (
              <>
                <style jsx>{`
                  body {
                    overflow: hidden !important;
                  }
                `}</style>
                <div 
                  className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-fade-in"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    margin: 0,
                    padding: '1rem'
                  }}
                  onClick={() => setShowJoinDirectory(false)}
                >
                  <div 
                    className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-scale-in"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      position: 'relative',
                      zIndex: 100000
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="sticky top-0 z-10 p-6 pb-4 border-b" style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--card-border)'
                    }}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--secondary)' }}>
                        📝 Create Your Collab Profile
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowJoinDirectory(false)}
                        className="text-2xl w-10 h-10 flex items-center justify-center rounded-full transition-all hover:opacity-70"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Your TikTok Username <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span 
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-bold pointer-events-none z-10"
                        style={{ color: 'rgba(255, 107, 107, 0.8)' }}
                      >
                        @
                      </span>
                      <input
                        type="text"
                        value={profileForm.tiktok_username}
                        onChange={(e) => setProfileForm({ ...profileForm, tiktok_username: e.target.value.replace('@', '') })}
                        placeholder="yourusername"
                        required
                        className="w-full rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 border"
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--card-border)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.display_name}
                      onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                      placeholder="Your Name"
                      className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 border"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Niche <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={profileForm.niche}
                        onChange={(e) => setProfileForm({ ...profileForm, niche: e.target.value })}
                        required
                        className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 border"
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--card-border)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <option value="">Select your niche</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Comedy">Comedy</option>
                        <option value="Beauty & Fashion">Beauty & Fashion</option>
                        <option value="Fitness & Health">Fitness & Health</option>
                        <option value="Food">Food</option>
                        <option value="Gaming">Gaming</option>
                        <option value="Education">Education</option>
                        <option value="Business">Business</option>
                        <option value="Experimental">Experimental</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Follower Count <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={profileForm.follower_count}
                        onChange={(e) => setProfileForm({ ...profileForm, follower_count: e.target.value })}
                        required
                        className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 border"
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--card-border)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <option value="">Select follower range</option>
                        <option value="1-500">1 - 500</option>
                        <option value="500-1500">500 - 1,500</option>
                        <option value="2000-5000">2,000 - 5,000</option>
                        <option value="5000-9000">5,000 - 9,000</option>
                        <option value="9000-15000">9,000 - 15,000</option>
                        <option value="15000-25000">15,000 - 25,000</option>
                        <option value="25000-75000">25,000 - 75,000</option>
                        <option value="75000-150000">75,000 - 150,000</option>
                        <option value="150000-300000">150,000 - 300,000</option>
                        <option value="300000-1000000">300,000 - 1M</option>
                        <option value="1000000+">1M+</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Content Focus
                    </label>
                    <select
                      value={profileForm.content_focus}
                      onChange={(e) => setProfileForm({ ...profileForm, content_focus: e.target.value })}
                      className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 border"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="">Select content focus</option>
                      <option value="Tutorials">Tutorials</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Comedy">Comedy</option>
                      <option value="Reviews">Reviews</option>
                      <option value="Vlogs">Vlogs</option>
                      <option value="Educational">Educational</option>
                      <option value="Storytelling">Storytelling</option>
                      <option value="Experimental">Experimental</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Bio
                    </label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      placeholder="Tell other creators about yourself..."
                      rows={3}
                      className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 border"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  {!user && (
                    <>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Email for Collabs <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={profileForm.email_for_collabs}
                          onChange={(e) => setProfileForm({ ...profileForm, email_for_collabs: e.target.value })}
                          placeholder="your@email.com"
                          required
                          className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 border"
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--card-border)',
                            color: 'var(--text-primary)'
                          }}
                        />
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          This email will be stored but NOT displayed to other users for privacy
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={profileForm.password}
                          onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                          placeholder="Create a password (min 6 characters)"
                          required
                          minLength={6}
                          className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 border"
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--card-border)',
                            color: 'var(--text-primary)'
                          }}
                        />
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          💡 This will create your PostReady account and give you access to all features
                        </p>
                      </div>
                    </>
                  )}

                  {user && (
                    <div className="p-4 rounded-lg" style={{
                      backgroundColor: theme === 'dark' ? 'rgba(111, 255, 210, 0.1)' : 'rgba(111, 255, 210, 0.15)',
                      border: '1px solid rgba(111, 255, 210, 0.3)'
                    }}>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        ✅ You're already signed in to PostReady
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Just fill out your TikTok info to join the Collab Network!
                      </p>
                    </div>
                  )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={isSubmittingProfile}
                          className="flex-1 py-3 rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                            color: 'white'
                          }}
                        >
                          {isSubmittingProfile ? 'Saving...' : directoryProfile ? 'Update Profile' : 'Join Network'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowJoinDirectory(false)}
                          className="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-80 border"
                          style={{
                            borderColor: 'var(--card-border)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              </>
            )}

            {/* Search Form */}
            {directoryProfile ? (
              // Simplified version for users with a profile
              <div className="space-y-4">
                <div className="p-4 rounded-lg border" style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255, 79, 120, 0.08)' : 'rgba(255, 79, 120, 0.05)',
                  borderColor: 'rgba(255, 79, 120, 0.3)'
                }}>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    🎯 Searching based on your profile:
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="px-3 py-1 rounded-full" style={{
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--card-border)'
                    }}>
                      @{directoryProfile.tiktok_username}
                    </span>
                    <span className="px-3 py-1 rounded-full" style={{
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--card-border)'
                    }}>
                      {directoryProfile.niche}
                    </span>
                    <span className="px-3 py-1 rounded-full" style={{
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--card-border)'
                    }}>
                      {directoryProfile.follower_range} followers
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // Search directly with profile data (no state update needed)
                    handleCollabSearch(e as any, {
                      username: directoryProfile.tiktok_username,
                      niche: directoryProfile.niche,
                      followerCount: directoryProfile.follower_range
                    });
                  }}
                  disabled={isLoadingCollabs}
                  className="w-full py-3 rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #FF4F78, #FF6B9D, #FF8FB3)',
                    color: 'white'
                  }}
                >
                  {isLoadingCollabs ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      Finding Collaborators...
                    </>
                  ) : (
                    <>
                      🔍 Find Collaborators
                    </>
                  )}
                </button>
              </div>
            ) : (
              // Full form for users without a profile
              <form onSubmit={handleCollabSearch} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Your TikTok Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span 
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-bold pointer-events-none z-10"
                      style={{ color: 'rgba(255, 107, 107, 0.8)' }}
                    >
                      @
                    </span>
                    <input
                      type="text"
                      value={collabUsername}
                      onChange={(e) => setCollabUsername(e.target.value.replace('@', ''))}
                      placeholder="yourusername"
                      required
                      className="w-full rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 border"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Your Niche <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={collabNiche}
                    onChange={(e) => setCollabNiche(e.target.value)}
                    placeholder="e.g., Fitness, Gaming, Beauty"
                    required
                    className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 border"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Your Follower Count <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={collabFollowerCount}
                    onChange={(e) => setCollabFollowerCount(e.target.value)}
                    required
                    className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 border"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">Select follower range</option>
                    <option value="1-500">1 - 500</option>
                    <option value="500-1500">500 - 1,500</option>
                    <option value="2000-5000">2,000 - 5,000</option>
                    <option value="5000-9000">5,000 - 9,000</option>
                    <option value="9000-15000">9,000 - 15,000</option>
                    <option value="15000-25000">15,000 - 25,000</option>
                    <option value="25000-75000">25,000 - 75,000</option>
                    <option value="75000-150000">75,000 - 150,000</option>
                    <option value="150000-300000">150,000 - 300,000</option>
                    <option value="300000-1000000">300,000 - 1M</option>
                    <option value="1000000+">1M+</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoadingCollabs}
                  className="w-full py-3 rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #FF4F78, #FF6B9D, #FF8FB3)',
                    color: 'white'
                  }}
                >
                  {isLoadingCollabs ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      Finding Collaborators...
                    </>
                  ) : (
                    <>
                      🔍 Find Collaborators
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Results */}
            {collaborators.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-2xl font-bold" style={{ color: 'var(--secondary)' }}>
                  ✨ Perfect Matches ({collaborators.length})
                </h3>
                {collaborators.map((collab, index) => (
                  <div 
                    key={index}
                    className="p-6 rounded-xl border transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.05)' : 'rgba(41, 121, 255, 0.03)',
                      borderColor: collab.isRealUser ? 'rgba(34, 197, 94, 0.4)' : 'rgba(41, 121, 255, 0.3)'
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <a
                            href={`https://www.tiktok.com/@${collab.username.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xl font-bold hover:underline"
                            style={{ color: 'var(--secondary)' }}
                          >
                            @{collab.username.replace('@', '')}
                          </a>
                          {collab.isRealUser && (
                            <span 
                              className="px-3 py-1 rounded-full text-xs font-bold"
                              style={{ 
                                backgroundColor: 'rgba(34, 197, 94, 0.2)', 
                                color: '#22c55e' 
                              }}
                            >
                              ✅ REAL USER
                            </span>
                          )}
                        </div>
                        {collab.displayName && (
                          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                            {collab.displayName}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ 
                              backgroundColor: 'rgba(41, 121, 255, 0.15)', 
                              color: 'var(--secondary)' 
                            }}
                          >
                            {collab.followerCount.toLocaleString()} followers
                          </span>
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ 
                              backgroundColor: 'rgba(111, 255, 210, 0.15)', 
                              color: '#6FFFD2' 
                            }}
                          >
                            {collab.niche}
                          </span>
                        </div>

                        {/* User Description Label */}
                        <p className="text-xs font-semibold mb-2 mt-2" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          User Description
                        </p>

                        {collab.contentFocus && (
                          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                            <strong>Focus:</strong> {collab.contentFocus}
                          </p>
                        )}
                        {collab.bio && (
                          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                            {collab.bio}
                          </p>
                        )}
                        {collab.isRealUser && (collab.instagram || collab.youtube) && (
                          <div className="flex gap-3 mb-3">
                            {collab.instagram && (
                              <a
                                href={`https://instagram.com/${collab.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm hover:underline"
                                style={{ color: '#E1306C' }}
                              >
                                📷 Instagram
                              </a>
                            )}
                            {collab.youtube && (
                              <a
                                href={`https://youtube.com/@${collab.youtube}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm hover:underline"
                                style={{ color: '#FF0000' }}
                              >
                                ▶️ YouTube
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 79, 120, 0.08)' }}>
                      <p className="text-sm font-semibold mb-1" style={{ color: '#FF4F78' }}>
                        💡 Why They're Perfect:
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        This creator is in your niche and has a follower count similar to yours, making them a strong match for a collaboration that could significantly boost engagement for both of you.
                      </p>
                    </div>

                    {collab.collabIdea && (
                      <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 139, 179, 0.08)' }}>
                        <p className="text-sm font-semibold mb-1" style={{ color: '#FF6B9D' }}>
                          🎬 Collaboration Idea:
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          {collab.collabIdea}
                        </p>
                      </div>
                    )}

                    {collab.dm && (
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg border" style={{ 
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--card-border)'
                        }}>
                          <p className="text-sm font-semibold mb-2" style={{ color: 'var(--secondary)' }}>
                            💬 Personalized DM:
                          </p>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                            {collab.dm}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopyDmAndVisit(collab.dm, collab.username, index)}
                          disabled={copyingDmIndex === index}
                          className="w-full py-3 rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          style={{
                            background: copyingDmIndex === index 
                              ? 'linear-gradient(135deg, #D63A5F, #E85577)' 
                              : 'linear-gradient(135deg, #FF4F78, #FF6B9D, #FF8FB3)',
                            color: 'white'
                          }}
                        >
                          {copyingDmIndex === index ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              Redirecting...
                            </>
                          ) : (
                            <>
                              📋 Copy DM & Visit Profile
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isLoadingCollabs && collaborators.length === 0 && collabNiche && (
              <div className="mt-6 p-6 rounded-xl text-center" style={{
                backgroundColor: theme === 'dark' ? 'rgba(255, 165, 0, 0.08)' : 'rgba(255, 165, 0, 0.05)',
                borderWidth: '2px',
                borderStyle: 'dashed',
                borderColor: 'rgba(255, 165, 0, 0.3)'
              }}>
                <p className="text-lg font-semibold mb-2" style={{ color: '#FFA500' }}>
                  No matches found yet
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Try adjusting your filters, or be the first to join the network in your niche!
                </p>
              </div>
            )}

            {directoryProfile && (
              <div 
                className="mt-6 p-4 rounded-lg border flex items-center justify-between transition-all duration-500 ease-in-out" 
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.05)',
                  borderColor: 'rgba(34, 197, 94, 0.3)',
                  animation: 'fadeIn 0.5s ease-in-out'
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--secondary)' }}>
                      You're in the network!
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Other creators can now find you
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Pre-fill email if user is authenticated
                    if (user && user.email) {
                      setProfileForm(prev => ({ ...prev, email_for_collabs: user.email || '' }));
                    }
                    setShowJoinDirectory(true);
                  }}
                  className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80 border"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--secondary)'
                  }}
                >
                  Edit Profile
                </button>
              </div>
            )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Trend Radar - Live trend tracking */}
        {currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('trend-radar')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'trend-radar')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'trend-radar')}
            onClick={() => !isReorderMode && collapsedModules.has('trend-radar') && toggleModuleCollapse('trend-radar')}
            className="rounded-2xl shadow-lg border transition-all duration-500 relative"
            style={{
              marginBottom: collapsedModules.has('trend-radar') ? '1rem' : '2.5rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: dragOverModule === 'trend-radar'
                ? '#2979FF'
                : 'var(--card-border)',
              boxShadow: dragOverModule === 'trend-radar'
                ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                  : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('trend-radar'),
              cursor: (isReorderMode && user) ? 'move' : (collapsedModules.has('trend-radar') ? 'pointer' : 'default'),
              opacity: draggedModule === 'trend-radar' ? 0.5 : 0.6,
              transform: dragOverModule === 'trend-radar' ? 'scale(1.02)' : 'scale(1)',
              padding: collapsedModules.has('trend-radar') ? '1rem' : '2rem',
              filter: 'grayscale(0.3)',
            }}
          >
            {/* Coming Soon Badge */}
            <div 
              className="absolute top-4 right-4 px-4 py-2 rounded-lg font-bold text-sm z-20"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.5)',
              }}
            >
              🚀 Coming Soon
            </div>
            {/* Collapsed Bar View */}
            <div 
              className="flex items-center justify-between"
              style={{
                transition: 'opacity 0.8s ease-in-out',
                opacity: collapsedModules.has('trend-radar') ? 1 : 0,
                pointerEvents: collapsedModules.has('trend-radar') ? 'auto' : 'none',
                position: collapsedModules.has('trend-radar') ? 'relative' : 'absolute',
                visibility: collapsedModules.has('trend-radar') ? 'visible' : 'hidden',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <h3 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--secondary)' }}>
                  Trend Radar
                </h3>
              </div>
              <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                {isReorderMode ? 'Drag to reorder' : 'Click to expand'}
              </span>
            </div>

            {/* Expanded Content */}
            <div
              style={{
                transition: 'opacity 0.8s ease-in-out',
                opacity: collapsedModules.has('trend-radar') ? 0 : 1,
                pointerEvents: collapsedModules.has('trend-radar') ? 'none' : 'auto',
                position: collapsedModules.has('trend-radar') ? 'absolute' : 'relative',
                visibility: collapsedModules.has('trend-radar') ? 'hidden' : 'visible',
              }}
            >
                {/* Reorder Controls */}
                {isReorderMode && user && (
                  <div className="absolute top-4 right-16 flex gap-2 z-10">
                    <button
                      onClick={() => moveModule('trend-radar', 'up')}
                      disabled={moduleOrder.indexOf('trend-radar') === 0}
                      className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Move Up"
                    >
                      ⬆️
                    </button>
                    <button
                      onClick={() => moveModule('trend-radar', 'down')}
                      disabled={moduleOrder.indexOf('trend-radar') === moduleOrder.length - 1}
                      className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Move Down"
                    >
                      ⬇️
                    </button>
                  </div>
                )}

                {/* Minimize Button */}
                {!isReorderMode && (
                  <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleModuleCollapse('trend-radar');
                  }}
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl transition-all hover:scale-110 active:scale-95"
                  style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.15)',
                    border: '2px solid rgba(41, 121, 255, 0.4)',
                    color: '#2979FF',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(41, 121, 255, 0.3)'
                  }}
                  title="Minimize"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                )}

                <div className="space-y-6">
                  <div className="text-center mb-6">
                <h2 className="text-4xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                  📊 Trend Radar
                </h2>
                <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                  Real-time trend analytics across social platforms
                </p>
              </div>

              {/* Analytics Graph */}
              <div className="space-y-6">
                {/* Trend Metrics Overview */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Active Trends', value: '2,847', change: '+12.5%', color: '#2979FF' },
                    { label: 'Avg Growth', value: '18.3%', change: '+3.2%', color: '#6366F1' },
                    { label: 'Peak Hour', value: '9 PM EST', change: 'Live', color: '#8B5CF6' }
                  ].map((metric, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl border"
                      style={{
                        backgroundColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.05)' : 'rgba(41, 121, 255, 0.03)',
                        borderColor: 'rgba(41, 121, 255, 0.2)'
                      }}
                    >
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        {metric.label}
                      </p>
                      <p className="text-2xl font-bold mb-1" style={{ color: metric.color }}>
                        {metric.value}
                      </p>
                      <p className="text-xs font-semibold" style={{ color: '#22c55e' }}>
                        {metric.change}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Trend Graph */}
                <div 
                  className="p-6 rounded-xl border"
                  style={{
                    backgroundColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.03)' : 'rgba(41, 121, 255, 0.02)',
                    borderColor: 'rgba(41, 121, 255, 0.2)'
                  }}
                >
                  <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--secondary)' }}>
                    📈 Trending Topics - Last 7 Days
                  </h3>
                  <div className="space-y-3">
                    {[
                      { name: 'AI Content Creation', value: 92, color: '#2979FF' },
                      { name: 'Sustainable Living', value: 78, color: '#6366F1' },
                      { name: 'Fitness Challenges', value: 85, color: '#8B5CF6' },
                      { name: 'Tech Reviews', value: 67, color: '#3B82F6' },
                      { name: 'Cooking Tutorials', value: 73, color: '#6366F1' },
                    ].map((trend, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {trend.name}
                          </span>
                          <span className="text-sm font-bold" style={{ color: trend.color }}>
                            {trend.value}%
                          </span>
                        </div>
                        <div 
                          className="h-2 rounded-full overflow-hidden"
                          style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
                        >
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${trend.value}%`,
                              background: `linear-gradient(to right, ${trend.color}, ${trend.color}dd)`,
                              boxShadow: `0 0 10px ${trend.color}88`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Platform Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { platform: 'TikTok', percentage: 38, icon: '🎵', color: '#00f2ea' },
                    { platform: 'Instagram', percentage: 29, icon: '📸', color: '#E1306C' },
                    { platform: 'YouTube', percentage: 22, icon: '▶️', color: '#FF0000' },
                    { platform: 'Twitter/X', percentage: 11, icon: '🐦', color: '#1DA1F2' }
                  ].map((platform, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl border"
                      style={{
                        backgroundColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.05)' : 'rgba(41, 121, 255, 0.03)',
                        borderColor: 'rgba(41, 121, 255, 0.2)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{platform.icon}</span>
                        <span className="text-lg font-bold" style={{ color: platform.color }}>
                          {platform.percentage}%
                        </span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {platform.platform}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Viral Video Idea Generator */}
        {currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('idea-generator')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'idea-generator')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'idea-generator')}
            onClick={() => !isReorderMode && collapsedModules.has('idea-generator') && toggleModuleCollapse('idea-generator')}
            className="rounded-2xl shadow-lg border transition-all duration-500 relative"
            style={{
              marginBottom: collapsedModules.has('idea-generator') ? '1rem' : '2.5rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: dragOverModule === 'idea-generator'
                ? '#2979FF'
                : 'var(--card-border)',
              boxShadow: dragOverModule === 'idea-generator'
                ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                  : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('idea-generator'),
              cursor: (isReorderMode && user) ? 'move' : (collapsedModules.has('idea-generator') ? 'pointer' : 'default'),
              opacity: draggedModule === 'idea-generator' ? 0.5 : 1,
              transform: dragOverModule === 'idea-generator' ? 'scale(1.02)' : 'scale(1)',
              padding: collapsedModules.has('idea-generator') ? '1rem' : '2rem',
            }}
          >
            {/* Collapsed Bar View */}
            <div 
              className="flex items-center justify-between gap-2"
              style={{
                transition: 'opacity 0.8s ease-in-out',
                opacity: collapsedModules.has('idea-generator') ? 1 : 0,
                pointerEvents: collapsedModules.has('idea-generator') ? 'auto' : 'none',
                position: collapsedModules.has('idea-generator') ? 'relative' : 'absolute',
                visibility: collapsedModules.has('idea-generator') ? 'visible' : 'hidden',
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <span className="text-3xl flex-shrink-0">🎥</span>
                <h3 className="text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--secondary)' }}>
                  Viral Video Idea Generator
                </h3>
                <span className="px-2 py-1 text-xs font-bold rounded flex-shrink-0" style={{
                  background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                  color: 'white',
                }}>
                  PRO
                </span>
              </div>
              <span className="text-sm opacity-60 flex-shrink-0 hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                {isReorderMode ? 'Drag to reorder' : 'Click to expand'}
              </span>
            </div>

            {/* Expanded Content */}
            <div
              style={{
                transition: 'opacity 0.8s ease-in-out',
                opacity: collapsedModules.has('idea-generator') ? 0 : 1,
                pointerEvents: collapsedModules.has('idea-generator') ? 'none' : 'auto',
                position: collapsedModules.has('idea-generator') ? 'absolute' : 'relative',
                visibility: collapsedModules.has('idea-generator') ? 'hidden' : 'visible',
              }}
            >
                {/* Reorder Controls */}
                {isReorderMode && user && (
                  <div className="absolute top-4 right-16 flex gap-2 z-10">
                    <button
                      onClick={() => moveModule('idea-generator', 'up')}
                      disabled={moduleOrder.indexOf('idea-generator') === 0}
                      className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Move Up"
                    >
                      ⬆️
                    </button>
                    <button
                      onClick={() => moveModule('idea-generator', 'down')}
                      disabled={moduleOrder.indexOf('idea-generator') === moduleOrder.length - 1}
                      className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Move Down"
                    >
                      ⬇️
                    </button>
                  </div>
                )}

                {/* Minimize Button */}
                {!isReorderMode && (
                  <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleModuleCollapse('idea-generator');
                  }}
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl transition-all hover:scale-110 active:scale-95"
                  style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.15)',
                    border: '2px solid rgba(41, 121, 255, 0.4)',
                    color: '#2979FF',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(41, 121, 255, 0.3)'
                  }}
                  title="Minimize"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                )}

                <div className="space-y-6">
                  <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <h2 className="text-4xl font-bold" style={{ color: 'var(--secondary)' }}>
                  🎥 Viral Video Idea Generator
                </h2>
                <span className="px-3 py-1 text-sm font-bold rounded" style={{
                  background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                  color: 'white',
                }}>
                  PRO
                </span>
              </div>
              <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                Get strategically engineered video ideas with hooks, viral mechanics, platform recommendations, and production tips
              </p>
            </div>

            {/* Pro Feature Paywall */}
            {!isPro ? (
              <div className="text-center py-8 px-4">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                    style={{
                      backgroundColor: 'rgba(41, 121, 255, 0.1)',
                      border: '3px solid rgba(41, 121, 255, 0.3)',
                    }}
                  >
                    <span className="text-4xl">🔒</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Pro Feature
                  </h3>
                  <p className="text-base mb-6" style={{ color: 'var(--text-secondary)' }}>
                    Upgrade to Pro to unlock unlimited access to the Viral Video Idea Generator and all premium features.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#2979FF' }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Unlimited viral video ideas</span>
                    </div>
                    <div className="flex items-center justify-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#2979FF' }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>All premium features</span>
                    </div>
                    <div className="flex items-center justify-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#2979FF' }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Priority support</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentStep('premium')}
                  className="px-8 py-4 rounded-xl font-bold text-lg text-white transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                    boxShadow: '0 8px 25px rgba(41, 121, 255, 0.3)',
                  }}
                >
                  Upgrade to Pro - $4.99/mo 🚀
                </button>
              </div>
            ) : (
              <form onSubmit={async (e) => {
              e.preventDefault();
              if (!viralTopic.trim()) return;
              
              setIsGeneratingViralIdeas(true);
              setViralIdeas([]);
              setViralIdeasProgress(0);
              
              // Simulate progress - slower and more realistic
              const progressInterval = setInterval(() => {
                setViralIdeasProgress(prev => {
                  if (prev >= 85) return prev; // Stop at 85% until complete
                  return prev + Math.random() * 8; // Slower increments
                });
              }, 800); // Slower updates
              
              try {
                const response = await fetch('/api/generate-viral-ideas', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ topic: viralTopic }),
                });
                
                if (!response.ok) {
                  throw new Error('Failed to generate ideas');
                }
                
                const data = await response.json();
                setViralIdeasProgress(100);
                setViralIdeas(data.ideas || []);
              } catch (error) {
                console.error('Error generating viral ideas:', error);
                showNotification("Failed to generate ideas. Please try again.", "error");
              } finally {
                clearInterval(progressInterval);
                setTimeout(() => {
                  setIsGeneratingViralIdeas(false);
                  setViralIdeasProgress(0);
                }, 500);
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  What topic do you want video ideas for? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={viralTopic}
                  onChange={(e) => setViralTopic(e.target.value)}
                  placeholder="e.g., AI, Fitness, Cooking, Gaming"
                  required
                  className="w-full rounded-md px-3 py-2 focus:outline-none focus:ring-2 border"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {isGeneratingViralIdeas && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span>Generating ideas...</span>
                    <span>{Math.round(viralIdeasProgress)}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--card-border)' }}>
                    <div 
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${viralIdeasProgress}%`,
                        background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                        boxShadow: '0 0 10px rgba(41, 121, 255, 0.5)'
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isGeneratingViralIdeas}
                className="w-full py-3 rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                  color: 'white'
                }}
              >
                {isGeneratingViralIdeas ? (
                  <>
                    <span className="animate-spin">🔄</span>
                    Generating Ideas...
                  </>
                ) : (
                  <>
                    ✨ Generate Video Ideas
                  </>
                )}
              </button>
            </form>
            )}

            {isPro && viralIdeas.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-2xl font-bold text-center" style={{ color: 'var(--secondary)' }}>
                  🎬 Viral Video Ideas
                </h3>
                {viralIdeas.map((idea: any, index: number) => (
                  <div 
                    key={index}
                    className="p-6 rounded-xl border transition-all hover:scale-[1.01]"
                    style={{
                      backgroundColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.05)' : 'rgba(41, 121, 255, 0.03)',
                      borderColor: 'rgba(41, 121, 255, 0.3)'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                        style={{
                          background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                          color: 'white'
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                          {idea.title}
                        </h4>
                        <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
                          {idea.description}
                        </p>
                        <div 
                          className="p-4 rounded-lg mb-4"
                          style={{ backgroundColor: theme === 'dark' ? 'rgba(111, 255, 210, 0.08)' : 'rgba(111, 255, 210, 0.05)' }}
                        >
                          <p className="text-sm font-semibold mb-1" style={{ color: '#6FFFD2' }}>
                            💡 Why This Could Go Viral:
                          </p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {idea.whyViral}
                          </p>
                        </div>

                        {/* Guide AI Button */}
                        {!showGuideInput ? (
                          <div className="flex justify-center">
                            <button
                              onClick={() => setShowGuideInput(true)}
                              className="py-2 px-4 rounded-lg font-semibold transition-all hover:scale-105 active:scale-95"
                              style={{
                                background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(41, 121, 255, 0.4)'
                              }}
                            >
                              Guide AI
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <textarea
                              value={guidePrompt}
                              onChange={(e) => setGuidePrompt(e.target.value)}
                              placeholder="Tell AI how to adjust this idea... (e.g., 'Make it funnier', 'Target younger audience', 'Add more suspense')"
                              rows={3}
                              className="w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 border text-sm"
                              style={{
                                backgroundColor: 'var(--card-bg)',
                                borderColor: 'var(--card-border)',
                                color: 'var(--text-primary)',
                                resize: 'none'
                              }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (!guidePrompt.trim()) return;
                                  
                                  setIsRefining(true);
                                  setViralIdeasProgress(0);
                                  
                                  const progressInterval = setInterval(() => {
                                    setViralIdeasProgress(prev => {
                                      if (prev >= 85) return prev;
                                      return prev + Math.random() * 8;
                                    });
                                  }, 800);
                                  
                                  try {
                                    const response = await fetch('/api/generate-viral-ideas', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ 
                                        topic: viralTopic,
                                        guidance: guidePrompt,
                                        previousIdea: idea
                                      }),
                                    });
                                    
                                    if (!response.ok) throw new Error('Failed to refine idea');
                                    
                                    const data = await response.json();
                                    setViralIdeasProgress(100);
                                    setViralIdeas(data.ideas || []);
                                    setGuidePrompt("");
                                    setShowGuideInput(false);
                                  } catch (error) {
                                    console.error('Error refining idea:', error);
                                    showNotification("Failed to refine idea. Please try again.", "error");
                                  } finally {
                                    clearInterval(progressInterval);
                                    setTimeout(() => {
                                      setIsRefining(false);
                                      setViralIdeasProgress(0);
                                    }, 500);
                                  }
                                }}
                                disabled={isRefining || !guidePrompt.trim()}
                                className="flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{
                                  background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                                  color: 'white'
                                }}
                              >
                                {isRefining ? (
                                  <>
                                    <span className="animate-spin">🔄</span>
                                    Refining...
                                  </>
                                ) : (
                                  <>
                                    <span>✨</span>
                                    Apply Changes
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setShowGuideInput(false);
                                  setGuidePrompt("");
                                }}
                                className="px-4 py-2.5 rounded-lg font-semibold transition-all hover:scale-[1.02]"
                                style={{
                                  backgroundColor: 'var(--card-bg)',
                                  border: '2px solid var(--card-border)',
                                  color: 'var(--text-secondary)'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                            
                            {isRefining && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
                                  <span>Refining idea...</span>
                                  <span>{Math.round(viralIdeasProgress)}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--card-border)' }}>
                                  <div 
                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                    style={{
                                      width: `${viralIdeasProgress}%`,
                                      background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                                      boxShadow: '0 0 10px rgba(41, 121, 255, 0.5)'
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
                </div>
            </div>
          </div>
        )}

        {/* Hashtag Deep Research Tool - Always visible on homepage */}
        {currentStep === "form" && (
          <div 
            ref={hashtagSectionRef}
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('hashtag-research')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'hashtag-research')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'hashtag-research')}
            onClick={() => !isReorderMode && collapsedModules.has('hashtag-research') && toggleModuleCollapse('hashtag-research')}
            className="rounded-2xl shadow-lg border transition-all duration-500 scroll-mt-4 relative"
            style={{
              marginBottom: collapsedModules.has('hashtag-research') ? '1rem' : '2.5rem',
              backgroundColor: 'var(--card-bg)',
              borderColor: dragOverModule === 'hashtag-research'
                ? '#2979FF'
                : 'var(--card-border)',
              boxShadow: dragOverModule === 'hashtag-research'
                ? '0 0 0 3px rgba(41, 121, 255, 0.4)'
                : theme === 'dark'
                  ? '0 8px 32px rgba(41, 121, 255, 0.15), 0 0 0 1px rgba(41, 121, 255, 0.1)'
                  : '0 4px 20px rgba(41, 121, 255, 0.12), 0 0 0 1px rgba(41, 121, 255, 0.08)',
              order: moduleOrder.indexOf('hashtag-research'),
              cursor: (isReorderMode && user) ? 'move' : (collapsedModules.has('hashtag-research') ? 'pointer' : 'default'),
              opacity: draggedModule === 'hashtag-research' ? 0.5 : 1,
              transform: dragOverModule === 'hashtag-research' ? 'scale(1.02)' : 'scale(1)',
              padding: collapsedModules.has('hashtag-research') ? '1rem' : '1.5rem',
            }}
          >
            {/* Collapsed Bar View */}
            <div 
              className="flex items-center justify-between"
              style={{
                transition: 'opacity 0.8s ease-in-out',
                opacity: collapsedModules.has('hashtag-research') ? 1 : 0,
                pointerEvents: collapsedModules.has('hashtag-research') ? 'auto' : 'none',
                position: collapsedModules.has('hashtag-research') ? 'relative' : 'absolute',
                visibility: collapsedModules.has('hashtag-research') ? 'visible' : 'hidden',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">#️⃣</span>
                <h3 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--secondary)' }}>
                  Hashtag Deep Research Tool
                </h3>
              </div>
              <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                {isReorderMode ? 'Drag to reorder' : 'Click to expand'}
              </span>
            </div>

            {/* Expanded Content */}
            <div
              style={{
                transition: 'opacity 0.8s ease-in-out',
                opacity: collapsedModules.has('hashtag-research') ? 0 : 1,
                pointerEvents: collapsedModules.has('hashtag-research') ? 'none' : 'auto',
                position: collapsedModules.has('hashtag-research') ? 'absolute' : 'relative',
                visibility: collapsedModules.has('hashtag-research') ? 'hidden' : 'visible',
              }}
            >
                {/* Reorder Controls */}
                {isReorderMode && user && (
                  <div className="absolute top-4 right-16 flex gap-2 z-10">
                    <button
                      onClick={() => moveModule('hashtag-research', 'up')}
                      disabled={moduleOrder.indexOf('hashtag-research') === 0}
                      className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Move Up"
                    >
                      ⬆️
                    </button>
                    <button
                      onClick={() => moveModule('hashtag-research', 'down')}
                      disabled={moduleOrder.indexOf('hashtag-research') === moduleOrder.length - 1}
                      className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Move Down"
                    >
                      ⬇️
                    </button>
                  </div>
                )}

                {/* Minimize Button */}
                {!isReorderMode && (
                  <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleModuleCollapse('hashtag-research');
                  }}
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl transition-all hover:scale-110 active:scale-95"
                  style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.15)',
                    border: '2px solid rgba(41, 121, 255, 0.4)',
                    color: '#2979FF',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(41, 121, 255, 0.3)'
                  }}
                  title="Minimize"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                )}

                <div className="space-y-4">
                  <div className="text-center mb-4">
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                #️⃣ Hashtag Deep Research Tool
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Discover the best hashtags for your niche and platform
              </p>
            </div>

            {/* Research Form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!hashtagResearchNiche.trim()) return;
              
              setIsResearchingHashtags(true);
              setSelectedHashtags([]); // Clear selection on new search
              setGenerationCount(0); // Reset generation count
              
              try {
                // Call AI-powered hashtag generation API
                const response = await fetch('/api/generate-hashtags', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    niche: hashtagResearchNiche,
                    platform: hashtagResearchPlatform,
                    batchNumber: 0
                  })
                });

                if (!response.ok) {
                  throw new Error('Failed to generate hashtags');
                }

                const data = await response.json();
                
                setHashtagResults({
                  niche: hashtagResearchNiche,
                  platform: hashtagResearchPlatform,
                  hashtags: data.hashtags
                });
                setGenerationCount(1);
              } catch (error) {
                console.error('Hashtag generation error:', error);
                showNotification('Failed to generate hashtags. Please try again.', 'error', 'Error');
              } finally {
                setIsResearchingHashtags(false);
              }
            }} className="space-y-4">
              <InputField
                label="Your Niche or Topic"
                value={hashtagResearchNiche}
                onChange={(value) => setHashtagResearchNiche(value)}
                placeholder="e.g., Fitness, Food, Travel, Fashion"
                required
              />

              <SelectField
                label="Platform"
                value={hashtagResearchPlatform}
                onChange={(value) => setHashtagResearchPlatform(value)}
                options={["Instagram", "TikTok", "YouTube Shorts", "Facebook", "X (Twitter)"]}
                required
              />

              <button 
                type="submit" 
                disabled={isResearchingHashtags || !hashtagResearchNiche.trim()}
                className="w-full px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl relative overflow-hidden"
                style={{
                  background: isResearchingHashtags || !hashtagResearchNiche.trim()
                    ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                    : 'linear-gradient(135deg, #2979FF 0%, #6FFFD2 100%)',
                  color: 'white',
                  border: 'none',
                  boxShadow: isResearchingHashtags || !hashtagResearchNiche.trim()
                    ? '0 4px 15px rgba(0, 0, 0, 0.1)'
                    : '0 8px 32px rgba(41, 121, 255, 0.3)'
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isResearchingHashtags ? (
                    <>
                      <span className="inline-block animate-spin text-xl">🔍</span>
                      <span>Researching Hashtags...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">🔍</span>
                      <span>Research Hashtags</span>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Results Section */}
            {hashtagResults && (
              <div className="mt-8 space-y-4 animate-fade-in">
                <div className="border-t pt-6" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                        📊 Recommended Hashtags for {hashtagResults.niche}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        Optimized for {hashtagResults.platform}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setHashtagResults(null);
                        setSelectedHashtags([]);
                        setGenerationCount(0);
                      }}
                      className="px-3 py-1.5 rounded-lg font-semibold text-xs transition-all hover:scale-105 border-2 flex items-center gap-1.5"
                      style={{
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.05)'
                      }}
                      title="Clear all hashtags and start fresh"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear All
                    </button>
                  </div>
                  <div 
                    className="mb-4 p-3 rounded-lg flex items-center justify-center gap-2"
                    style={{ 
                      backgroundColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.05)' : 'rgba(41, 121, 255, 0.04)',
                      borderLeft: theme === 'dark' ? '3px solid #2979FF' : '3px solid rgba(41, 121, 255, 0.5)'
                    }}
                  >
                    <span className="text-sm">💡</span>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Sorted by effectiveness score. Higher numbers = better reach + lower competition.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {hashtagResults.hashtags.map((hashtag: any, index: number) => {
                      const isSelected = selectedHashtags.includes(hashtag.tag);
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedHashtags(prev => prev.filter(tag => tag !== hashtag.tag));
                            } else {
                              setSelectedHashtags(prev => [...prev, hashtag.tag]);
                            }
                          }}
                          className="rounded-lg p-3 border-2 transition-all hover:scale-[1.02] cursor-pointer min-w-0"
                          style={{
                            backgroundColor: isSelected 
                              ? (theme === 'dark' ? 'rgba(41, 121, 255, 0.15)' : 'rgba(41, 121, 255, 0.08)')
                              : 'var(--card-bg)',
                            borderColor: isSelected 
                              ? '#2979FF' 
                              : 'var(--card-border)',
                            boxShadow: isSelected 
                              ? (theme === 'dark' 
                                  ? '0 4px 20px rgba(41, 121, 255, 0.3), 0 0 0 2px rgba(41, 121, 255, 0.2)'
                                  : '0 2px 8px rgba(41, 121, 255, 0.2), 0 0 0 1px rgba(41, 121, 255, 0.3)')
                              : (theme === 'dark' ? '0 4px 12px rgba(41, 121, 255, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.05)')
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                              <div 
                                className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0"
                                style={{
                                  borderColor: isSelected ? '#2979FF' : 'var(--card-border)',
                                  backgroundColor: isSelected ? '#2979FF' : 'transparent'
                                }}
                              >
                                {isSelected && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              
                              {/* Reach Score Badge */}
                              {(() => {
                                // Scale score from 0-54 to 0-100
                                const reachScore = Math.round((hashtag.score / 54) * 100);
                                
                                const getRating = (score: number) => {
                                  if (score >= 90) return { label: 'Outstanding', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
                                  if (score >= 70) return { label: 'High', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)' };
                                  if (score >= 50) return { label: 'Medium', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' };
                                  if (score >= 30) return { label: 'Low', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
                                  return { label: 'Very Low', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
                                };
                                const rating = getRating(reachScore);
                                return (
                                  <div 
                                    className="px-2 py-0.5 rounded text-xs font-bold min-w-[36px] text-center flex-shrink-0"
                                    style={{
                                      backgroundColor: rating.bg,
                                      color: rating.color,
                                      border: `1px solid ${rating.border}`
                                    }}
                                    title={`Reach Score: ${reachScore}/100 - ${rating.label}`}
                                  >
                                    {reachScore}
                                  </div>
                                );
                              })()}
                              
                          </div>
                          
                          <h4 className="text-sm font-bold leading-tight line-clamp-2 mt-2" style={{ color: 'var(--text-primary)' }}>
                            {hashtag.tag}
                          </h4>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Hashtags Box */}
                  {selectedHashtags.length > 0 && (
                    <div className="mt-4">
                      <div 
                        className="rounded-lg p-4 border-2"
                        style={{
                          backgroundColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.05)' : 'rgba(41, 121, 255, 0.03)',
                          borderColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.3)' : 'rgba(41, 121, 255, 0.2)',
                          boxShadow: theme === 'dark' ? '0 4px 16px rgba(41, 121, 255, 0.15)' : '0 2px 8px rgba(41, 121, 255, 0.1)'
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-base font-bold" style={{ color: 'var(--secondary)' }}>
                            📦 Selected Hashtags ({selectedHashtags.length})
                          </h4>
                          <button
                            onClick={() => {
                              setSelectedHashtags([]);
                            }}
                            className="text-xs font-medium transition-all hover:opacity-70"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Clear All
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3 p-3 rounded-lg" style={{ 
                          backgroundColor: 'var(--card-bg)',
                          minHeight: '50px'
                        }}>
                          {selectedHashtags.map((tag, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all hover:scale-105"
                              style={{
                                backgroundColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.1)' : 'rgba(41, 121, 255, 0.08)',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.3)' : 'rgba(41, 121, 255, 0.25)',
                                color: 'var(--text-primary)'
                              }}
                            >
                              <span className="font-medium text-sm">{tag}</span>
                              <button
                                onClick={() => {
                                  setSelectedHashtags(prev => prev.filter(t => t !== tag));
                                }}
                                className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-red-500 hover:text-white transition-all"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            const selectedText = selectedHashtags.join(' ');
                            navigator.clipboard.writeText(selectedText);
                            showNotification(`Copied ${selectedHashtags.length} hashtag${selectedHashtags.length > 1 ? 's' : ''}!`, 'success', 'Copied');
                          }}
                          className="w-full px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 shadow-md"
                          style={{
                            background: 'linear-gradient(135deg, #2979FF 0%, #6FFFD2 100%)',
                            color: 'white'
                          }}
                        >
                          📋 Copy Selected Hashtags ({selectedHashtags.length})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-4 flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        const allTags = hashtagResults.hashtags.map((h: any) => h.tag);
                        setSelectedHashtags(allTags);
                      }}
                      className="px-6 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 border-2 shadow-sm"
                      style={{
                        borderColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.3)' : 'rgba(41, 121, 255, 0.25)',
                        color: '#2979FF',
                        backgroundColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.05)' : 'rgba(41, 121, 255, 0.04)'
                      }}
                    >
                      ✅ Select All
                    </button>
                    {selectedHashtags.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedHashtags([]);
                        }}
                        className="px-6 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 border-2 shadow-sm"
                        style={{
                          borderColor: 'var(--card-border)',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--card-bg)'
                        }}
                      >
                        🗑️ Clear Selection
                      </button>
                    )}
                  </div>

                  {/* Generate More Hashtags Button */}
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={async () => {
                        setIsGeneratingMore(true);
                        
                        try {
                          // Call AI API to generate more hashtags
                          const response = await fetch('/api/generate-hashtags', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              niche: hashtagResults.niche,
                              platform: hashtagResults.platform,
                              batchNumber: generationCount
                            })
                          });

                          if (!response.ok) {
                            throw new Error('Failed to generate more hashtags');
                          }

                          const data = await response.json();
                          
                          // Filter out duplicates and append new ones
                          const existingTags = new Set(hashtagResults.hashtags.map((h: any) => h.tag));
                          const uniqueNewHashtags = data.hashtags.filter((h: any) => !existingTags.has(h.tag));
                          
                          // Append to existing hashtags and re-sort by score
                          const allHashtags = [...hashtagResults.hashtags, ...uniqueNewHashtags];
                          const sortedHashtags = allHashtags.sort((a: any, b: any) => b.score - a.score);
                          
                          setHashtagResults({
                            ...hashtagResults,
                            hashtags: sortedHashtags
                          });
                          
                          setGenerationCount(prev => prev + 1);
                        } catch (error) {
                          console.error('Error generating more hashtags:', error);
                          showNotification('Failed to generate more hashtags. Please try again.', 'error', 'Error');
                        } finally {
                          setIsGeneratingMore(false);
                        }
                      }}
                      disabled={isGeneratingMore}
                      className="px-8 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 border-2 flex items-center justify-center gap-2 shadow-sm"
                      style={{
                        background: isGeneratingMore 
                          ? 'var(--card-bg)' 
                          : (theme === 'dark' 
                              ? 'linear-gradient(135deg, rgba(41, 121, 255, 0.1) 0%, rgba(111, 255, 210, 0.1) 100%)'
                              : 'linear-gradient(135deg, rgba(41, 121, 255, 0.06) 0%, rgba(111, 255, 210, 0.06) 100%)'),
                        borderColor: theme === 'dark' ? '#2979FF' : 'rgba(41, 121, 255, 0.4)',
                        color: 'var(--text-primary)',
                        borderStyle: 'dashed'
                      }}
                    >
                      {isGeneratingMore ? (
                        <>
                          <span className="inline-block animate-spin">⚡</span>
                          <span>Generating More...</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>Generate More Hashtags</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!hashtagResults && !isResearchingHashtags && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                  Ready to find the perfect hashtags?
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Enter your niche and platform to get started
                </p>
              </div>
            )}
            </div>
            </div>
          </div>
        )}

        {/* Music Generator */}
        {currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('music-generator')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'music-generator')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'music-generator')}
            onClick={() => !isReorderMode && collapsedModules.has('music-generator') && toggleModuleCollapse('music-generator')}
            className="rounded-2xl shadow-lg border scroll-mt-4 relative overflow-hidden"
            style={{
              transition: 'max-height 1.5s cubic-bezier(0.65, 0, 0.35, 1), padding 1.5s cubic-bezier(0.65, 0, 0.35, 1), margin-bottom 0.3s ease-out, transform 0.3s ease-out, box-shadow 0.3s ease-out, border-color 0.3s ease-out',
              marginBottom: collapsedModules.has('music-generator') ? '1rem' : '2.5rem',
              backgroundColor: theme === 'dark' 
                ? 'rgba(41, 121, 255, 0.12)' 
                : 'rgba(41, 121, 255, 0.03)',
              borderColor: dragOverModule === 'music-generator'
                ? '#2979FF'
                : (isReorderMode && user)
                  ? (theme === 'dark' ? 'rgba(41, 121, 255, 0.6)' : 'rgba(41, 121, 255, 0.5)')
                  : (theme === 'dark'
                    ? 'rgba(41, 121, 255, 0.4)'
                    : 'rgba(41, 121, 255, 0.3)'),
              boxShadow: draggedModule === 'music-generator'
                ? '0 16px 48px rgba(41, 121, 255, 0.45), 0 0 0 2px rgba(41, 121, 255, 0.6), 0 0 20px rgba(41, 121, 255, 0.3)'
                : dragOverModule === 'music-generator'
                  ? '0 0 0 3px rgba(41, 121, 255, 0.5), 0 0 20px rgba(41, 121, 255, 0.3)'
                  : (isReorderMode && user)
                    ? (theme === 'dark'
                      ? '0 8px 32px rgba(41, 121, 255, 0.4), 0 0 0 2px rgba(41, 121, 255, 0.5), 0 0 20px rgba(41, 121, 255, 0.25)'
                      : '0 8px 32px rgba(41, 121, 255, 0.3), 0 0 0 2px rgba(41, 121, 255, 0.4), 0 0 15px rgba(41, 121, 255, 0.2)')
                    : (theme === 'dark'
                      ? '0 4px 20px rgba(41, 121, 255, 0.25), 0 0 15px rgba(41, 121, 255, 0.15)'
                      : '0 4px 20px rgba(41, 121, 255, 0.15), 0 0 10px rgba(41, 121, 255, 0.1)'),
              order: moduleOrder.indexOf('music-generator'),
              cursor: (isReorderMode && user) ? (draggedModule === 'music-generator' ? 'grabbing' : 'grab') : (collapsedModules.has('music-generator') ? 'pointer' : 'default'),
              opacity: 1,
              transform: draggedModule === 'music-generator' 
                ? 'scale(1.05) rotate(2deg)' 
                : 'scale(1)',
              padding: collapsedModules.has('music-generator') ? '1rem' : '1.5rem',
              zIndex: draggedModule === 'music-generator' ? 1000 : 'auto',
              maxHeight: collapsedModules.has('music-generator') ? '80px' : '2000px',
              overflow: 'hidden',
            }}
          >
            {/* Drop Indicator - Top */}
            {dragOverModule === 'music-generator' && dropPosition === 'before' && draggedModule !== 'music-generator' && (
              <div 
                className="absolute -top-2 left-0 right-0 h-1 rounded-full"
                style={{
                  backgroundColor: '#2979FF',
                  boxShadow: '0 0 16px rgba(41, 121, 255, 0.8)',
                  zIndex: 1001,
                }}
              />
            )}
            
            {/* Drop Indicator - Bottom */}
            {dragOverModule === 'music-generator' && dropPosition === 'after' && draggedModule !== 'music-generator' && (
              <div 
                className="absolute -bottom-2 left-0 right-0 h-1 rounded-full"
                style={{
                  backgroundColor: '#2979FF',
                  boxShadow: '0 0 16px rgba(41, 121, 255, 0.8)',
                  zIndex: 1001,
                }}
              />
            )}

            {/* Collapsed Bar View */}
            <div 
              className="flex items-center justify-between gap-2"
              style={{
                transition: 'opacity 0.8s ease-in-out',
                opacity: collapsedModules.has('music-generator') ? 1 : 0,
                pointerEvents: collapsedModules.has('music-generator') ? 'auto' : 'none',
                position: collapsedModules.has('music-generator') ? 'relative' : 'absolute',
                visibility: collapsedModules.has('music-generator') ? 'visible' : 'hidden',
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <span className="text-3xl flex-shrink-0">🎵</span>
                <h3 className="text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--secondary)' }}>
                  Music Generator
                </h3>
              </div>
              <span className="text-sm opacity-60 flex-shrink-0 hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                {isReorderMode ? 'Drag to reorder' : 'Click to expand'}
              </span>
            </div>

            {/* Expanded Content */}
            <div
              style={{
                transition: 'opacity 0.8s ease-in-out',
                opacity: collapsedModules.has('music-generator') ? 0 : 1,
                pointerEvents: collapsedModules.has('music-generator') ? 'none' : 'auto',
                position: collapsedModules.has('music-generator') ? 'absolute' : 'relative',
                visibility: collapsedModules.has('music-generator') ? 'hidden' : 'visible',
              }}
            >
              {/* Minimize Button */}
              {!collapsedModules.has('music-generator') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleModuleCollapse('music-generator');
                  }}
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl transition-all hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor: 'rgba(41, 121, 255, 0.15)',
                    border: '2px solid rgba(41, 121, 255, 0.4)',
                    color: '#2979FF',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(41, 121, 255, 0.3)',
                  }}
                  title="Minimize"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                  </svg>
                </button>
              )}

              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-2" style={{ 
                color: '#2979FF',
                textShadow: '0 0 20px rgba(41, 121, 255, 0.3)'
              }}>
                🎵 Music Generator
              </h2>
              <p className="text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
                Create unique music tracks powered by AI
              </p>

              <div className="space-y-4">
                {/* Song Duration Slider */}
                <div>
                  <label className="block mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Song Length: {musicDuration}s
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="10"
                    value={musicDuration}
                    onChange={(e) => setMusicDuration(Number(e.target.value))}
                    disabled={isGeneratingMusic}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #2979FF 0%, #2979FF ${((musicDuration - 10) / 110) * 100}%, ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} ${((musicDuration - 10) / 110) * 100}%, ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    <span>10s</span>
                    <span>120s</span>
                  </div>
                </div>

                {/* Music Type Dropdown */}
                <div>
                  <label className="block mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Music Type
                  </label>
                  <select
                    value={musicType}
                    onChange={(e) => setMusicType(e.target.value)}
                    disabled={isGeneratingMusic}
                    className="w-full px-4 py-3 rounded-lg border-2 transition-all"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.4)' : 'rgba(41, 121, 255, 0.3)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="instrumental">Instrumental</option>
                    <option value="vocals">With Vocals</option>
                  </select>
                </div>

                {/* Music Prompt */}
                <div>
                  <label className="block mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Describe Your Music
                  </label>
                  <textarea
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    disabled={isGeneratingMusic}
                    placeholder="E.g., 'Upbeat electronic dance music' or 'Calm acoustic guitar'"
                    className="w-full px-4 py-3 rounded-lg border-2 transition-all resize-none text-sm sm:text-base"
                    rows={4}
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      borderColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.4)' : 'rgba(41, 121, 255, 0.3)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* Generate Button */}
                {!generatedMusic && (
                  <button
                    onClick={generateMusic}
                    disabled={isGeneratingMusic || !musicPrompt.trim()}
                    className="w-full py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(41, 121, 255, 0.4)'
                    }}
                  >
                    {isGeneratingMusic ? '🎵 Generating...' : '🎵 Generate Music'}
                  </button>
                )}

                {/* Progress Bar */}
                {isGeneratingMusic && (
                  <div className="space-y-2">
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{
                      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    }}>
                      <div 
                        className="h-full transition-all duration-300 rounded-full"
                        style={{
                          width: `${musicProgress}%`,
                          background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                          boxShadow: '0 0 10px rgba(41, 121, 255, 0.5)'
                        }}
                      />
                    </div>
                    <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Creating your music... {musicProgress}%
                    </p>
                  </div>
                )}

                {/* Audio Player & Download */}
                {generatedMusic && (
                  <div className="mt-6 p-4 rounded-lg" style={{
                    backgroundColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.1)' : 'rgba(41, 121, 255, 0.05)',
                    border: '2px solid rgba(41, 121, 255, 0.3)',
                  }}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">✅</span>
                      <h3 className="font-bold text-lg" style={{ color: '#2979FF' }}>
                        Music Generated!
                      </h3>
                    </div>

                    {/* Audio Player */}
                    <audio
                      controls
                      className="w-full mb-4"
                      style={{
                        borderRadius: '8px',
                        outline: 'none',
                      }}
                    >
                      <source src={generatedMusic.audio} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = generatedMusic.audio;
                          link.download = `postready-music-${Date.now()}.mp3`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="flex-1 py-3 px-4 rounded-lg font-bold text-sm sm:text-base transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(41, 121, 255, 0.4)'
                        }}
                      >
                        💾 Download
                      </button>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setGeneratedMusic(null);
                            setMusicProgress(0);
                            generateMusic();
                          }}
                          disabled={isGeneratingMusic}
                          className="flex-1 py-3 px-4 rounded-lg font-bold text-sm sm:text-base transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(41, 121, 255, 0.4)'
                          }}
                        >
                          🎵 Generate New
                        </button>
                        {musicHistory.length > 0 && (
                          <button
                            onClick={() => setShowMusicHistory(!showMusicHistory)}
                            className="py-3 px-4 rounded-lg font-bold transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                            style={{
                              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              color: 'var(--text-primary)',
                            }}
                            title="View History"
                          >
                            📜
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Music History Panel */}
                {showMusicHistory && musicHistory.length > 0 && (
                  <div className="mt-6 p-4 rounded-lg" style={{
                    backgroundColor: theme === 'dark' ? 'rgba(41, 121, 255, 0.1)' : 'rgba(41, 121, 255, 0.05)',
                    border: '2px solid rgba(41, 121, 255, 0.3)',
                  }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg" style={{ color: '#2979FF' }}>
                        📜 Music History
                      </h3>
                      <button
                        onClick={() => setShowMusicHistory(false)}
                        className="text-sm opacity-60 hover:opacity-100"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        ✕ Close
                      </button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {musicHistory.map((music) => (
                        <div
                          key={music.id}
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            border: '1px solid rgba(41, 121, 255, 0.2)',
                          }}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                {music.prompt}
                              </p>
                              <p className="text-xs opacity-60" style={{ color: 'var(--text-secondary)' }}>
                                {new Date(music.timestamp).toLocaleString()} • {music.duration}s • {music.type}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setGeneratedMusic(music);
                                setShowMusicHistory(false);
                              }}
                              className="px-3 py-1 text-xs rounded-lg font-bold transition-all hover:scale-105"
                              style={{
                                background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                                color: 'white',
                              }}
                            >
                              Load
                            </button>
                          </div>
                          <audio
                            controls
                            className="w-full"
                            style={{
                              height: '32px',
                              borderRadius: '4px',
                            }}
                          >
                            <source src={music.audio} type="audio/mpeg" />
                          </audio>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sora Prompt Generator */}
        {currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('sora-prompt')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'sora-prompt')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'sora-prompt')}
            onClick={() => !isReorderMode && collapsedModules.has('sora-prompt') && toggleModuleCollapse('sora-prompt')}
            className="rounded-2xl shadow-lg border scroll-mt-4 relative overflow-hidden"
            style={{
              transition: 'max-height 1.5s cubic-bezier(0.65, 0, 0.35, 1), padding 1.5s cubic-bezier(0.65, 0, 0.35, 1), margin-bottom 0.3s ease-out, transform 0.3s ease-out, box-shadow 0.3s ease-out, border-color 0.3s ease-out',
              marginBottom: collapsedModules.has('sora-prompt') ? '1rem' : '2.5rem',
              backgroundColor: theme === 'dark' 
                ? 'rgba(88, 50, 120, 0.12)' 
                : 'rgba(139, 92, 246, 0.03)',
              borderColor: dragOverModule === 'sora-prompt'
                ? '#8B5CF6'
                : (isReorderMode && user)
                  ? (theme === 'dark' ? 'rgba(139, 92, 246, 0.6)' : 'rgba(139, 92, 246, 0.5)')
                  : (theme === 'dark'
                    ? 'rgba(139, 92, 246, 0.4)'
                    : 'rgba(139, 92, 246, 0.3)'),
              boxShadow: draggedModule === 'sora-prompt'
                ? '0 16px 48px rgba(139, 92, 246, 0.45), 0 0 0 2px rgba(139, 92, 246, 0.6), 0 0 20px rgba(139, 92, 246, 0.3)'
                : dragOverModule === 'sora-prompt'
                  ? '0 0 0 3px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)'
                  : (isReorderMode && user)
                    ? (theme === 'dark'
                      ? '0 8px 32px rgba(139, 92, 246, 0.4), 0 0 0 2px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.25)'
                      : '0 8px 32px rgba(139, 92, 246, 0.3), 0 0 0 2px rgba(139, 92, 246, 0.4), 0 0 15px rgba(139, 92, 246, 0.2)')
                    : (theme === 'dark'
                      ? '0 4px 20px rgba(139, 92, 246, 0.25), 0 0 15px rgba(139, 92, 246, 0.15)'
                      : '0 4px 20px rgba(139, 92, 246, 0.15), 0 0 10px rgba(139, 92, 246, 0.1)'),
              order: moduleOrder.indexOf('sora-prompt'),
              cursor: (isReorderMode && user) ? (draggedModule === 'sora-prompt' ? 'grabbing' : 'grab') : (collapsedModules.has('sora-prompt') ? 'pointer' : 'default'),
              opacity: 1,
              transform: draggedModule === 'sora-prompt' 
                ? 'scale(1.05) rotate(2deg)' 
                : 'scale(1)',
              padding: collapsedModules.has('sora-prompt') ? '1rem' : '1.5rem',
              zIndex: draggedModule === 'sora-prompt' ? 1000 : 'auto',
              maxHeight: collapsedModules.has('sora-prompt') ? '80px' : '2000px',
              overflow: 'hidden',
            }}
          >
            {/* Drop Indicator - Top */}
            {dragOverModule === 'sora-prompt' && dropPosition === 'before' && draggedModule !== 'sora-prompt' && (
              <div 
                className="absolute -top-2 left-0 right-0 h-1 rounded-full"
                style={{
                  backgroundColor: '#8B5CF6',
                  boxShadow: '0 0 16px rgba(139, 92, 246, 0.8)',
                  zIndex: 1001,
                }}
              />
            )}
            
            {/* Drop Indicator - Bottom */}
            {dragOverModule === 'sora-prompt' && dropPosition === 'after' && draggedModule !== 'sora-prompt' && (
              <div 
                className="absolute -bottom-2 left-0 right-0 h-1 rounded-full"
                style={{
                  backgroundColor: '#8B5CF6',
                  boxShadow: '0 0 16px rgba(139, 92, 246, 0.8)',
                  zIndex: 1001,
                }}
              />
            )}

            {/* Collapsed Bar View */}
            <div 
              className="flex items-center justify-between gap-2"
              style={{
                transition: 'opacity 0.8s ease-in-out',
                opacity: collapsedModules.has('sora-prompt') ? 1 : 0,
                pointerEvents: collapsedModules.has('sora-prompt') ? 'auto' : 'none',
                position: collapsedModules.has('sora-prompt') ? 'relative' : 'absolute',
                visibility: collapsedModules.has('sora-prompt') ? 'visible' : 'hidden',
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <span className="text-3xl flex-shrink-0">🎬</span>
                <h3 className="text-lg sm:text-xl font-bold truncate" style={{ color: 'var(--secondary)' }}>
                  Sora Prompt Generator
                </h3>
                <span className="px-2 py-1 text-xs font-bold rounded flex-shrink-0" style={{
                  background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                  color: 'white',
                }}>
                  PRO
                </span>
              </div>
              <span className="text-sm opacity-60 flex-shrink-0 hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                {isReorderMode ? 'Drag to reorder' : 'Click to expand'}
              </span>
            </div>

            {/* Expanded Content */}
            <div
              style={{
                transition: 'opacity 0.8s ease-in-out',
                opacity: collapsedModules.has('sora-prompt') ? 0 : 1,
                pointerEvents: collapsedModules.has('sora-prompt') ? 'none' : 'auto',
                position: collapsedModules.has('sora-prompt') ? 'absolute' : 'relative',
                visibility: collapsedModules.has('sora-prompt') ? 'hidden' : 'visible',
              }}
            >
                {/* Minimize Button */}
                {!isReorderMode && (
                  <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleModuleCollapse('sora-prompt');
                  }}
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl transition-all hover:scale-110 active:scale-95"
                  style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.15)',
                    border: '2px solid rgba(41, 121, 255, 0.4)',
                    color: '#2979FF',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(41, 121, 255, 0.3)'
                  }}
                  title="Minimize"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                )}

                <div className="space-y-6">
                  <div className="text-center relative">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToPremium();
                        }}
                        className="px-4 py-2 text-sm font-bold rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        style={{
                          background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(41, 121, 255, 0.4)'
                        }}
                      >
                        <span>★</span>
                        Get Pro
                      </button>
                      <h2 className="text-3xl sm:text-4xl font-bold text-center flex-1" style={{ 
                        color: '#8B5CF6',
                        textShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
                      }}>
                        🎬 Sora Prompt Generator
                      </h2>
                      <div className="w-[100px]"></div>
                    </div>
                    <p className="text-sm sm:text-base" style={{ 
                      color: theme === 'dark' ? 'rgba(139, 92, 246, 0.8)' : 'rgba(99, 102, 241, 0.9)'
                    }}>
                      Generate professional, detailed video prompts for OpenAI Sora
                    </p>
                  </div>
                  
                  {/* Usage Indicator */}
                  {!isPro && (
                    <div className="mt-4 p-3 rounded-lg" style={{
                      backgroundColor: soraUsageCount >= 1 
                        ? 'rgba(239, 68, 68, 0.1)' 
                        : 'rgba(139, 92, 246, 0.1)',
                      border: `1px solid ${soraUsageCount >= 1 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
                    }}>
                      <p className="text-sm font-medium" style={{ 
                        color: soraUsageCount >= 1 ? '#ef4444' : '#8B5CF6'
                      }}>
                        {soraUsageCount === 0 ? 'Free Trial: 1 generation remaining' : 'Upgrade to Pro for unlimited generations'}
                      </p>
                    </div>
                  )}
                  
                  {isPro && (
                    <div className="mt-4 p-3 rounded-lg" style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}>
                      <p className="text-sm font-medium" style={{ color: '#10b981' }}>
                        Pro Member: Unlimited generations
                      </p>
                    </div>
                  )}

                  {/* Input Form */}
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    
                    // Check if user needs to upgrade to Pro (free users get 1 use)
                    if (!isPro && soraUsageCount >= 1) {
                      setShowSoraPaywall(true);
                      return;
                    }
                    
                    setIsGeneratingSora(true);
                    
                    try {
                      const response = await fetch('/api/generate-sora-prompts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          videoIdea: soraVideoIdea,
                          style: soraStyle,
                          cameraMovement: soraCameraMovement,
                          mood: soraMood,
                        }),
                      });

                      if (!response.ok) throw new Error('Failed to generate prompts');

                      const data = await response.json();
                      setSoraPrompts(data.prompts || []);
                      
                      // Increment usage count (only for free users and anonymous users)
                      if (!isPro) {
                        const newCount = soraUsageCount + 1;
                        setSoraUsageCount(newCount);
                        
                        // Save to BOTH device and user storage to prevent bypassing by signing in/out
                        const deviceId = getDeviceId();
                        const deviceUsageKey = `sora_usage_${deviceId}`;
                        localStorage.setItem(deviceUsageKey, newCount.toString());
                        
                        // Also save to user-specific key if signed in
                        if (user) {
                          const userUsageKey = `sora_usage_user_${user.id}`;
                          localStorage.setItem(userUsageKey, newCount.toString());
                        }
                      }
                    } catch (error) {
                      console.error('Error generating Sora prompts:', error);
                      alert('Failed to generate prompts. Please try again.');
                    } finally {
                      setIsGeneratingSora(false);
                    }
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Video Concept <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={soraVideoIdea}
                        onChange={(e) => setSoraVideoIdea(e.target.value)}
                        placeholder="Describe your video idea... (e.g., 'A serene morning in Tokyo, cherry blossoms falling')"
                        required
                        rows={3}
                        className="w-full rounded-lg px-4 py-3 focus:outline-none border"
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'rgba(139, 92, 246, 0.3)',
                          color: 'var(--text-primary)',
                          resize: 'vertical',
                          boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#8B5CF6';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.2), 0 0 15px rgba(139, 92, 246, 0.3)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                          e.currentTarget.style.boxShadow = '0 0 0 0 rgba(139, 92, 246, 0)';
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Visual Style
                        </label>
                        <select
                          value={soraStyle}
                          onChange={(e) => setSoraStyle(e.target.value)}
                          className="w-full rounded-lg px-4 py-3 focus:outline-none border"
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'rgba(139, 92, 246, 0.3)',
                            color: 'var(--text-primary)',
                            boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#8B5CF6';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.2), 0 0 15px rgba(139, 92, 246, 0.3)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                            e.currentTarget.style.boxShadow = '0 0 0 0 rgba(139, 92, 246, 0)';
                          }}
                        >
                          <option value="">Select style</option>
                          <option value="cinematic">Cinematic</option>
                          <option value="photorealistic">Photorealistic</option>
                          <option value="animated">Animated</option>
                          <option value="surreal">Surreal</option>
                          <option value="documentary">Documentary</option>
                          <option value="vintage">Vintage Film</option>
                          <option value="hyperrealistic">Hyperrealistic</option>
                          <option value="security-camera">Security Camera</option>
                          <option value="ring-camera">Ring Camera</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Camera Movement
                        </label>
                        <select
                          value={soraCameraMovement}
                          onChange={(e) => setSoraCameraMovement(e.target.value)}
                          className="w-full rounded-lg px-4 py-3 focus:outline-none border"
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'rgba(139, 92, 246, 0.3)',
                            color: 'var(--text-primary)',
                            boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#8B5CF6';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.2), 0 0 15px rgba(139, 92, 246, 0.3)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                            e.currentTarget.style.boxShadow = '0 0 0 0 rgba(139, 92, 246, 0)';
                          }}
                        >
                          <option value="">Select movement</option>
                          <option value="static">Static Shot</option>
                          <option value="slow-pan">Slow Pan</option>
                          <option value="tracking">Tracking Shot</option>
                          <option value="aerial">Aerial/Drone</option>
                          <option value="handheld">Handheld</option>
                          <option value="crane">Crane Shot</option>
                          <option value="dolly">Dolly Zoom</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Mood/Tone
                        </label>
                        <select
                          value={soraMood}
                          onChange={(e) => setSoraMood(e.target.value)}
                          className="w-full rounded-lg px-4 py-3 focus:outline-none border"
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'rgba(139, 92, 246, 0.3)',
                            color: 'var(--text-primary)',
                            boxShadow: '0 0 0 0 rgba(139, 92, 246, 0)',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#8B5CF6';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.2), 0 0 15px rgba(139, 92, 246, 0.3)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                            e.currentTarget.style.boxShadow = '0 0 0 0 rgba(139, 92, 246, 0)';
                          }}
                        >
                          <option value="">Select mood</option>
                          <option value="peaceful">Peaceful</option>
                          <option value="dramatic">Dramatic</option>
                          <option value="energetic">Energetic</option>
                          <option value="mysterious">Mysterious</option>
                          <option value="uplifting">Uplifting</option>
                          <option value="melancholic">Melancholic</option>
                          <option value="suspenseful">Suspenseful</option>
                          <option value="funny">Funny</option>
                          <option value="strange">Strange</option>
                          <option value="hyper-experimental">Hyper Experimental</option>
                          <option value="hyper-bizarre">Hyper Bizarre</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isGeneratingSora || !soraVideoIdea}
                      className="w-full py-4 rounded-lg font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)',
                        color: 'white'
                      }}
                    >
                      {isGeneratingSora ? (
                        <>
                          <span className="animate-spin">🎬</span>
                          Generating Prompts...
                        </>
                      ) : (
                        <>
                          ✨ Generate Sora Prompts
                        </>
                      )}
                    </button>
                  </form>

                  {/* Generated Prompts */}
                  {soraPrompts.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--secondary)' }}>
                          <span>📝</span> Generated Prompts
                        </h3>
                        <button
                          onClick={() => setSoraPrompts([])}
                          className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center gap-2"
                          style={{
                            backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            border: '1px solid',
                            color: '#ef4444'
                          }}
                        >
                          🗑️ Clear Prompts
                        </button>
                      </div>
                      <div className="grid gap-4">
                        {soraPrompts.map((prompt, index) => (
                          <div 
                            key={index}
                            className="rounded-xl p-5 border-2 relative group"
                            style={{
                              backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.03)',
                              borderColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'
                            }}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <h4 className="font-bold text-lg" style={{ color: '#8B5CF6' }}>
                                Prompt {index + 1}: {prompt.title}
                              </h4>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(prompt.prompt);
                                }}
                                className="px-3 py-1.5 rounded-lg transition-all hover:scale-105 flex items-center gap-1.5 text-sm font-medium"
                                style={{
                                  background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                                  color: 'white'
                                }}
                              >
                                📋 Copy
                              </button>
                            </div>
                            <p className="text-sm leading-relaxed mb-3 p-3 rounded-lg" style={{ 
                              color: 'var(--text-primary)',
                              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)'
                            }}>
                              {prompt.prompt}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {prompt.tags && prompt.tags.map((tag: string, tagIndex: number) => (
                                <span 
                                  key={tagIndex}
                                  className="px-2 py-1 rounded-full"
                                  style={{
                                    backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                                    color: '#8B5CF6'
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {soraPrompts.length === 0 && !isGeneratingSora && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎬</div>
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                        Ready to create stunning video prompts?
                      </h3>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        Describe your video concept and we'll generate professional Sora prompts
                      </p>
                    </div>
                  )}
                </div>
            </div>
          </div>
        )}

        </div>
        {/* End Modules Container */}

        {/* Researching State */}
        {currentStep === "researching" && (
          <div ref={strategyRef} className="mb-10 scroll-mt-4">
            <div 
              className="rounded-2xl shadow-lg border p-8 space-y-6 transition-all duration-500"
              style={{
                backgroundColor: userType === 'creator' 
                  ? 'rgba(218, 165, 32, 0.08)'
                  : 'var(--card-bg)',
                borderColor: userType === 'creator'
                  ? 'rgba(218, 165, 32, 0.3)'
                  : 'var(--card-border)',
                boxShadow: userType === 'creator'
                  ? '0 10px 40px rgba(218, 165, 32, 0.15)'
                  : undefined
              }}
            >
              <div className="text-center py-12">
                <div className="text-6xl mb-6 animate-bounce">⚡</div>
                <h2 className="text-3xl font-bold mb-4 transition-colors duration-500" style={{ 
                  color: userType === 'creator' ? '#DAA520' : 'var(--secondary)' 
                }}>
                  {userType === 'business' ? 'Creating Your Strategy...' : 'Researching Creator Insights...'}
                </h2>
                <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
                  {userType === 'business' 
                    ? `Finding the best tactics for ${businessInfo.businessName} on ${businessInfo.platform}`
                    : `Analyzing ${businessInfo.businessType} trends and building your content strategy...`
                  }
                </p>

                <div className="max-w-md mx-auto space-y-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {researchStatus}
                    </span>
                    <span className="font-bold transition-colors duration-500" style={{ 
                      color: userType === 'creator' ? '#DAA520' : 'var(--primary)' 
                    }}>
                      {Math.round(researchProgress)}%
                    </span>
                  </div>
                  {/* Progress bar container */}
                  <div 
                    className="w-full rounded-full overflow-hidden relative"
                    style={{ 
                      backgroundColor: 'var(--card-border)',
                      height: '12px',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {/* Progress bar fill */}
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                      style={{ 
                        width: `${researchProgress}%`,
                        background: userType === 'creator'
                          ? 'linear-gradient(90deg, #DAA520 0%, #F4D03F 50%, #FFD700 100%)'
                          : 'linear-gradient(90deg, #2979FF 0%, #6F7FFF 50%, #9F7AEA 100%)',
                        boxShadow: userType === 'creator'
                          ? '0 0 12px rgba(218, 165, 32, 0.5), 0 2px 4px rgba(218, 165, 32, 0.3)'
                          : '0 0 12px rgba(41, 121, 255, 0.5), 0 2px 4px rgba(41, 121, 255, 0.3)'
                      }}
                    >
                      {/* Shimmer effect */}
                      <div 
                        className="absolute inset-0 opacity-40"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)',
                          animation: 'shimmer 2s infinite ease-in-out',
                          width: '50%'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step-by-Step Strategy Wizard */}
        {strategy && currentStep !== "form" && currentStep !== "researching" && currentStep !== "premium" && currentStep !== "history" && currentStep !== "businesses" && (
          <div ref={strategyRef} className="mb-10 scroll-mt-4">
            <div 
              className="rounded-2xl shadow-lg border p-8 space-y-6 transition-all duration-500"
              style={{
                backgroundColor: userType === 'creator' 
                  ? 'rgba(218, 165, 32, 0.08)'
                  : 'var(--card-bg)',
                borderColor: userType === 'creator'
                  ? 'rgba(218, 165, 32, 0.3)'
                  : 'var(--card-border)',
                boxShadow: userType === 'creator'
                  ? '0 10px 40px rgba(218, 165, 32, 0.15)'
                  : undefined
              }}
            >
              {/* Progress Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Step {Math.min(getStepNumber(), 4)} of 4
                  </span>
                  <span className="text-sm text-gray-500">
                    {businessInfo.businessName} - {businessInfo.location}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(Math.min(getStepNumber(), 4) / 4) * 100}%`,
                      background: userType === 'creator' 
                        ? 'linear-gradient(to right, #DAA520, #F4D03F)'
                        : '#2979FF'
                    }}
                  ></div>
                </div>
              </div>

              {/* Step 1: Key Strategies */}
              {currentStep === "principles" && strategy && strategy.keyPrinciples && strategy.contentIdeas && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-3 transition-colors duration-500" style={{ 
                      color: userType === 'creator' ? '#DAA520' : 'var(--secondary)' 
                    }}>
                      {userType === 'business' 
                        ? `Your ${businessInfo.platform} Growth Strategy`
                        : `Your ${businessInfo.platform} Creator Strategy`
                      }
                    </h2>
                    <p className="text-sm sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
                      {userType === 'business'
                        ? 'Simple, actionable tactics that actually work'
                        : 'Expert insights to grow your channel and engage your audience'
                      }
                    </p>
                  </div>

                  <div className="rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-5 sm:mb-8 border-l-4 transition-all duration-500" style={{ 
                    background: userType === 'creator'
                      ? 'linear-gradient(135deg, rgba(218, 165, 32, 0.12) 0%, rgba(244, 208, 63, 0.12) 100%)'
                      : 'linear-gradient(135deg, rgba(41, 121, 255, 0.08) 0%, rgba(111, 255, 210, 0.08) 100%)',
                    borderColor: userType === 'creator' ? '#DAA520' : 'var(--accent)'
                  }}>
                    <div className="flex items-start">
                      <span className="text-3xl sm:text-5xl mr-3 sm:mr-5">🎯</span>
                      <div>
                        <h3 className="font-bold text-base sm:text-xl mb-2 sm:mb-3 transition-colors duration-500" style={{ 
                          color: userType === 'creator' ? '#DAA520' : 'var(--secondary)' 
                        }}>
                          {userType === 'business' ? 'The Key to Success' : 'Your Creator Blueprint'}
                        </h3>
                        <p className="text-sm sm:text-lg leading-relaxed" style={{ color: 'var(--text-primary)' }}>{strategy.headlineSummary}</p>
                      </div>
                    </div>
                  </div>

                  {/* Value Creation Message - Only for Creators */}
                  {userType === 'creator' && (
                    <div className="rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-5 sm:mb-8 border-2" style={{
                      background: 'linear-gradient(135deg, rgba(218, 165, 32, 0.15) 0%, rgba(244, 208, 63, 0.15) 100%)',
                      borderColor: '#DAA520',
                      boxShadow: '0 4px 16px rgba(218, 165, 32, 0.2)'
                    }}>
                      <div className="flex items-start gap-3 sm:gap-5">
                        <span className="text-4xl sm:text-6xl">💎</span>
                        <div>
                          <h4 className="font-bold text-lg sm:text-2xl mb-2 sm:mb-4" style={{ color: '#DAA520' }}>
                            The Golden Rule: Deliver Real Value
                          </h4>
                          <p className="text-sm sm:text-lg leading-relaxed mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
                            Whether you entertain, educate, or inspire — <span className="font-bold" style={{ color: '#DAA520' }}>the more value you provide, the faster your channel grows</span>. Every video should answer: "What does my viewer gain from watching this?"
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                            <div className="flex items-start gap-2">
                              <span className="text-xl sm:text-2xl">🎭</span>
                              <div>
                                <p className="font-semibold mb-1 text-sm sm:text-base" style={{ color: '#DAA520' }}>Entertainment Value</p>
                                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Make them laugh, feel, or escape reality</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xl sm:text-2xl">🎓</span>
                              <div>
                                <p className="font-semibold mb-1 text-sm sm:text-base" style={{ color: '#DAA520' }}>Utility Value</p>
                                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>Teach them something useful or solve a problem</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Experimentation Message - Only for Creators */}
                  {userType === 'creator' && (
                    <div className="rounded-xl p-4 sm:p-6 mb-5 sm:mb-8 border-l-4" style={{
                      background: 'linear-gradient(135deg, rgba(218, 165, 32, 0.1) 0%, rgba(244, 208, 63, 0.1) 100%)',
                      borderColor: '#DAA520'
                    }}>
                      <div className="flex items-start gap-3 sm:gap-4">
                        <span className="text-3xl sm:text-4xl">🧪</span>
                        <div>
                          <h4 className="font-bold text-base sm:text-lg mb-2" style={{ color: '#DAA520' }}>
                            The Power of Experimentation
                          </h4>
                          <p className="text-sm sm:text-base leading-relaxed mb-2 sm:mb-3" style={{ color: 'var(--text-primary)' }}>
                            Experimentation is often how creators reach new heights. By leveraging your unique creativity and trying new formats, styles, and approaches, you'll discover what truly resonates with your audience. Don't be afraid to break your own rules and test new ideas — that's where breakthrough content lives.
                          </p>
                          <p className="text-sm sm:text-base leading-relaxed italic" style={{ color: 'var(--text-primary)', opacity: 0.9 }}>
                            Remember: sometimes the most chaotic, unplanned moments create the most viral, memorable content. Embrace the unexpected — it's often your greatest creative asset.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-6 sm:mb-10">
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center transition-colors duration-500" style={{ 
                      color: userType === 'creator' ? '#DAA520' : 'var(--secondary)' 
                    }}>
                      <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">⚡</span>
                      {userType === 'business' ? '5 Strategies to Grow Your Audience' : '5 Key Creator Strategies'}
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {strategy.keyPrinciples.map((principle, index) => (
                        <div 
                          key={index} 
                          className="rounded-lg sm:rounded-xl p-4 sm:p-6 border transition-all duration-500 hover:scale-[1.02] cursor-default"
                          style={{
                            backgroundColor: userType === 'creator' 
                              ? 'rgba(218, 165, 32, 0.05)'
                              : 'var(--card-bg)',
                            borderColor: userType === 'creator'
                              ? 'rgba(218, 165, 32, 0.2)'
                              : 'var(--card-border)',
                            boxShadow: userType === 'creator'
                              ? '0 2px 8px rgba(218, 165, 32, 0.1)'
                              : '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div 
                              className="rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold flex-shrink-0 text-sm sm:text-lg transition-all duration-500"
                              style={{
                                background: userType === 'creator' 
                                  ? 'linear-gradient(135deg, #DAA520 0%, #F4D03F 100%)'
                                  : 'linear-gradient(135deg, #2979FF 0%, #6FFFD2 100%)',
                                color: userType === 'creator' ? '#1A1F2E' : 'white'
                              }}
                            >
                              {index + 1}
                            </div>
                            <p className="text-sm sm:text-base leading-relaxed pt-0.5 sm:pt-1" style={{ color: 'var(--text-primary)' }}>{principle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl p-6 mb-8 border-l-4" style={{ 
                    backgroundColor: '#FEF3C7',
                    borderColor: '#F59E0B'
                  }}>
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">💡</span>
                      <div>
                        <h4 className="font-bold text-lg mb-2" style={{ color: '#92400E' }}>Pro Tip</h4>
                        <p style={{ color: '#78350F' }}>
                          Consistency beats perfection. Post regularly, engage authentically, and your audience will grow!
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleNextStep}
                    className="w-full text-lg py-4 rounded-lg font-bold transition-all duration-500 hover:scale-105 active:scale-95 shadow-lg"
                    style={{
                      background: userType === 'creator'
                        ? 'linear-gradient(to right, #DAA520, #F4D03F)'
                        : 'linear-gradient(to right, #2979FF, #6FFFD2)',
                      color: userType === 'creator' ? '#1A1F2E' : 'white',
                      boxShadow: userType === 'creator'
                        ? '0 8px 20px rgba(218, 165, 32, 0.35)'
                        : '0 8px 20px rgba(41, 121, 255, 0.3)'
                    }}
                  >
                    {userType === 'business' ? 'Next: Choose Your Video Idea →' : 'Next: Pick Your Content →'}
                  </button>
                </div>
              )}

              {/* Step 2: Choose Video Idea */}
              {currentStep === "choose-idea" && strategy && strategy.contentIdeas && (
                <div>
                  <h2 className="text-3xl font-bold mb-2 transition-colors duration-500" style={{ 
                    color: userType === 'creator' ? '#DAA520' : 'var(--secondary)' 
                  }}>
                    {userType === 'business' ? 'Choose Your Video Idea' : 'Pick Your Content Concept'}
                  </h2>
                  <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                    {userType === 'business'
                      ? 'Select one idea to create content for. You\'ll record the video next.'
                      : 'Choose a content idea that resonates with your goals. You\'ll craft your video next.'
                    }
                  </p>

                  {/* Loading State - Beautiful Animated Emoji */}
                  {isGeneratingIdeas && (
                    <div className="flex flex-col items-center justify-center py-20 mb-6">
                      <div className="text-8xl mb-6 animate-bounce">
                        ✨
                      </div>
                      <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                        Generating Fresh Ideas...
                      </h3>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        Creating amazing video concepts just for you
                      </p>
                    </div>
                  )}

                  {/* Video Ideas Grid */}
                  {!isGeneratingIdeas && (
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 transition-all duration-300 ${
                      ideasAnimation === 'fadeOut' ? 'animate-fade-out' : 
                      ideasAnimation === 'fadeIn' ? 'animate-fade-in' : ''
                    }`}>
                    {strategy.contentIdeas.map((idea, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectIdea(idea)}
                        className="group relative border-2 rounded-2xl cursor-pointer transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          backgroundColor: selectedIdea?.title === idea.title 
                            ? (userType === 'creator' ? 'rgba(218, 165, 32, 0.15)' : 'rgba(41, 121, 255, 0.08)')
                            : 'var(--card-bg)',
                          borderColor: selectedIdea?.title === idea.title 
                            ? (userType === 'creator' ? '#DAA520' : 'var(--primary)')
                            : (userType === 'creator' ? 'rgba(218, 165, 32, 0.4)' : 'var(--card-border)'),
                          boxShadow: selectedIdea?.title === idea.title 
                            ? (userType === 'creator' ? '0 10px 30px rgba(218, 165, 32, 0.35), 0 0 0 1px rgba(218, 165, 32, 0.5)' : '0 10px 30px rgba(41, 121, 255, 0.25)')
                            : '0 4px 12px rgba(0,0,0,0.12)',
                          transform: selectedIdea?.title === idea.title ? 'translateY(-2px)' : 'none',
                          padding: '1.5rem'
                        }}
                      >
                        {/* Badge positioned at top right */}
                        <div className="flex justify-end mb-4">
                          <Badge variant={idea.angle}>
                            {idea.angle.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        
                        {/* Title - matching business card style */}
                        <h4 
                          className="font-bold mb-4 transition-colors duration-500" 
                          style={{ 
                            color: selectedIdea?.title === idea.title 
                              ? (userType === 'creator' ? '#DAA520' : 'var(--primary)')
                              : 'var(--text-primary)',
                            fontSize: '1.125rem',
                            lineHeight: '1.4',
                            letterSpacing: '0',
                            fontWeight: '700'
                          }}
                        >
                          {idea.title}
                        </h4>
                        
                        {/* Description - matching business card style */}
                        <p 
                          className="leading-relaxed" 
                          style={{ 
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                            letterSpacing: '0',
                            margin: 0
                          }}
                        >
                          {idea.description}
                        </p>
                        
                        {/* Selected indicator */}
                        {selectedIdea?.title === idea.title && (
                          <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg" style={{ 
                            background: userType === 'creator' 
                              ? 'linear-gradient(135deg, #DAA520, #F4D03F)'
                              : 'linear-gradient(135deg, #2979FF, #4A9FFF)',
                            boxShadow: userType === 'creator'
                              ? '0 4px 12px rgba(218, 165, 32, 0.5)'
                              : '0 4px 12px rgba(41, 121, 255, 0.5)'
                          }}>
                            <span className="text-white text-xl font-bold">✓</span>
                          </div>
                        )}
                      </div>
                    ))}
                    </div>
                  )}

                  {/* Generate More Ideas Button - Floating */}
                  <div className="mb-6 flex items-center justify-end gap-4">
                    <button
                      onClick={async () => {
                        // Check if user has exceeded free limit (2 free generates)
                        if (generateIdeasCount >= 2 && !isPro) {
                          setModalState({
                            isOpen: true,
                            title: "Pro Feature",
                            message: "You've used your 2 free idea generations. Upgrade to PostReady Pro for unlimited video ideas?",
                            type: 'confirm',
                            onConfirm: scrollToPremium,
                            confirmText: "Upgrade Now"
                          });
                          return;
                        }

                        // Generate ideas with smooth animation
                        if (!businessInfo.businessName) {
                          showNotification("Please fill in your business information first.", "error", "Error");
                          return;
                        }
                        
                        setIsRewriting(true);
                        setIdeasAnimation('fadeOut');
                        
                        try {
                          // Wait for fade out animation
                          await new Promise(resolve => setTimeout(resolve, 300));
                          
                          // Show loading state
                          setIsGeneratingIdeas(true);
                          
                          const response = await fetch("/api/research-business", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ businessInfo }),
                          });

                          if (!response.ok) {
                            let errorMessage = `Failed to generate more ideas: ${response.status} ${response.statusText}`;
                            try {
                              const errorText = await response.text();
                              try {
                                const errorData = JSON.parse(errorText);
                                errorMessage = errorData.error || errorMessage;
                              } catch {
                                errorMessage = errorText || errorMessage;
                              }
                            } catch {
                              // Use default error message
                            }
                            console.error("API Error:", errorMessage);
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
                          
                          console.log("✅ Generated", data.research.contentIdeas.length, "new contextual ideas");
                          
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
                            setGenerateIdeasCount(prev => prev + 1);
                          }
                          
                          // Start fade in animation
                          setIdeasAnimation('fadeIn');
                          
                          // Show success notification
                          showNotification("New video ideas generated!", "success", "Success");
                          
                          // Reset animation after fade in completes
                          setTimeout(() => {
                            setIdeasAnimation('idle');
                          }, 500);
                        } catch (error) {
                          console.error("Error generating more ideas:", error);
                          showNotification("Failed to generate more ideas. Please try again.", "error", "Error");
                          setIdeasAnimation('idle');
                          setIsGeneratingIdeas(false);
                        } finally {
                          setIsRewriting(false);
                        }
                      }}
                      disabled={isRewriting || isGeneratingIdeas}
                      className={`px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 shadow-2xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 relative overflow-hidden ${
                        isRewriting || isGeneratingIdeas
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "text-white"
                      }`}
                      style={!isRewriting && !isGeneratingIdeas ? { 
                        background: 'linear-gradient(135deg, #2979FF 0%, #4A9FFF 50%, #6FFFD2 100%)',
                        border: '2px solid rgba(111, 255, 210, 0.8)',
                        boxShadow: '0 8px 25px rgba(41, 121, 255, 0.5), 0 0 40px rgba(111, 255, 210, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                      } : {}}
                      onMouseEnter={(e) => {
                        if (!isRewriting && !isGeneratingIdeas) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #1e5dd9 0%, #2979FF 50%, #4A9FFF 100%)';
                          e.currentTarget.style.borderColor = 'rgba(111, 255, 210, 1)';
                          e.currentTarget.style.boxShadow = '0 12px 35px rgba(41, 121, 255, 0.6), 0 0 60px rgba(111, 255, 210, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                          e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isRewriting && !isGeneratingIdeas) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #2979FF 0%, #4A9FFF 50%, #6FFFD2 100%)';
                          e.currentTarget.style.borderColor = 'rgba(111, 255, 210, 0.8)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(41, 121, 255, 0.5), 0 0 40px rgba(111, 255, 210, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                          e.currentTarget.style.transform = 'scale(1) translateY(0)';
                        }
                      }}
                    >
                      {isRewriting ? (
                        "Generating..."
                      ) : generateIdeasCount >= 2 && !isPro ? (
                        <>
                          <span className="mr-2">🔒</span>
                          Pro: Unlimited Ideas
                        </>
                      ) : isPro ? (
                        <>
                          <span className="mr-2">🎬</span>
                          Generate More Ideas
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🎬</span>
                          Generate More Ideas
                        </>
                      )}
                    </button>
                  </div>

                  {/* Guide AI Button for Video Ideas */}
                  <div className="mb-6 flex items-center justify-center">
                    <div className="relative guide-ai-ideas-container">
                      <button
                        onClick={() => {
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
                          setShowGuideAIForIdeas(!showGuideAIForIdeas);
                        }}
                        disabled={guideAIForIdeasCount >= 3 && !isPro}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 flex items-center gap-2 border-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          guideAIForIdeasCount >= 3 && !isPro ? '' : ''
                        }`}
                        style={guideAIForIdeasCount >= 3 && !isPro ? {
                          backgroundColor: 'transparent',
                          borderColor: '#94a3b8',
                          color: '#94a3b8'
                        } : { 
                          backgroundColor: 'transparent',
                          borderColor: userType === 'creator' ? '#DAA520' : '#2979FF',
                          color: userType === 'creator' ? '#DAA520' : '#2979FF'
                        }}
                        title={!isPro && guideAIForIdeasCount < 3 ? `${3 - guideAIForIdeasCount} Guide AI uses left` : ''}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Guide AI
                        {!isPro && guideAIForIdeasCount < 3 && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                            backgroundColor: userType === 'creator' ? 'rgba(218, 165, 32, 0.15)' : 'rgba(41, 121, 255, 0.15)',
                            color: userType === 'creator' ? '#DAA520' : '#2979FF'
                          }}>
                            {3 - guideAIForIdeasCount}
                          </span>
                        )}
                      </button>
                      {showGuideAIForIdeas && (
                        <div 
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 rounded-lg shadow-2xl border-2 p-4 z-50 guide-ai-ideas-container"
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: userType === 'creator' ? 'rgba(218, 165, 32, 0.3)' : 'rgba(41, 121, 255, 0.3)',
                            boxShadow: userType === 'creator' 
                              ? '0 10px 40px rgba(218, 165, 32, 0.2)' 
                              : '0 10px 40px rgba(41, 121, 255, 0.2)'
                          }}
                        >
                          <div className="mb-3">
                            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                              Tell the AI how to adjust the video ideas:
                            </label>
                            <textarea
                              value={aiGuidanceForIdeas}
                              onChange={(e) => setAiGuidanceForIdeas(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  if (aiGuidanceForIdeas.trim() && !isGeneratingIdeas) {
                                    handleGenerateIdeasWithGuidance(aiGuidanceForIdeas.trim());
                                  }
                                }
                              }}
                              placeholder="e.g., 'Make them more casual and fun', 'Focus on behind-the-scenes content', 'Make them shorter and simpler', 'Add more educational tips'"
                              rows={3}
                              className="w-full px-3 py-2 rounded-lg border-2 resize-none focus:outline-none text-sm"
                              style={{
                                backgroundColor: theme === 'dark' ? 'rgba(30, 37, 50, 0.85)' : 'white',
                                borderColor: userType === 'creator' ? 'rgba(218, 165, 32, 0.25)' : 'rgba(41, 121, 255, 0.25)',
                                color: theme === 'dark' ? 'var(--text-primary)' : '#1a1a1a'
                              }}
                              onFocus={(e) => {
                                e.target.style.boxShadow = userType === 'creator' 
                                  ? '0 0 0 2px rgba(218, 165, 32, 0.5)' 
                                  : '0 0 0 2px rgba(41, 121, 255, 0.5)';
                              }}
                              onBlur={(e) => {
                                e.target.style.boxShadow = 'none';
                              }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (aiGuidanceForIdeas.trim()) {
                                  if (!isPro) {
                                    setGuideAIForIdeasCount(prev => prev + 1);
                                  }
                                  handleGenerateIdeasWithGuidance(aiGuidanceForIdeas.trim());
                                }
                              }}
                              disabled={!aiGuidanceForIdeas.trim() || isGeneratingIdeas}
                              className="flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ 
                                backgroundColor: userType === 'creator' ? '#DAA520' : '#2979FF'
                              }}
                            >
                              Apply & Generate
                            </button>
                            <button
                              onClick={() => {
                                setShowGuideAIForIdeas(false);
                                setAiGuidanceForIdeas("");
                              }}
                              className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 border-2"
                              style={{
                                borderColor: userType === 'creator' ? '#DAA520' : '#2979FF',
                                color: userType === 'creator' ? '#DAA520' : '#2979FF',
                                backgroundColor: 'transparent'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 border-2 rounded-xl px-6 py-3 font-bold transition-all duration-500 shadow-sm hover:shadow-md hover:scale-105"
                      style={{
                        borderColor: userType === 'creator' ? '#DAA520' : 'var(--primary)',
                        color: userType === 'creator' ? '#DAA520' : 'var(--primary)',
                        backgroundColor: userType === 'creator' 
                          ? 'rgba(218, 165, 32, 0.05)'
                          : 'rgba(41, 121, 255, 0.05)'
                      }}
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="flex-1 rounded-xl px-6 py-3 font-bold transition-all duration-500 shadow-md hover:shadow-lg hover:scale-105"
                      style={{
                        background: userType === 'creator'
                          ? 'linear-gradient(to right, #DAA520, #F4D03F)'
                          : 'linear-gradient(to right, #2979FF, #6FFFD2)',
                        color: userType === 'creator' ? '#1A1F2E' : 'white'
                      }}
                    >
                      {userType === 'business' ? 'Next: Record Video →' : 'Next: Create Content →'}
                    </button>
                  </div>
                </div>
              )}


              {/* Step 3: Record Video */}
              {currentStep === "record-video" && selectedIdea && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-6">🎥</div>
                  <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--secondary)' }}>
                    Time to Record Your Video!
                  </h2>
                  
                  <div className="max-w-2xl mx-auto mb-8">
                    <div className="border-2 rounded-lg p-6 mb-4" style={{ 
                      backgroundColor: userType === 'creator' 
                        ? 'rgba(218, 165, 32, 0.1)'
                        : 'rgba(99, 102, 241, 0.1)',
                      borderColor: userType === 'creator'
                        ? 'rgba(218, 165, 32, 0.3)'
                        : 'rgba(99, 102, 241, 0.3)'
                    }}>
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Your Selected Idea:
                      </h3>
                      <p className="text-lg font-medium mb-2" style={{ 
                        color: userType === 'creator' ? '#DAA520' : 'var(--primary)'
                      }}>
                        {selectedIdea.title}
                      </p>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        {selectedIdea.description}
                      </p>
                    </div>

                    {/* Regenerate Idea Button */}
                    <div className="mb-6">
                      <button
                        onClick={handleRegenerateIdea}
                        className={`w-full px-4 py-3 rounded-lg font-bold transition-all shadow-sm hover:shadow-md hover:scale-105 ${
                          regenerateCount >= 2 && !isPro
                            ? userType === 'creator'
                              ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600"
                              : "bg-gradient-to-r from-amber-500 to-blue-600 text-white hover:from-amber-600 hover:to-blue-700"
                            : ""
                        }`}
                        style={regenerateCount < 2 || isPro ? {
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          borderColor: userType === 'creator' ? '#DAA520' : '#2563eb',
                          color: userType === 'creator' ? '#DAA520' : '#2563eb',
                          backgroundColor: userType === 'creator' 
                            ? 'rgba(218, 165, 32, 0.05)'
                            : 'rgba(37, 99, 235, 0.05)'
                        } : {}}
                      >
                        {regenerateCount >= 2 && !isPro
                          ? "🔒 Pro: Unlimited Ideas"
                          : <span className="flex items-center justify-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Regenerate Idea
                            </span>}
                      </button>
                      {regenerateCount >= 2 && !isPro && (
                        <p className="text-xs text-gray-600 text-center mt-2">
                          You've used your 2 free regenerations
                        </p>
                      )}
                      {regenerateCount > 0 && regenerateCount < 2 && !isPro && (
                        <p className="text-xs text-gray-600 text-center mt-2">
                          {2 - regenerateCount} free regeneration{2 - regenerateCount !== 1 ? 's' : ''} remaining
                        </p>
                      )}
                    </div>

                    {/* Recording Instructions - Simplified */}
                    <div className="rounded-xl p-8 mb-8 border-2 transition-all duration-500 text-center" style={{
                      background: userType === 'creator'
                        ? 'linear-gradient(135deg, rgba(218, 165, 32, 0.08) 0%, rgba(244, 208, 63, 0.08) 100%)'
                        : 'linear-gradient(135deg, rgba(41, 121, 255, 0.05) 0%, rgba(111, 255, 210, 0.05) 100%)',
                      borderColor: userType === 'creator' 
                        ? 'rgba(218, 165, 32, 0.3)'
                        : 'rgba(41, 121, 255, 0.2)'
                    }}>
                      <div className="flex flex-col items-center">
                        <span className="text-5xl mb-4">{userType === 'creator' ? '🎬' : '📱'}</span>
                        <h4 className="font-bold text-2xl mb-4 transition-colors duration-500" style={{ 
                          color: userType === 'creator' ? '#DAA520' : 'var(--secondary)' 
                        }}>
                          {userType === 'business' ? 'Ready to Record?' : 'Ready to Create?'}
                        </h4>
                        <p className="text-lg mb-2 max-w-xl" style={{ color: 'var(--text-primary)' }}>
                          {userType === 'business'
                            ? <>Research shows that users prefer <span className="font-semibold" style={{ color: '#2979FF' }}>raw phone video</span> over heavily edited content.</>
                            : <>Research repeatedly confirms that <span className="font-semibold transition-colors duration-500" style={{ color: userType === 'creator' ? '#DAA520' : '#2979FF' }}>authenticity drives engagement</span> faster than any other social media tactic.</>
                          }
                        </p>
                        <div className="mt-5 pt-5 border-t-2 transition-colors duration-500" style={{
                          borderColor: userType === 'creator'
                            ? 'rgba(218, 165, 32, 0.2)'
                            : 'rgba(41, 121, 255, 0.15)'
                        }}>
                          <p className="text-base flex items-center justify-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <span className="text-xl">💪</span>
                            <span>{userType === 'business'
                              ? "Don't overthink it — hit record and come back when you're done!"
                              : "Go record your video, then come back to this page"
                            }</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 max-w-md mx-auto">
                    <button
                      onClick={handlePreviousStep}
                      className="flex-1 border-2 rounded-xl px-6 py-3 font-bold transition-all duration-500 shadow-sm hover:shadow-md hover:scale-105"
                      style={{
                        borderColor: userType === 'creator' ? '#DAA520' : 'var(--primary)',
                        color: userType === 'creator' ? '#DAA520' : 'var(--primary)',
                        backgroundColor: userType === 'creator' 
                          ? 'rgba(218, 165, 32, 0.05)'
                          : 'rgba(41, 121, 255, 0.05)'
                      }}
                    >
                      ← Change Idea
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="flex-1 rounded-xl px-6 py-3 font-bold transition-all duration-500 shadow-md hover:shadow-lg hover:scale-105"
                      style={{
                        background: userType === 'creator'
                          ? 'linear-gradient(to right, #DAA520, #F4D03F)'
                          : 'linear-gradient(to right, #2979FF, #6FFFD2)',
                        color: userType === 'creator' ? '#1A1F2E' : 'white'
                      }}
                    >
                      {userType === 'business' ? "I'm Done Recording! →" : "I'm Done Creating! →"}
                    </button>
                  </div>
                </div>
              )}

              {/* Generating Caption Loading Screen with Progress */}
              {currentStep === "generating-caption" && (
                <LoadingProgress />
              )}

              {/* Step 4: Post Details */}
              {currentStep === "post-details" && (
                <div className="max-w-4xl mx-auto animate-fade-in" style={{
                  animation: 'fadeInUp 0.8s ease-out forwards',
                  opacity: 0
                }}>
                  <h2 className="text-3xl font-bold mb-2" style={{ 
                    color: 'var(--secondary)',
                    animation: 'fadeInUp 0.8s ease-out 0.1s forwards',
                    opacity: 0
                  }}>
                    Your Post is Ready! 🎉
                  </h2>
                  <p className="mb-8" style={{ 
                    color: 'var(--text-secondary)',
                    animation: 'fadeInUp 0.8s ease-out 0.2s forwards',
                    opacity: 0
                  }}>
                    Copy your caption and post when the time is right
                  </p>

                  {!postDetails ? (
                    <div className="text-center py-12">
                      <div className="inline-block mb-6">
                        <div className="w-16 h-16 border-4 rounded-full animate-spin" style={{ 
                          borderColor: userType === 'creator' ? 'rgba(218, 165, 32, 0.2)' : 'rgba(41, 121, 255, 0.2)',
                          borderTopColor: userType === 'creator' ? '#DAA520' : '#2979FF'
                        }}></div>
                      </div>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        Generating your caption...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-5" style={{
                        animation: 'fadeInUp 0.8s ease-out 0.3s forwards',
                        opacity: 0
                      }}>
                        {/* Best Times to Post */}
                        <div className="rounded-xl p-5 border-2" style={{ 
                          background: userType === 'creator'
                            ? 'linear-gradient(135deg, rgba(218, 165, 32, 0.08) 0%, rgba(244, 208, 63, 0.08) 100%)'
                            : 'linear-gradient(135deg, rgba(41, 121, 255, 0.05) 0%, rgba(111, 255, 210, 0.05) 100%)',
                          borderColor: userType === 'creator' ? 'rgba(218, 165, 32, 0.3)' : 'rgba(41, 121, 255, 0.2)',
                          animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
                          opacity: 0
                        }}>
                          <h3 className="font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
                            <span className="text-2xl mr-2">📅</span>
                            Best Times to Post
                          </h3>
                          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                            Based on our analysis of the {businessInfo.location} market...
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            {/* Morning */}
                            <div className="relative group">
                              <div className="rounded-lg p-3 text-center transition-all hover:scale-105 cursor-help" style={{ 
                                background: userType === 'creator' ? 'rgba(218, 165, 32, 0.08)' : 'rgba(41, 121, 255, 0.08)',
                                border: `1px solid ${userType === 'creator' ? 'rgba(218, 165, 32, 0.2)' : 'rgba(41, 121, 255, 0.2)'}`
                              }}>
                                <div className="font-bold text-sm mb-1" style={{ color: userType === 'creator' ? '#DAA520' : '#2979FF' }}>Morning</div>
                                <div className="text-sm" style={{ color: 'var(--text-primary)' }}>8am - 10am</div>
                              </div>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl">
                                  <div className="font-bold mb-1">☀️ Morning Rush</div>
                                  <div className="text-gray-300">
                                    People check social media during breakfast and commutes. Perfect for catching early birds before their day gets busy.
                                  </div>
                                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                                </div>
                              </div>
                            </div>

                            {/* Afternoon */}
                            <div className="relative group">
                              <div className="rounded-lg p-3 text-center transition-all hover:scale-105 cursor-help" style={{ 
                                background: userType === 'creator' ? 'rgba(218, 165, 32, 0.08)' : 'rgba(41, 121, 255, 0.08)',
                                border: `1px solid ${userType === 'creator' ? 'rgba(218, 165, 32, 0.2)' : 'rgba(41, 121, 255, 0.2)'}`
                              }}>
                                <div className="font-bold text-sm mb-1" style={{ color: userType === 'creator' ? '#DAA520' : '#2979FF' }}>Afternoon</div>
                                <div className="text-sm" style={{ color: 'var(--text-primary)' }}>2pm - 5pm</div>
                              </div>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl">
                                  <div className="font-bold mb-1">☕ Afternoon Break</div>
                                  <div className="text-gray-300">
                                    Lunch breaks and mid-day scrolling. High engagement as people take mental breaks from work or daily activities.
                                  </div>
                                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                                </div>
                              </div>
                            </div>

                            {/* Evening */}
                            <div className="relative group">
                              <div className="rounded-lg p-3 text-center transition-all hover:scale-105 cursor-help" style={{ 
                                background: userType === 'creator' ? 'rgba(218, 165, 32, 0.08)' : 'rgba(41, 121, 255, 0.08)',
                                border: `1px solid ${userType === 'creator' ? 'rgba(218, 165, 32, 0.2)' : 'rgba(41, 121, 255, 0.2)'}`
                              }}>
                                <div className="font-bold text-sm mb-1" style={{ color: userType === 'creator' ? '#DAA520' : '#2979FF' }}>Evening</div>
                                <div className="text-sm" style={{ color: 'var(--text-primary)' }}>7pm - 8pm</div>
                              </div>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl">
                                  <div className="font-bold mb-1">🌙 Peak Engagement</div>
                                  <div className="text-gray-300">
                                    Prime time when people unwind after dinner. Highest engagement and reach as audiences relax and scroll through content.
                                  </div>
                                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Title */}
                        <div className="rounded-xl p-6 border-2 shadow-sm" style={{ 
                          background: userType === 'creator'
                            ? 'linear-gradient(135deg, rgba(218, 165, 32, 0.08) 0%, rgba(244, 208, 63, 0.08) 100%)'
                            : 'linear-gradient(135deg, rgba(41, 121, 255, 0.04) 0%, rgba(111, 255, 210, 0.04) 100%)',
                          borderColor: userType === 'creator' ? 'rgba(218, 165, 32, 0.3)' : 'rgba(41, 121, 255, 0.2)'
                        }}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold flex items-center text-lg" style={{ color: userType === 'creator' ? '#DAA520' : 'var(--secondary)' }}>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              Post Title
                            </h3>
                            <button
                              onClick={handleRewordTitle}
                              disabled={isRewordingTitle}
                              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 flex items-center gap-2 shadow-sm ${
                                isRewordingTitle
                                  ? "bg-gray-400 text-white cursor-not-allowed"
                                  : rewordTitleCount >= 3 && !isPro
                                  ? "text-white"
                                  : "text-white"
                              }`}
                              style={!isRewordingTitle ? {
                                backgroundColor: rewordTitleCount >= 3 && !isPro 
                                  ? '#94a3b8' 
                                  : userType === 'creator' ? '#DAA520' : '#2979FF'
                              } : {}}
                            >
                              {isRewordingTitle ? (
                                <>
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Rewording...
                                </>
                              ) : rewordTitleCount >= 3 && !isPro ? (
                                <>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                  </svg>
                                  Pro Only
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Reword
                                </>
                              )}
                            </button>
                          </div>
                          {!isPro && (
                            <p className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              {rewordTitleCount >= 3 
                                ? "You've used your 3 free rewords" 
                                : `${3 - rewordTitleCount} ${3 - rewordTitleCount === 1 ? 'use' : 'uses'} left`}
                            </p>
                          )}
                          <input
                            type="text"
                            value={postDetails.title}
                            onChange={(e) => {
                              const updatedDetails = { ...postDetails, title: e.target.value };
                              setPostDetails(updatedDetails);
                            }}
                            onBlur={async () => {
                              // Auto-save when user finishes editing
                              if (user && selectedIdea && postDetails) {
                                await saveCompletedPostToHistory(selectedIdea, postDetails);
                              }
                            }}
                            className={`border-2 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                              titleAnimation === 'fadeOut' ? 'animate-fade-out' : 
                              titleAnimation === 'fadeIn' ? 'animate-fade-in' : ''
                            }`}
                            style={{
                              backgroundColor: theme === 'dark' ? 'rgba(30, 37, 50, 0.85)' : 'white',
                              borderColor: 'rgba(41, 121, 255, 0.25)',
                              color: theme === 'dark' ? 'var(--text-primary)' : '#1a1a1a',
                              fontSize: '15px'
                            }}
                            placeholder="Enter your post title..."
                          />
                        </div>

                        {/* Caption with Hashtags */}
                        <div className="rounded-xl p-6 border-2 shadow-sm" style={{ 
                          background: userType === 'creator'
                            ? 'linear-gradient(135deg, rgba(218, 165, 32, 0.08) 0%, rgba(244, 208, 63, 0.08) 100%)'
                            : 'linear-gradient(135deg, rgba(41, 121, 255, 0.04) 0%, rgba(111, 255, 210, 0.04) 100%)',
                          borderColor: userType === 'creator' ? 'rgba(218, 165, 32, 0.3)' : 'rgba(41, 121, 255, 0.2)'
                        }}>
                          <h3 className="font-bold mb-4 flex items-center text-lg" style={{ color: userType === 'creator' ? '#DAA520' : 'var(--secondary)' }}>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Caption (Editable)
                          </h3>
                          <textarea
                            value={postDetails.caption}
                            onChange={(e) => {
                              const updatedDetails = { ...postDetails, caption: e.target.value };
                              setPostDetails(updatedDetails);
                            }}
                            onBlur={async (e) => {
                              // Remove focus ring
                              e.target.style.boxShadow = 'none';
                              // Auto-save when user finishes editing
                              if (user && selectedIdea && postDetails) {
                                await saveCompletedPostToHistory(selectedIdea, postDetails);
                              }
                            }}
                            rows={8}
                            className={`border-2 rounded-lg px-4 py-3 w-full focus:outline-none resize-vertical transition-all duration-300 ${
                              captionAnimation === 'fadeOut' ? 'animate-fade-out' : 
                              captionAnimation === 'typing' ? 'animate-typing' : ''
                            }`}
                            style={{
                              backgroundColor: theme === 'dark' ? 'rgba(30, 37, 50, 0.85)' : 'white',
                              borderColor: userType === 'creator' ? 'rgba(218, 165, 32, 0.25)' : 'rgba(41, 121, 255, 0.25)',
                              color: theme === 'dark' ? 'var(--text-primary)' : '#1a1a1a',
                              fontSize: '14.5px',
                              lineHeight: '1.6'
                            }}
                            onFocus={(e) => {
                              e.target.style.boxShadow = userType === 'creator' 
                                ? '0 0 0 2px rgba(218, 165, 32, 0.5)' 
                                : '0 0 0 2px rgba(41, 121, 255, 0.5)';
                            }}
                            placeholder="Your caption with hashtags will appear here..."
                          />
                          
                          {/* Action Buttons - Clean Compact Layout */}
                          <div className="flex flex-wrap gap-2 mt-4 justify-center">
                            <button
                              onClick={handleCopyToClipboard}
                              className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 text-white flex items-center gap-2"
                              style={{ backgroundColor: userType === 'creator' ? '#DAA520' : '#2979FF' }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy
                            </button>
                            
                            <div className="relative guide-ai-container">
                              <button
                                onClick={() => {
                                  if (guideAICount >= 2 && !isPro) {
                                    setModalState({
                                      isOpen: true,
                                      title: userType === 'creator' ? "Upgrade to Creator" : "Upgrade to PostReady Pro",
                                      message: userType === 'creator' 
                                        ? "You've used your 2 free Guide AI uses. Upgrade to Creator for unlimited Guide AI and more features!"
                                        : "You've used your 2 free Guide AI uses. Upgrade to PostReady Pro for unlimited Guide AI and more features!",
                                      type: 'confirm',
                                      onConfirm: scrollToPremium,
                                      confirmText: userType === 'creator' ? "View Creator Plan" : "View Pro Plan"
                                    });
                                    return;
                                  }
                                  setShowGuideAI(!showGuideAI);
                                }}
                                disabled={guideAICount >= 2 && !isPro}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 flex items-center gap-2 border-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                  guideAICount >= 2 && !isPro ? '' : ''
                                }`}
                                style={guideAICount >= 2 && !isPro ? {
                                  backgroundColor: 'transparent',
                                  borderColor: '#94a3b8',
                                  color: '#94a3b8'
                                } : { 
                                  backgroundColor: 'transparent',
                                  borderColor: userType === 'creator' ? '#DAA520' : '#2979FF',
                                  color: userType === 'creator' ? '#DAA520' : '#2979FF'
                                }}
                                title={!isPro && guideAICount < 2 ? `${2 - guideAICount} Guide AI uses left` : ''}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                Guide AI
                                {!isPro && guideAICount < 2 && (
                                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                                    backgroundColor: userType === 'creator' ? 'rgba(218, 165, 32, 0.15)' : 'rgba(41, 121, 255, 0.15)',
                                    color: userType === 'creator' ? '#DAA520' : '#2979FF'
                                  }}>
                                    {2 - guideAICount}
                                  </span>
                                )}
                              </button>
                              {showGuideAI && (
                                <div 
                                  className="absolute bottom-full left-0 mb-2 w-80 rounded-lg shadow-2xl border-2 p-4 z-50 guide-ai-container"
                                  style={{
                                    backgroundColor: 'var(--card-bg)',
                                    borderColor: userType === 'creator' ? 'rgba(218, 165, 32, 0.3)' : 'rgba(41, 121, 255, 0.3)',
                                    boxShadow: userType === 'creator' 
                                      ? '0 10px 40px rgba(218, 165, 32, 0.2)' 
                                      : '0 10px 40px rgba(41, 121, 255, 0.2)'
                                  }}
                                >
                                  <div className="mb-3">
                                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                      Tell the AI how to adjust the caption:
                                    </label>
                                    <textarea
                                      value={aiGuidance}
                                      onChange={(e) => setAiGuidance(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          if (aiGuidance.trim() && !isRewriting) {
                                            handleRewriteCaption(aiGuidance.trim());
                                          }
                                        }
                                      }}
                                      placeholder="e.g., 'Make it more casual', 'Add more emojis', 'Make it shorter', 'Focus on gaming'"
                                      rows={3}
                                      className="w-full px-3 py-2 rounded-lg border-2 resize-none focus:outline-none text-sm"
                                      style={{
                                        backgroundColor: theme === 'dark' ? 'rgba(30, 37, 50, 0.85)' : 'white',
                                        borderColor: userType === 'creator' ? 'rgba(218, 165, 32, 0.25)' : 'rgba(41, 121, 255, 0.25)',
                                        color: theme === 'dark' ? 'var(--text-primary)' : '#1a1a1a'
                                      }}
                                      onFocus={(e) => {
                                        e.target.style.boxShadow = userType === 'creator' 
                                          ? '0 0 0 2px rgba(218, 165, 32, 0.5)' 
                                          : '0 0 0 2px rgba(41, 121, 255, 0.5)';
                                      }}
                                      onBlur={(e) => {
                                        e.target.style.boxShadow = 'none';
                                      }}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        if (aiGuidance.trim()) {
                                          if (!isPro) {
                                            setGuideAICount(prev => prev + 1);
                                          }
                                          handleRewriteCaption(aiGuidance.trim());
                                        }
                                      }}
                                      disabled={!aiGuidance.trim() || isRewriting}
                                      className="flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                      style={{ 
                                        backgroundColor: userType === 'creator' ? '#DAA520' : '#2979FF'
                                      }}
                                    >
                                      Apply & Rewrite
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowGuideAI(false);
                                        setAiGuidance("");
                                      }}
                                      className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 border-2"
                                      style={{
                                        borderColor: userType === 'creator' ? '#DAA520' : '#2979FF',
                                        color: userType === 'creator' ? '#DAA520' : '#2979FF',
                                        backgroundColor: 'transparent'
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => handleRewriteCaption()}
                              disabled={isRewriting}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 flex items-center gap-2 ${
                                isRewriting
                                  ? "bg-gray-400 text-white cursor-not-allowed"
                                  : "text-white"
                              }`}
                              style={!isRewriting ? {
                                backgroundColor: rewriteCount >= 2 && !isPro 
                                  ? '#94a3b8' 
                                  : userType === 'creator' ? '#DAA520' : '#2979FF'
                              } : {}}
                              title={!isPro && rewriteCount < 2 ? `${2 - rewriteCount} rewrites left` : ''}
                            >
                              {isRewriting ? (
                                <>
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Rewriting...
                                </>
                              ) : rewriteCount >= 2 && !isPro ? (
                                <>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                  </svg>
                                  Pro Only
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Rewrite
                                  {!isPro && rewriteCount < 2 && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/20">
                                      {2 - rewriteCount}
                                    </span>
                                  )}
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={handleMoreHashtags}
                              disabled={isGeneratingHashtags || (hashtagCount >= 3 && !isPro)}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 flex items-center gap-2 border-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                              style={hashtagCount >= 3 && !isPro ? {
                                backgroundColor: 'transparent',
                                borderColor: '#94a3b8',
                                color: '#94a3b8'
                              } : {
                                backgroundColor: 'transparent',
                                borderColor: userType === 'creator' ? '#DAA520' : '#2979FF',
                                color: userType === 'creator' ? '#DAA520' : '#2979FF'
                              }}
                              title={!isPro && hashtagCount < 3 ? `${3 - hashtagCount} hashtag generations left` : ''}
                            >
                              {isGeneratingHashtags ? (
                                <>
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Generating...
                                </>
                              ) : hashtagCount >= 3 && !isPro ? (
                                <>
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                  </svg>
                                  Pro Only
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                  More Hashtags
                                  {!isPro && hashtagCount < 3 && (
                                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                                      backgroundColor: userType === 'creator' ? 'rgba(218, 165, 32, 0.15)' : 'rgba(41, 121, 255, 0.15)',
                                      color: userType === 'creator' ? '#DAA520' : '#2979FF'
                                    }}>
                                      {3 - hashtagCount}
                                    </span>
                                  )}
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* User Notes Section (Only for signed-in users) */}
                        {user && (
                          <div className="mt-6">
                            <h3 className="font-bold mb-3 flex items-center text-base" style={{ color: 'var(--text-primary)' }}>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Personal Notes
                            </h3>
                            <textarea
                              value={userNotes}
                              onChange={(e) => setUserNotes(e.target.value)}
                              placeholder="Add personal notes about this post idea... (optional)"
                              rows={4}
                              className="w-full rounded-lg px-4 py-3 text-sm resize-none border-2 focus:outline-none focus:ring-2 transition-all"
                              style={{
                                backgroundColor: 'var(--input-bg)',
                                borderColor: 'var(--card-border)',
                                color: 'var(--text-primary)'
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = userType === 'creator' ? '#DAA520' : '#2979FF';
                                e.target.style.boxShadow = userType === 'creator' 
                                  ? '0 0 0 3px rgba(218, 165, 32, 0.1)' 
                                  : '0 0 0 3px rgba(41, 121, 255, 0.1)';
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = 'var(--card-border)';
                                e.target.style.boxShadow = 'none';
                              }}
                            />
                          </div>
                        )}

                        {/* Save to History Button (Only for signed-in users) */}
                        {user && (
                          <div className="pt-2">
                            <button
                              onClick={handleSaveToHistory}
                              disabled={isSavingToHistory || isSavedToHistory}
                              className="w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-105 border-2 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              style={isSavedToHistory ? {
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                borderColor: '#10b981',
                                color: 'white'
                              } : {
                                background: userType === 'creator' 
                                  ? 'linear-gradient(135deg, #DAA520 0%, #F4D03F 100%)'
                                  : 'linear-gradient(135deg, #2979FF 0%, #4A9FFF 100%)',
                                borderColor: userType === 'creator' ? '#DAA520' : '#2979FF',
                                color: 'white'
                              }}
                            >
                              {isSavingToHistory ? (
                                <>
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Saving...
                                </>
                              ) : isSavedToHistory ? (
                                <>
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Saved to History
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                  </svg>
                                  Save to History
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Back Button */}
                        <div className="pt-2">
                          <button
                            onClick={handlePreviousStep}
                            className="w-full px-4 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-105 border-2 flex items-center justify-center gap-2 shadow-sm"
                            style={{ 
                              borderColor: 'rgba(41, 121, 255, 0.3)',
                              color: '#2979FF',
                              backgroundColor: 'rgba(41, 121, 255, 0.02)'
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Social Media Page Analyzer */}
        {currentStep === "form" && (
          <div 
            draggable={!!(isReorderMode && user)}
            onDragStart={() => handleDragStart('page-analyzer')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, 'page-analyzer')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'page-analyzer')}
            onClick={() => !isReorderMode && collapsedModules.has('page-analyzer') && toggleModuleCollapse('page-analyzer')}
            className="rounded-2xl shadow-lg border scroll-mt-4 relative overflow-hidden"
            style={{
              transition: 'max-height 1.5s cubic-bezier(0.65, 0, 0.35, 1), padding 1.5s cubic-bezier(0.65, 0, 0.35, 1), margin-bottom 0.3s ease-out, transform 0.3s ease-out, box-shadow 0.3s ease-out, border-color 0.3s ease-out',
              marginBottom: collapsedModules.has('page-analyzer') ? '1rem' : '2.5rem',
              backgroundColor: theme === 'dark' 
                ? 'rgba(20, 184, 166, 0.08)' 
                : 'rgba(20, 184, 166, 0.03)',
              borderColor: dragOverModule === 'page-analyzer'
                ? '#14B8A6'
                : (isReorderMode && user)
                  ? (theme === 'dark' ? 'rgba(20, 184, 166, 0.6)' : 'rgba(20, 184, 166, 0.5)')
                  : (theme === 'dark'
                    ? 'rgba(20, 184, 166, 0.4)'
                    : 'rgba(20, 184, 166, 0.3)'),
              boxShadow: draggedModule === 'page-analyzer'
                ? '0 16px 48px rgba(20, 184, 166, 0.45), 0 0 0 2px rgba(20, 184, 166, 0.6), 0 0 20px rgba(20, 184, 166, 0.3)'
                : dragOverModule === 'page-analyzer'
                  ? '0 0 0 3px rgba(20, 184, 166, 0.5), 0 0 20px rgba(20, 184, 166, 0.3)'
                  : (isReorderMode && user)
                    ? (theme === 'dark'
                      ? '0 8px 32px rgba(20, 184, 166, 0.4), 0 0 0 2px rgba(20, 184, 166, 0.5), 0 0 20px rgba(20, 184, 166, 0.25)'
                      : '0 8px 32px rgba(20, 184, 166, 0.3), 0 0 0 2px rgba(20, 184, 166, 0.4), 0 0 15px rgba(20, 184, 166, 0.2)')
                    : (theme === 'dark'
                      ? '0 4px 20px rgba(20, 184, 166, 0.25), 0 0 15px rgba(20, 184, 166, 0.15)'
                      : '0 4px 20px rgba(20, 184, 166, 0.15), 0 0 10px rgba(20, 184, 166, 0.1)'),
              cursor: (isReorderMode && user) ? (draggedModule === 'page-analyzer' ? 'grabbing' : 'grab') : (collapsedModules.has('page-analyzer') ? 'pointer' : 'default'),
              opacity: 1,
              transform: draggedModule === 'page-analyzer' 
                ? 'scale(1.05) rotate(2deg)' 
                : 'scale(1)',
              padding: collapsedModules.has('page-analyzer') ? '1rem' : '1.5rem',
              zIndex: draggedModule === 'page-analyzer' ? 1000 : 'auto',
              maxHeight: collapsedModules.has('page-analyzer') ? '80px' : 'none',
              overflow: collapsedModules.has('page-analyzer') ? 'hidden' : 'visible',
            }}
          >
            {/* Drop Indicators */}
            {dragOverModule === 'page-analyzer' && dropPosition === 'before' && draggedModule !== 'page-analyzer' && (
              <div 
                className="absolute -top-2 left-0 right-0 h-1 rounded-full"
                style={{
                  backgroundColor: '#14B8A6',
                  boxShadow: '0 0 16px rgba(20, 184, 166, 0.8)',
                  zIndex: 1001,
                }}
              />
            )}
            
            {dragOverModule === 'page-analyzer' && dropPosition === 'after' && draggedModule !== 'page-analyzer' && (
              <div 
                className="absolute -bottom-2 left-0 right-0 h-1 rounded-full"
                style={{
                  backgroundColor: '#14B8A6',
                  boxShadow: '0 0 16px rgba(20, 184, 166, 0.8)',
                  zIndex: 1001,
                }}
              />
            )}

            {/* Collapsed Bar View */}
            <div 
              className="flex items-center justify-between"
              style={{
                transition: 'opacity 0.8s ease-in-out',
                opacity: collapsedModules.has('page-analyzer') ? 1 : 0,
                pointerEvents: collapsedModules.has('page-analyzer') ? 'auto' : 'none',
                position: collapsedModules.has('page-analyzer') ? 'relative' : 'absolute',
                visibility: collapsedModules.has('page-analyzer') ? 'visible' : 'hidden',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <h3 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--secondary)' }}>
                  Page Analyzer
                </h3>
              </div>
              <span className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                {isReorderMode ? 'Drag to reorder' : 'Click to expand'}
              </span>
            </div>

            {/* Expanded Content */}
            <div
              style={{
                transition: 'opacity 0.8s ease-in-out',
                opacity: collapsedModules.has('page-analyzer') ? 0 : 1,
                pointerEvents: collapsedModules.has('page-analyzer') ? 'none' : 'auto',
                position: collapsedModules.has('page-analyzer') ? 'absolute' : 'relative',
                visibility: collapsedModules.has('page-analyzer') ? 'hidden' : 'visible',
              }}
            >
              {/* Minimize Button */}
              {!isReorderMode && (
                <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleModuleCollapse('page-analyzer');
                }}
                className="absolute top-1 right-1 sm:top-2 sm:right-2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl transition-all hover:scale-110 active:scale-95"
                style={{ 
                  backgroundColor: 'rgba(41, 121, 255, 0.15)',
                  border: '2px solid rgba(41, 121, 255, 0.4)',
                  color: '#2979FF',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(41, 121, 255, 0.3)'
                }}
                title="Minimize"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                  </svg>
                </button>
              )}

              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-2" style={{ 
                    color: '#14B8A6',
                    textShadow: '0 0 20px rgba(20, 184, 166, 0.3)'
                  }}>
                    📊 Social Media Page Analyzer
                  </h2>
                  <p className="text-sm sm:text-base" style={{ 
                    color: theme === 'dark' ? 'rgba(20, 184, 166, 0.8)' : 'rgba(20, 184, 166, 0.9)'
                  }}>
                    Upload a screenshot of any social media page to get AI-powered insights and actionable improvements
                  </p>
                  
                  {/* Privacy Notice */}
                  <div className="mt-4 p-3 rounded-lg text-xs text-center" style={{
                    backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    color: 'var(--text-secondary)'
                  }}>
                    <p className="flex items-center justify-center gap-2">
                      <span>🔒</span>
                      <span>
                        By using this tool, you agree that we may store extracted data to improve our services. See our{' '}
                        <a href="/privacy" target="_blank" className="underline hover:opacity-70" style={{ color: 'rgb(99, 102, 241)' }}>
                          Privacy Policy
                        </a>
                        {' '}for details.
                      </span>
                    </p>
                  </div>
                </div>

                {/* Upload Section */}
                {!pageAnalysis && (
                  <div className="space-y-4">
                    <div 
                      className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-teal-500 transition-all"
                      style={{
                        borderColor: theme === 'dark' ? 'rgba(20, 184, 166, 0.4)' : 'rgba(20, 184, 166, 0.3)',
                        backgroundColor: theme === 'dark' ? 'rgba(20, 184, 166, 0.05)' : 'rgba(20, 184, 166, 0.02)'
                      }}
                      onClick={() => document.getElementById('page-screenshot-upload')?.click()}
                    >
                      {pageScreenshotPreview ? (
                        <div className="space-y-4">
                          <img 
                            src={pageScreenshotPreview} 
                            alt="Preview" 
                            className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
                          />
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Click to change screenshot
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-6xl">📸</div>
                          <div>
                            <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                              Upload Screenshot
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                              PNG, JPG, or WEBP (max 10MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      id="page-screenshot-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            showNotification("File size must be less than 10MB", "error", "Error");
                            return;
                          }
                          setPageScreenshot(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPageScreenshotPreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />

                    {pageScreenshotPreview && (
                      <button
                        onClick={async () => {
                          if (!pageScreenshotPreview) return;
                          
                          setIsAnalyzingPage(true);
                          try {
                            const response = await fetch('/api/analyze-page', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                imageData: pageScreenshotPreview,
                              }),
                            });

                            if (!response.ok) {
                              throw new Error('Failed to analyze page');
                            }

                            const data = await response.json();
                            setPageAnalysis(data.analysis);
                            
                            // Update user info from AI extraction
                            if (data.userInfo) {
                              setPageUserInfo(data.userInfo);
                            }
                            
                            // Save analysis data to database with screenshot
                            try {
                              await fetch('/api/save-page-analysis', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  userId: user?.id || null,
                                  userInfo: data.userInfo || pageUserInfo,
                                  analysis: data.analysis,
                                  screenshotData: pageScreenshotPreview, // Send the base64 image data
                                }),
                              });
                              console.log('Analysis and screenshot saved to database');
                            } catch (saveError) {
                              console.error('Error saving analysis data:', saveError);
                              // Don't notify user about save error
                            }
                            
                            showNotification("Analysis complete!", "success", "Success");
                          } catch (error) {
                            console.error('Error analyzing page:', error);
                            showNotification("Failed to analyze page. Please try again.", "error", "Error");
                          } finally {
                            setIsAnalyzingPage(false);
                          }
                        }}
                        disabled={isAnalyzingPage}
                        className="w-full px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        style={{
                          background: isAnalyzingPage 
                            ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                            : 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                          color: 'white',
                          boxShadow: '0 4px 15px rgba(20, 184, 166, 0.4)',
                        }}
                      >
                        {isAnalyzingPage ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Analyzing...
                          </span>
                        ) : (
                          '🔍 Analyze Page'
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Analysis Results */}
                {pageAnalysis && (
                  <div className="space-y-4">
                    {/* Extracted User Info Display */}
                    {(pageUserInfo.username || pageUserInfo.fullName) && (
                      <div 
                        className="p-4 rounded-xl"
                        style={{
                          backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                        }}
                      >
                        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                          📊 Detected Page Info
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          {pageUserInfo.username && (
                            <div>
                              <span className="text-xs opacity-70">Username:</span>
                              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pageUserInfo.username}</p>
                            </div>
                          )}
                          {pageUserInfo.fullName && (
                            <div>
                              <span className="text-xs opacity-70">Name:</span>
                              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pageUserInfo.fullName}</p>
                            </div>
                          )}
                          {pageUserInfo.followerCount && (
                            <div>
                              <span className="text-xs opacity-70">Followers:</span>
                              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pageUserInfo.followerCount}</p>
                            </div>
                          )}
                          {pageUserInfo.postCount && (
                            <div>
                              <span className="text-xs opacity-70">Posts:</span>
                              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pageUserInfo.postCount}</p>
                            </div>
                          )}
                          {pageUserInfo.socialLink && (
                            <div className="col-span-2">
                              <span className="text-xs opacity-70">Profile:</span>
                              <a 
                                href={pageUserInfo.socialLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-semibold hover:underline block truncate"
                                style={{ color: 'rgb(99, 102, 241)' }}
                              >
                                {pageUserInfo.socialLink}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div 
                      className="p-6 rounded-xl"
                      style={{
                        backgroundColor: theme === 'dark' ? 'rgba(20, 184, 166, 0.1)' : 'rgba(20, 184, 166, 0.05)',
                        border: '1px solid rgba(20, 184, 166, 0.3)',
                      }}
                    >
                      <div className="whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                        {pageAnalysis}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => {
                          setPageAnalysis(null);
                          setPageScreenshot(null);
                          setPageScreenshotPreview("");
                          setPageUserInfo({
                            username: '',
                            fullName: '',
                            bioLinks: '',
                            followerCount: '',
                            postCount: '',
                            socialLink: '',
                          });
                        }}
                        className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          border: '2px solid var(--card-border)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        Analyze Another
                      </button>
                      <button
                        onClick={() => {
                          // Generate PDF
                          const pdf = new jsPDF();
                          const pageWidth = pdf.internal.pageSize.getWidth();
                          const pageHeight = pdf.internal.pageSize.getHeight();
                          const margin = 20;
                          const maxWidth = pageWidth - (margin * 2);
                          let yPosition = 20;

                          // Header Background
                          pdf.setFillColor(41, 121, 255);
                          pdf.rect(0, 0, pageWidth, 45, 'F');

                          // PostReady Branding
                          pdf.setTextColor(255, 255, 255);
                          pdf.setFontSize(26);
                          pdf.setFont('helvetica', 'bold');
                          pdf.text('PostReady', margin, 28);
                          
                          pdf.setFontSize(11);
                          pdf.setFont('helvetica', 'normal');
                          pdf.text('Social Media Page Analysis Report', margin, 37);

                          // Date
                          pdf.setFontSize(9);
                          const dateText = `Generated: ${new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}`;
                          const dateWidth = pdf.getTextWidth(dateText);
                          pdf.text(dateText, pageWidth - margin - dateWidth, 37);

                          yPosition = 60;

                          // Reset text color for content
                          pdf.setTextColor(0, 0, 0);

                          // Add User Information Section if available
                          if (pageUserInfo.username || pageUserInfo.fullName) {
                            pdf.setFillColor(245, 247, 250);
                            pdf.roundedRect(margin, yPosition - 5, maxWidth, 45, 2, 2, 'F');
                            
                            pdf.setFontSize(12);
                            pdf.setFont('helvetica', 'bold');
                            pdf.setTextColor(41, 121, 255);
                            pdf.text('PAGE INFORMATION', margin + 3, yPosition);
                            yPosition += 8;
                            
                            pdf.setFontSize(9);
                            pdf.setFont('helvetica', 'normal');
                            pdf.setTextColor(60, 60, 60);
                            
                            if (pageUserInfo.username) {
                              pdf.text(`Username: ${pageUserInfo.username}`, margin + 3, yPosition);
                              yPosition += 5;
                            }
                            if (pageUserInfo.fullName) {
                              pdf.text(`Name: ${pageUserInfo.fullName}`, margin + 3, yPosition);
                              yPosition += 5;
                            }
                            if (pageUserInfo.followerCount) {
                              pdf.text(`Followers: ${pageUserInfo.followerCount}`, margin + 3, yPosition);
                              yPosition += 5;
                            }
                            if (pageUserInfo.postCount) {
                              pdf.text(`Posts: ${pageUserInfo.postCount}`, margin + 3, yPosition);
                              yPosition += 5;
                            }
                            if (pageUserInfo.bioLinks) {
                              pdf.text(`Bio Links: ${pageUserInfo.bioLinks}`, margin + 3, yPosition);
                              yPosition += 5;
                            }
                            if (pageUserInfo.socialLink) {
                              pdf.setTextColor(41, 121, 255);
                              pdf.textWithLink(`Profile: ${pageUserInfo.socialLink}`, margin + 3, yPosition, { url: pageUserInfo.socialLink });
                              yPosition += 5;
                            }
                            
                            yPosition += 8;
                            pdf.setTextColor(0, 0, 0);
                          }

                          // Helper function to remove emojis and clean text
                          const cleanText = (text: string) => {
                            return text
                              .replace(/🎯|✨|⚠️|🚀|💡|📈|🎨|•/g, '')
                              .replace(/\*\*/g, '')
                              .trim();
                          };

                          // Process the analysis text
                          const lines = pageAnalysis.split('\n');
                          
                          lines.forEach((line: string) => {
                            // Check if we need a new page
                            if (yPosition > pageHeight - 30) {
                              pdf.addPage();
                              yPosition = 20;
                            }

                            const trimmedLine = line.trim();

                            // Skip separators and empty lines
                            if (trimmedLine === '' || trimmedLine === '---') {
                              yPosition += 3;
                              return;
                            }

                            // Section headers (detect by ** and emojis)
                            if (line.includes('**') && (line.includes('🎯') || line.includes('✨') || line.includes('⚠️') || line.includes('🚀') || line.includes('💡') || line.includes('📈') || line.includes('🎨'))) {
                              yPosition += 8;
                              
                              // Add a colored bar on the left
                              pdf.setFillColor(41, 121, 255);
                              pdf.rect(margin - 5, yPosition - 6, 3, 12, 'F');
                              
                              // Add a subtle background box
                              pdf.setFillColor(245, 247, 250);
                              pdf.roundedRect(margin, yPosition - 6, maxWidth, 12, 2, 2, 'F');
                              
                              // Section header text
                              pdf.setFontSize(13);
                              pdf.setFont('helvetica', 'bold');
                              pdf.setTextColor(41, 121, 255);
                              
                              const cleanLine = cleanText(line).toUpperCase();
                              pdf.text(cleanLine, margin + 3, yPosition);
                              
                              yPosition += 12;
                              pdf.setTextColor(0, 0, 0);
                            }
                            // Numbered action items
                            else if (line.match(/^\d+\.\s\*\*/)) {
                              pdf.setFontSize(10);
                              
                              // Extract number and text
                              const match = line.match(/^(\d+)\.\s\*\*(.*?)\*\*\s*-\s*(.*)/);
                              if (match) {
                                const [, number, title, description] = match;
                                
                                // Number circle with gradient effect
                                pdf.setFillColor(41, 121, 255);
                                pdf.circle(margin + 4, yPosition - 2, 4.5, 'F');
                                
                                // Inner circle for depth
                                pdf.setFillColor(60, 140, 255);
                                pdf.circle(margin + 4, yPosition - 2, 3.5, 'F');
                                
                                pdf.setTextColor(255, 255, 255);
                                pdf.setFontSize(9);
                                pdf.setFont('helvetica', 'bold');
                                const numWidth = pdf.getTextWidth(number);
                                pdf.text(number, margin + 4 - (numWidth / 2), yPosition + 0.8);
                                
                                // Title
                                pdf.setTextColor(0, 0, 0);
                                pdf.setFontSize(11);
                                pdf.setFont('helvetica', 'bold');
                                pdf.text(title.trim(), margin + 12, yPosition);
                                
                                // Description
                                yPosition += 6;
                                pdf.setFont('helvetica', 'normal');
                                pdf.setTextColor(60, 60, 60);
                                pdf.setFontSize(10);
                                const descWrapped = pdf.splitTextToSize(description.trim(), maxWidth - 12);
                                descWrapped.forEach((textLine: string) => {
                                  pdf.text(textLine, margin + 12, yPosition);
                                  yPosition += 5;
                                });
                                
                                yPosition += 3;
                                pdf.setTextColor(0, 0, 0);
                              }
                            }
                            // Bullet points (detect by • or starting with -)
                            else if (trimmedLine.startsWith('•') || (trimmedLine.startsWith('-') && !line.match(/^\d+\./))) {
                              pdf.setFontSize(10);
                              pdf.setFont('helvetica', 'normal');
                              pdf.setTextColor(40, 40, 40);
                              
                              // Bullet point circle
                              pdf.setFillColor(41, 121, 255);
                              pdf.circle(margin + 2.5, yPosition - 1.5, 1.8, 'F');
                              
                              const text = trimmedLine.replace(/^[•-]\s*/, '').trim();
                              const wrappedText = pdf.splitTextToSize(text, maxWidth - 10);
                              wrappedText.forEach((textLine: string, index: number) => {
                                pdf.text(textLine, margin + 8, yPosition);
                                if (index < wrappedText.length - 1) {
                                  yPosition += 5;
                                }
                              });
                              
                              yPosition += 7;
                              pdf.setTextColor(0, 0, 0);
                            }
                            // Regular paragraphs
                            else if (trimmedLine.length > 0) {
                              pdf.setFontSize(10);
                              pdf.setFont('helvetica', 'normal');
                              pdf.setTextColor(50, 50, 50);
                              
                              const wrappedText = pdf.splitTextToSize(trimmedLine, maxWidth);
                              wrappedText.forEach((textLine: string) => {
                                pdf.text(textLine, margin, yPosition);
                                yPosition += 5;
                              });
                              yPosition += 2;
                              pdf.setTextColor(0, 0, 0);
                            }
                          });

                          // Footer on every page
                          const totalPages = pdf.internal.pages.length - 1;
                          for (let i = 1; i <= totalPages; i++) {
                            pdf.setPage(i);
                            
                            // Footer line
                            pdf.setDrawColor(200, 200, 200);
                            pdf.setLineWidth(0.5);
                            pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
                            
                            pdf.setFontSize(8);
                            pdf.setTextColor(120, 120, 120);
                            pdf.setFont('helvetica', 'normal');
                            
                            // Page number on left
                            pdf.text(`Page ${i} of ${totalPages}`, margin, pageHeight - 8);
                            
                            // PostReady branding on right
                            const brandText = 'PostReady - Built to help creators thrive';
                            const brandWidth = pdf.getTextWidth(brandText);
                            pdf.text(brandText, pageWidth - margin - brandWidth, pageHeight - 8);
                          }

                          // Save the PDF
                          pdf.save(`PostReady-Analysis-${new Date().getTime()}.pdf`);
                          showNotification("PDF downloaded successfully!", "success", "Success");
                        }}
                        className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                        style={{
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                          color: 'white',
                        }}
                      >
                        📄 Save as PDF
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pageAnalysis);
                          showNotification("Analysis copied to clipboard!", "success", "Success");
                        }}
                        className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                        style={{
                          background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
                          color: 'white',
                        }}
                      >
                        📋 Copy Analysis
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History Page - Shows completed posts and saved video ideas */}
        {currentStep === "history" && (
          <SectionCard className="mb-10" isPro={isPro}>
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-4xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                    📝 Your History
                  </h2>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    All your saved video ideas and completed posts
                  </p>
                </div>
                <button
                  onClick={navigateHome}
                  disabled={isNavigating}
                  className="px-5 py-2.5 rounded-lg font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  ← Back to Home
                </button>
              </div>

              {completedPosts.length === 0 && savedVideoIdeas.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                    No history yet
                  </h3>
                  <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                    Save video ideas or complete posts to see them here
                  </p>
                  <PrimaryButton onClick={navigateHome} isPro={isPro}>
                    Get Started
                  </PrimaryButton>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Saved Video Ideas Section - List View */}
                  {savedVideoIdeas.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--secondary)' }}>
                        💡 Saved Video Ideas ({savedVideoIdeas.length})
                      </h3>
                      <div className="space-y-2 mb-8">
                        {savedVideoIdeas.map((savedIdea) => (
                          <div
                            key={savedIdea.id}
                            onClick={() => router.push(`/idea/${savedIdea.id}`)}
                            className="border-2 rounded-lg p-4 transition-all hover:shadow-md cursor-pointer group"
                            style={{
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--card-border)'
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold mb-1 group-hover:opacity-80 transition-opacity" style={{ color: 'var(--text-primary)' }}>
                                      {savedIdea.videoIdea.title}
                                    </h4>
                                    <p className="text-xs mb-2 truncate" style={{ color: 'var(--text-secondary)' }}>
                                      {savedIdea.businessName} • {new Date(savedIdea.savedAt).toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant={savedIdea.videoIdea.angle}>
                                        {savedIdea.videoIdea.angle.replace(/_/g, " ")}
                                      </Badge>
                                    </div>
                                  </div>
                                  <svg 
                                    className="w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-70 transition-opacity" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                    style={{ color: 'var(--text-secondary)' }}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!user || !user.id) return;
                                  
                                  // Remove from Supabase
                                  const result = await deleteSavedVideoIdea(user.id, savedIdea.id);
                                  if (!result.error) {
                                    setSavedVideoIdeas(prev => prev.filter(s => s.id !== savedIdea.id));
                                    showNotification("Idea removed", "success", "Removed");
                                  }
                                }}
                                className="p-1.5 rounded hover:bg-gray-100 transition-colors ml-2 flex-shrink-0"
                                style={{ color: 'var(--text-secondary)' }}
                                title="Remove from saved"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Posts Section - Compact List View */}
                  {completedPosts.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--secondary)' }}>
                        ✅ Completed Posts ({completedPosts.length})
                      </h3>
                      <div className="space-y-3">
                        {completedPosts.map((post) => (
                          <div
                            key={post.id}
                            onClick={() => router.push(`/post/${post.id}`)}
                            className="group rounded-xl p-5 border-2 transition-all cursor-pointer hover:scale-[1.01]"
                            style={{
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--card-border)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'rgba(41, 121, 255, 0.4)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 121, 255, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--card-border)';
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold mb-2 truncate" style={{ color: 'var(--text-primary)' }}>
                                  {post.videoIdea.title}
                                </h3>
                                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                                  {post.businessName} • {new Date(post.completedAt).toLocaleDateString()}
                                </p>
                                <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                                  {post.postDetails.caption.substring(0, 100)}
                                  {post.postDetails.caption.length > 100 ? '...' : ''}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={post.videoIdea.angle}>
                                    {post.videoIdea.angle.replace(/_/g, " ")}
                                  </Badge>
                                  {post.postDetails.notes && (
                                    <span 
                                      className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                                      style={{
                                        backgroundColor: 'rgba(41, 121, 255, 0.1)',
                                        color: '#2979FF'
                                      }}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Has notes
                                    </span>
                                  )}
                                </div>
                              </div>
                              <svg 
                                className="w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-70 transition-opacity" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Businesses Page - Shows saved businesses for quick access */}
        {currentStep === "businesses" && (
          <SectionCard className="mb-10" isPro={isPro}>
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-4xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                    🏢 My Businesses
                  </h2>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Quickly generate more videos for your researched businesses
                  </p>
                </div>
                <button
                  onClick={navigateHome}
                  disabled={isNavigating}
                  className="px-5 py-2.5 rounded-lg font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  ← Back to Home
                </button>
              </div>

              {savedBusinesses.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🏢</div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                    No businesses yet
                  </h3>
                  <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                    Research a business to save it for quick access later
                  </p>
                  <PrimaryButton onClick={navigateHome} isPro={isPro}>
                    Research Your First Business
                  </PrimaryButton>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savedBusinesses.map((business) => (
                    <div
                      key={business.id}
                      className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => loadSavedBusiness(business)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {business.businessInfo.businessName}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
                              {business.businessInfo.businessType}
                            </span>
                            <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                              {business.businessInfo.platform}
                            </span>
                            <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                              📍 {business.businessInfo.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                        <h4 className="font-bold text-gray-900 mb-2 text-sm">Strategy Summary:</h4>
                        <p className="text-gray-700 text-sm line-clamp-2">
                          {business.strategy.headlineSummary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Last used: {new Date(business.lastUsed).toLocaleDateString()}
                        </span>
                        <span className="font-medium text-blue-600">
                          {business.strategy.contentIdeas.length} video ideas →
                        </span>
                      </div>

                      <div className="mt-4 text-center">
                        <div className="text-blue-600 font-bold text-sm">
                          Click to generate more videos
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        )}

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
                          <p className="font-bold text-lg">Sora Prompt Generator</p>
                          <p className="text-purple-100 text-sm">Unlimited sora video prompts</p>
                        </div>
                      </div>
                      <div className="flex items-start bg-white bg-opacity-10 rounded-lg p-4">
                        <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="font-bold text-lg">Viral Video Idea Generator</p>
                          <p className="text-purple-100 text-sm">Get unlimited viral video ideas with hooks & strategies</p>
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
                {/* Plan Type Toggle Pill */}

                <div 
                  className="rounded-2xl p-8 text-white shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                    boxShadow: '0 20px 60px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold mb-2">
                      Pro Plan
                    </h3>
                    <div className="flex items-end justify-center gap-2">
                      <span className="text-5xl font-bold">
                        $4.99
                      </span>
                      <span className="text-xl mb-2 opacity-80">/month</span>
                    </div>
                    <p className="mt-2 opacity-90">
                      Everything you need to grow your page
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Sora Prompt Generator</p>
                        <p className="text-sm opacity-85">Unlimited sora video prompts</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Hashtag Deep Research Tool</p>
                        <p className="text-sm opacity-85">Find trending hashtags in your niche</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Viral Video Idea Generator</p>
                        <p className="text-sm opacity-85">Get unlimited viral video ideas with hooks & strategies</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Priority Support</p>
                        <p className="text-sm opacity-85">Get help when you need it most</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Advanced Strategy Insights</p>
                        <p className="text-sm opacity-85">Get deeper analysis to grow your social media</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={initiateCheckout}
                    className="w-full bg-white rounded-lg px-6 py-4 font-bold text-lg hover:bg-gray-50 transition-all shadow-lg"
                    style={{
                      color: '#2563eb'
                    }}
                  >
                    {user 
                      ? 'Subscribe to PostReady Pro - $4.99/month'
                      : 'Sign Up & Subscribe - $4.99/month'}
                  </button>
                  <p className="text-center text-sm mt-3 opacity-85">
                    Cancel anytime • Secure payment by Stripe
                  </p>
                </div>
              </div>
            )}

            {/* Feature Comparison */}
            <div className="max-w-2xl mx-auto mb-8">
              <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: 'var(--secondary)' }}>
                Free vs Pro Comparison
              </h3>
              <div className="rounded-lg border-2 overflow-hidden" style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)'
              }}>
                <div className="grid grid-cols-3 text-center border-b-2" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="p-4 font-bold" style={{ color: 'var(--text-primary)' }}>Feature</div>
                  <div className="p-4 font-bold" style={{ 
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-primary)'
                  }}>Free</div>
                  <div className="p-4 font-bold" style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.1)',
                    color: 'var(--primary)'
                  }}>Pro/Creator</div>
                </div>
                <div className="grid grid-cols-3 text-center border-b" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="p-4 text-left text-sm" style={{ color: 'var(--text-primary)' }}>Sora Prompt Generator</div>
                  <div className="p-4" style={{ 
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-primary)'
                  }}>1 use</div>
                  <div className="p-4 font-bold" style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.1)',
                    color: 'var(--primary)'
                  }}>Unlimited</div>
                </div>
                <div className="grid grid-cols-3 text-center border-b" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="p-4 text-left text-sm" style={{ color: 'var(--text-primary)' }}>Hashtag Deep Research Tool</div>
                  <div className="p-4" style={{ 
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-secondary)'
                  }}>Pro Only</div>
                  <div className="p-4 font-bold" style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.1)',
                    color: 'var(--primary)'
                  }}>Unlimited</div>
                </div>
                <div className="grid grid-cols-3 text-center border-b" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="p-4 text-left text-sm" style={{ color: 'var(--text-primary)' }}>Viral Video Idea Generator</div>
                  <div className="p-4" style={{ 
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-secondary)'
                  }}>Pro Only</div>
                  <div className="p-4 font-bold" style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.1)',
                    color: 'var(--primary)'
                  }}>Unlimited</div>
                </div>
                <div className="grid grid-cols-3 text-center border-b" style={{ borderColor: 'var(--card-border)' }}>
                  <div className="p-4 text-left text-sm" style={{ color: 'var(--text-primary)' }}>Support</div>
                  <div className="p-4" style={{ 
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-primary)'
                  }}>Email</div>
                  <div className="p-4 font-bold" style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.1)',
                    color: 'var(--primary)'
                  }}>Priority</div>
                </div>
                <div className="grid grid-cols-3 text-center">
                  <div className="p-4 text-left text-sm" style={{ color: 'var(--text-primary)' }}>Advanced Strategy Insights</div>
                  <div className="p-4" style={{ 
                    backgroundColor: 'var(--hover-bg)',
                    color: 'var(--text-secondary)'
                  }}>Pro Only</div>
                  <div className="p-4 font-bold" style={{ 
                    backgroundColor: 'rgba(41, 121, 255, 0.1)',
                    color: 'var(--primary)'
                  }}>Unlimited</div>
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

        {/* Get unlimited ideas with Pro button - Video ideas page only */}
        {currentStep === "choose-idea" && !isPro && (
          <div className="mb-8 flex justify-center w-full">
            <button
              onClick={scrollToPremium}
              className="rounded-xl px-6 py-3 border-2 shadow-lg transition-all hover:shadow-xl hover:scale-105 flex items-center gap-2 font-semibold text-base"
              style={{
                maxWidth: '28rem',
                background: 'linear-gradient(135deg, rgba(41, 121, 255, 0.2) 0%, rgba(111, 255, 210, 0.2) 100%)',
                borderColor: 'rgba(41, 121, 255, 0.7)',
                color: '#2979FF',
                boxShadow: 'rgba(41, 121, 255, 0.3) 0px 4px 20px, rgba(111, 255, 210, 0.1) 0px 0px 40px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(41, 121, 255, 0.2) 0%, rgba(111, 255, 210, 0.2) 100%)';
                e.currentTarget.style.borderColor = 'rgba(41, 121, 255, 0.7)';
                e.currentTarget.style.boxShadow = 'rgba(41, 121, 255, 0.3) 0px 6px 25px, rgba(111, 255, 210, 0.15) 0px 0px 50px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(41, 121, 255, 0.2) 0%, rgba(111, 255, 210, 0.2) 100%)';
                e.currentTarget.style.borderColor = 'rgba(41, 121, 255, 0.7)';
                e.currentTarget.style.boxShadow = 'rgba(41, 121, 255, 0.3) 0px 4px 20px, rgba(111, 255, 210, 0.1) 0px 0px 40px';
              }}
            >
              <span className="text-xl">⚡</span>
              <span>Get unlimited ideas with Pro</span>
            </button>
          </div>
        )}

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
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authModalMode}
      />

      {/* Custom Modal */}
      <Modal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onClose={() => {
          if (modalState.onCancel) {
            modalState.onCancel();
          }
          setModalState({ ...modalState, isOpen: false });
        }}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
        isCreator={userType === 'creator'}
      />

      {/* Notification */}
      <Notification
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        duration={3000}
      />

      {/* Celebration Splash Screen for Successful Subscription */}
      {showCelebration && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          {/* Confetti Effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-20px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: ['#2979FF', '#6FFFD2', '#DAA520', '#F4D03F', '#FF6B9D'][Math.floor(Math.random() * 5)],
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                  animation: `fall ${2 + Math.random() * 3}s linear infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                  opacity: 0.8
                }}
              />
            ))}
          </div>

          {/* Celebration Card */}
          <div 
            className="relative max-w-lg w-full rounded-3xl p-8 text-center"
            style={{
              background: isCreator 
                ? 'linear-gradient(135deg, rgba(218, 165, 32, 0.15) 0%, rgba(244, 208, 63, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(41, 121, 255, 0.15) 0%, rgba(111, 255, 210, 0.15) 100%)',
              border: `3px solid ${isCreator ? '#DAA520' : '#2979FF'}`,
              boxShadow: isCreator
                ? '0 20px 60px rgba(218, 165, 32, 0.4), 0 0 80px rgba(244, 208, 63, 0.2)'
                : '0 20px 60px rgba(41, 121, 255, 0.4), 0 0 80px rgba(111, 255, 210, 0.2)',
              animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              backgroundColor: 'var(--card-bg)'
            }}
          >
            {/* Animated Trophy/Star */}
            <div 
              className="text-8xl mb-6"
              style={{
                animation: 'bounce 1s ease-in-out infinite'
              }}
            >
              {isCreator ? '✨' : '🎉'}
            </div>

            {/* Title */}
            <h2 
              className="text-4xl font-bold mb-4"
              style={{
                color: isCreator ? '#DAA520' : '#2979FF',
                textShadow: isCreator
                  ? '0 0 20px rgba(218, 165, 32, 0.5)'
                  : '0 0 20px rgba(41, 121, 255, 0.5)'
              }}
            >
              Welcome to {isCreator ? 'PostReady Creator' : 'PostReady Pro'}!
            </h2>

            {/* Message */}
            <p 
              className="text-xl mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              You're all set! 🚀
            </p>
            <p 
              className="text-lg mb-8 opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              Enjoy unlimited video ideas, advanced insights, and priority support.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {['Unlimited Ideas', 'Advanced Insights', 'Priority Support'].map((feature, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 rounded-full text-sm font-bold"
                  style={{
                    background: isCreator
                      ? 'linear-gradient(to right, #DAA520, #F4D03F)'
                      : 'linear-gradient(to right, #2979FF, #6FFFD2)',
                    color: 'white',
                    boxShadow: isCreator
                      ? '0 4px 15px rgba(218, 165, 32, 0.4)'
                      : '0 4px 15px rgba(41, 121, 255, 0.3)',
                    animation: `slideUp 0.5s ease-out ${idx * 0.1}s backwards`
                  }}
                >
                  ✓ {feature}
                </span>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                setShowCelebration(false);
                // Reload page to refresh Pro status after user closes modal
                window.location.reload();
              }}
              className="px-8 py-4 rounded-xl font-bold text-lg text-white transition-all hover:scale-105"
              style={{
                background: isCreator
                  ? 'linear-gradient(to right, #DAA520, #F4D03F)'
                  : 'linear-gradient(to right, #2979FF, #6FFFD2)',
                boxShadow: isCreator
                  ? '0 8px 25px rgba(218, 165, 32, 0.4), 0 0 40px rgba(244, 208, 63, 0.2)'
                  : '0 8px 25px rgba(41, 121, 255, 0.3), 0 0 40px rgba(111, 255, 210, 0.1)'
              }}
            >
              Let's Get Started! 🎯
            </button>
          </div>

          {/* CSS Animations */}
          <style jsx>{`
            @keyframes fadeIn {
              from { 
                opacity: 0;
                transform: translateY(10px);
              }
              to { 
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
            
            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.5) rotate(-10deg);
              }
              to {
                opacity: 1;
                transform: scale(1) rotate(0deg);
              }
            }
            
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-20px); }
            }
            
            @keyframes fall {
              from {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
              }
              to {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
              }
            }
            
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}

      {/* Floating Reorder Toggle - Removed per user request */}
      {false && user && currentStep === "form" && (
        <button
          onClick={() => setIsReorderMode(!isReorderMode)}
          className="hidden md:block fixed bottom-24 right-6 rounded-xl z-50 group transition-all duration-200"
          style={{ 
            padding: '10px 18px',
            backgroundColor: isReorderMode ? '#2979FF' : theme === 'dark' ? 'rgba(40, 40, 50, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            border: `2px solid ${isReorderMode ? '#2979FF' : theme === 'dark' ? 'rgba(111, 255, 210, 0.25)' : 'rgba(41, 121, 255, 0.2)'}`,
            boxShadow: isReorderMode 
              ? '0 4px 16px rgba(41, 121, 255, 0.3), 0 12px 32px rgba(41, 121, 255, 0.2)'
              : theme === 'dark'
                ? '0 4px 16px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.3)'
                : '0 4px 16px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.12)',
            backdropFilter: 'blur(16px)',
          }}
          title={isReorderMode ? 'Done editing' : 'Edit module order'}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            if (isReorderMode) {
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(41, 121, 255, 0.4), 0 16px 40px rgba(41, 121, 255, 0.25)';
            } else {
              e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(111, 255, 210, 0.4)' : 'rgba(41, 121, 255, 0.4)';
              e.currentTarget.style.boxShadow = theme === 'dark'
                ? '0 6px 20px rgba(0, 0, 0, 0.5), 0 12px 32px rgba(0, 0, 0, 0.35)'
                : '0 6px 20px rgba(0, 0, 0, 0.12), 0 12px 32px rgba(0, 0, 0, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = isReorderMode ? '#2979FF' : theme === 'dark' ? 'rgba(111, 255, 210, 0.25)' : 'rgba(41, 121, 255, 0.2)';
            e.currentTarget.style.boxShadow = isReorderMode 
              ? '0 4px 16px rgba(41, 121, 255, 0.3), 0 12px 32px rgba(41, 121, 255, 0.2)'
              : theme === 'dark'
                ? '0 4px 16px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.3)'
                : '0 4px 16px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.12)';
          }}
        >
          <div className="flex items-center gap-2.5">
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none"
              style={{ transition: 'transform 0.2s ease' }}
              className={isReorderMode ? 'rotate-0' : ''}
            >
              {isReorderMode ? (
                <path 
                  d="M13.5 4.5L6.5 11.5L2.5 7.5" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              ) : (
                <>
                  <rect x="2" y="3" width="12" height="2" rx="1" fill={theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'} />
                  <rect x="2" y="7" width="12" height="2" rx="1" fill={theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'} />
                  <rect x="2" y="11" width="12" height="2" rx="1" fill={theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'} />
                </>
              )}
            </svg>
            <span 
              className="text-sm font-medium"
              style={{ 
                color: isReorderMode ? 'white' : 'var(--text-primary)',
                letterSpacing: '-0.01em'
              }}
            >
              {isReorderMode ? 'Done' : 'Edit'}
            </span>
          </div>
        </button>
      )}

      {/* Floating Minimize/Maximize All Button - Only on home screen */}
      {!isReorderMode && currentStep === "form" && (
        <button
          onClick={() => {
            if (areAllModulesCollapsed()) {
              expandAllModules();
            } else {
              collapseAllModules();
            }
          }}
          className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 rounded-full hover:scale-110 z-50 opacity-70 sm:opacity-100"
          style={{ 
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            transition: 'all 0.3s ease, transform 0.2s ease',
            filter: 'drop-shadow(0 0 8px rgba(41, 121, 255, 0.6)) drop-shadow(0 0 16px rgba(41, 121, 255, 0.4))'
          }}
          title={areAllModulesCollapsed() ? 'Expand All Modules' : 'Collapse All Modules'}
        >
        <img 
          src={areAllModulesCollapsed() ? '/icons/maximize.png' : '/icons/minimize.png'}
          alt={areAllModulesCollapsed() ? 'Expand' : 'Collapse'}
          className="w-12 h-12 sm:w-14 sm:h-14"
          style={{ transition: 'opacity 0.3s ease', display: 'block' }}
        />
      </button>
      )}

      {/* Floating Theme Toggle */}
      {!isReorderMode && (
        <button
          onClick={toggleTheme}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-full hover:scale-110 z-50 opacity-70 sm:opacity-100"
          style={{ 
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            transition: 'all 0.3s ease, transform 0.2s ease',
            filter: 'drop-shadow(0 0 8px rgba(41, 121, 255, 0.6)) drop-shadow(0 0 16px rgba(41, 121, 255, 0.4))'
          }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
        <img 
          src={theme === 'light' ? '/icons/darkmode.png' : '/icons/lightmode.png'}
          alt={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          className="w-12 h-12 sm:w-14 sm:h-14"
          style={{ transition: 'opacity 0.3s ease', display: 'block' }}
        />
      </button>
      )}

      {/* Sora Paywall Modal */}
      {showSoraPaywall && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
          }}
          onClick={() => setShowSoraPaywall(false)}
        >
          <div 
            className="max-w-lg w-full rounded-2xl p-8 animate-scale-in"
            style={{
              backgroundColor: 'var(--card-bg)',
              border: '2px solid rgba(139, 92, 246, 0.4)',
              boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#8B5CF6' }}>
                Unlock Unlimited Sora Prompts
              </h2>
              <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                {user 
                  ? "You've used your free generation. Upgrade to Pro for unlimited access to the Sora Prompt Generator."
                  : "You've used your free generation. Sign in and upgrade to Pro for unlimited access to the Sora Prompt Generator."
                }
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-lg" style={{
                backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}>
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#8B5CF6' }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Unlimited Sora Generations
                  </span>
                </div>
                <p className="text-sm ml-9" style={{ color: 'var(--text-secondary)' }}>
                  Create as many video prompts as you need
                </p>
              </div>

              <div className="p-4 rounded-lg" style={{
                backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}>
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#8B5CF6' }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Plus All Pro Features
                  </span>
                </div>
                <p className="text-sm ml-9" style={{ color: 'var(--text-secondary)' }}>
                  Unlimited video ideas, hashtag research, and more
                </p>
              </div>
            </div>

            <div className="text-center mb-4">
              <div className="text-4xl font-bold mb-2" style={{ color: '#8B5CF6' }}>
                $4.99<span className="text-lg font-normal">/month</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Cancel anytime • Secure payment by Stripe
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSoraPaywall(false);
                  if (user) {
                    setCurrentStep('premium');
                  } else {
                    setCurrentStep('form');
                    // Scroll to top and show sign in prompt
                    window.scrollTo(0, 0);
                  }
                }}
                className="flex-1 py-3 rounded-lg font-bold transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                  color: 'white',
                }}
              >
                {user ? 'Upgrade to Pro' : 'Sign In to Get Pro'}
              </button>
              <button
                onClick={() => setShowSoraPaywall(false)}
                className="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-80 border"
                style={{
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

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
