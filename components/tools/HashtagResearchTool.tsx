"use client";

import React, { useState, useRef } from 'react';
import { InputField } from "@/components/InputField";
import { SelectField } from "@/components/SelectField";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function HashtagResearchTool() {
  const { theme } = useTheme();
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [results, setResults] = useState<any>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [generationCount, setGenerationCount] = useState(0);
  const [error, setError] = useState("");

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) return;
    
    setIsResearching(true);
    setSelectedHashtags([]);
    setGenerationCount(0);
    setError("");
    
    try {
      const response = await fetch('/api/generate-hashtags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          niche,
          platform,
          batchNumber: 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate hashtags');
      }

      const data = await response.json();
      
      setResults({
        niche,
        platform,
        hashtags: data.hashtags
      });
      setGenerationCount(1);
    } catch (err: any) {
      console.error('Hashtag generation error:', err);
      setError(err.message || 'Failed to generate hashtags. Please try again.');
    } finally {
      setIsResearching(false);
    }
  };

  const handleGenerateMore = async () => {
    setIsGeneratingMore(true);
    setError("");
    
    try {
      const response = await fetch('/api/generate-hashtags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          niche: results.niche,
          platform: results.platform,
          batchNumber: generationCount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate more hashtags');
      }

      const data = await response.json();
      
      // Filter out duplicates and append new ones
      const existingTags = new Set(results.hashtags.map((h: any) => h.tag));
      const uniqueNewHashtags = data.hashtags.filter((h: any) => !existingTags.has(h.tag));
      
      // Append to existing hashtags and re-sort by score
      const allHashtags = [...results.hashtags, ...uniqueNewHashtags];
      const sortedHashtags = allHashtags.sort((a: any, b: any) => b.score - a.score);
      
      setResults({
        ...results,
        hashtags: sortedHashtags
      });
      
      setGenerationCount(prev => prev + 1);
    } catch (err: any) {
      console.error('Error generating more hashtags:', err);
      setError(err.message || 'Failed to generate more hashtags.');
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const copySelected = () => {
    const selectedText = selectedHashtags.join(' ');
    navigator.clipboard.writeText(selectedText);
    // Toast notification would go here
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Research Parameters</CardTitle>
          <CardDescription>Enter your niche and platform to find the best hashtags.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResearch} className="space-y-4">
            <InputField
              label="Your Niche or Topic"
              value={niche}
              onChange={setNiche}
              placeholder="e.g., Fitness, Food, Travel, Fashion"
              required
            />

            <SelectField
              label="Platform"
              value={platform}
              onChange={setPlatform}
              options={["Instagram", "TikTok", "YouTube Shorts", "Facebook", "X (Twitter)"]}
              required
            />

            <Button 
              type="submit" 
              disabled={isResearching || !niche.trim()}
              className="w-full font-bold text-lg py-6"
              size="lg"
            >
              {isResearching ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Researching Hashtags...
                </>
              ) : (
                <>
                  <span className="mr-2 text-xl">🔍</span>
                  Research Hashtags
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recommended Hashtags</CardTitle>
                  <CardDescription>
                    Optimized for {results.platform} in the {results.niche} niche.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResults(null);
                    setSelectedHashtags([]);
                    setGenerationCount(0);
                  }}
                >
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-muted/50 rounded-lg border-l-4 border-primary flex items-center gap-3">
                <span className="text-xl">💡</span>
                <p className="text-sm text-muted-foreground">
                  Sorted by effectiveness score. Higher numbers = better reach + lower competition.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {results.hashtags.map((hashtag: any, index: number) => {
                  const isSelected = selectedHashtags.includes(hashtag.tag);
                  const reachScore = Math.round((hashtag.score / 54) * 100);
                  
                  let scoreColor = "text-red-500 bg-red-500/10 border-red-500/20";
                  if (reachScore >= 90) scoreColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
                  else if (reachScore >= 70) scoreColor = "text-green-500 bg-green-500/10 border-green-500/20";
                  else if (reachScore >= 50) scoreColor = "text-blue-500 bg-blue-500/10 border-blue-500/20";
                  else if (reachScore >= 30) scoreColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";

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
                      className={`
                        rounded-lg p-3 border-2 cursor-pointer transition-all hover:scale-[1.02]
                        ${isSelected 
                          ? 'bg-primary/10 border-primary shadow-md' 
                          : 'bg-card border-border hover:border-primary/50'}
                      `}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`
                          w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                          ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}
                        `}>
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        
                        <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${scoreColor}`}>
                          {reachScore}
                        </div>
                        
                        <span className="text-sm font-bold truncate" title={hashtag.tag}>
                          {hashtag.tag}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedHashtags.length > 0 && (
                <div className="p-4 border-2 rounded-xl bg-muted/30 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold">Selected Hashtags ({selectedHashtags.length})</h4>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedHashtags([])}>Clear Selection</Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4 p-3 bg-background rounded-lg border min-h-[50px]">
                    {selectedHashtags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-secondary-foreground text-sm font-medium">
                        {tag}
                        <button onClick={() => setSelectedHashtags(prev => prev.filter(t => t !== tag))} className="hover:text-destructive">×</button>
                      </span>
                    ))}
                  </div>

                  <Button onClick={copySelected} className="w-full font-bold">
                    📋 Copy Selected Hashtags
                  </Button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    const allTags = results.hashtags.map((h: any) => h.tag);
                    setSelectedHashtags(allTags);
                  }}
                >
                  Select All
                </Button>
                
                <Button 
                  onClick={handleGenerateMore} 
                  disabled={isGeneratingMore}
                  variant="secondary"
                >
                  {isGeneratingMore ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                      Generating More...
                    </>
                  ) : (
                    "✨ Generate More Hashtags"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


