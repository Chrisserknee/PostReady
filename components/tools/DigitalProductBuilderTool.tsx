"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/InputField";
import { TextAreaField } from "@/components/TextAreaField";
import { SelectField } from "@/components/SelectField";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "@/components/Modal";
import jsPDF from 'jspdf';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  FileText,
  DollarSign,
  Rocket,
  Package,
  Copy,
  Download,
  Loader2,
  Save,
  RefreshCw,
  Calculator,
  Mail,
  Zap,
  Edit3,
  Check,
  X,
  Trash2,
  PartyPopper,
  TrendingUp,
  Lightbulb,
  LayoutTemplate,
  PenTool,
  Target,
  ShoppingCart,
  Calendar,
  Store,
  Users,
  Trophy,
  Layers,
  BookOpen,
  Briefcase,
  Code,
  Palette,
  MessageSquare,
  Lock,
  Crown
} from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface ProductIdea {
  title: string;
  description: string;
  targetAudience: string;
  problemSolved: string;
  priceRange: string;
  simplicityLevel: string;
}

interface ProductBlueprint {
  title: string;
  promise: string;
  keyOutcome: string;
  sections: Array<{
    title: string;
    description: string;
  }>;
}

interface ContentSection {
  title: string;
  content: string;
  type: 'outline' | 'content' | 'template';
}

interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
}

interface SalesCopy {
  headline: string;
  description: string;
  benefits: string[];
  faq: Array<{ question: string; answer: string }>;
  objectionHandling: string[];
  transformationStory: string;
}

interface LaunchPlan {
  day: number;
  action: string;
  contentIdea: string;
  hook: string;
  cta: string;
}

interface PlatformSuggestion {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  bestFor: string;
}

interface EmailSequence {
  subject: string;
  preview: string;
  body: string;
  dayToSend: number;
  purpose: string;
}

interface SavedProgress {
  currentStep: Step;
  niche: string;
  audience: string;
  commonRequests: string;
  strengths: string;
  effortLevel: string;
  productIdeas: ProductIdea[];
  selectedProductIdea: ProductIdea | null;
  blueprint: ProductBlueprint | null;
  contentSections: ContentSection[];
  productType: string;
  pricingTiers: PricingTier[];
  positioning: string;
  salesCopy: SalesCopy | null;
  launchPlan: LaunchPlan[];
  platformSuggestions: PlatformSuggestion[];
  emailSequence: EmailSequence[];
  savedAt: string;
}

// Quick Start Templates for common niches
const QUICK_START_TEMPLATES: Array<{
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  niche: string;
  audience: string;
  commonRequests: string;
  strengths: string;
  effortLevel: string;
}> = [
  {
    name: "Fitness",
    icon: Trophy,
    niche: "Fitness & Health",
    audience: "Busy professionals who want to get fit without spending hours at the gym",
    commonRequests: "Quick workout routines, meal plans, staying consistent with fitness goals",
    strengths: "Personal training experience, nutrition knowledge, motivational coaching",
    effortLevel: "Medium effort"
  },
  {
    name: "Creator",
    icon: MessageSquare,
    niche: "Content Creation & Social Media",
    audience: "Aspiring content creators and small business owners who want to grow online",
    commonRequests: "How to go viral, content ideas, growing followers, monetization strategies",
    strengths: "Building engaged audiences, creating viral content, understanding algorithms",
    effortLevel: "Medium effort"
  },
  {
    name: "Business",
    icon: Briefcase,
    niche: "Business & Entrepreneurship",
    audience: "First-time entrepreneurs and small business owners looking to scale",
    commonRequests: "Business planning, pricing strategies, finding clients, scaling operations",
    strengths: "Business strategy, marketing, sales processes, operations management",
    effortLevel: "High effort / high reward"
  },
  {
    name: "Design",
    icon: Palette,
    niche: "Design & Creativity",
    audience: "Freelance designers and creative professionals wanting to improve their craft",
    commonRequests: "Design tips, client management, portfolio building, pricing creative work",
    strengths: "Visual design, branding, creative direction, design tools expertise",
    effortLevel: "Low effort"
  },
  {
    name: "Developer",
    icon: Code,
    niche: "Technology & Development",
    audience: "Aspiring developers and tech professionals wanting to level up their skills",
    commonRequests: "Learning to code, building projects, landing tech jobs, freelancing",
    strengths: "Programming, software development, tech career guidance, project building",
    effortLevel: "High effort / high reward"
  },
  {
    name: "Finance",
    icon: DollarSign,
    niche: "Personal Finance & Investing",
    audience: "Young professionals and beginners wanting to manage money and build wealth",
    commonRequests: "Budgeting tips, investing basics, debt payoff strategies, passive income",
    strengths: "Financial planning, investment strategies, money management, tax optimization",
    effortLevel: "Medium effort"
  },
  {
    name: "Cooking",
    icon: BookOpen,
    niche: "Cooking & Food",
    audience: "Home cooks and food enthusiasts who want to improve their culinary skills",
    commonRequests: "Quick recipes, meal prep ideas, cooking techniques, healthy eating",
    strengths: "Recipe development, cooking techniques, food photography, nutrition knowledge",
    effortLevel: "Low effort"
  },
  {
    name: "Parenting",
    icon: Users,
    niche: "Parenting & Family",
    audience: "New parents and families looking for practical parenting advice",
    commonRequests: "Sleep training, discipline strategies, educational activities, work-life balance",
    strengths: "Child development knowledge, practical parenting experience, patience strategies",
    effortLevel: "Medium effort"
  },
  {
    name: "Music",
    icon: Layers,
    niche: "Music & Audio Production",
    audience: "Aspiring musicians and producers wanting to create and release music",
    commonRequests: "Learning instruments, music production, releasing music, building fanbase",
    strengths: "Music theory, production skills, instrument proficiency, audio engineering",
    effortLevel: "High effort / high reward"
  },
  {
    name: "Writing",
    icon: PenTool,
    niche: "Writing & Publishing",
    audience: "Aspiring authors and writers wanting to publish and monetize their writing",
    commonRequests: "Writing tips, self-publishing, building audience, overcoming writer's block",
    strengths: "Storytelling, editing, self-publishing experience, content marketing",
    effortLevel: "Medium effort"
  },
  {
    name: "Marketing",
    icon: TrendingUp,
    niche: "Digital Marketing",
    audience: "Small business owners and marketers wanting to grow their online presence",
    commonRequests: "SEO tips, paid ads, email marketing, conversion optimization",
    strengths: "Digital marketing strategy, analytics, copywriting, funnel building",
    effortLevel: "High effort / high reward"
  },
  {
    name: "Photography",
    icon: Sparkles,
    niche: "Photography & Visual Arts",
    audience: "Hobbyists and aspiring professional photographers",
    commonRequests: "Camera settings, editing techniques, building portfolio, getting clients",
    strengths: "Photography skills, editing expertise, client management, visual storytelling",
    effortLevel: "Medium effort"
  }
];

