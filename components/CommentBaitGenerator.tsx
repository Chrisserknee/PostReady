"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentBaitItem, CommentBaitRequest, CommentBaitResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CommentBaitGenerator() {
  // Auth
  const { isPro, user } = useAuth();
  const router = useRouter();

  // Form State
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("TikTok");
  const [engagementStyle, setEngagementStyle] = useState("Spicy / Controversial");
  const [customStyle, setCustomStyle] = useState("");
  const [audience, setAudience] = useState("");
  const [count, setCount] = useState("5");

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CommentBaitItem[]>([]);
  const [error, setError] = useState("");
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);

  // Function to navigate to the premium page
  const navigateToPremium = () => {
    router.push('/?premium=true');
  };

  // Fetch usage on mount and after generation
  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/comment-bait/usage');
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

  const handleGenerate = async () => {
    if (!topic) {
      setError("Please enter a topic or description for your post.");
      return;
    }

    setIsLoading(true);
    setError("");
    setRequiresUpgrade(false);
    setResults([]);

    try {
      const requestBody: CommentBaitRequest = {
        topic,
        platform,
        engagementStyle: engagementStyle.split(' (')[0], // Clean up the display label if needed
        customStyle: engagementStyle === 'Custom' ? customStyle : undefined,
        audience,
        count: parseInt(count)
      };

      const response = await fetch('/api/comment-bait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.requiresUpgrade) {
          setRequiresUpgrade(true);
          setUsageRemaining(0); // Ensure UI reflects 0
          throw new Error(errorData.error || "This is a Pro feature. Please upgrade to use.");
        }

        throw new Error(errorData.error || 'Failed to generate comments');
      }

      const data: CommentBaitResponse = await response.json();
      setResults(data.items);

      // Refresh usage count
      fetchUsage();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app, trigger a toast here. For now, we rely on button feedback or user knowledge.
    // toast({ title: "Copied!", description: "Comment copied to clipboard." });
    // We'll add a temporary visual cue if we had a toast system hooked up in this file context.
  };

  const copyAll = () => {
    const allText = results.map(r => r.text).join('\n');
    copyToClipboard(allText);
  };

  return (
    <Card className="w-full border-2 shadow-md animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎣</span>
          <div>
            <CardTitle className="text-2xl font-bold">Comment Bait Generator</CardTitle>
            <CardDescription>
              Generate high-engagement "first comments" to pin under your videos and spark real conversation — or use them under other people's posts to pull more viewers back to your page.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT: Form */}
          <div className="space-y-6">
            {/* Usage Badge */}
            {!isPro && usageRemaining !== null && (
              <div className={`flex items-center justify-between p-3 rounded-lg border ${usageRemaining > 0 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Free Uses Remaining:</span>
                  <Badge variant={usageRemaining > 0 ? "default" : "destructive"} className="text-xs">
                    {usageRemaining}
                  </Badge>
                </div>
                {usageRemaining === 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-orange-800 font-bold"
                    onClick={navigateToPremium}
                  >
                    Unlock Unlimited
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="topic">Content Topic / Description <span className="text-red-500">*</span></Label>
              <Textarea 
                id="topic" 
                placeholder="Describe your video or post... e.g. 'rant about why 9–5 is broken'" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-32 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="Instagram Reels">Instagram Reels</SelectItem>
                    <SelectItem value="YouTube Shorts">YouTube Shorts</SelectItem>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="Twitter/X">Twitter/X</SelectItem>
                    <SelectItem value="Generic">Generic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Count</Label>
                <Select value={count} onValueChange={setCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Comments</SelectItem>
                    <SelectItem value="5">5 Comments</SelectItem>
                    <SelectItem value="10">10 Comments</SelectItem>
                    <SelectItem value="15">15 Comments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Engagement Style</Label>
              <Select value={engagementStyle} onValueChange={setEngagementStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spicy / Controversial">Spicy / Controversial</SelectItem>
                  <SelectItem value="Debate / Hot Take">Debate / Hot Take</SelectItem>
                  <SelectItem value="Poll / Choose a Side">Poll / Choose a Side</SelectItem>
                  <SelectItem value="Storytime / Confession Bait">Storytime / Confession Bait</SelectItem>
                  <SelectItem value="Wholesome / Supportive">Wholesome / Supportive</SelectItem>
                  <SelectItem value="Toxic but Playful">Toxic but Playful</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {engagementStyle === 'Custom' && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="customStyle">Custom Style Description</Label>
                <Input 
                  id="customStyle" 
                  placeholder="e.g. Sarcastic but informative" 
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="audience">Audience / Niche (Optional)</Label>
              <Input 
                id="audience" 
                placeholder="e.g. gamers, small business owners, movie fans..." 
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>

            <Button 
              className="w-full font-bold" 
              size="lg" 
              onClick={handleGenerate}
              disabled={isLoading || (!isPro && usageRemaining === 0)}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Generating...
                </>
              ) : !isPro && usageRemaining === 0 ? (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Upgrade to Generate
                </>
              ) : (
                "Generate Comment Bait 🎣"
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="flex flex-col gap-3">
                  <p>{error}</p>
                  {requiresUpgrade && (
                    <Button
                      variant="secondary"
                      className="w-full mt-2 font-bold gap-2 bg-white text-destructive hover:bg-white/90"
                      onClick={navigateToPremium}
                    >
                      <Lock className="w-4 h-4" />
                      Upgrade to Unlimited
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* RIGHT: Output */}
          <div className="space-y-4 bg-muted/30 p-6 rounded-xl border min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Generated Comments</h3>
              {results.length > 0 && (
                <Button variant="outline" size="sm" onClick={copyAll}>
                  Copy All
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-all animate-scale-in group relative"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-2 w-full">
                        <Badge variant="secondary" className="text-xs font-normal opacity-70">
                          {item.styleTag}
                        </Badge>
                        <p className="text-base font-medium leading-relaxed">{item.text}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(item.text)}
                        title="Copy to clipboard"
                      >
                        <svg 
                          width="15" 
                          height="15" 
                          viewBox="0 0 15 15" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                        >
                          <path d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00006H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50006C5 4.67163 5.67157 4.00006 6.5 4.00006H12.5C13.3284 4.00006 14 4.67163 14 5.50006V12.5001C14 13.3285 13.3284 14.0001 12.5 14.0001H6.5C5.67157 14.0001 5 13.3285 5 12.5001V5.50006ZM6.5 5.00006C6.22386 5.00006 6 5.22392 6 5.50006V12.5001C6 12.7762 6.22386 13.0001 6.5 13.0001H12.5C12.7761 13.0001 13 12.7762 13 12.5001V5.50006C13 5.22392 12.7761 5.00006 12.5 5.00006H6.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                        </svg>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2 opacity-60">
                <span className="text-4xl">💬</span>
                <p>Generate comment bait and we'll list your best options here.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

