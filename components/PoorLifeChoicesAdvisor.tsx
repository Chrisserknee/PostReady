"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/contexts/AuthContext';
import { Lock, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdviceResult {
  situation: string;
  advice: string;
  warnings: string[];
  humor: string;
}

export function PoorLifeChoicesAdvisor() {
  const { isPro, user } = useAuth();
  const router = useRouter();
  const [situation, setSituation] = useState("");
  const [tone, setTone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AdviceResult | null>(null);
  const [error, setError] = useState("");
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/poor-life-choices-advisor/usage', {
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

  const handleGetAdvice = async () => {
    if (!situation.trim()) {
      setError("Please describe your situation");
      return;
    }

    if (!isPro && usageRemaining !== null && usageRemaining <= 0) {
      router.push('/?premium=true');
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch('/api/poor-life-choices-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ situation, tone }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.requiresUpgrade) {
          router.push('/?premium=true');
          return;
        }
        throw new Error(errorData.error || 'Failed to get advice');
      }

      const data = await response.json();
      setResult(data);
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
          <CardTitle>🤦 Poor Life Choices Advisor</CardTitle>
          <CardDescription>
            Get humorous, sarcastic advice about poor life choices. Perfect for entertainment and laughs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPro && usageRemaining !== null && (
            <Badge variant="secondary">
              {usageRemaining > 0 ? `${usageRemaining} Free Use${usageRemaining !== 1 ? 's' : ''} Remaining` : 'Free Uses Exhausted'}
            </Badge>
          )}

          <div className="space-y-2">
            <Label htmlFor="situation">Describe Your Situation</Label>
            <Textarea
              id="situation"
              placeholder="e.g., 'I want to text my ex at 2am', 'I'm thinking about buying something I can't afford'"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tone (Optional)</Label>
            <Input
              id="tone"
              placeholder="e.g., 'sarcastic', 'playful', 'relatable'"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            />
          </div>

          <Button
            onClick={handleGetAdvice}
            disabled={isLoading || !situation.trim() || (!isPro && usageRemaining !== null && usageRemaining <= 0)}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Getting Advice...
              </>
            ) : (!isPro && usageRemaining !== null && usageRemaining <= 0) ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Upgrade for Advice
              </>
            ) : (
              "🤦 Get Terrible Advice"
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Your Advice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Situation:</Label>
              <p className="mt-1 text-muted-foreground">{result.situation}</p>
            </div>

            <div>
              <Label className="text-sm font-semibold">Advice:</Label>
              <p className="mt-1">{result.advice}</p>
            </div>

            {result.warnings && result.warnings.length > 0 && (
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Warnings:
                </Label>
                <ul className="mt-2 space-y-1">
                  {result.warnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-yellow-500">⚠️</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.humor && (
              <div>
                <Label className="text-sm font-semibold">The Humor:</Label>
                <p className="mt-1 text-muted-foreground">{result.humor}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

