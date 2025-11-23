"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Shield, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SafetyResult {
  url: string;
  isSafe: boolean;
  safetyScore: number;
  concerns: string[];
  explanation: string;
  recommendations: string[];
}

export function KidSafeUrlChecker() {
  const { isPro, user } = useAuth();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SafetyResult | null>(null);
  const [error, setError] = useState("");
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/kidsafe-url-checker/usage', {
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

  const validateUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const normalizeUrl = (urlString: string): string => {
    if (!urlString.trim()) return '';
    if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
      return urlString;
    }
    return `https://${urlString}`;
  };

  const handleCheck = async () => {
    if (!url.trim()) {
      setError("Please enter a URL to check");
      return;
    }

    const normalizedUrl = normalizeUrl(url.trim());
    if (!validateUrl(normalizedUrl)) {
      setError("Please enter a valid URL (e.g., example.com or https://example.com)");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/kidsafe-url-checker', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ url: normalizedUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.requiresUpgrade && !isPro) {
          router.push('/?premium=true');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to check URL safety');
      }

      const data = await response.json();
      setResult(data);
      fetchUsage(); // Refresh usage count
    } catch (err: any) {
      console.error('KidSafe URL Checker error:', err);
      setError(err.message || 'Failed to check URL safety. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      <Card>
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: '#10B981' }} />
            <span className="break-words">KidSafe URL Checker</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base break-words">
            Check if a website is safe for children under 13. Get instant safety ratings with clear explanations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
          {!isPro && usageRemaining !== null && (
            <Badge variant="secondary" className="text-xs sm:text-sm">
              {usageRemaining > 0 ? `${usageRemaining} Free Use${usageRemaining !== 1 ? 's' : ''} Remaining` : 'Free Uses Exhausted'}
            </Badge>
          )}

          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm sm:text-base">Website URL</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="url"
                placeholder="e.g., example.com or https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleCheck();
                  }
                }}
                className="flex-1 text-base sm:text-sm min-h-[44px]"
              />
              <Button
                onClick={handleCheck}
                disabled={isLoading || !url.trim()}
                className="min-h-[44px] text-sm sm:text-base whitespace-nowrap"
                style={{ backgroundColor: '#10B981', color: 'white' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Checking...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Check Safety</span>
                    <span className="sm:hidden">Check</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4 mt-4 sm:mt-6">
              <Card style={{ 
                borderColor: result.isSafe ? '#10B981' : '#EF4444',
                borderWidth: '2px'
              }}>
                <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      {result.isSafe ? (
                        <>
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" style={{ color: '#10B981' }} />
                          <span style={{ color: '#10B981' }} className="break-words">Safe for Children</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" style={{ color: '#EF4444' }} />
                          <span style={{ color: '#EF4444' }} className="break-words">Not Safe for Children</span>
                        </>
                      )}
                    </CardTitle>
                    <Badge 
                      variant={result.isSafe ? "default" : "destructive"}
                      className="text-xs sm:text-sm w-fit"
                      style={{ 
                        backgroundColor: result.isSafe ? '#10B981' : '#EF4444',
                        color: 'white'
                      }}
                    >
                      Safety Score: {result.safetyScore}/100
                    </Badge>
                  </div>
                  <CardDescription className="break-all text-xs sm:text-sm mt-2">{result.url}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">Safety Analysis:</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">{result.explanation}</p>
                  </div>

                  {result.concerns && result.concerns.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#EF4444' }} />
                        <span>Safety Concerns:</span>
                      </h4>
                      <ul className="list-disc pl-5 sm:pl-6 space-y-1">
                        {result.concerns.map((concern, idx) => (
                          <li key={idx} className="text-xs sm:text-sm text-muted-foreground break-words">{concern}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.recommendations && result.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
                        <Shield className="w-4 h-4 flex-shrink-0" style={{ color: '#10B981' }} />
                        <span>Recommendations:</span>
                      </h4>
                      <ul className="list-disc pl-5 sm:pl-6 space-y-1">
                        {result.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs sm:text-sm text-muted-foreground break-words">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

