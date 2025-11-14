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
import { saveBusiness, loadSavedBusinesses, saveCompletedPost, loadPostHistory } from "@/lib/userHistory";

type WizardStep = "form" | "researching" | "principles" | "choose-idea" | "record-video" | "generating-caption" | "post-details" | "premium" | "history" | "businesses";

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

  const [strategy, setStrategy] = useState<StrategyResult | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>("form");
  const [researchProgress, setResearchProgress] = useState<number>(0);
  const [researchStatus, setResearchStatus] = useState<string>("");

  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [videoDescription, setVideoDescription] = useState<string>("");
  const [postPlatform, setPostPlatform] = useState<string>("");
  const [postDetails, setPostDetails] = useState<PostDetails | null>(null);
  const [rewriteCount, setRewriteCount] = useState<number>(0);
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const [regenerateCount, setRegenerateCount] = useState<number>(0);
  const [rewordTitleCount, setRewordTitleCount] = useState<number>(0);
  const [isRewordingTitle, setIsRewordingTitle] = useState<boolean>(false);
  const [captionAnimation, setCaptionAnimation] = useState<'idle' | 'fadeOut' | 'typing'>('idle');
  const [titleAnimation, setTitleAnimation] = useState<'idle' | 'fadeOut' | 'fadeIn'>('idle');
  const [ideasAnimation, setIdeasAnimation] = useState<'idle' | 'fadeOut' | 'fadeIn'>('idle');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState<boolean>(false);
  const [generateIdeasCount, setGenerateIdeasCount] = useState<number>(0);
  const [hasLoadedUsageCounts, setHasLoadedUsageCounts] = useState<boolean>(false);
  const [billingLoading, setBillingLoading] = useState<boolean>(false);
  
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

  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'confirm' | 'success' | 'error';
    onConfirm?: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

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

  const strategyRef = useRef<HTMLDivElement>(null);
  const postPlannerRef = useRef<HTMLDivElement>(null);

  // Load user progress when user signs in
  useEffect(() => {
    if (user && !authLoading) {
      loadProgress();
      loadHistoryData();
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

  // Scroll to top when step changes (mobile optimization)
  useEffect(() => {
    // Smooth scroll to top on step changes
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [currentStep]);

  // Handle URL parameters for navigation from portal
  useEffect(() => {
    const view = searchParams.get('view');
    const premium = searchParams.get('premium');
    const upgrade = searchParams.get('upgrade');
    
    if (view === 'history') {
      setCurrentStep('history');
      // Reload history data when navigating to history page
      if (user) {
        loadHistoryData();
      }
      // Clear URL params after navigation
      setTimeout(() => router.replace('/'), 100);
    } else if (view === 'businesses') {
      setCurrentStep('businesses');
      // Reload businesses data when navigating to businesses page
      if (user) {
        loadHistoryData();
      }
      // Clear URL params after navigation
      setTimeout(() => router.replace('/'), 100);
    } else if (premium === 'true' || upgrade === 'true') {
      // Navigate to premium section
      setCurrentStep("premium");
      // Scroll after state updates
      setTimeout(() => {
        const viewportHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        
        let targetScroll;
        if (docHeight > viewportHeight * 1.5) {
          targetScroll = Math.min(docHeight * 0.25, docHeight - viewportHeight);
        } else {
          targetScroll = Math.max(0, docHeight - viewportHeight - 100);
        }
        
        window.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
        
        // Clear URL params after scroll
        setTimeout(() => router.replace('/'), 500);
      }, 100);
    }
  }, [searchParams, router, user]);

  // Load usage counts from localStorage for anonymous users (prevent refresh abuse)
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      try {
        const storedCount = localStorage.getItem('postready_generateIdeasCount');
        const storedTimestamp = localStorage.getItem('postready_generateIdeasTimestamp');
        
        if (storedCount) {
          const count = parseInt(storedCount, 10);
          const timestamp = storedTimestamp ? parseInt(storedTimestamp, 10) : Date.now();
          
          // Check if data is fresh (within 30 days)
          const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
          const isDataFresh = (Date.now() - timestamp) < thirtyDaysInMs;
          
          if (isDataFresh && !isNaN(count)) {
            setGenerateIdeasCount(count);
            console.log('Loaded usage count:', count);
          } else {
            // Reset if data is too old
            localStorage.removeItem('postready_generateIdeasCount');
            localStorage.removeItem('postready_generateIdeasTimestamp');
          }
        }
      } catch (error) {
        console.error('Error loading usage from localStorage:', error);
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
  useEffect(() => {
    // Only save if we've loaded the initial counts (prevent overwriting on mount)
    if (!user && typeof window !== 'undefined' && hasLoadedUsageCounts) {
      try {
        localStorage.setItem('postready_generateIdeasCount', generateIdeasCount.toString());
        if (!localStorage.getItem('postready_generateIdeasTimestamp')) {
          localStorage.setItem('postready_generateIdeasTimestamp', Date.now().toString());
        }
        console.log('Saved usage count:', generateIdeasCount);
      } catch (error) {
        console.error('Error saving usage to localStorage:', error);
      }
    }
  }, [generateIdeasCount, user, hasLoadedUsageCounts]);

  // Save usage counts to database for authenticated users (prevent refresh abuse)
  useEffect(() => {
    if (user && !authLoading) {
      // Debounce the save to avoid too many database calls
      const timeoutId = setTimeout(() => {
        saveProgress();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [generateIdeasCount, rewriteCount, regenerateCount, rewordTitleCount, user, authLoading]);

  // Save post to history when reaching post-details step (ensures post is saved even if caption generation had issues)
  useEffect(() => {
    if (currentStep === "post-details" && user && selectedIdea && postDetails) {
      console.log('📝 Post-details step reached - ensuring post is saved to history');
      saveCompletedPostToHistory(selectedIdea, postDetails);
    }
  }, [currentStep, user, selectedIdea, postDetails]);

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
        regenerateCount,
        rewordTitleCount,
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const loadHistoryData = async () => {
    if (!user) return;

    console.log('📂 Loading history data for user:', user.id);
    
    try {
      const [businessesResult, postsResult] = await Promise.all([
        loadSavedBusinesses(user.id),
        loadPostHistory(user.id)
      ]);

      console.log('📂 Businesses result:', businessesResult);
      console.log('📂 Posts result:', postsResult);

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
    } catch (error) {
      console.error('❌ Error loading history:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    // Reset to initial state
    setBusinessInfo({
      businessName: "",
      businessType: "Restaurant",
      location: "",
      platform: "Instagram",
    });
    setStrategy(null);
    setCurrentStep("form");
    setSelectedIdea(null);
    setPostDetails(null);
  };

  const handleManageBilling = async () => {
    if (!user) return;
    
    setBillingLoading(true);
    try {
      // Create Stripe Customer Portal session
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Wait a bit for scroll to complete, then change page
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Reset to home state
    setCurrentStep("form");
    setStrategy(null);
    setSelectedIdea(null);
    setPostDetails(null);
    setRewriteCount(0);
    setRegenerateCount(0);
    setGenerateIdeasCount(0);
    setRewordTitleCount(0);
    
    // Allow navigation again after animation completes
    setTimeout(() => setIsNavigating(false), 100);
  };

  const navigateToPortal = () => {
    if (isNavigating) return; // Prevent multiple clicks during animation
    
    setIsNavigating(true);
    
    // Use Next.js router for client-side navigation
    router.push('/portal');
    
    // Allow navigation again after a short delay
    setTimeout(() => setIsNavigating(false), 500);
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

  // Load saved business
  const loadSavedBusiness = async (business: typeof savedBusinesses[0]) => {
    setBusinessInfo(business.businessInfo);
    setStrategy(business.strategy);
    setCurrentStep("choose-idea");
    setSelectedIdea(null);
    setPostDetails(null);
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
    if (!user) {
      // User not logged in - guide them to sign up
      setRedirectToCheckoutAfterAuth(true);
      setAuthModalMode('signup');
      setAuthModalOpen(true);
      showNotification("Please create an account to subscribe to PostReady Pro", "info", "Sign Up Required");
      return;
    }

    try {
      // Create Stripe checkout session
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      console.error("Checkout error:", error);
      showNotification("Failed to start checkout. Please try again.", "error", "Error");
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

    setTimeout(() => {
      strategyRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      // Call research API
      const response = await fetch("/api/research-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businessInfo }),
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
    setCurrentStep("premium");
    // Elegant scroll to show both pricing card and comparison table
    // Wait longer to ensure content is fully rendered
    setTimeout(() => {
      const viewportHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const isMobile = window.innerWidth < 768; // md breakpoint
      
      let targetScroll;
      
      if (isMobile) {
        // On mobile, scroll to top to show the premium card properly centered
        targetScroll = 0;
      } else {
        // Desktop: Scroll down to show the premium section nicely
        // We want to scroll just enough to see both the pricing and comparison
        // If the page is tall enough, scroll to 25% of the page
        // Otherwise, scroll to a position that shows content without too much white space
        if (docHeight > viewportHeight * 1.5) {
          // Page is tall enough, scroll to show premium section
          targetScroll = Math.min(
            docHeight - viewportHeight, // Don't scroll past the bottom
            Math.max(200, docHeight * 0.25) // Scroll to 25% or at least 200px
          );
        } else {
          // Page is shorter, scroll less aggressively
          targetScroll = Math.max(0, (docHeight - viewportHeight) * 0.5);
        }
      }
      
      window.scrollTo({ 
        top: targetScroll, 
        behavior: 'smooth' 
      });
    }, 300); // Increased delay to ensure full render
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

  const handleRewriteCaption = async () => {
    // Check if user has exceeded free rewrite limit (2 free rewrites)
    if (rewriteCount >= 2 && !isPro) {
      setModalState({
        isOpen: true,
        title: "Upgrade to PostReady Pro",
        message: "You've used your 2 free rewrites. Upgrade to PostReady Pro for unlimited rewrites and more features!",
        type: 'confirm',
        onConfirm: scrollToPremium,
        confirmText: "View Pro Plan"
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
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Failed to generate caption");
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
        showNotification("Failed to rewrite caption. Please try again.", "error", "Error");
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
        title: "Upgrade to PostReady Pro",
        message: "You've used your free idea regenerations. Upgrade to PostReady Pro for unlimited regenerations and more features!",
        type: 'confirm',
        onConfirm: scrollToPremium,
        confirmText: "View Pro Plan"
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

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--background)' }}>
      {/* Premium Background Effect for Pro Users */}
      {isPro && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5" style={{
            background: 'radial-gradient(circle, rgba(41, 121, 255, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'float 20s ease-in-out infinite'
          }}></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-5" style={{
            background: 'radial-gradient(circle, rgba(111, 255, 210, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'float 25s ease-in-out infinite reverse'
          }}></div>
        </div>
      )}
      <div className="max-w-5xl mx-auto px-4 py-10 relative" style={{ zIndex: 1 }}>
        {/* Header with Auth - Only for signed-in users */}
        {user && !authLoading && (
          <div className="flex justify-end items-center mb-8">
            <div className="flex items-center gap-3">
              {isPro && (
                <span 
                  className="text-white px-3 py-1 rounded-full text-xs font-bold relative overflow-hidden"
                  style={{ 
                    background: 'linear-gradient(to right, #2979FF, #6FFFD2)',
                    boxShadow: '0 0 20px rgba(41, 121, 255, 0.4), 0 0 40px rgba(111, 255, 210, 0.2)',
                    animation: 'shimmer 3s ease-in-out infinite'
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
                className="text-sm font-medium transition-all disabled:opacity-50"
                style={currentStep === "form" ? { 
                  color: 'var(--primary)',
                  fontWeight: 'bold'
                } : { 
                  color: 'var(--text-secondary)' 
                }}
              >
                Home
              </button>
              <button
                onClick={() => {
                  setCurrentStep("businesses");
                  if (user) {
                    loadHistoryData();
                  }
                }}
                className="text-sm font-medium transition-colors"
                style={currentStep === "businesses" ? { 
                  color: 'var(--primary)',
                  fontWeight: 'bold'
                } : { 
                  color: 'var(--text-secondary)' 
                }}
              >
                My Businesses
              </button>
              <button
                onClick={() => {
                  setCurrentStep("history");
                  if (user) {
                    loadHistoryData();
                  }
                }}
                className="text-sm font-medium transition-colors"
                style={currentStep === "history" ? { 
                  color: 'var(--primary)',
                  fontWeight: 'bold'
                } : { 
                  color: 'var(--text-secondary)' 
                }}
              >
                History
              </button>
              <button
                onClick={navigateToPortal}
                disabled={isNavigating}
                className="text-sm transition-all font-medium underline decoration-dotted hover:opacity-70 disabled:opacity-50"
                style={{ color: 'var(--text-secondary)' }}
              >
                {user?.email || 'dev@test.com'}
              </button>
              {!isPro && (
                <button
                  onClick={scrollToPremium}
                  className="text-white px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(to right, #2979FF, #6FFFD2)' }}
                >
                  Upgrade to Pro
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Sign Out
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
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-10 h-10" style={{ color: '#2979FF' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg" style={{ color: 'var(--secondary)' }}>
                      Save Your Work!
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Sign up now to save your history and businesses
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openAuthModal('signin')}
                    className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-105 border-2 whitespace-nowrap"
                    style={{ 
                      borderColor: '#2979FF',
                      color: '#2979FF',
                      backgroundColor: 'white'
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="px-6 py-3 rounded-lg font-bold text-sm transition-all hover:scale-105 text-white shadow-md whitespace-nowrap flex items-center gap-2"
                    style={{ background: 'linear-gradient(to right, #2979FF, #6FFFD2)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Sign Up Now
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
                className="h-6 w-auto"
              />
              <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                PostReady
              </span>
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
              className="h-24 w-auto"
            />
          </div>
          <p className="text-2xl font-medium tracking-wide" style={{ color: 'var(--primary)' }}>
            Posting made easy.
          </p>
          <p className="text-lg mt-4 max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            PostReady researches your business, analyzes your local market, and creates tailored posts, captions, and growth strategies — automatically.
          </p>
        </div>

        {/* Business Info Form */}
        {currentStep === "form" && (
          <SectionCard className="mb-10" isPro={isPro}>
            <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--secondary)' }}>
              Tell Us About Your Business
            </h2>
            <form onSubmit={handleGenerateStrategy} className="space-y-4">
              <InputField
                label="Business Name"
                value={businessInfo.businessName}
                onChange={(value) =>
                  setBusinessInfo({ ...businessInfo, businessName: value })
                }
                placeholder="Joe's Pizza"
                required
              />

              <SelectField
                label="Business Type"
                value={businessInfo.businessType}
                onChange={(value) =>
                  setBusinessInfo({
                    ...businessInfo,
                    businessType: value as BusinessInfo["businessType"],
                  })
                }
                options={[
                  "Restaurant",
                  "Cafe / Bakery",
                  "Retail Shop",
                  "Thrift Store / Resale",
                  "Salon / Spa",
                  "Gym / Fitness",
                  "Real Estate",
                  "Movie Theater",
                  "Other",
                ]}
                required
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Location
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={businessInfo.location}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, location: e.target.value })}
                    placeholder="Monterey, CA"
                    required
                    className="rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 border"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={detectUserLocation}
                    disabled={isDetectingLocation}
                    className="px-4 py-2 rounded-md font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: 'white'
                    }}
                    title="Detect my location"
                  >
                    {isDetectingLocation ? (
                      <>
                        <span className="animate-spin">🌍</span>
                        Detecting...
                      </>
                    ) : (
                      <>
                        📍 Detect
                      </>
                    )}
                  </button>
                </div>
              </div>

              <SelectField
                label="Primary Platform"
                value={businessInfo.platform}
                onChange={(value) =>
                  setBusinessInfo({
                    ...businessInfo,
                    platform: value as BusinessInfo["platform"],
                  })
                }
                options={["Instagram", "TikTok", "Facebook", "YouTube Shorts"]}
                required
              />

              <PrimaryButton type="submit" className="w-full" isPro={isPro}>
                Generate Social Media Strategy
              </PrimaryButton>
            </form>

              {/* Pro Status Display */}
              {!isPro ? (
                <div className="mt-8 rounded-2xl p-6 border-2" style={{ 
                  background: 'linear-gradient(135deg, rgba(41, 121, 255, 0.05) 0%, rgba(111, 255, 210, 0.05) 100%)',
                  borderColor: 'rgba(41, 121, 255, 0.25)'
                }}>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1 flex items-center" style={{ color: 'var(--secondary)' }}>
                        <span className="text-2xl mr-2">✨</span>
                        Unlock PostReady Pro
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Get unlimited video ideas, advanced insights, and priority support
                      </p>
                    </div>
                    <button
                      onClick={scrollToPremium}
                      className="text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center whitespace-nowrap hover:scale-105"
                      style={{ background: 'linear-gradient(to right, var(--primary), var(--accent))' }}
                    >
                      <span className="mr-2">⚡</span>
                      View Pro Plan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 rounded-2xl p-6 border-2" style={{ 
                  background: 'linear-gradient(135deg, rgba(41, 121, 255, 0.08) 0%, rgba(111, 255, 210, 0.08) 100%)',
                  borderColor: 'rgba(41, 121, 255, 0.4)',
                  boxShadow: '0 4px 20px rgba(41, 121, 255, 0.15)'
                }}>
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-8 h-8" style={{ color: '#2979FF' }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <h3 className="font-bold text-xl" style={{ color: 'var(--secondary)' }}>
                      You're a Pro Member! 🎉
                    </h3>
                  </div>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Enjoy unlimited access to all premium features
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#10b981' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span style={{ color: 'var(--text-primary)' }}>Unlimited Video Ideas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#10b981' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span style={{ color: 'var(--text-primary)' }}>Unlimited Caption Rewrites</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#10b981' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span style={{ color: 'var(--text-primary)' }}>Unlimited Title Rewords</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#10b981' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span style={{ color: 'var(--text-primary)' }}>Priority Support</span>
                    </div>
                  </div>
                </div>
              )}
          </SectionCard>
        )}

        {/* Researching State */}
        {currentStep === "researching" && (
          <div ref={strategyRef} className="mb-10 scroll-mt-4">
            <SectionCard isPro={isPro}>
              <div className="text-center py-12">
                <div className="text-6xl mb-6 animate-bounce">⚡</div>
                <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--secondary)' }}>
                  Creating Your Strategy...
                </h2>
                <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
                  Finding the best tactics for {businessInfo.businessName} on {businessInfo.platform}
                </p>

                <div className="max-w-md mx-auto space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {researchStatus}
                    </span>
                    <span className="font-bold" style={{ color: 'var(--primary)' }}>
                      {Math.round(researchProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${researchProgress}%` }}
                    >
                      <div className="h-full w-full bg-white/30 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Step-by-Step Strategy Wizard */}
        {strategy && currentStep !== "form" && currentStep !== "researching" && currentStep !== "premium" && currentStep !== "history" && currentStep !== "businesses" && (
          <div ref={strategyRef} className="mb-10 scroll-mt-4">
            <SectionCard isPro={isPro}>
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
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(Math.min(getStepNumber(), 4) / 4) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Step 1: Key Strategies */}
              {currentStep === "principles" && strategy && strategy.keyPrinciples && strategy.contentIdeas && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-4xl font-bold mb-3" style={{ color: 'var(--secondary)' }}>
                      Your {businessInfo.platform} Growth Strategy
                    </h2>
                    <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                      Simple, actionable tactics that actually work
                    </p>
                  </div>

                  <div className="rounded-2xl p-8 mb-8 border-l-4" style={{ 
                    background: 'linear-gradient(135deg, rgba(41, 121, 255, 0.08) 0%, rgba(111, 255, 210, 0.08) 100%)',
                    borderColor: 'var(--accent)'
                  }}>
                    <div className="flex items-start">
                      <span className="text-5xl mr-5">🎯</span>
                      <div>
                        <h3 className="font-bold text-xl mb-3" style={{ color: 'var(--secondary)' }}>The Key to Success</h3>
                        <p className="text-lg leading-relaxed" style={{ color: 'var(--text-primary)' }}>{strategy.headlineSummary}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-10">
                    <h3 className="text-2xl font-bold mb-6 flex items-center" style={{ color: 'var(--secondary)' }}>
                      <span className="text-3xl mr-3">⚡</span>
                      5 Strategies to Grow Your Audience
                    </h3>
                    <div className="space-y-3">
                      {strategy.keyPrinciples.map((principle, index) => (
                        <div 
                          key={index} 
                          className="rounded-xl p-6 border transition-all hover:scale-[1.02] cursor-default"
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--card-border)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div 
                              className="rounded-full w-10 h-10 flex items-center justify-center font-bold text-white flex-shrink-0 text-lg"
                              style={{ 
                                background: 'linear-gradient(135deg, #2979FF 0%, #6FFFD2 100%)'
                              }}
                            >
                              {index + 1}
                            </div>
                            <p className="text-base leading-relaxed pt-1" style={{ color: 'var(--text-primary)' }}>{principle}</p>
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

                  <PrimaryButton onClick={handleNextStep} className="w-full text-lg py-4" isPro={isPro}>
                    Next: Choose Your Video Idea →
                  </PrimaryButton>
                </div>
              )}

              {/* Step 2: Choose Video Idea */}
              {currentStep === "choose-idea" && strategy && strategy.contentIdeas && (
                <div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                    Choose Your Video Idea
                  </h2>
                  <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                    Select one idea to create content for. You'll record the video next.
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
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 transition-all duration-300 ${
                      ideasAnimation === 'fadeOut' ? 'animate-fade-out' : 
                      ideasAnimation === 'fadeIn' ? 'animate-fade-in' : ''
                    }`}>
                    {strategy.contentIdeas.map((idea, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectIdea(idea)}
                        className="border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                        style={{
                          backgroundColor: selectedIdea?.title === idea.title ? 'var(--hover-bg)' : 'var(--card-bg)',
                          borderColor: selectedIdea?.title === idea.title ? 'var(--primary)' : 'var(--card-border)',
                          boxShadow: selectedIdea?.title === idea.title ? '0 4px 12px rgba(41, 121, 255, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold flex-1" style={{ color: 'var(--text-primary)' }}>
                            {idea.title}
                          </h4>
                          <Badge variant={idea.angle}>
                            {idea.angle.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{idea.description}</p>
                        {selectedIdea?.title === idea.title && (
                          <div className="mt-3 font-medium text-sm flex items-center" style={{ color: 'var(--primary)' }}>
                            <span className="mr-2">✓</span> Selected
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
                        if (!businessInfo.businessName) return;
                        
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
                            throw new Error("Failed to generate more ideas");
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
                      disabled={isRewriting}
                      className={`px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 ${
                        isRewriting
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "text-white"
                      }`}
                      style={!isRewriting ? { 
                        backgroundColor: '#2979FF',
                        border: '2px solid #6FFFD2'
                      } : {}}
                      onMouseEnter={(e) => !isRewriting && (e.currentTarget.style.backgroundColor = '#1e5dd9')}
                      onMouseLeave={(e) => !isRewriting && (e.currentTarget.style.backgroundColor = '#2979FF')}
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
                    
                    {/* Usage counter inline - to the right of button */}
                    {!isPro && generateIdeasCount < 2 && (
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {2 - generateIdeasCount} use{2 - generateIdeasCount !== 1 ? 's' : ''} left
                      </span>
                    )}
                    
                    {/* Compact Go Pro Callout - Floating next to button */}
                    {!isPro && (
                      <div className="relative">
                        <button
                          onClick={scrollToPremium}
                          className="rounded-lg px-4 py-2 border-2 shadow-lg transition-all hover:shadow-xl hover:scale-105 flex items-center gap-2 text-sm font-bold whitespace-nowrap w-full"
                          style={{ 
                            background: 'linear-gradient(135deg, rgba(41, 121, 255, 0.1) 0%, rgba(111, 255, 210, 0.1) 100%)',
                            borderColor: 'rgba(41, 121, 255, 0.4)',
                            color: '#2979FF'
                          }}
                        >
                          <span>⚡</span>
                          <span>Go Pro</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <SecondaryButton onClick={handlePreviousStep} className="flex-1">
                      ← Back
                    </SecondaryButton>
                    <PrimaryButton onClick={handleNextStep} className="flex-1" isPro={isPro}>
                      Next: Record Video →
                    </PrimaryButton>
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
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      borderColor: 'rgba(99, 102, 241, 0.3)'
                    }}>
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Your Selected Idea:
                      </h3>
                      <p className="text-lg font-medium mb-2" style={{ color: 'var(--primary)' }}>
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
                        className={`w-full px-4 py-3 rounded-lg font-bold transition-all ${
                          regenerateCount >= 2 && !isPro
                            ? "bg-gradient-to-r from-amber-500 to-blue-600 text-white hover:from-amber-600 hover:to-blue-700"
                            : "bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        {regenerateCount >= 2 && !isPro
                          ? "🔒 Pro: Unlimited Ideas"
                          : "🔄 Regenerate Idea"}
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
                    <div className="rounded-xl p-8 mb-8 border-2 transition-all text-center" style={{ 
                      background: 'linear-gradient(135deg, rgba(41, 121, 255, 0.05) 0%, rgba(111, 255, 210, 0.05) 100%)',
                      borderColor: 'rgba(41, 121, 255, 0.2)'
                    }}>
                      <div className="flex flex-col items-center">
                        <span className="text-5xl mb-4">📱</span>
                        <h4 className="font-bold text-2xl mb-4" style={{ color: 'var(--secondary)' }}>
                          Ready to Record?
                        </h4>
                        <p className="text-lg mb-2 max-w-xl" style={{ color: 'var(--text-primary)' }}>
                          Research shows that users prefer <span className="font-semibold" style={{ color: '#2979FF' }}>raw phone video</span> over heavily edited content.
                        </p>
                        <div className="mt-5 pt-5 border-t-2" style={{ borderColor: 'rgba(41, 121, 255, 0.15)' }}>
                          <p className="text-base flex items-center justify-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <span className="text-xl">💪</span>
                            <span>Don't overthink it — hit record and come back when you're done!</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 max-w-md mx-auto">
                    <SecondaryButton onClick={handlePreviousStep} className="flex-1">
                      ← Change Idea
                    </SecondaryButton>
                    <PrimaryButton onClick={handleNextStep} className="flex-1" isPro={isPro}>
                      I'm Done Recording! →
                    </PrimaryButton>
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
                          borderColor: 'rgba(41, 121, 255, 0.2)',
                          borderTopColor: '#2979FF'
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
                          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(251, 146, 60, 0.05) 100%)',
                          borderColor: 'rgba(251, 191, 36, 0.3)',
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
                                background: 'rgba(41, 121, 255, 0.08)',
                                border: '1px solid rgba(41, 121, 255, 0.2)'
                              }}>
                                <div className="font-bold text-sm mb-1" style={{ color: '#2979FF' }}>Morning</div>
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
                                background: 'rgba(41, 121, 255, 0.08)',
                                border: '1px solid rgba(41, 121, 255, 0.2)'
                              }}>
                                <div className="font-bold text-sm mb-1" style={{ color: '#2979FF' }}>Afternoon</div>
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
                                background: 'rgba(41, 121, 255, 0.08)',
                                border: '1px solid rgba(41, 121, 255, 0.2)'
                              }}>
                                <div className="font-bold text-sm mb-1" style={{ color: '#2979FF' }}>Evening</div>
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
                          background: 'linear-gradient(135deg, rgba(41, 121, 255, 0.04) 0%, rgba(111, 255, 210, 0.04) 100%)',
                          borderColor: 'rgba(41, 121, 255, 0.2)'
                        }}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold flex items-center text-lg" style={{ color: 'var(--secondary)' }}>
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
                                backgroundColor: rewordTitleCount >= 3 && !isPro ? '#94a3b8' : '#2979FF'
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
                              backgroundColor: 'white',
                              borderColor: 'rgba(41, 121, 255, 0.25)',
                              color: '#1a1a1a',
                              fontSize: '15px'
                            }}
                            placeholder="Enter your post title..."
                          />
                        </div>

                        {/* Caption with Hashtags */}
                        <div className="rounded-xl p-6 border-2 shadow-sm" style={{ 
                          background: 'linear-gradient(135deg, rgba(41, 121, 255, 0.04) 0%, rgba(111, 255, 210, 0.04) 100%)',
                          borderColor: 'rgba(41, 121, 255, 0.2)'
                        }}>
                          <h3 className="font-bold mb-4 flex items-center text-lg" style={{ color: 'var(--secondary)' }}>
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
                            onBlur={async () => {
                              // Auto-save when user finishes editing
                              if (user && selectedIdea && postDetails) {
                                await saveCompletedPostToHistory(selectedIdea, postDetails);
                              }
                            }}
                            rows={8}
                            className={`border-2 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical transition-all duration-300 ${
                              captionAnimation === 'fadeOut' ? 'animate-fade-out' : 
                              captionAnimation === 'typing' ? 'animate-typing' : ''
                            }`}
                            style={{
                              backgroundColor: 'white',
                              borderColor: 'rgba(41, 121, 255, 0.25)',
                              color: '#1a1a1a',
                              fontSize: '14.5px',
                              lineHeight: '1.6'
                            }}
                            placeholder="Your caption with hashtags will appear here..."
                          />
                          
                          {/* Copy and Rewrite Buttons */}
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <button
                              onClick={handleCopyToClipboard}
                              className="px-4 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-105 text-white flex items-center justify-center gap-2 shadow-sm"
                              style={{ backgroundColor: '#2979FF' }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy Caption
                            </button>
                            <button
                              onClick={handleRewriteCaption}
                              disabled={isRewriting}
                              className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-sm ${
                                isRewriting
                                  ? "bg-gray-400 text-white cursor-not-allowed"
                                  : "text-white"
                              }`}
                              style={!isRewriting ? {
                                backgroundColor: rewriteCount >= 2 && !isPro ? '#94a3b8' : '#2979FF'
                              } : {}}
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
                                </>
                              )}
                            </button>
                          </div>
                          {!isPro && (
                            <p className="text-xs text-center mt-3 flex items-center justify-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              {rewriteCount >= 2
                                ? "You've used your 2 free rewrites"
                                : `${2 - rewriteCount} ${2 - rewriteCount === 1 ? 'use' : 'uses'} left`}
                            </p>
                          )}
                        </div>

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
            </SectionCard>
          </div>
        )}

        {/* History Page - Shows completed posts */}
        {currentStep === "history" && (
          <SectionCard className="mb-10" isPro={isPro}>
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-4xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                    📝 Your Post History
                  </h2>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    All the video ideas and posts you've created
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

              {completedPosts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                    No posts yet
                  </h3>
                  <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                    Complete the full PostReady workflow to see your posts here
                  </p>
                  <PrimaryButton onClick={navigateHome} isPro={isPro}>
                    Create Your First Post
                  </PrimaryButton>
                </div>
              ) : (
                <div className="space-y-6">
                  {completedPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {post.videoIdea.title}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {post.businessName} • {new Date(post.completedAt).toLocaleDateString()}
                          </p>
                          <Badge variant={post.videoIdea.angle}>
                            {post.videoIdea.angle.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-bold text-gray-900 mb-2">Caption:</h4>
                        <p className="text-gray-700 whitespace-pre-wrap text-sm">
                          {post.postDetails.caption}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-bold text-gray-700">Title:</span>
                          <p className="text-gray-600">{post.postDetails.title}</p>
                        </div>
                        <div>
                          <span className="font-bold text-gray-700">Best Time:</span>
                          <p className="text-gray-600">{post.postDetails.bestPostTime}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(post.postDetails.caption);
                          showNotification("Caption copied to clipboard!", "success", "Copied!");
                        }}
                        className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
                      >
                        Copy Caption
                      </button>
                    </div>
                  ))}
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
              /* Pro Member Status Display */
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
              /* Non-Pro User Pricing Card */
              <div className="max-w-3xl mx-auto mb-10">
                <div className="bg-gradient-to-br from-blue-600 to-cyan-400 rounded-2xl p-8 text-white shadow-2xl">
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold mb-2">Pro Plan</h3>
                    <div className="flex items-end justify-center gap-2">
                      <span className="text-5xl font-bold">$10</span>
                      <span className="text-xl mb-2 opacity-80">/month</span>
                    </div>
                    <p className="text-purple-100 mt-2">Everything you need to grow your business</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Unlimited Video Ideas</p>
                        <p className="text-purple-100 text-sm">Generate endless content ideas instantly</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Advanced Strategy Insights</p>
                        <p className="text-purple-100 text-sm">Get deeper analysis and competitor research</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Priority Support</p>
                        <p className="text-purple-100 text-sm">Get help when you need it most</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Hashtag Research Tool</p>
                        <p className="text-purple-100 text-sm">Find trending hashtags in your niche</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={initiateCheckout}
                    className="w-full bg-white text-blue-600 rounded-lg px-6 py-4 font-bold text-lg hover:bg-gray-50 transition-all shadow-lg"
                  >
                    {user ? 'Subscribe to PostReady Pro - $10/month' : 'Sign Up & Subscribe - $10/month'}
                  </button>
                  <p className="text-center text-purple-100 text-sm mt-3">
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
                    }}>Pro</div>
                  </div>
                  <div className="grid grid-cols-3 text-center border-b" style={{ borderColor: 'var(--card-border)' }}>
                    <div className="p-4 text-left text-sm" style={{ color: 'var(--text-primary)' }}>Video Ideas</div>
                    <div className="p-4" style={{ 
                      backgroundColor: 'var(--hover-bg)',
                      color: 'var(--text-primary)'
                    }}>6</div>
                    <div className="p-4 font-bold" style={{ 
                      backgroundColor: 'rgba(41, 121, 255, 0.1)',
                      color: 'var(--primary)'
                    }}>Unlimited</div>
                  </div>
                  <div className="grid grid-cols-3 text-center border-b" style={{ borderColor: 'var(--card-border)' }}>
                    <div className="p-4 text-left text-sm" style={{ color: 'var(--text-primary)' }}>Business Deep Research</div>
                    <div className="p-4" style={{ 
                      backgroundColor: 'var(--hover-bg)',
                      color: 'var(--text-primary)'
                    }}>1 use</div>
                    <div className="p-4 font-bold" style={{ 
                      backgroundColor: 'rgba(41, 121, 255, 0.1)',
                      color: 'var(--primary)'
                    }}>Unlimited</div>
                  </div>
                  <div className="grid grid-cols-3 text-center">
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

        <div className="text-center text-gray-500 text-sm py-8">
          <p>© 2025 PostReady. Built to help local businesses thrive.</p>
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
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
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

      {/* Floating Theme Toggle - Bottom Right */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-2xl hover:scale-110 z-50"
        style={{ 
          backgroundColor: 'var(--card-bg)',
          border: '3px solid var(--primary)',
          transition: 'all 0.3s ease, transform 0.2s ease'
        }}
        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      >
        <span className="text-3xl" style={{ transition: 'opacity 0.3s ease' }}>
          {theme === 'light' ? '🌙' : '☀️'}
        </span>
      </button>
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
