"use client";

import React, { useState, useEffect } from 'react';
import { SelectField } from "@/components/SelectField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  Hash, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Globe,
  Download,
  Lock
} from "lucide-react";

interface TrendMetrics {
  estimatedViews?: string;
  growthRate?: string;
  postCount?: string;
  avgEngagementRate?: string;
  peakEngagementTime?: string;
}

interface TrendDemographics {
  ageRange?: string;
  genderSplit?: string;
  geographicFocus?: string;
  interests?: string[];
}

interface Trend {
  title: string;
  description: string;
  engagementLevel: string;
  reachPotential: string;
  platforms?: string[];
  primaryPlatform?: string;
  metrics?: TrendMetrics;
  demographics?: TrendDemographics;
  contentFormats?: string[];
  hashtags?: string[];
  keywords?: string[];
  monetizationPotential?: string;
  monetizationNotes?: string;
  longevity?: string;
  longevityReason?: string;
  competitorAnalysis?: string;
  contentStrategy?: string;
  risks?: string;
  bestPractices?: string[];
}

export function TrendRadarTool() {
  const { isPro, user } = useAuth();
  const router = useRouter();
  const [category, setCategory] = useState("General");
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedTrend, setExpandedTrend] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);

  const fetchTrends = async (selectedCategory: string) => {
    setIsLoading(true);
    setError("");
    setExpandedTrend(null);
    setProgress(0);
    
    console.log('🔍 Starting trend fetch for category:', selectedCategory);
    
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      // Add timeout - reduced to 45 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('⏱️ Request timeout after 45 seconds');
        controller.abort();
      }, 45000); // 45 second timeout
      
      console.log('📡 Sending API request...');
      setProgress(5);
      
      // Start progress animation - slower and more realistic
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          // Slow down progress - max at 85% until response
          if (prev >= 85) {
            return 85;
          }
          // Increment slowly (1-3% per interval)
          return prev + Math.random() * 2 + 1;
        });
      }, 800); // Update every 800ms
      
      const startTime = Date.now();
      
      const response = await fetch('/api/trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ category: selectedCategory }),
        signal: controller.signal
      });

      const endTime = Date.now();
      console.log(`📡 API response received in ${endTime - startTime}ms, status:`, response.status);
      
      // Clear progress interval and set to 90%
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      setProgress(90);

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API error response:', errorData);
        
        if (errorData.requiresUpgrade) {
          setRequiresUpgrade(true);
          setShowPaywallModal(true);
          setUsageRemaining(0);
          throw new Error(errorData.error || "This is a Pro feature. Please upgrade to use.");
        }
        
        throw new Error(errorData.error || errorData.details || `Failed to fetch trends (${response.status})`);
      }

      console.log('📦 Parsing response JSON...');
      const data = await response.json();
      console.log('✅ Response parsed, trends count:', data.trends?.length || 0);
      setProgress(95);
      
      if (!data.trends || !Array.isArray(data.trends)) {
        console.error('❌ Invalid trends format:', data);
        throw new Error('Invalid response format - no trends array found');
      }
      
      if (data.trends.length === 0) {
        console.warn('⚠️ Empty trends array received');
        setError('No trends found for this category. Try a different category.');
        setTrends([]);
        setProgress(100);
        setTimeout(() => setProgress(0), 1000);
        return;
      }
      
      console.log('✅ Setting trends:', data.trends.length);
      // Only set to 100% when trends are actually set
      setProgress(100);
      setTrends(data.trends);
      // Keep progress at 100% briefly, then reset
      setTimeout(() => setProgress(0), 1000);
      
      // Refresh usage count after successful generation
      fetchUsage();
    } catch (err: any) {
      console.error('❌ Trend fetch error:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      if (err.name === 'AbortError') {
        setError('Request timed out after 60 seconds. The analysis is taking too long. Please try again.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to load trends. Please check your connection and try again.');
      }
      setTrends([]);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setProgress(0);
    } finally {
      console.log('🏁 Trend fetch completed, setting loading to false');
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setIsLoading(false);
    }
  };

  // Fetch usage on mount and after generation
  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/trends/usage', {
        credentials: 'include', // Include cookies for authentication
      });
      if (response.ok) {
        const data = await response.json();
        const remaining = Math.max(0, data.limit - data.usageCount);
        setUsageRemaining(remaining);
      }
    } catch (err) {
      console.error('Error fetching usage:', err);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [user]); // Re-fetch usage when user changes (login/logout)

  const handleSearch = () => {
    if (!category) {
      setError("Please select a category first");
      return;
    }
    
    // Check usage limit before searching
    if (!isPro && usageRemaining !== null && usageRemaining <= 0) {
      setShowPaywallModal(true);
      setRequiresUpgrade(true);
      return;
    }
    
    fetchTrends(category);
  };

  const toggleExpand = (index: number) => {
    setExpandedTrend(expandedTrend === index ? null : index);
  };

  const generatePDF = async () => {
    // Check Pro status
    if (!isPro) {
      setShowPaywallModal(true);
      return;
    }

    if (trends.length === 0) {
      setError("No trends to save. Please analyze trends first.");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
      };

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Trend Analysis Report", margin, yPos);
      yPos += 10;

      // Category and Date
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Category: ${category}`, margin, yPos);
      yPos += 6;
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
      yPos += 10;

      // Add each trend
      trends.forEach((trend, index) => {
        checkPageBreak(80);

        // Trend Title
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        const titleLines = doc.splitTextToSize(`${index + 1}. ${trend.title}`, maxWidth);
        doc.text(titleLines, margin, yPos);
        yPos += titleLines.length * 7 + 3;

        // Engagement Level and Reach Potential
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Engagement: ${trend.engagementLevel} | Reach Potential: ${trend.reachPotential}%`, margin, yPos);
        yPos += 6;

        // Description
        doc.setFontSize(11);
        const descLines = doc.splitTextToSize(trend.description, maxWidth);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 5 + 5;

        // Metrics
        if (trend.metrics) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("Metrics:", margin, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          
          if (trend.metrics.estimatedViews) {
            doc.text(`  • Estimated Views: ${trend.metrics.estimatedViews}`, margin + 5, yPos);
            yPos += 5;
          }
          if (trend.metrics.growthRate) {
            doc.text(`  • Growth Rate: ${trend.metrics.growthRate}`, margin + 5, yPos);
            yPos += 5;
          }
          if (trend.metrics.postCount) {
            doc.text(`  • Post Count: ${trend.metrics.postCount}`, margin + 5, yPos);
            yPos += 5;
          }
          if (trend.metrics.avgEngagementRate) {
            doc.text(`  • Avg Engagement: ${trend.metrics.avgEngagementRate}`, margin + 5, yPos);
            yPos += 5;
          }
          if (trend.metrics.peakEngagementTime) {
            doc.text(`  • Peak Time: ${trend.metrics.peakEngagementTime}`, margin + 5, yPos);
            yPos += 5;
          }
          yPos += 3;
        }

        // Demographics
        if (trend.demographics) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("Demographics:", margin, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          
          if (trend.demographics.ageRange) {
            doc.text(`  • Age Range: ${trend.demographics.ageRange}`, margin + 5, yPos);
            yPos += 5;
          }
          if (trend.demographics.genderSplit) {
            doc.text(`  • Gender Split: ${trend.demographics.genderSplit}`, margin + 5, yPos);
            yPos += 5;
          }
          if (trend.demographics.geographicFocus) {
            doc.text(`  • Geographic Focus: ${trend.demographics.geographicFocus}`, margin + 5, yPos);
            yPos += 5;
          }
          yPos += 3;
        }

        // Platforms
        if (trend.platforms && trend.platforms.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`Platforms: ${trend.platforms.join(", ")}`, margin, yPos);
          yPos += 6;
        }

        // Hashtags
        if (trend.hashtags && trend.hashtags.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`Hashtags: ${trend.hashtags.join(", ")}`, margin, yPos);
          yPos += 6;
        }

        // Content Strategy
        if (trend.contentStrategy) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("Content Strategy:", margin, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          const strategyLines = doc.splitTextToSize(trend.contentStrategy, maxWidth - 5);
          doc.text(strategyLines, margin + 5, yPos);
          yPos += strategyLines.length * 5 + 3;
        }

        // Monetization
        if (trend.monetizationPotential) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`Monetization Potential: ${trend.monetizationPotential}`, margin, yPos);
          yPos += 5;
          if (trend.monetizationNotes) {
            doc.setFont("helvetica", "normal");
            const monetLines = doc.splitTextToSize(trend.monetizationNotes, maxWidth - 5);
            doc.text(monetLines, margin + 5, yPos);
            yPos += monetLines.length * 5 + 3;
          }
        }

        // Longevity
        if (trend.longevity) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(`Trend Longevity: ${trend.longevity}`, margin, yPos);
          yPos += 5;
          if (trend.longevityReason) {
            doc.setFont("helvetica", "normal");
            const longevityLines = doc.splitTextToSize(trend.longevityReason, maxWidth - 5);
            doc.text(longevityLines, margin + 5, yPos);
            yPos += longevityLines.length * 5 + 3;
          }
        }

        // Best Practices
        if (trend.bestPractices && trend.bestPractices.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("Best Practices:", margin, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          trend.bestPractices.forEach((practice) => {
            checkPageBreak(10);
            doc.text(`  • ${practice}`, margin + 5, yPos);
            yPos += 5;
          });
          yPos += 3;
        }

        // Risks
        if (trend.risks) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("Potential Risks:", margin, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          const riskLines = doc.splitTextToSize(trend.risks, maxWidth - 5);
          doc.text(riskLines, margin + 5, yPos);
          yPos += riskLines.length * 5 + 3;
        }

        yPos += 10; // Space between trends
      });

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
          `Page ${i} of ${totalPages} | Generated by PostReady`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Save PDF
      const fileName = `Trend-Analysis-${category}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleUpgradeClick = () => {
    setShowPaywallModal(false);
    router.push('/?premium=true');
  };

  const getEngagementBadgeVariant = (level: string) => {
    if (level.includes('Hot') || level.includes('🔥')) return 'destructive';
    if (level.includes('Rising') || level.includes('📈')) return 'default';
    return 'secondary';
  };

  const getMonetizationColor = (potential?: string) => {
    if (potential === 'High') return 'text-green-600';
    if (potential === 'Medium') return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">📡 Real-Time Trend Monitor</CardTitle>
          <CardDescription className="text-base">
            Discover what's going viral right now with comprehensive analysis, metrics, and actionable insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <SelectField
                label="Category / Niche"
                value={category}
                onChange={(val) => {
                  setCategory(val);
                  setTrends([]); // Clear previous trends when category changes
                  setError(""); // Clear any errors
                }}
                options={[
                  "General",
                  "Technology",
                  "Fashion & Beauty",
                  "Health & Fitness",
                  "Food & Cooking",
                  "Business & Finance",
                  "Gaming",
                  "Travel",
                  "Entertainment"
                ]}
                required
              />
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              {!isPro && usageRemaining !== null && (
                <Badge variant="secondary" className="w-fit">
                  {usageRemaining > 0 ? `${usageRemaining} Free Use${usageRemaining !== 1 ? 's' : ''} Remaining` : 'Free Uses Exhausted'}
                </Badge>
              )}
              <Button 
                onClick={handleSearch}
                disabled={isLoading || !category || (!isPro && usageRemaining !== null && usageRemaining <= 0)}
                className="w-full sm:w-auto py-6 font-bold"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                    Analyzing Trends...
                  </>
                ) : (!isPro && usageRemaining !== null && usageRemaining <= 0) ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Upgrade to Analyze
                  </>
                ) : (
                  "🔍 Analyze Trends"
                )}
              </Button>
            </div>
          </div>
          
          {isLoading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Analyzing trends...</span>
                <span className="font-semibold">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {progress < 20 && "Connecting to trend database..."}
                {progress >= 20 && progress < 50 && "Analyzing current trends..."}
                {progress >= 50 && progress < 80 && "Processing engagement metrics..."}
                {progress >= 80 && progress < 95 && "Compiling insights..."}
                {progress >= 95 && "Finalizing results..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {trends.length === 0 && !isLoading && !error && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">📡</div>
            <h3 className="text-xl font-bold mb-2">Ready to Analyze Trends</h3>
            <p className="text-muted-foreground">
              Select a category above and click "Analyze Trends" to discover what's going viral.
            </p>
          </CardContent>
        </Card>
      )}

      {trends.length > 0 && (
        <>
          {/* Save PDF Button */}
          <Card className="border-2 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1">Save Analysis Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Export all trend data as a professional PDF report
                  </p>
                </div>
                <Button
                  onClick={generatePDF}
                  disabled={isGeneratingPDF}
                  className="font-bold"
                  size="lg"
                >
                  {isGeneratingPDF ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      {isPro ? (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Save as PDF
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Unlock PDF Export
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trends Grid */}
        <div className="grid gap-6 animate-fade-in">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          trends.map((trend, index) => (
            <Card 
              key={index} 
              className="border-2 hover:border-primary/50 transition-all"
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{trend.title}</h3>
                      <Badge variant={getEngagementBadgeVariant(trend.engagementLevel)}>
                        {trend.engagementLevel}
                      </Badge>
                      {trend.primaryPlatform && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {trend.primaryPlatform}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      {trend.description}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-emerald-500">
                      {trend.reachPotential}%
                    </div>
                    <div className="text-xs text-muted-foreground">Reach Potential</div>
                  </div>
                </div>

                {/* Quick Stats */}
                {trend.metrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
                    {trend.metrics.estimatedViews && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Estimated Views</div>
                        <div className="text-sm font-bold">{trend.metrics.estimatedViews}</div>
                      </div>
                    )}
                    {trend.metrics.growthRate && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Growth Rate</div>
                        <div className="text-sm font-bold text-green-600">{trend.metrics.growthRate}</div>
                      </div>
                    )}
                    {trend.metrics.postCount && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Post Count</div>
                        <div className="text-sm font-bold">{trend.metrics.postCount}</div>
                      </div>
                    )}
                    {trend.metrics.avgEngagementRate && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Avg Engagement</div>
                        <div className="text-sm font-bold">{trend.metrics.avgEngagementRate}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Expandable Details */}
                <Button
                  variant="ghost"
                  onClick={() => toggleExpand(index)}
                  className="w-full mt-2"
                >
                  {expandedTrend === index ? 'Show Less' : 'Show Full Analysis ↓'}
                </Button>

                {expandedTrend === index && (
                  <div className="mt-4 space-y-4 animate-fade-in border-t pt-4">
                    {/* Insights Section */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg flex items-center gap-2 text-foreground">
                        <BarChart3 className="w-5 h-5" />
                        Insights & Metrics
                      </h4>
                        {trend.metrics?.peakEngagementTime && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-semibold text-blue-900 dark:text-blue-100">Peak Engagement Time</span>
                            </div>
                            <p className="text-sm text-blue-800 dark:text-blue-200">{trend.metrics.peakEngagementTime}</p>
                          </div>
                        )}

                        {trend.longevity && (
                          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800/30">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="font-semibold text-purple-900 dark:text-purple-100">Trend Longevity: {trend.longevity}</span>
                            </div>
                            <p className="text-sm text-purple-800 dark:text-purple-200">{trend.longevityReason}</p>
                          </div>
                        )}

                        {trend.platforms && trend.platforms.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Globe className="w-4 h-4" />
                              <span className="font-semibold text-foreground">Active Platforms</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {trend.platforms.map((platform, i) => (
                                <Badge key={i} variant="outline">{platform}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {trend.hashtags && trend.hashtags.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Hash className="w-4 h-4" />
                              <span className="font-semibold text-foreground">Top Hashtags</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {trend.hashtags.map((tag, i) => (
                                <Badge key={i} variant="secondary">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {trend.keywords && trend.keywords.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-4 h-4" />
                              <span className="font-semibold text-foreground">Keywords</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {trend.keywords.map((keyword, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{keyword}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Audience Section */}
                    <div className="space-y-4 border-t pt-4 border-border">
                      <h4 className="font-bold text-lg flex items-center gap-2 text-foreground">
                        <Users className="w-5 h-5" />
                        Audience Demographics
                      </h4>
                        {trend.demographics && (
                          <div className="space-y-3">
                            {trend.demographics.ageRange && (
                              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                <span className="font-semibold text-foreground">Age Range: </span>
                                <span className="text-foreground">{trend.demographics.ageRange}</span>
                              </div>
                            )}
                            {trend.demographics.genderSplit && (
                              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                <span className="font-semibold text-foreground">Gender Split: </span>
                                <span className="text-foreground">{trend.demographics.genderSplit}</span>
                              </div>
                            )}
                            {trend.demographics.geographicFocus && (
                              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                <span className="font-semibold text-foreground">Geographic Focus: </span>
                                <span className="text-foreground">{trend.demographics.geographicFocus}</span>
                              </div>
                            )}
                            {trend.demographics.interests && trend.demographics.interests.length > 0 && (
                              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                <span className="font-semibold mb-2 block text-foreground">Interests:</span>
                                <div className="flex flex-wrap gap-2">
                                  {trend.demographics.interests.map((interest, i) => (
                                    <Badge key={i} variant="secondary">{interest}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                    </div>

                    {/* Strategy Section */}
                    <div className="space-y-4 border-t pt-4 border-border">
                      <h4 className="font-bold text-lg flex items-center gap-2 text-foreground">
                        <Target className="w-5 h-5" />
                        Content Strategy
                      </h4>
                        {trend.contentFormats && trend.contentFormats.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <BarChart3 className="w-4 h-4" />
                              <span className="font-semibold text-foreground">Recommended Content Formats</span>
                            </div>
                            <ul className="space-y-2">
                              {trend.contentFormats.map((format, i) => (
                                <li key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded border border-border">
                                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  <span className="text-sm text-foreground">{format}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {trend.contentStrategy && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/30">
                            <div className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Content Strategy</div>
                            <p className="text-sm text-blue-800 dark:text-blue-200">{trend.contentStrategy}</p>
                          </div>
                        )}

                        {trend.competitorAnalysis && (
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                            <div className="font-semibold mb-2 text-yellow-900 dark:text-yellow-100">Competitor Analysis</div>
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">{trend.competitorAnalysis}</p>
                          </div>
                        )}

                        {trend.bestPractices && trend.bestPractices.length > 0 && (
                          <div>
                            <div className="font-semibold mb-3 text-foreground">Best Practices</div>
                            <ul className="space-y-2">
                              {trend.bestPractices.map((practice, i) => (
                                <li key={i} className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded border border-green-200 dark:border-green-800/30">
                                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  <span className="text-sm text-green-900 dark:text-green-100">{practice}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {trend.risks && (
                          <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800/30">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                              <span className="font-semibold text-red-900 dark:text-red-100">Potential Risks</span>
                            </div>
                            <p className="text-sm text-red-800 dark:text-red-200">{trend.risks}</p>
                          </div>
                        )}
                    </div>

                    {/* Monetization Section */}
                    <div className="space-y-4 border-t pt-4 border-border">
                      <h4 className="font-bold text-lg flex items-center gap-2 text-foreground">
                        <DollarSign className="w-5 h-5" />
                        Monetization Opportunities
                      </h4>
                      {trend.monetizationPotential && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                              Monetization Potential: 
                              <span className={getMonetizationColor(trend.monetizationPotential)}>
                                {' '}{trend.monetizationPotential}
                              </span>
                            </span>
                          </div>
                          {trend.monetizationNotes && (
                            <p className="text-sm mt-2 text-emerald-800 dark:text-emerald-200">{trend.monetizationNotes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
        </div>
        </>
      )}

      {/* Paywall Modal */}
      <Modal
        isOpen={showPaywallModal}
        onClose={() => {
          setShowPaywallModal(false);
          setRequiresUpgrade(false);
        }}
        title="Upgrade to Pro"
        message={requiresUpgrade ? "You've used your free trend analysis. Upgrade to Pro for unlimited access to comprehensive trend insights, metrics, and analysis!" : "PDF export is a Pro feature. Upgrade to unlock the ability to save comprehensive trend analysis reports as PDFs."}
        type="info"
        confirmText="Upgrade to Pro"
        onConfirm={handleUpgradeClick}
      />
    </div>
  );
}