export function DigitalProductBuilderTool() {
  const { user, isPro } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationStep, setCelebrationStep] = useState<number>(0);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [selectingProduct, setSelectingProduct] = useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to top of container when step changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Step 1: Product Discovery
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [commonRequests, setCommonRequests] = useState("");
  const [strengths, setStrengths] = useState("");
  const [effortLevel, setEffortLevel] = useState("");
  const [productIdeas, setProductIdeas] = useState<ProductIdea[]>([]);
  const [selectedProductIdea, setSelectedProductIdea] = useState<ProductIdea | null>(null);

  // Step 2: Product Blueprint
  const [blueprint, setBlueprint] = useState<ProductBlueprint | null>(null);

  // Step 3: Content Builder
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);
  const [productType, setProductType] = useState("");

  // Step 4: Pricing & Positioning
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [positioning, setPositioning] = useState("");

  // Step 5: Sales Copy
  const [salesCopy, setSalesCopy] = useState<SalesCopy | null>(null);

  // Step 6: Launch Plan
  const [launchPlan, setLaunchPlan] = useState<LaunchPlan[]>([]);

  // Step 7: Platform Suggestions
  const [platformSuggestions, setPlatformSuggestions] = useState<PlatformSuggestion[]>([]);

  // Bonus: Email Sequence
  const [emailSequence, setEmailSequence] = useState<EmailSequence[]>([]);
  const [isGeneratingEmails, setIsGeneratingEmails] = useState(false);

  // Revenue Calculator
  const [expectedSales, setExpectedSales] = useState<number>(100);
  const [selectedPriceTier, setSelectedPriceTier] = useState<number>(0);

  // Load saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem('digitalProductBuilder_progress');
    if (saved) {
      setHasSavedProgress(true);
      // Show resume modal after a short delay
      setTimeout(() => setShowResumeModal(true), 500);
    }
  }, []);

  // Auto-save progress whenever state changes
  const saveProgress = useCallback(() => {
    const progress: SavedProgress = {
      currentStep,
      niche,
      audience,
      commonRequests,
      strengths,
      effortLevel,
      productIdeas,
      selectedProductIdea,
      blueprint,
      contentSections,
      productType,
      pricingTiers,
      positioning,
      salesCopy,
      launchPlan,
      platformSuggestions,
      emailSequence,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('digitalProductBuilder_progress', JSON.stringify(progress));
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 2000);
  }, [currentStep, niche, audience, commonRequests, strengths, effortLevel, productIdeas, selectedProductIdea, blueprint, contentSections, productType, pricingTiers, positioning, salesCopy, launchPlan, platformSuggestions, emailSequence]);

  const loadSavedProgress = useCallback(() => {
    const saved = localStorage.getItem('digitalProductBuilder_progress');
    if (saved) {
      const progress: SavedProgress = JSON.parse(saved);
      setCurrentStep(progress.currentStep);
      setNiche(progress.niche);
      setAudience(progress.audience);
      setCommonRequests(progress.commonRequests);
      setStrengths(progress.strengths);
      setEffortLevel(progress.effortLevel);
      setProductIdeas(progress.productIdeas);
      setSelectedProductIdea(progress.selectedProductIdea);
      setBlueprint(progress.blueprint);
      setContentSections(progress.contentSections);
      setProductType(progress.productType);
      setPricingTiers(progress.pricingTiers);
      setPositioning(progress.positioning);
      setSalesCopy(progress.salesCopy);
      setLaunchPlan(progress.launchPlan);
      setPlatformSuggestions(progress.platformSuggestions);
      setEmailSequence(progress.emailSequence || []);
      setShowResumeModal(false);
    }
  }, []);

  const clearSavedProgress = useCallback(() => {
    localStorage.removeItem('digitalProductBuilder_progress');
    setHasSavedProgress(false);
    setShowResumeModal(false);
  }, []);

  const applyTemplate = useCallback((template: typeof QUICK_START_TEMPLATES[0]) => {
    setNiche(template.niche);
    setAudience(template.audience);
    setCommonRequests(template.commonRequests);
    setStrengths(template.strengths);
    setEffortLevel(template.effortLevel);
  }, []);

  // Celebration effect when completing a step
  const triggerCelebration = useCallback((step: number) => {
    setCelebrationStep(step);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  }, []);

  // Progress tracking
  const completedSteps: Step[] = [];
  if (selectedProductIdea) completedSteps.push(1);
  if (blueprint) completedSteps.push(2);
  if (contentSections.length > 0) completedSteps.push(3);
  if (pricingTiers.length > 0) completedSteps.push(4);
  if (salesCopy) completedSteps.push(5);
  if (launchPlan.length > 0) completedSteps.push(6);
  if (platformSuggestions.length > 0) completedSteps.push(7);

  const progressPercentage = (completedSteps.length / 7) * 100;

  const handleStep1Submit = async () => {
    if (!niche || !audience || !commonRequests || !strengths || !effortLevel) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/digital-product-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 1,
          niche,
          audience,
          commonRequests,
          strengths,
          effortLevel: effortLevel.toLowerCase().includes('low') ? 'low' : effortLevel.toLowerCase().includes('medium') ? 'medium' : 'high'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate product ideas');
      }

      const data = await response.json();
      setProductIdeas(data.ideas || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate product ideas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Generate = async () => {
    if (!selectedProductIdea) {
      setError("Please select a product idea first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/digital-product-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 2,
          productIdea: selectedProductIdea
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate blueprint');
      }

      const data = await response.json();
      setBlueprint(data.blueprint);
      setProductType(data.productType || 'guide');
    } catch (err: any) {
      setError(err.message || 'Failed to generate blueprint');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Generate = async () => {
    if (!blueprint) {
      setError("Please generate a blueprint first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/digital-product-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 3,
          blueprint,
          productType
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate content');
      }

      const data = await response.json();
      setContentSections(data.content || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep4Generate = async () => {
    if (!blueprint || !selectedProductIdea) {
      setError("Please complete previous steps first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/digital-product-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 4,
          blueprint,
          productIdea: selectedProductIdea
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate pricing');
      }

      const data = await response.json();
      setPricingTiers(data.pricingTiers || []);
      setPositioning(data.positioning || "");
    } catch (err: any) {
      setError(err.message || 'Failed to generate pricing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep5Generate = async () => {
    if (!blueprint || !selectedProductIdea || !pricingTiers.length) {
      setError("Please complete previous steps first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/digital-product-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 5,
          blueprint,
          productIdea: selectedProductIdea,
          pricingTiers
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate sales copy');
      }

      const data = await response.json();
      setSalesCopy(data.salesCopy);
    } catch (err: any) {
      setError(err.message || 'Failed to generate sales copy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep6Generate = async () => {
    if (!blueprint || !selectedProductIdea) {
      setError("Please complete previous steps first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/digital-product-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 6,
          blueprint,
          productIdea: selectedProductIdea
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate launch plan');
      }

      const data = await response.json();
      setLaunchPlan(data.launchPlan || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate launch plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep7Generate = async () => {
    if (!productType) {
      setError("Please complete previous steps first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/digital-product-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 7,
          productType,
          productIdea: selectedProductIdea
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate platform suggestions');
      }

      const data = await response.json();
      setPlatformSuggestions(data.platforms || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate platform suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Generate Email Sequence
  const handleGenerateEmails = async () => {
    if (!selectedProductIdea || !salesCopy) {
      setError("Please complete previous steps first");
      return;
    }

    setIsGeneratingEmails(true);
    setError("");

    try {
      const response = await fetch('/api/digital-product-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 8, // Email sequence step
          productIdea: selectedProductIdea,
          salesCopy,
          pricingTiers
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate email sequence');
      }

      const data = await response.json();
      setEmailSequence(data.emailSequence || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate email sequence');
    } finally {
      setIsGeneratingEmails(false);
    }
  };

  // Calculate potential revenue
  const calculateRevenue = () => {
    if (pricingTiers.length === 0) return { low: 0, mid: 0, high: 0 };
    const price = pricingTiers[selectedPriceTier]?.price || 0;
    return {
      low: Math.floor(expectedSales * 0.5) * price,
      mid: expectedSales * price,
      high: Math.floor(expectedSales * 1.5) * price
    };
  };

  // Export everything to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach((line: string) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin, yPos);
        yPos += lineHeight;
      });
      yPos += 3;
    };

    const addSection = (title: string) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      yPos += 5;
      addText(title, 16, true);
      yPos += 3;
    };

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Digital Product Blueprint', margin, yPos);
    yPos += 15;

    if (selectedProductIdea) {
      addSection('📦 Product Overview');
      addText(`Product: ${selectedProductIdea.title}`, 14, true);
      addText(selectedProductIdea.description);
      addText(`Target Audience: ${selectedProductIdea.targetAudience}`);
      addText(`Problem Solved: ${selectedProductIdea.problemSolved}`);
      addText(`Price Range: ${selectedProductIdea.priceRange}`);
    }

    if (blueprint) {
      addSection('📋 Product Blueprint');
      addText(`Promise: ${blueprint.promise}`);
      addText(`Key Outcome: ${blueprint.keyOutcome}`);
      yPos += 3;
      addText('Modules:', 12, true);
      blueprint.sections.forEach((section, idx) => {
        addText(`${idx + 1}. ${section.title}`);
        addText(`   ${section.description}`);
      });
    }

    if (contentSections.length > 0) {
      addSection('📝 Content Outline');
      contentSections.forEach((section) => {
        addText(section.title, 12, true);
        addText(section.content);
        yPos += 3;
      });
    }

    if (pricingTiers.length > 0) {
      addSection('💰 Pricing Strategy');
      pricingTiers.forEach((tier) => {
        addText(`${tier.name} - $${tier.price}`, 12, true);
        addText(tier.description);
        tier.features.forEach(f => addText(`• ${f}`));
        yPos += 3;
      });
      if (positioning) {
        addText('Positioning Strategy:', 12, true);
        addText(positioning);
      }
    }

    if (salesCopy) {
      addSection('✍️ Sales Copy');
      addText('Headlines:', 12, true);
      addText(salesCopy.headline);
      yPos += 3;
      addText('Description:', 12, true);
      addText(salesCopy.description);
      yPos += 3;
      addText('Benefits:', 12, true);
      salesCopy.benefits.forEach(b => addText(`• ${b}`));
      yPos += 3;
      addText('FAQ:', 12, true);
      salesCopy.faq.forEach(item => {
        addText(`Q: ${item.question}`, 12, true);
        addText(`A: ${item.answer}`);
      });
    }

    if (launchPlan.length > 0) {
      addSection('🚀 Launch Plan');
      launchPlan.forEach((day) => {
        addText(`Day ${day.day}: ${day.action}`, 12, true);
        addText(`Content: ${day.contentIdea}`);
        addText(`Hook: ${day.hook}`);
        addText(`CTA: ${day.cta}`);
        yPos += 3;
      });
    }

    if (emailSequence.length > 0) {
      addSection('📧 Email Sequence');
      emailSequence.forEach((email) => {
        addText(`Day ${email.dayToSend}: ${email.subject}`, 12, true);
        addText(`Purpose: ${email.purpose}`);
        addText(email.body);
        yPos += 3;
      });
    }

    if (platformSuggestions.length > 0) {
      addSection('🏪 Platform Recommendations');
      platformSuggestions.forEach((platform) => {
        addText(platform.name, 12, true);
        addText(platform.description);
        addText(`Best for: ${platform.bestFor}`);
        yPos += 3;
      });
    }

    // Save the PDF
    const fileName = selectedProductIdea 
      ? `${selectedProductIdea.title.replace(/[^a-z0-9]/gi, '_')}_Blueprint.pdf`
      : 'Digital_Product_Blueprint.pdf';
    doc.save(fileName);
  };

  // Inline editing helpers
  const startEditing = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const saveEdit = (field: string, newValue: string) => {
    // Update the appropriate state based on field
    if (field.startsWith('blueprint.')) {
      const key = field.replace('blueprint.', '');
      if (blueprint) {
        setBlueprint({ ...blueprint, [key]: newValue });
      }
    } else if (field.startsWith('salesCopy.')) {
      const key = field.replace('salesCopy.', '');
      if (salesCopy) {
        setSalesCopy({ ...salesCopy, [key]: newValue });
      }
    }
    setEditingField(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };


  // Pro-only paywall
  if (!isPro) {
    return (
      <div ref={containerRef} className="space-y-8">
        <Card className="relative overflow-hidden border-2 border-cyan-500/30">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
          <CardContent className="relative p-8 md:p-12">
            <div className="text-center max-w-2xl mx-auto">
              {/* Lock Icon */}
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 opacity-15" />
                <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Pro Feature
              </h2>
              
              {/* Description */}
              <p className="text-muted-foreground mb-6 text-lg">
                The Digital Product Builder is a premium feature that helps you create, price, and launch your digital product from start to finish.
              </p>

              {/* Features List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 text-left max-w-lg mx-auto">
                {[
                  "7-step guided product creation",
                  "AI-powered product ideas",
                  "Pricing strategy generator",
                  "Sales copy & launch plan",
                  "Platform recommendations",
                  "Email sequence builder",
                  "Export to PDF",
                  "Save & resume progress"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => router.push('/?premium=true')}
                className="px-8 py-3 h-auto rounded-xl text-base font-bold text-white border-none hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                }}
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Pro
              </Button>

              {/* Price hint */}
              <p className="text-xs text-muted-foreground mt-4">
                Get unlimited access to all Pro tools
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="text-center bg-background/95 backdrop-blur-md p-10 rounded-3xl shadow-2xl border-2 border-primary/20 animate-in zoom-in-95 duration-300">
            <div className="relative w-24 h-24 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 animate-pulse opacity-30" />
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent mb-2">
              Step {celebrationStep} Complete!
            </p>
            <p className="text-sm text-muted-foreground">
              Great progress! Moving to the next step...
            </p>
          </div>
        </div>
      )}

      {/* Saved Notification */}
      {showSavedNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Progress saved!
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Resume Modal */}
      <Modal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        title="Resume Your Progress?"
        message="We found saved progress from your last session. Would you like to continue where you left off?"
        type="info"
        confirmText="Resume"
        onConfirm={loadSavedProgress}
        cancelText="Start Fresh"
        onCancel={clearSavedProgress}
      />

      {/* Progress Dashboard - Enhanced */}
      <Card className="border-2 border-primary/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Your Product Journey
              </CardTitle>
              <CardDescription>
                {completedSteps.length === 7 
                  ? "🎉 All steps complete! Your product is ready to launch!"
                  : `${completedSteps.length}/7 steps completed`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={saveProgress}
                className="gap-1"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              {completedSteps.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                  className="gap-1"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export PDF</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Progress value={progressPercentage} className="h-4" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {[
                { num: 1, Icon: Lightbulb, label: 'Discover' },
                { num: 2, Icon: LayoutTemplate, label: 'Blueprint' },
                { num: 3, Icon: PenTool, label: 'Content' },
                { num: 4, Icon: DollarSign, label: 'Pricing' },
                { num: 5, Icon: FileText, label: 'Sales' },
                { num: 6, Icon: Rocket, label: 'Launch' },
                { num: 7, Icon: Store, label: 'Platform' }
              ].map((step) => (
                <button
                  key={step.num}
                  onClick={() => {
                    if (step.num <= currentStep || completedSteps.includes(step.num as Step)) {
                      setCurrentStep(step.num as Step);
                    }
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-300 ${
                    currentStep === step.num
                      ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground scale-105 shadow-lg shadow-primary/25'
                      : completedSteps.includes(step.num as Step)
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <step.Icon className={`w-5 h-5 ${currentStep === step.num ? 'text-primary-foreground' : ''}`} />
                  <span className="text-[10px] font-semibold">{step.label}</span>
                  {completedSteps.includes(step.num as Step) && currentStep !== step.num && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4">
        {[
          { num: 1, label: 'Discovery' },
          { num: 2, label: 'Blueprint' },
          { num: 3, label: 'Content' },
          { num: 4, label: 'Pricing' },
          { num: 5, label: 'Sales Copy' },
          { num: 6, label: 'Launch Plan' },
          { num: 7, label: 'Platform' }
        ].map((step, idx) => (
          <React.Fragment key={step.num}>
            <button
              onClick={() => {
                if (step.num <= currentStep || completedSteps.includes(step.num as Step)) {
                  setCurrentStep(step.num as Step);
                }
              }}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[80px] ${
                currentStep === step.num
                  ? 'bg-primary text-primary-foreground'
                  : completedSteps.includes(step.num as Step)
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className="text-xs font-bold">{step.num}</span>
              <span className="text-xs">{step.label}</span>
            </button>
            {idx < 6 && (
              <div
                className={`h-1 w-8 ${
                  completedSteps.includes((step.num + 1) as Step)
                    ? 'bg-green-500'
                    : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Product Discovery */}
      {currentStep === 1 && (
        <Card className="border-2 border-transparent hover:border-primary/20 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Lightbulb className="w-6 h-6 text-amber-500" />
              </div>
              Product Discovery
            </CardTitle>
            <CardDescription className="text-base">
              Let&apos;s find the perfect digital product for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Start Templates */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Quick Start Templates</span>
                <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">Click to auto-fill</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_START_TEMPLATES.map((template, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                    className="h-7 px-2 text-xs gap-1 bg-background hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 hover:shadow-[0_0_12px_rgba(148,163,184,0.5)] dark:hover:shadow-[0_0_12px_rgba(148,163,184,0.3)]"
                  >
                    <template.icon className="w-3 h-3" />
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t pt-6 space-y-5">
              <InputField
                label="What is your niche?"
                value={niche}
                onChange={setNiche}
                placeholder="e.g., Fitness, Marketing, Cooking"
              />
              <InputField
                label="Who is your audience?"
                value={audience}
                onChange={setAudience}
                placeholder="e.g., Busy professionals, Beginners, Entrepreneurs"
              />
              <TextAreaField
                label="What do people ask you for?"
                value={commonRequests}
                onChange={setCommonRequests}
                placeholder="What questions or requests do you get most often?"
                rows={3}
              />
              <TextAreaField
                label="What are you good at?"
                value={strengths}
                onChange={setStrengths}
                placeholder="Your skills, knowledge, and expertise"
                rows={3}
              />
            <SelectField
              label="What kind of energy do you want to put in?"
              value={effortLevel}
              onChange={setEffortLevel}
              options={[
                'Low effort',
                'Medium effort',
                'High effort / high reward'
              ]}
              required
            />
            <Button
              onClick={handleStep1Submit}
              disabled={isLoading || !niche || !audience || !commonRequests || !strengths || !effortLevel}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  Generate Product Ideas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {productIdeas.length > 0 && (
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/20">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-bold">Choose Your Product Idea</h3>
                </div>
                {productIdeas.map((idea, idx) => (
                  <Card
                    key={idx}
                    className={`cursor-pointer group relative overflow-hidden transition-all duration-300 ${
                      selectingProduct === idx
                        ? 'scale-[0.98] border-primary border-2 shadow-2xl shadow-primary/40 bg-primary/10 ring-4 ring-primary/20'
                        : selectedProductIdea === idea
                        ? 'border-primary border-2 shadow-xl shadow-primary/20 bg-primary/5'
                        : 'hover:border-primary/60 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 hover:scale-[1.01]'
                    }`}
                    onClick={() => {
                      setSelectingProduct(idx);
                      setTimeout(() => {
                        setSelectedProductIdea(idea);
                        triggerCelebration(1);
                        setSelectingProduct(null);
                        setTimeout(() => setCurrentStep(2), 800);
                      }, 300);
                    }}
                  >
                    {/* Hover shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                    <CardContent className="p-5 relative">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-lg group-hover:text-primary transition-all duration-300 group-hover:translate-x-1">{idea.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline"
                            className={
                              idea.simplicityLevel === 'Beginner' 
                                ? 'border-green-500 text-green-600 bg-green-500/10' 
                                : idea.simplicityLevel === 'Intermediate' 
                                ? 'border-blue-500 text-blue-600 bg-blue-500/10' 
                                : 'border-purple-500 text-purple-600 bg-purple-500/10'
                            }
                          >
                            {idea.simplicityLevel}
                          </Badge>
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                            <Badge className="bg-primary text-primary-foreground">
                              Click to select →
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 group-hover:text-foreground/80 transition-colors duration-300">{idea.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                          <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-xs text-muted-foreground block">Target Audience</span>
                            <span>{idea.targetAudience}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                          <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-xs text-muted-foreground block">Price Range</span>
                            <span>{idea.priceRange}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
                        <Target className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold text-xs text-primary block">Problem Solved</span>
                          <span className="text-sm">{idea.problemSolved}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Product Blueprint */}
      {currentStep === 2 && (
        <Card className="border-2 border-transparent hover:border-primary/20 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                <LayoutTemplate className="w-6 h-6 text-blue-500" />
              </div>
              Product Blueprint
            </CardTitle>
            <CardDescription className="text-base">
              Let&apos;s shape your product structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!blueprint ? (
              <>
                {selectedProductIdea ? (
                  <>
                    <div className="p-4 bg-muted rounded-lg mb-4">
                      <p className="font-semibold mb-2">Selected Product:</p>
                      <p>{selectedProductIdea.title}</p>
                    </div>
                    <Button
                      onClick={handleStep2Generate}
                      disabled={isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Blueprint...
                        </>
                      ) : (
                        <>
                          Generate Product Blueprint
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Please go back to Step 1 and select a product idea first.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg">{blueprint.title}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing('blueprint.title', blueprint.title)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Promise:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing('blueprint.promise', blueprint.promise)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                    {editingField === 'blueprint.promise' ? (
                      <div className="flex gap-2 mt-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 p-2 rounded-lg border bg-background text-sm"
                          rows={3}
                        />
                        <div className="flex flex-col gap-1">
                          <Button size="sm" onClick={() => saveEdit('blueprint.promise', editValue)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mb-4">{blueprint.promise}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Key Outcome:</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing('blueprint.keyOutcome', blueprint.keyOutcome)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                    {editingField === 'blueprint.keyOutcome' ? (
                      <div className="flex gap-2 mt-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 p-2 rounded-lg border bg-background text-sm"
                          rows={2}
                        />
                        <div className="flex flex-col gap-1">
                          <Button size="sm" onClick={() => saveEdit('blueprint.keyOutcome', editValue)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p>{blueprint.keyOutcome}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-3">Product Structure:</h4>
                  {blueprint.sections.map((section, idx) => (
                    <Card key={idx} className="mb-3">
                      <CardContent className="p-4">
                        <h5 className="font-semibold mb-2">{section.title}</h5>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      triggerCelebration(2);
                      setTimeout(() => setCurrentStep(3), 1000);
                    }}
                    className="flex-1"
                    size="lg"
                  >
                    Continue to Content Builder
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleStep2Generate}
                    variant="outline"
                    disabled={isLoading}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Content Builder */}
      {currentStep === 3 && (
        <Card className="border-2 border-transparent hover:border-primary/20 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <PenTool className="w-6 h-6 text-purple-500" />
              </div>
              Content Builder
            </CardTitle>
            <CardDescription className="text-base">
              Build the actual content for your product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!blueprint ? (
              <Alert>
                <AlertDescription>
                  Please complete Step 2 first to generate a blueprint.
                </AlertDescription>
              </Alert>
            ) : contentSections.length === 0 ? (
              <Button
                onClick={handleStep3Generate}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    Generate Content
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                {contentSections.map((section, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(section.content)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-sm">{section.content}</div>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      triggerCelebration(3);
                      setTimeout(() => setCurrentStep(4), 1000);
                    }}
                    className="flex-1"
                    size="lg"
                  >
                    Continue to Pricing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleStep3Generate}
                    variant="outline"
                    disabled={isLoading}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Pricing & Positioning */}
      {currentStep === 4 && (
        <Card className="border-2 border-transparent hover:border-primary/20 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              Pricing & Positioning
            </CardTitle>
            <CardDescription className="text-base">
              Strategic pricing to maximize your revenue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pricingTiers.length === 0 ? (
              <Button
                onClick={handleStep4Generate}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Pricing Strategy...
                  </>
                ) : (
                  <>
                    Generate Pricing Strategy
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                {pricingTiers.map((tier, idx) => (
                  <Card key={idx} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{tier.name}</CardTitle>
                        <Badge className="text-lg">${tier.price}</Badge>
                      </div>
                      <CardDescription>{tier.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {tier.features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
                {positioning && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Positioning Strategy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{positioning}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Revenue Calculator */}
                <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                        <Calculator className="w-5 h-5 text-green-600" />
                      </div>
                      Revenue Calculator
                    </CardTitle>
                    <CardDescription>
                      See your potential earnings based on sales projections
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          Select Price Tier
                        </label>
                        <select
                          value={selectedPriceTier}
                          onChange={(e) => setSelectedPriceTier(Number(e.target.value))}
                          className="w-full p-3 rounded-xl border bg-background focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 transition-all"
                        >
                          {pricingTiers.map((tier, idx) => (
                            <option key={idx} value={idx}>
                              {tier.name} - ${tier.price}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          Expected Sales (3 months)
                        </label>
                        <input
                          type="number"
                          value={expectedSales}
                          onChange={(e) => setExpectedSales(Number(e.target.value))}
                          className="w-full p-3 rounded-xl border bg-background focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 transition-all"
                          min={1}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-green-500/20">
                      <div className="text-center p-4 rounded-xl bg-white/70 dark:bg-gray-900/50">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Conservative</p>
                        <p className="text-xl font-bold text-green-600">${calculateRevenue().low.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{Math.floor(expectedSales * 0.5)} sales</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 shadow-sm">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Expected</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">${calculateRevenue().mid.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{expectedSales} sales</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-white/70 dark:bg-gray-900/50">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Optimistic</p>
                        <p className="text-xl font-bold text-green-600">${calculateRevenue().high.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{Math.floor(expectedSales * 1.5)} sales</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Tip:</span> Start with the Core tier to maximize conversions, then upsell to Premium
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      triggerCelebration(4);
                      setTimeout(() => setCurrentStep(5), 1000);
                    }}
                    className="flex-1"
                    size="lg"
                  >
                    Continue to Sales Copy
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleStep4Generate}
                    variant="outline"
                    disabled={isLoading}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5: Sales Copy */}
      {currentStep === 5 && (
        <Card className="border-2 border-transparent hover:border-primary/20 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
                <FileText className="w-6 h-6 text-orange-500" />
              </div>
              Sales Page Copy
            </CardTitle>
            <CardDescription className="text-base">
              Persuasive copy that converts visitors into buyers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!salesCopy ? (
              <Button
                onClick={handleStep5Generate}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Sales Copy...
                  </>
                ) : (
                  <>
                    Generate Sales Copy
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Headline</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing('salesCopy.headline', salesCopy.headline)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(salesCopy.headline)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingField === 'salesCopy.headline' ? (
                      <div className="flex gap-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 p-2 rounded-lg border bg-background text-lg font-bold"
                          rows={2}
                        />
                        <div className="flex flex-col gap-1">
                          <Button size="sm" onClick={() => saveEdit('salesCopy.headline', editValue)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-lg font-bold">{salesCopy.headline}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Description</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(salesCopy.description)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{salesCopy.description}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Key Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {salesCopy.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600" />
                          <span className="text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>FAQ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {salesCopy.faq.map((item, idx) => (
                      <div key={idx} className="border-l-2 border-primary pl-4">
                        <p className="font-semibold text-sm mb-1">{item.question}</p>
                        <p className="text-sm text-muted-foreground">{item.answer}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Objection Handling</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {salesCopy.objectionHandling.map((objection, idx) => (
                        <li key={idx} className="text-sm">• {objection}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Transformation Story</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{salesCopy.transformationStory}</p>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      triggerCelebration(5);
                      setTimeout(() => setCurrentStep(6), 1000);
                    }}
                    className="flex-1"
                    size="lg"
                  >
                    Continue to Launch Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleStep5Generate}
                    variant="outline"
                    disabled={isLoading}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 6: Launch Plan */}
      {currentStep === 6 && (
        <Card className="border-2 border-transparent hover:border-primary/20 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20">
                <Rocket className="w-6 h-6 text-pink-500" />
              </div>
              Launch Plan
            </CardTitle>
            <CardDescription className="text-base">
              A day-by-day strategy to launch successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {launchPlan.length === 0 ? (
              <Button
                onClick={handleStep6Generate}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Launch Plan...
                  </>
                ) : (
                  <>
                    Generate Launch Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                {launchPlan.map((day, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-sm font-bold">
                          {day.day}
                        </div>
                        <span>Day {day.day}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-primary" />
                          <p className="font-semibold text-sm">Action</p>
                        </div>
                        <p className="text-sm">{day.action}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          <p className="font-semibold text-sm">Content Idea</p>
                        </div>
                        <p className="text-sm">{day.contentIdea}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          <p className="font-semibold text-sm">Hook</p>
                        </div>
                        <p className="text-sm italic">&ldquo;{day.hook}&rdquo;</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                        <div className="flex items-center gap-2 mb-1">
                          <ArrowRight className="w-4 h-4 text-green-500" />
                          <p className="font-semibold text-sm">Call to Action</p>
                        </div>
                        <p className="text-sm">{day.cta}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      triggerCelebration(6);
                      setTimeout(() => setCurrentStep(7), 1000);
                    }}
                    className="flex-1"
                    size="lg"
                  >
                    Continue to Platform Suggestions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleStep6Generate}
                    variant="outline"
                    disabled={isLoading}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 7: Platform Suggestions */}
      {currentStep === 7 && (
        <Card className="border-2 border-transparent hover:border-primary/20 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <Store className="w-6 h-6 text-cyan-500" />
              </div>
              Platform & Delivery
            </CardTitle>
            <CardDescription className="text-base">
              Where to host and sell your product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {platformSuggestions.length === 0 ? (
              <Button
                onClick={handleStep7Generate}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Platform Suggestions...
                  </>
                ) : (
                  <>
                    Generate Platform Suggestions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                {platformSuggestions.map((platform, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                          <Store className="w-5 h-5 text-cyan-500" />
                        </div>
                        {platform.name}
                      </CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-green-600" />
                          <p className="font-semibold text-sm text-green-700 dark:text-green-400">Best For</p>
                        </div>
                        <p className="text-sm">{platform.bestFor}</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Pros
                          </p>
                          <ul className="space-y-1.5">
                            {platform.pros.map((pro, pIdx) => (
                              <li key={pIdx} className="flex items-start gap-2 text-sm">
                                <span className="text-green-500 mt-1">+</span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Circle className="w-4 h-4 text-amber-500" />
                            Cons
                          </p>
                          <ul className="space-y-1.5">
                            {platform.cons.map((con, cIdx) => (
                              <li key={cIdx} className="flex items-start gap-2 text-sm">
                                <span className="text-amber-500 mt-1">-</span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {/* Email Sequence Generator */}
                <Card className="border-2 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-500" />
                      Bonus: Email Sequence
                    </CardTitle>
                    <CardDescription>
                      Generate a complete email marketing sequence for your launch
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {emailSequence.length === 0 ? (
                      <Button
                        onClick={handleGenerateEmails}
                        disabled={isGeneratingEmails || !salesCopy}
                        className="w-full"
                        variant="outline"
                      >
                        {isGeneratingEmails ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Email Sequence...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Generate Email Sequence
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        {emailSequence.map((email, idx) => (
                          <Card key={idx} className="bg-blue-50/50 dark:bg-blue-950/20">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline">Day {email.dayToSend}</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="font-semibold text-sm mb-1">📧 {email.subject}</p>
                              <p className="text-xs text-muted-foreground mb-2">{email.purpose}</p>
                              <p className="text-sm whitespace-pre-wrap bg-white dark:bg-gray-900 p-3 rounded-lg">
                                {email.body}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Completion Card */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 overflow-hidden">
                  <CardContent className="p-8 text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/10 to-green-500/5 pointer-events-none" />
                    <div className="relative">
                      <div className="mb-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                          <Trophy className="w-10 h-10 text-white" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Congratulations!
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        You&apos;ve completed all 7 steps. Your digital product is ready to launch!
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={exportToPDF} size="lg" className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                          <Download className="w-5 h-5" />
                          Download Blueprint (PDF)
                        </Button>
                        <Button variant="outline" size="lg" onClick={saveProgress} className="gap-2">
                          <Save className="w-5 h-5" />
                          Save Progress
                        </Button>
                      </div>
                      <div className="mt-6 pt-6 border-t border-green-200 dark:border-green-800">
                        <p className="text-sm font-medium mb-3">What&apos;s included in your blueprint:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {[
                            { icon: Lightbulb, label: 'Product Idea' },
                            { icon: LayoutTemplate, label: 'Full Blueprint' },
                            { icon: PenTool, label: 'Content Outline' },
                            { icon: DollarSign, label: 'Pricing Strategy' },
                            { icon: FileText, label: 'Sales Copy' },
                            { icon: Rocket, label: 'Launch Plan' },
                            { icon: Store, label: 'Platform Guide' },
                            { icon: Mail, label: 'Email Sequence' }
                          ].map((item, idx) => (
                            <div key={idx} className="p-2.5 bg-white/70 dark:bg-gray-900/50 rounded-lg flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                              <item.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1) as Step)}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        {currentStep < 7 && (
          <Button
            onClick={() => setCurrentStep(Math.min(7, currentStep + 1) as Step)}
            disabled={currentStep === 7}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

    </div>
  );
}

