"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { TrendingUp, DollarSign, Target, Loader2, Sparkles, TrendingDown, Users, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NicheOpportunity {
  id: string;
  niche: string;
  competitionLevel: 'Low' | 'Medium' | 'High';
  competitionScore: number; // 0-100, lower is better
  valueScore: number; // 0-100, higher is better
  opportunityScore: number; // Combined score
  estimatedEarning: string;
  growthTrend: 'Rising' | 'Stable' | 'Declining';
  description: string;
  whyLowCompetition: string;
  entryBarrier: string;
  x: number; // For graph positioning
  y: number; // For graph positioning
}

interface NicheRadarForm {
  interests: string;
  skills: string;
  budget: string;
  timeCommitment: string;
}

export function OpportunityRadar() {
  const { isPro, user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<NicheRadarForm>({
    interests: '',
    skills: '',
    budget: '',
    timeCommitment: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [niches, setNiches] = useState<NicheOpportunity[]>([]);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!formData.interests.trim() || !formData.skills.trim() || !formData.budget || !formData.timeCommitment) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError("");
    setNiches([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/opportunity-radar', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze niches');
      }

      const data = await response.json();
      setNiches(data.niches || []);
    } catch (err: any) {
      console.error('Niche Radar error:', err);
      setError(err.message || 'Failed to analyze niches. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'High': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Rising': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'Stable': return <TrendingUp className="w-4 h-4 text-yellow-500 rotate-90" />;
      case 'Declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  // Calculate graph dimensions
  const graphWidth = 600;
  const graphHeight = 400;
  const padding = 60;

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      <Card>
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: '#2979FF' }} />
            <span className="break-words">Niche Radar</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base break-words">
            Discover profitable niches with low competition. Find where your skills meet untapped opportunities for maximum success.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interests" className="text-sm sm:text-base">
                Your Interests & Passions <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="interests"
                placeholder="e.g., Sustainable Fashion, AI Tools, Pet Care, Mental Health, Gaming..."
                value={formData.interests}
                onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                className="min-h-[80px] text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground">What topics or industries interest you?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills" className="text-sm sm:text-base">
                Your Skills <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="skills"
                placeholder="e.g., Writing, Video Editing, Design, Programming, Marketing..."
                value={formData.skills}
                onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                className="min-h-[80px] text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground">What skills do you have or want to develop?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="text-sm sm:text-base">
                Starting Budget <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.budget} onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your starting budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-100">$0 - $100 (Bootstrapped)</SelectItem>
                  <SelectItem value="100-500">$100 - $500 (Small Investment)</SelectItem>
                  <SelectItem value="500-2000">$500 - $2,000 (Moderate Investment)</SelectItem>
                  <SelectItem value="2000+">$2,000+ (Significant Investment)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeCommitment" className="text-sm sm:text-base">
                Time Commitment <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.timeCommitment} onValueChange={(value) => setFormData(prev => ({ ...prev, timeCommitment: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your time commitment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5-10">5-10 hours/week (Side Hustle)</SelectItem>
                  <SelectItem value="10-20">10-20 hours/week (Part-Time)</SelectItem>
                  <SelectItem value="20-30">20-30 hours/week (Near Full-Time)</SelectItem>
                  <SelectItem value="30+">30+ hours/week (Full-Time)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Niches...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Find Low-Competition Niches
                </>
              )}
            </Button>
          </div>

          {niches.length > 0 && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" style={{ color: '#2979FF' }} />
                <h3 className="text-lg font-semibold">Niche Opportunity Map</h3>
              </div>

              {/* Graph Visualization */}
              <div className="border rounded-lg p-4 bg-muted/30 overflow-x-auto">
                <div className="relative" style={{ width: graphWidth, height: graphHeight, margin: '0 auto' }}>
                  {/* Axes */}
                  <svg width={graphWidth} height={graphHeight} className="absolute inset-0">
                    {/* Y-axis (Value Score) */}
                    <line
                      x1={padding}
                      y1={padding}
                      x2={padding}
                      y2={graphHeight - padding}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-muted-foreground"
                    />
                    <text x={padding - 10} y={padding + 5} className="text-xs fill-muted-foreground">High Value</text>
                    <text x={padding - 10} y={graphHeight - padding + 5} className="text-xs fill-muted-foreground">Low Value</text>

                    {/* X-axis (Competition - inverted, lower is better) */}
                    <line
                      x1={padding}
                      y1={graphHeight - padding}
                      x2={graphWidth - padding}
                      y2={graphHeight - padding}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-muted-foreground"
                    />
                    <text x={padding - 5} y={graphHeight - padding + 20} className="text-xs fill-muted-foreground">Low Comp</text>
                    <text x={graphWidth - padding - 30} y={graphHeight - padding + 20} className="text-xs fill-muted-foreground">High Comp</text>

                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((val) => (
                      <g key={val}>
                        {/* Horizontal grid */}
                        <line
                          x1={padding}
                          y1={padding + (100 - val) * (graphHeight - 2 * padding) / 100}
                          x2={graphWidth - padding}
                          y2={padding + (100 - val) * (graphHeight - 2 * padding) / 100}
                          stroke="currentColor"
                          strokeWidth="0.5"
                          strokeDasharray="4"
                          className="text-muted-foreground/30"
                        />
                        {/* Vertical grid */}
                        <line
                          x1={padding + val * (graphWidth - 2 * padding) / 100}
                          y1={padding}
                          x2={padding + val * (graphWidth - 2 * padding) / 100}
                          y2={graphHeight - padding}
                          stroke="currentColor"
                          strokeWidth="0.5"
                          strokeDasharray="4"
                          className="text-muted-foreground/30"
                        />
                      </g>
                    ))}

                    {/* Plot niches */}
                    {niches.map((niche) => {
                      const x = padding + niche.competitionScore * (graphWidth - 2 * padding) / 100;
                      const y = padding + (100 - niche.valueScore) * (graphHeight - 2 * padding) / 100;
                      const isSweetSpot = niche.competitionScore < 40 && niche.valueScore > 60;
                      
                      return (
                        <g key={niche.id}>
                          <circle
                            cx={x}
                            cy={y}
                            r={isSweetSpot ? 8 : 6}
                            fill={isSweetSpot ? '#10B981' : '#2979FF'}
                            opacity={0.7}
                            className="cursor-pointer hover:opacity-100 transition-opacity"
                          >
                            <title>{niche.niche}: Competition {niche.competitionScore}%, Value {niche.valueScore}%</title>
                          </circle>
                        </g>
                      );
                    })}

                    {/* Sweet Spot Zone */}
                    <rect
                      x={padding}
                      y={padding}
                      width={(40) * (graphWidth - 2 * padding) / 100}
                      height={(100 - 60) * (graphHeight - 2 * padding) / 100}
                      fill="#10B981"
                      opacity={0.1}
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                    <text
                      x={padding + 5}
                      y={padding + 15}
                      className="text-xs fill-green-600 dark:fill-green-400 font-semibold"
                    >
                      Sweet Spot
                    </text>
                  </svg>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4 justify-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Sweet Spot (Low Competition, High Value)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-muted-foreground">Other Opportunities</span>
                  </div>
                </div>
              </div>

              {/* Niche Cards */}
              <div className="space-y-4">
                {niches
                  .sort((a, b) => b.opportunityScore - a.opportunityScore)
                  .map((niche) => (
                  <Card key={niche.id} className={`border-l-4 ${getCompetitionColor(niche.competitionLevel)}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start gap-2 flex-wrap">
                            <h4 className="text-base sm:text-lg font-semibold flex-1">{niche.niche}</h4>
                            <Badge className={getCompetitionColor(niche.competitionLevel)}>
                              {niche.competitionLevel} Competition
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getTrendIcon(niche.growthTrend)}
                              {niche.growthTrend}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">{niche.estimatedEarning}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>Competition: {niche.competitionScore}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="w-4 h-4 text-muted-foreground" />
                              <span>Value Score: {niche.valueScore}%</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              Opportunity Score: {niche.opportunityScore}%
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground">{niche.description}</p>

                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Why Low Competition:</p>
                              <p className="text-xs text-muted-foreground">{niche.whyLowCompetition}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Entry Barrier:</p>
                              <p className="text-xs text-muted-foreground">{niche.entryBarrier}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
