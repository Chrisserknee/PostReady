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
import { supabase } from '@/lib/supabase';
import { Lock, AlertTriangle, AlertCircle, Shield } from 'lucide-react';
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
  const [hasRedFlags, setHasRedFlags] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

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
      setError("Please enter some text to analyze");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);
    setHasRedFlags(false);
    setShowResult(false);
    setShowPopup(false);

    try {
      // Get access token from Supabase session for API authentication
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      // Add Authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/red-flag-translator', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ text, context }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('🚩 Red Flag API Error:', {
          status: response.status,
          errorData,
          isPro: isPro,
          user: user?.id
        });
        
        // Only redirect if it's actually a requiresUpgrade error AND user is not Pro
        if (errorData.requiresUpgrade && !isPro) {
          router.push('/?premium=true');
          return;
        }
        
        // If Pro user gets requiresUpgrade, log it but don't redirect
        if (errorData.requiresUpgrade && isPro) {
          console.error('🚩 ERROR: Pro user received requiresUpgrade error!', {
            userId: user?.id,
            isPro,
            errorData
          });
        }
        
        throw new Error(errorData.error || 'Failed to detect red flags');
      }

      const data = await response.json();
      setResult(data);
      const flagsDetected = data.redFlags && data.redFlags.length > 0;
      setHasRedFlags(flagsDetected);
      
      // If red flags detected, show popup animation
      if (flagsDetected) {
        // Show popup animation
        setShowPopup(true);
        
        // Hide popup after 3 seconds
        setTimeout(() => {
          setShowPopup(false);
        }, 3000);
      }
      
      // Animate result appearance
      setTimeout(() => {
        setShowResult(true);
      }, 100);
      
      fetchUsage();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative overflow-x-hidden max-w-full">
      {/* Hovering Popup Animation */}
      {showPopup && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden"
          style={{
            animation: 'fadeInScale 0.5s ease-out',
            maxWidth: '100vw',
          }}
        >
          <div 
            className="bg-gradient-to-br from-red-500 to-red-700 text-white px-8 py-6 rounded-2xl shadow-2xl border-4 border-white/20 flex items-center gap-4"
            style={{
              animation: 'floatUp 0.5s ease-out, pulse 2s ease-in-out infinite',
              animationDelay: '0s, 0.5s',
              boxShadow: '0 20px 60px rgba(239, 68, 68, 0.5), 0 0 0 10px rgba(239, 68, 68, 0.2)',
            }}
          >
            <AlertTriangle className="h-12 w-12 animate-bounce" />
            <div>
              <h2 className="text-3xl font-bold mb-1">Red Flag Detected!</h2>
              <p className="text-red-100 text-sm">Analyzing potential warning signs...</p>
            </div>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>🚩 Red Flag Detector</CardTitle>
          <CardDescription>
            Detect hidden meanings and identify red flags in text messages, social media posts, and conversations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPro && usageRemaining !== null && (
            <Badge variant="secondary">
              {usageRemaining > 0 ? `${usageRemaining} Free Use${usageRemaining !== 1 ? 's' : ''} Remaining` : 'Free Uses Exhausted'}
            </Badge>
          )}

          <div className="space-y-2">
            <Label htmlFor="text">Text to Analyze</Label>
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
                Detecting...
              </>
            ) : (
              "🚩 Detect Red Flags"
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
        <Card 
          className={`transition-all duration-500 ${
            showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          } ${
            hasRedFlags ? 'border-red-500 shadow-lg shadow-red-500/20' : 'border-green-500 shadow-lg shadow-green-500/20'
          }`}
          style={{
            animation: hasRedFlags ? 'pulse 2s ease-in-out infinite' : undefined,
          }}
        >
          <CardHeader className={hasRedFlags ? 'bg-red-50 dark:bg-red-950/20' : 'bg-green-50 dark:bg-green-950/20'}>
            <CardTitle className={`flex items-center gap-2 ${hasRedFlags ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {hasRedFlags ? (
                <>
                  <AlertTriangle className="h-5 w-5 animate-pulse" />
                  Red Flags Detected!
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  No Red Flags Found
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Original Text */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <Label className="text-sm font-semibold text-muted-foreground mb-2 block">Original Text:</Label>
              <p className="text-base leading-relaxed">{result.original}</p>
            </div>

            {/* What They Really Mean */}
            <div className={`p-4 rounded-lg border-2 ${
              hasRedFlags 
                ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/30' 
                : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/30'
            }`}>
              <Label className={`text-sm font-semibold mb-2 block ${
                hasRedFlags 
                  ? 'text-red-700 dark:text-red-300' 
                  : 'text-blue-700 dark:text-blue-300'
              }`}>
                What They Really Mean:
              </Label>
              <p className={`text-base leading-relaxed ${
                hasRedFlags 
                  ? 'text-red-900 dark:text-red-100' 
                  : 'text-blue-900 dark:text-blue-100'
              }`}>
                {result.translation}
              </p>
            </div>

            {/* Red Flags - Animated */}
            {result.redFlags && result.redFlags.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                  <Label className="text-lg font-bold text-red-600 dark:text-red-400">
                    {result.redFlags.length} Red Flag{result.redFlags.length !== 1 ? 's' : ''} Detected
                  </Label>
                </div>
                <div className="space-y-2">
                  {result.redFlags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 animate-fade-in"
                      style={{
                        animationDelay: `${idx * 100}ms`,
                        animation: 'slideInLeft 0.5s ease-out',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl animate-bounce" style={{ animationDelay: `${idx * 100}ms` }}>🚩</span>
                        <p className="text-red-900 dark:text-red-100 font-medium flex-1">{flag}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Beautiful Analysis */}
            {result.explanation && (
              <div className={`p-5 rounded-lg border-2 ${
                hasRedFlags 
                  ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40 border-red-300 dark:border-red-700/50' 
                  : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border-green-300 dark:border-green-700/50'
              }`}>
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className={`h-5 w-5 mt-0.5 ${
                    hasRedFlags 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`} />
                  <Label className={`text-base font-bold ${
                    hasRedFlags 
                      ? 'text-red-700 dark:text-red-300' 
                      : 'text-green-700 dark:text-green-300'
                  }`}>
                    Analysis
                  </Label>
                </div>
                <p className={`text-sm leading-relaxed ${
                  hasRedFlags 
                    ? 'text-red-900 dark:text-red-100' 
                    : 'text-green-900 dark:text-green-100'
                }`}>
                  {result.explanation}
                </p>
              </div>
            )}

            {/* Suggested Response */}
            {result.response && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30">
                <Label className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 block">
                  Suggested Response:
                </Label>
                <p className="text-blue-900 dark:text-blue-100 text-sm leading-relaxed">{result.response}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes floatUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

