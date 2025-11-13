"use client";

import React, { useState, useRef, useEffect } from "react";
import { BusinessInfo, StrategyResult, PostDetails, ContentIdea } from "@/types";
import { generateStrategyAndIdeas } from "@/lib/strategy";
import { generatePostDetails } from "@/lib/post";
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

type WizardStep = "form" | "researching" | "principles" | "choose-idea" | "record-video" | "post-details" | "premium" | "history" | "businesses";

export default function Home() {
  const { user, isPro, signOut, upgradeToPro, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
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

  // Auto-save progress when data changes
  useEffect(() => {
    if (user && currentStep !== 'form') {
      saveProgress();
    }
  }, [user, businessInfo, strategy, selectedIdea, postDetails, currentStep]);

  const loadProgress = async () => {
    if (!user) return;

    try {
      const { data, error } = await loadUserProgress(user.id);
      if (!error && data) {
        if (data.businessInfo) setBusinessInfo(data.businessInfo);
        if (data.strategy) setStrategy(data.strategy);
        if (data.selectedIdea) setSelectedIdea(data.selectedIdea);
        if (data.postDetails) setPostDetails(data.postDetails);
        if (data.currentStep) setCurrentStep(data.currentStep as WizardStep);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async () => {
    if (!user) return;

    try {
      await saveUserProgress(user.id, {
        businessInfo,
        strategy,
        selectedIdea,
        postDetails,
        currentStep,
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const loadHistoryData = async () => {
    if (!user) return;

    try {
      const [businessesResult, postsResult] = await Promise.all([
        loadSavedBusinesses(user.id),
        loadPostHistory(user.id)
      ]);

      if (!businessesResult.error && businessesResult.data) {
        setSavedBusinesses(businessesResult.data);
      }

      if (!postsResult.error && postsResult.data) {
        setCompletedPosts(postsResult.data);
      }
    } catch (error) {
      console.error('Error loading history:', error);
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

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Save business for quick access later
  const saveBusinessForLater = async (info: BusinessInfo, strat: StrategyResult) => {
    if (!user) return;

    try {
      // Save to Supabase
      await saveBusiness(user.id, info, strat);
      
      // Reload the businesses list
      const { data, error } = await loadSavedBusinesses(user.id);
      if (!error && data) {
        setSavedBusinesses(data);
      }
    } catch (error) {
      console.error('Error saving business:', error);
    }
  };

  // Save completed post to history
  const saveCompletedPostToHistory = async (idea: ContentIdea, details: PostDetails) => {
    if (!user) return;

    try {
      // Save to Supabase
      await saveCompletedPost(user.id, businessInfo.businessName, idea, details);
      
      // Reload the post history
      const { data, error } = await loadPostHistory(user.id);
      if (!error && data) {
        setCompletedPosts(data);
      }
    } catch (error) {
      console.error('Error saving completed post:', error);
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

  const handleGenerateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessInfo.businessName || !businessInfo.location) {
      alert("Please fill in all required fields");
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
    }, 400);

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
      
      // Use the REAL research data from GPT-4
      let researchResult;
      if (data.research && data.research.headlineSummary && data.research.keyPrinciples && data.research.contentIdeas) {
        researchResult = data.research;
      } else {
        // Fallback to template if research data is incomplete
        console.log("Research data incomplete, using fallback:", data);
        researchResult = generateStrategyAndIdeas(businessInfo);
      }
      
      // Complete progress
      setResearchProgress(100);
      setResearchStatus("Research complete!");
      
      // Set strategy and move to next step after state updates
      setStrategy(researchResult);
      
      // Save business for quick access later
      if (user) {
        saveBusinessForLater(businessInfo, researchResult);
      }
      
      setTimeout(() => {
        setCurrentStep("principles");
      }, 1200);
      
    } catch (error: any) {
      console.error("Research error:", error);
      clearInterval(progressInterval);
      
      // Fallback to regular strategy if research fails
      const result = generateStrategyAndIdeas(businessInfo);
      setResearchProgress(100);
      setResearchStatus("Using backup strategy...");
      setStrategy(result);
      
      // Save business for quick access later
      if (user) {
        saveBusinessForLater(businessInfo, result);
      }
      
      setTimeout(() => {
        setCurrentStep("principles");
      }, 1200);
    }
  };

  const handleNextStep = () => {
    if (currentStep === "principles") {
      setCurrentStep("choose-idea");
    } else if (currentStep === "choose-idea") {
      if (!selectedIdea) {
        alert("Please select a video idea before continuing");
        return;
      }
      setCurrentStep("record-video");
    } else if (currentStep === "record-video") {
      setCurrentStep("post-details");
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "choose-idea") {
      setCurrentStep("principles");
    } else if (currentStep === "record-video") {
      setCurrentStep("choose-idea");
    } else if (currentStep === "post-details") {
      setCurrentStep("record-video");
    } else if (currentStep === "premium") {
      setCurrentStep("form");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };

  const scrollToPremium = () => {
    setCurrentStep("premium");
    // Smooth scroll to top after state update
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', title?: string) => {
    setNotification({
      isOpen: true,
      message,
      type,
      title,
    });
  };

  const handleSelectIdea = (idea: ContentIdea) => {
    setSelectedIdea(idea);
  };

  const handleGeneratePost = async () => {
    if (!strategy || !selectedIdea) {
      alert("Please select a content idea first");
      return;
    }

    try {
      // Get intelligent caption from API
      const response = await fetch("/api/generate-caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessInfo,
          selectedIdea,
        }),
      });

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

      // Use AI caption with hashtags already included
      const newPostDetails = {
        ...result,
        caption: data.caption,
        hashtags: [], // Hashtags are now in the caption
      };
      setPostDetails(newPostDetails);
      
      // Save to history
      if (user) {
        saveCompletedPostToHistory(selectedIdea, newPostDetails);
      }
    } catch (error) {
      console.error("Caption generation error:", error);
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
        saveCompletedPostToHistory(selectedIdea, newPostDetails);
      }
    }
  };

  const handleCopyToClipboard = () => {
    if (!postDetails) return;
    navigator.clipboard.writeText(postDetails.caption);
    alert("Caption copied to clipboard!");
  };

  const handleRewriteCaption = async () => {
    // Check if user has exceeded free rewrite limit (2 free rewrites)
    if (rewriteCount >= 2 && !isPro) {
      if (window.confirm("You've used your 2 free rewrites. Upgrade to PostReady Pro for unlimited rewrites?")) {
        scrollToPremium();
      }
      return;
    }

    if (!strategy || !selectedIdea) {
      alert("Please select a content idea first");
      return;
    }

    setIsRewriting(true);
    setCaptionAnimation('fadeOut');

    try {
      // Wait for fade out animation
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get intelligent caption from API, using current title as context
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
      });

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

      // Use AI caption with hashtags already included
      const newPostDetails = {
        ...result,
        caption: data.caption,
        hashtags: [], // Hashtags are now in the caption
      };
      setPostDetails(newPostDetails);
      setRewriteCount(prev => prev + 1);
      
      // Start typing animation
      setCaptionAnimation('typing');
      
      // Reset animation after typing completes
      setTimeout(() => {
        setCaptionAnimation('idle');
      }, 2000);
      
      alert("Caption rewritten successfully!");
    } catch (error) {
      console.error("Caption rewrite error:", error);
      alert("Failed to rewrite caption. Please try again.");
      setCaptionAnimation('idle');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleRegenerateIdea = () => {
    // Check if user has exceeded free regenerate limit
    if (regenerateCount >= 2 && !isPro) {
      if (window.confirm("You've used your free idea regenerations. Upgrade to PostReady Pro for unlimited regenerations?")) {
        scrollToPremium();
      }
      return;
    }

    if (!strategy || !strategy.contentIdeas || strategy.contentIdeas.length <= 1) {
      alert("No other ideas available");
      return;
    }

    // Get a different random idea
    const availableIdeas = strategy.contentIdeas.filter(
      idea => idea.title !== selectedIdea?.title
    );
    
    if (availableIdeas.length === 0) {
      alert("No other ideas available");
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableIdeas.length);
    const newIdea = availableIdeas[randomIndex];
    
    setSelectedIdea(newIdea);
    setPostDetails(null); // Reset post details so caption gets regenerated with new idea
    setRegenerateCount(prev => prev + 1);
    
    alert(`New idea selected! "${newIdea.title}"`);
  };

  const handleRewordTitle = async () => {
    // Check if user has exceeded free reword limit (3 free rewords)
    if (rewordTitleCount >= 3 && !isPro) {
      if (window.confirm("You've used your 3 free title rewords. Upgrade to PostReady Pro for unlimited rewords?")) {
        scrollToPremium();
      }
      return;
    }

    if (!postDetails || !selectedIdea) {
      alert("Please generate a post first");
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
      setPostDetails({
        ...postDetails,
        title: data.title,
      });
      setRewordTitleCount(prev => prev + 1);
      
      // Start fade in animation
      setTitleAnimation('fadeIn');
      
      // Reset animation after fade in completes
      setTimeout(() => {
        setTitleAnimation('idle');
      }, 500);
    } catch (error) {
      console.error("Title reword error:", error);
      alert("Failed to reword title. Please try again.");
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
      "post-details": 4,
      "premium": 0,  // Premium page doesn't show step progress
      "history": 0,  // History page doesn't show step progress
      "businesses": 0  // Businesses page doesn't show step progress
    };
    return steps[currentStep] || 0;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header with Auth */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1"></div>
          
          {!authLoading && (
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {isPro && (
                    <span style={{ background: 'linear-gradient(to right, #2979FF, #6FFFD2)' }} className="text-white px-3 py-1 rounded-full text-xs font-bold">
                      PRO
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setCurrentStep("form");
                      setStrategy(null);
                      setSelectedIdea(null);
                      setPostDetails(null);
                      setRewriteCount(0);
                      setRegenerateCount(0);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-sm font-medium transition-colors"
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
                    onClick={() => setCurrentStep("businesses")}
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
                    onClick={() => setCurrentStep("history")}
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
                    onClick={() => window.location.href = '/portal'}
                    className="text-sm transition-colors font-medium underline decoration-dotted"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {user.email}
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
                </>
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal('signin')}
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="text-white px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
                    style={{ backgroundColor: '#2979FF' }}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="text-center mb-16">
          <h1 
            onClick={() => {
              setCurrentStep("form");
              setStrategy(null);
              setSelectedIdea(null);
              setPostDetails(null);
            }}
            className="text-6xl font-extrabold mb-3 cursor-pointer transition-all hover:scale-105"
            style={{ 
              color: 'var(--secondary)',
              letterSpacing: '-0.02em'
            }}
          >
            PostReady
          </h1>
          <p className="text-2xl font-medium tracking-wide" style={{ color: 'var(--primary)' }}>
            Posting made easy.
          </p>
        </div>

        {/* Business Info Form */}
        {currentStep === "form" && (
          <SectionCard className="mb-10">
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

              <InputField
                label="Location"
                value={businessInfo.location}
                onChange={(value) =>
                  setBusinessInfo({ ...businessInfo, location: value })
                }
                placeholder="Monterey, CA"
                required
              />

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

              <PrimaryButton type="submit" className="w-full">
                Research My Business & Generate Strategy
              </PrimaryButton>
            </form>

              {/* Pro Upgrade CTA */}
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
          </SectionCard>
        )}

        {/* Researching State */}
        {currentStep === "researching" && (
          <div ref={strategyRef} className="mb-10 scroll-mt-4">
            <SectionCard>
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
        {strategy && currentStep !== "form" && currentStep !== "researching" && currentStep !== "premium" && (
          <div ref={strategyRef} className="mb-10 scroll-mt-4">
            <SectionCard>
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

                  <PrimaryButton onClick={handleNextStep} className="w-full text-lg py-4">
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

                  {/* Generate More Ideas Button - Floating */}
                  <div className="mb-6 flex justify-end">
                    <button
                      onClick={async () => {
                        if (!isPro) {
                          setModalState({
                            isOpen: true,
                            title: "Pro Feature",
                            message: "Generate More Ideas is a Pro feature. Upgrade to PostReady Pro for unlimited video ideas?",
                            type: 'confirm',
                            onConfirm: scrollToPremium,
                            confirmText: "Upgrade Now"
                          });
                          return;
                        }

                        // Pro users: Regenerate ideas with smooth animation
                        if (!businessInfo.businessName) return;
                        
                        setIsRewriting(true);
                        setIdeasAnimation('fadeOut');
                        
                        try {
                          // Wait for fade out animation
                          await new Promise(resolve => setTimeout(resolve, 300));
                          
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
                          
                          // Update strategy with new ideas
                          setStrategy(data.research);
                          setSelectedIdea(null);
                          
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
                      ) : isPro ? (
                        <>
                          <span className="mr-2">🎬</span>
                          Generate More Ideas
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🔒</span>
                          Pro: More Ideas
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <SecondaryButton onClick={handlePreviousStep} className="flex-1">
                      ← Back
                    </SecondaryButton>
                    <PrimaryButton onClick={handleNextStep} className="flex-1">
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

                    {/* Recording Instructions */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                      <div className="flex items-start">
                        <span className="text-3xl mr-3">📱</span>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg mb-2">
                            How to Record:
                          </h4>
                          <p className="text-gray-800 leading-relaxed">
                            Simply record with your <strong>iPhone (or any smartphone)</strong> using regular video settings. 
                            No need to get extra fancy! Research has proven that users actually prefer <strong>raw phone video</strong> over overly edited content. 
                            Authentic beats perfect every time. 🎥
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6 text-left space-y-4">
                      <h4 className="font-bold text-gray-900 text-lg mb-3">
                        📝 Quick Recording Tips:
                      </h4>
                      <ul className="space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Keep it short (up to 90 seconds works great)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Film in good lighting (natural light works best)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          <span>Be authentic - show your personality!</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 max-w-2xl mx-auto">
                    <p className="text-gray-800">
                      <strong>👉 Go record your video now!</strong> When you're done, come back here and click "I'm Done Recording" to get your caption, hashtags, and best posting time.
                    </p>
                  </div>

                  {/* Tough Love Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
                    <div className="flex items-start">
                      <span className="text-3xl mr-3">💪</span>
                      <div>
                        <p className="text-gray-800 font-medium mb-2">
                          We know how hard it is to actually hit record — but this is your sign.
                        </p>
                        <p className="text-gray-700">
                          <strong>Don't overthink it. Just film something.</strong> Every time you do it, it gets easier.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 max-w-md mx-auto">
                    <SecondaryButton onClick={handlePreviousStep} className="flex-1">
                      ← Change Idea
                    </SecondaryButton>
                    <PrimaryButton onClick={handleNextStep} className="flex-1">
                      I'm Done Recording! →
                    </PrimaryButton>
                  </div>
                </div>
              )}

              {/* Step 4: Post Details */}
              {currentStep === "post-details" && (
                <div>
                  <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--secondary)' }}>
                    Your Post is Ready! 🎉
                  </h2>
                  <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                    Here's everything you need to post your video
                  </p>

                  {!postDetails ? (
                    <>
                      <div className="border-l-4 p-4 mb-6 rounded-lg" style={{ 
                        backgroundColor: 'rgba(41, 121, 255, 0.1)',
                        borderColor: 'var(--primary)'
                      }}>
                        <p style={{ color: 'var(--text-primary)' }}>
                          Click the button below to generate your caption (with hashtags included) and best posting time!
                        </p>
                      </div>
                      <PrimaryButton onClick={handleGeneratePost} className="w-full mb-6">
                        Generate My Caption
                      </PrimaryButton>
                    </>
                  ) : (
                    <>
                      <div className="space-y-6">
                        {/* Best Times to Post */}
                        <div className="border-l-4 p-6 rounded-lg" style={{ 
                          backgroundColor: 'rgba(251, 191, 36, 0.1)',
                          borderColor: '#F59E0B'
                        }}>
                          <h3 className="text-lg font-bold mb-3 flex items-center" style={{ color: 'var(--text-primary)' }}>
                            <span className="text-2xl mr-2">📅</span>
                            Best Times to Post
                          </h3>
                          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                            Based on our analysis of the {businessInfo.location} market...
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="rounded-lg p-3 border" style={{ 
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--card-border)'
                            }}>
                              <div className="font-bold" style={{ color: 'var(--primary)' }}>Morning</div>
                              <div style={{ color: 'var(--text-primary)' }}>8am - 10am</div>
                            </div>
                            <div className="rounded-lg p-3 border" style={{ 
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--card-border)'
                            }}>
                              <div className="font-bold" style={{ color: 'var(--primary)' }}>Afternoon</div>
                              <div style={{ color: 'var(--text-primary)' }}>2pm - 5pm</div>
                            </div>
                            <div className="rounded-lg p-3 border" style={{ 
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--card-border)'
                            }}>
                              <div className="font-bold" style={{ color: 'var(--primary)' }}>Evening</div>
                              <div style={{ color: 'var(--text-primary)' }}>7pm - 8pm</div>
                            </div>
                          </div>
                        </div>

                        {/* Title */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xl font-bold" style={{ color: 'var(--secondary)' }}>
                              📝 Post Title
                            </h3>
                            <button
                              onClick={handleRewordTitle}
                              disabled={isRewordingTitle}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                isRewordingTitle
                                  ? "bg-gray-400 text-white cursor-not-allowed"
                                  : rewordTitleCount >= 3 && !isPro
                                  ? "bg-gradient-to-r from-blue-600 to-cyan-400 text-white hover:from-blue-700 hover:to-cyan-500"
                                  : "bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                              }`}
                            >
                              {isRewordingTitle
                                ? "Rewording..."
                                : rewordTitleCount >= 3 && !isPro
                                ? "🔒 Pro Only"
                                : "🔄 Reword"}
                            </button>
                          </div>
                          {rewordTitleCount > 0 && rewordTitleCount < 3 && !isPro && (
                            <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                              {3 - rewordTitleCount} {3 - rewordTitleCount === 1 ? 'use' : 'uses'} left
                            </p>
                          )}
                          {rewordTitleCount >= 3 && !isPro && (
                            <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                              You've used your 3 free rewords
                            </p>
                          )}
                          <input
                            type="text"
                            value={postDetails.title}
                            onChange={(e) =>
                              setPostDetails({ ...postDetails, title: e.target.value })
                            }
                            className={`border-2 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 text-lg font-medium transition-all duration-300 ${
                              titleAnimation === 'fadeOut' ? 'animate-fade-out' : 
                              titleAnimation === 'fadeIn' ? 'animate-fade-in' : ''
                            }`}
                            style={{
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--card-border)',
                              color: 'var(--text-primary)'
                            }}
                            placeholder="Post title..."
                          />
                        </div>

                        {/* Caption with Hashtags */}
                        <div>
                          <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--secondary)' }}>
                            ✍️ Caption (Editable)
                          </h3>
                          <textarea
                            value={postDetails.caption}
                            onChange={(e) =>
                              setPostDetails({ ...postDetails, caption: e.target.value })
                            }
                            rows={12}
                            className={`border-2 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 resize-vertical font-sans transition-all duration-300 ${
                              captionAnimation === 'fadeOut' ? 'animate-fade-out' : 
                              captionAnimation === 'typing' ? 'animate-typing' : ''
                            }`}
                            style={{
                              backgroundColor: 'var(--card-bg)',
                              borderColor: 'var(--card-border)',
                              color: 'var(--text-primary)'
                            }}
                            placeholder="Your caption with hashtags will appear here..."
                          />
                          
                          {/* Copy and Rewrite Buttons */}
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <PrimaryButton onClick={handleCopyToClipboard} className="w-full">
                              📋 Copy Caption
                            </PrimaryButton>
                            <button
                              onClick={handleRewriteCaption}
                              disabled={isRewriting}
                              className={`w-full px-4 py-3 rounded-lg font-bold transition-all ${
                                isRewriting
                                  ? "bg-gray-400 text-white cursor-not-allowed"
                                  : rewriteCount >= 2 && !isPro
                                  ? "bg-gradient-to-r from-blue-600 to-cyan-400 text-white hover:from-blue-700 hover:to-cyan-500"
                                  : "bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                              }`}
                            >
                              {isRewriting
                                ? "Rewriting..."
                                : rewriteCount >= 2 && !isPro
                                ? "🔒 Pro Only"
                                : "🔄 Rewrite"}
                            </button>
                          </div>
                          {rewriteCount >= 2 && !isPro && (
                            <p className="text-xs text-center mt-2" style={{ color: 'var(--text-secondary)' }}>
                              You've used your 2 free rewrites
                            </p>
                          )}
                          {rewriteCount > 0 && rewriteCount < 2 && !isPro && (
                            <p className="text-xs text-center mt-2" style={{ color: 'var(--text-secondary)' }}>
                              {2 - rewriteCount} {2 - rewriteCount === 1 ? 'use' : 'uses'} left
                            </p>
                          )}
                        </div>

                        {/* Back Button */}
                        <div className="pt-4">
                          <SecondaryButton onClick={handlePreviousStep} className="w-full">
                            ← Back
                          </SecondaryButton>
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
          <SectionCard className="mb-10">
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
                  onClick={() => setCurrentStep("form")}
                  className="px-5 py-2.5 rounded-lg font-medium transition-all hover:scale-105"
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
                  <PrimaryButton onClick={() => setCurrentStep("form")}>
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
                          alert("Caption copied to clipboard!");
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
          <SectionCard className="mb-10">
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
                  onClick={() => setCurrentStep("form")}
                  className="px-5 py-2.5 rounded-lg font-medium transition-all hover:scale-105"
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
                  <PrimaryButton onClick={() => setCurrentStep("form")}>
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
            {/* Pricing Card - Main Focus */}
            <div className="max-w-3xl mx-auto mb-10">
                <div className="bg-gradient-to-br from-blue-600 to-cyan-400 rounded-2xl p-8 text-white shadow-2xl">
                  <div className="text-center mb-6">
                    <div className="inline-block bg-white/20 rounded-full px-4 py-1 text-sm font-bold mb-4">
                      MOST POPULAR
                    </div>
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
                    onClick={async () => {
                      if (!user) {
                        alert("Please sign up or sign in first to upgrade!");
                        openAuthModal('signup');
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
                        alert("Failed to start checkout. Please try again.");
                      }
                    }}
                    className="w-full bg-white text-blue-600 rounded-lg px-6 py-4 font-bold text-lg hover:bg-gray-50 transition-all shadow-lg"
                  >
                    Subscribe to PostReady Pro - $10/month
                  </button>
                  <p className="text-center text-purple-100 text-sm mt-3">
                    Cancel anytime • Secure payment by Stripe
                  </p>
                </div>
              </div>

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
                    }}>Basic</div>
                    <div className="p-4 font-bold" style={{ 
                      backgroundColor: 'rgba(41, 121, 255, 0.1)',
                      color: 'var(--primary)'
                    }}>Advanced</div>
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
        onClose={() => setNotification({ ...notification, isOpen: false })}
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
