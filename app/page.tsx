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
import { useAuth } from "@/contexts/AuthContext";
import { saveUserProgress, loadUserProgress } from "@/lib/userProgress";

type WizardStep = "form" | "researching" | "principles" | "choose-idea" | "record-video" | "post-details" | "premium";

export default function Home() {
  const { user, isPro, signOut, upgradeToPro, loading: authLoading } = useAuth();
  
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

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');

  const strategyRef = useRef<HTMLDivElement>(null);
  const postPlannerRef = useRef<HTMLDivElement>(null);

  // Load user progress when user signs in
  useEffect(() => {
    if (user && !authLoading) {
      loadProgress();
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
    }
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
      setPostDetails({
        ...result,
        caption: data.caption,
        hashtags: [], // Hashtags are now in the caption
      });
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
      setPostDetails({
        ...result,
        caption: captionWithHashtags,
        hashtags: [],
      });
    }
  };

  const handleCopyToClipboard = () => {
    if (!postDetails) return;
    navigator.clipboard.writeText(postDetails.caption);
    alert("Caption copied to clipboard!");
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
      "premium": 0  // Premium page doesn't show step progress
    };
    return steps[currentStep] || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header with Auth */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1"></div>
          
          {!authLoading && (
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {isPro && (
                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      PRO
                    </span>
                  )}
                  <span className="text-sm text-gray-600">{user.email}</span>
                  {!isPro && (
                    <button
                      onClick={() => setCurrentStep("premium")}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:from-purple-700 hover:to-indigo-700 transition-all"
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
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="text-center mb-12">
          <h1 
            onClick={() => {
              setCurrentStep("form");
              setStrategy(null);
              setSelectedIdea(null);
              setPostDetails(null);
            }}
            className="text-5xl font-bold text-gray-900 mb-3 cursor-pointer hover:text-indigo-600 transition-colors"
          >
            PostReady
          </h1>
          <p className="text-lg text-gray-700 font-medium mb-4">
            We help you do the most important thing for your business: post.
          </p>
          <p className="text-xl text-indigo-600 font-medium mb-2">
            Your personal social media manager.
          </p>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get personalized content ideas, captions, tags, and posting times
            based on your business and location.
          </p>
        </div>

        {/* Business Info Form */}
        {currentStep === "form" && (
          <SectionCard className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
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
            <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1 flex items-center">
                    <span className="text-2xl mr-2">✨</span>
                    Unlock PostReady Pro
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Get unlimited video ideas, advanced insights, and priority support
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep("premium")}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center whitespace-nowrap"
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
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Creating Your Strategy...
                </h2>
                <p className="text-gray-600 mb-8">
                  Finding the best tactics for {businessInfo.businessName} on {businessInfo.platform}
                </p>

                <div className="max-w-md mx-auto space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium">
                      {researchStatus}
                    </span>
                    <span className="text-indigo-600 font-bold">
                      {Math.round(researchProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
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
        {strategy && currentStep !== "form" && currentStep !== "researching" && (
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
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(Math.min(getStepNumber(), 4) / 4) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Step 1: Key Strategies */}
              {currentStep === "principles" && strategy && strategy.keyPrinciples && strategy.contentIdeas && (
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Your {businessInfo.platform} Growth Strategy
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Simple, actionable tactics that actually work
                  </p>

                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500 p-6 mb-8 rounded-r-lg">
                    <div className="flex items-start">
                      <span className="text-4xl mr-4">🎯</span>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">The Key to Success</h3>
                        <p className="text-gray-800 text-lg">{strategy.headlineSummary}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="text-3xl mr-2">⚡</span>
                      5 Strategies to Grow Your Audience
                    </h3>
                    <div className="space-y-4">
                      {strategy.keyPrinciples.map((principle, index) => (
                        <div key={index} className="bg-white p-5 rounded-lg border-2 border-gray-200 hover:border-indigo-400 transition-all shadow-sm hover:shadow-md">
                          <div className="flex items-start">
                            <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                              {index + 1}
                            </div>
                            <p className="text-gray-800 text-lg leading-relaxed">{principle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start">
                      <span className="text-3xl mr-3">💡</span>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Remember:</h4>
                        <p className="text-gray-700">
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
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Choose Your Video Idea
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Select one idea to create content for. You'll record the video next.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {strategy.contentIdeas.map((idea, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectIdea(idea)}
                        className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedIdea?.title === idea.title
                            ? "border-indigo-500 bg-indigo-50 shadow-lg"
                            : "border-gray-200 hover:border-indigo-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-gray-900 flex-1">
                            {idea.title}
                          </h4>
                          <Badge variant={idea.angle}>
                            {idea.angle.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{idea.description}</p>
                        {selectedIdea?.title === idea.title && (
                          <div className="mt-3 text-indigo-600 font-medium text-sm flex items-center">
                            <span className="mr-2">✓</span> Selected
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pro Upgrade Button */}
                  <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1 flex items-center">
                          <span className="text-2xl mr-2">✨</span>
                          Want More Creative Ideas?
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Get unlimited video ideas tailored to your business
                        </p>
                      </div>
                      <button
                        onClick={() => setCurrentStep("premium")}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center whitespace-nowrap"
                      >
                        <span className="mr-2">⚡</span>
                        Upgrade to Pro
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <SecondaryButton onClick={handlePreviousStep} className="flex-1">
                      ← Back
                    </SecondaryButton>
                    <PrimaryButton onClick={handleNextStep} className="flex-1">
                      Next: Record Instructions →
                    </PrimaryButton>
                  </div>
                </div>
              )}


              {/* Step 3: Record Video */}
              {currentStep === "record-video" && selectedIdea && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-6">🎥</div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Time to Record Your Video!
                  </h2>
                  
                  <div className="max-w-2xl mx-auto mb-8">
                    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Your Selected Idea:
                      </h3>
                      <p className="text-lg font-medium text-indigo-700 mb-2">
                        {selectedIdea.title}
                      </p>
                      <p className="text-gray-700">
                        {selectedIdea.description}
                      </p>
                    </div>

                    {/* Recording Instructions */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
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

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 max-w-2xl mx-auto">
                    <p className="text-gray-800">
                      <strong>👉 Go record your video now!</strong> When you're done, come back here and click "I'm Done Recording" to get your caption, hashtags, and best posting time.
                    </p>
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
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Your Post is Ready! 🎉
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Here's everything you need to post your video
                  </p>

                  {!postDetails ? (
                    <>
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                        <p className="text-blue-800">
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
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                            <span className="text-2xl mr-2">📅</span>
                            Best Times to Post
                          </h3>
                          <div className="text-gray-800 whitespace-pre-line leading-relaxed">
                            {postDetails.bestPostTime}
                          </div>
                        </div>

                        {/* Title */}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">
                            📝 Post Title
                          </h3>
                          <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                            <p className="text-lg font-medium text-gray-900">
                              {postDetails.title}
                            </p>
                          </div>
                        </div>

                        {/* Caption with Hashtags */}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">
                            ✍️ Caption (Editable)
                          </h3>
                          <textarea
                            value={postDetails.caption}
                            onChange={(e) =>
                              setPostDetails({ ...postDetails, caption: e.target.value })
                            }
                            rows={12}
                            className="border-2 border-gray-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical font-sans"
                            placeholder="Your caption with hashtags will appear here..."
                          />
                          
                          {/* Copy Button directly under caption */}
                          <PrimaryButton onClick={handleCopyToClipboard} className="w-full mt-3">
                            📋 Copy Caption
                          </PrimaryButton>
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

        {/* Premium Subscription Page - Accessible from any step */}
        {currentStep === "premium" && (
          <SectionCard className="mb-10">
            <div>
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">⚡</div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  Upgrade to PostReady Pro
                </h2>
                <p className="text-gray-600 text-lg">
                  Supercharge your social media strategy with unlimited powerful tools
                </p>
              </div>

              {/* Pricing Card */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
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
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">✓</span>
                      <div>
                        <p className="font-bold text-lg">Deep Research Tool</p>
                        <p className="text-purple-100 text-sm">Conduct in-depth analysis of your business, competitors, and market trends for comprehensive strategic insights</p>
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
                    className="w-full bg-white text-purple-600 rounded-lg px-6 py-4 font-bold text-lg hover:bg-gray-50 transition-all shadow-lg"
                  >
                    Start Your Pro Trial - 2 Days Free
                  </button>
                  <p className="text-center text-purple-100 text-sm mt-3">
                    Cancel anytime • Secure payment by Stripe
                  </p>
                </div>
              </div>

              {/* Feature Comparison */}
              <div className="max-w-2xl mx-auto mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  Free vs Pro Comparison
                </h3>
                <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                  <div className="grid grid-cols-3 text-center border-b-2 border-gray-200">
                    <div className="p-4 font-bold">Feature</div>
                    <div className="p-4 font-bold bg-gray-50">Free</div>
                    <div className="p-4 font-bold bg-purple-50 text-purple-600">Pro</div>
                  </div>
                  <div className="grid grid-cols-3 text-center border-b border-gray-200">
                    <div className="p-4 text-left text-sm">Video Ideas</div>
                    <div className="p-4 bg-gray-50">6</div>
                    <div className="p-4 bg-purple-50 font-bold text-purple-600">Unlimited</div>
                  </div>
                  <div className="grid grid-cols-3 text-center border-b border-gray-200">
                    <div className="p-4 text-left text-sm">Business Deep Research</div>
                    <div className="p-4 bg-gray-50">Basic</div>
                    <div className="p-4 bg-purple-50 font-bold text-purple-600">Advanced</div>
                  </div>
                  <div className="grid grid-cols-3 text-center">
                    <div className="p-4 text-left text-sm">Support</div>
                    <div className="p-4 bg-gray-50">Email</div>
                    <div className="p-4 bg-purple-50 font-bold text-purple-600">Priority</div>
                  </div>
                </div>
              </div>

              {/* Back Button */}
              <div className="text-center">
                <button
                  onClick={() => setCurrentStep("form")}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  ← Back to Main Page
                </button>
              </div>
            </div>
          </SectionCard>
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
    </div>
  );
}
