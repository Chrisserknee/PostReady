"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CommentFightStarterGenerator() {
  const { isPro, user } = useAuth();
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("");
  const [tone, setTone] = useState("");
  const [count, setCount] = useState("3");
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/comment-fight-starter/usage', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUsageRemaining(Math.max(0, data.limit - data.usageCount));
      }
    } catch (err) {
      console.error('Error fetching usage:', err);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [user]);

  const handleGenerate = async () => {
    if (!isPro && usageRemaining !== null && usageRemaining <= 0) {
      router.push('/?premium=true');
      return;
    }

    setIsLoading(true);
    setError("");
    setComments([]);

    try {
      const response = await fetch('/api/comment-fight-starter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          topic, 
          platform, 
          tone, 
          count: Math.min(Math.max(parseInt(count) || 3, 1), 3) 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.requiresUpgrade) {
          router.push('/?premium=true');
          return;
        }
        throw new Error(errorData.error || 'Failed to generate comments');
      }

      const data = await response.json();
      setComments(data.comments || []);
      fetchUsage();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>💥 Comment Fight Starter Generator</CardTitle>
          <CardDescription>
            Generate controversial, debate-provoking comments designed to spark arguments and engagement in social media comment sections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPro && usageRemaining !== null && (
            <Badge variant="secondary">
              {usageRemaining > 0 ? `${usageRemaining} Free Use${usageRemaining !== 1 ? 's' : ''} Remaining` : 'Free Uses Exhausted'}
            </Badge>
          )}

          <div className="space-y-2">
            <Label htmlFor="topic">Topic (Optional)</Label>
            <Input
              id="topic"
              placeholder="e.g., 'pineapple on pizza', 'best programming language'"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Platform (Optional)</Label>
            <Input
              id="platform"
              placeholder="e.g., 'TikTok', 'Instagram', 'YouTube'"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tone (Optional)</Label>
            <Input
              id="tone"
              placeholder="e.g., 'playful', 'serious', 'sarcastic'"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">Number of Comments</Label>
            <Input
              id="count"
              type="number"
              min="1"
              max="3"
              value={count}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value);
                if (value === '' || (numValue >= 1 && numValue <= 3)) {
                  setCount(value);
                } else if (numValue > 3) {
                  setCount('3');
                }
              }}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isLoading || (!isPro && usageRemaining !== null && usageRemaining <= 0)}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Generating...
              </>
            ) : (!isPro && usageRemaining !== null && usageRemaining <= 0) ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Upgrade to Generate
              </>
            ) : (
              "💥 Generate Fight Starters"
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {comments.map((comment, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border bg-muted/50"
              >
                <p className="text-sm font-medium mb-1">Comment {idx + 1}:</p>
                <p>{comment}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

