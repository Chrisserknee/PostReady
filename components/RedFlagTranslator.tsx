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

interface TranslationResult {
  original: string;
  translation: string;
  redFlags: string[];
  explanation: string;
  response?: string;
}

export function RedFlagTranslator() {
  const { isPro, user } = useAuth();
  const router = useRouter();
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState("");
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/red-flag-translator/usage', {
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

  const handleTranslate = async () => {
    if (!text.trim()) {
      setError("Please enter some text to translate");
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
      const response = await fetch('/api/red-flag-translator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text, context }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.requiresUpgrade) {
          router.push('/?premium=true');
          return;
        }
        throw new Error(errorData.error || 'Failed to translate');
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
          <CardTitle>🚩 Red Flag Translator</CardTitle>
          <CardDescription>
            Decode hidden meanings and identify red flags in text messages, social media posts, and conversations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPro && usageRemaining !== null && (
            <Badge variant="secondary">
              {usageRemaining > 0 ? `${usageRemaining} Free Use${usageRemaining !== 1 ? 's' : ''} Remaining` : 'Free Uses Exhausted'}
            </Badge>
          )}

          <div className="space-y-2">
            <Label htmlFor="text">Text to Translate</Label>
            <Textarea
              id="text"
              placeholder="Paste the text message, post, or conversation snippet here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Context (Optional)</Label>
            <Input
              id="context"
              placeholder="e.g., 'from a dating app match', 'from my ex', 'from a coworker'"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>

          <Button
            onClick={handleTranslate}
            disabled={isLoading || !text.trim() || (!isPro && usageRemaining !== null && usageRemaining <= 0)}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Translating...
              </>
            ) : (!isPro && usageRemaining !== null && usageRemaining <= 0) ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Upgrade to Translate
              </>
            ) : (
              "🚩 Translate Red Flags"
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
            <CardTitle>Translation Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Original Text:</Label>
              <p className="mt-1 text-muted-foreground">{result.original}</p>
            </div>

            <div>
              <Label className="text-sm font-semibold">What They Really Mean:</Label>
              <p className="mt-1">{result.translation}</p>
            </div>

            {result.redFlags && result.redFlags.length > 0 && (
              <div>
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Red Flags:
                </Label>
                <ul className="mt-2 space-y-1">
                  {result.redFlags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-500">🚩</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.explanation && (
              <div>
                <Label className="text-sm font-semibold">Why This Is Problematic:</Label>
                <p className="mt-1 text-muted-foreground">{result.explanation}</p>
              </div>
            )}

            {result.response && (
              <div>
                <Label className="text-sm font-semibold">Suggested Response:</Label>
                <p className="mt-1 text-muted-foreground">{result.response}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

