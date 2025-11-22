"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { SugarDaddyMessageItem, SugarDaddyMessageRequest, SugarDaddyMessageResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';

export function SugarDaddyMessageGeneratorTool() {
  // Auth & Router
  const { isPro, user } = useAuth();
  const router = useRouter();
  
  const handleUpgrade = () => {
    router.push('/?premium=true');
  };

  // Form State
  const [situation, setSituation] = useState("");
  const [tone, setTone] = useState("Sweet");
  const [relationship, setRelationship] = useState("Long-term");
  const [amount, setAmount] = useState("");
  const [count, setCount] = useState("5");

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SugarDaddyMessageItem[]>([]);
  const [error, setError] = useState("");
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);

  // Fetch usage on mount and after generation
  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/sugar-daddy-messages/usage');
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
  }, [user]);

  const handleGenerate = async () => {
    if (!situation) {
      setError("Please describe your situation or need.");
      return;
    }

    setIsLoading(true);
    setError("");
    setRequiresUpgrade(false);
    setResults([]);

    try {
      const requestBody: SugarDaddyMessageRequest = {
        situation,
        tone,
        relationship,
        amount: amount ? `$${amount.replace(/,/g, '')}` : undefined,
        count: parseInt(count)
      };

      const response = await fetch('/api/sugar-daddy-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // 401 means auth required, but our API now handles optional auth.
        // If we get 401, it's an explicit auth error, but usage limits are 403
        
        if (errorData.requiresUpgrade) {
            setRequiresUpgrade(true);
            setUsageRemaining(0); // Ensure UI reflects 0
            throw new Error(errorData.error || "This is a Pro feature. Please upgrade to use.");
        }

        throw new Error(errorData.error || 'Failed to generate messages');
      }

      const data: SugarDaddyMessageResponse = await response.json();
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
  };

  const copyAll = () => {
    const allText = results.map(r => r.text).join('\n\n');
    copyToClipboard(allText);
  };

  return (
    <CardContent className="p-6">
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
                        onClick={handleUpgrade}
                    >
                        Unlock Unlimited
                    </Button>
                )}
             </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="situation">Situation / Need <span className="text-red-500">*</span></Label>
            <Textarea
              id="situation"
              placeholder="e.g. Rent is due, Emergency car repair, Shopping for essentials..."
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              className="h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sweet">Sweet</SelectItem>
                  <SelectItem value="Desperate">Desperate</SelectItem>
                  <SelectItem value="Playful">Playful</SelectItem>
                  <SelectItem value="Grateful">Grateful</SelectItem>
                  <SelectItem value="Direct">Direct</SelectItem>
                  <SelectItem value="Sexy">Sexy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Long-term">Long-term</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground font-semibold z-10">$</span>
              <Input
                id="amount"
                placeholder="500, 1000..."
                value={amount}
                onChange={(e) => {
                  // Remove any existing dollar signs and allow only numbers and commas
                  const value = e.target.value.replace(/[^0-9,]/g, '');
                  setAmount(value);
                }}
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Count</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Messages</SelectItem>
                <SelectItem value="5">5 Messages</SelectItem>
                <SelectItem value="10">10 Messages</SelectItem>
              </SelectContent>
            </Select>
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
              "Generate Messages 💸"
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
                        onClick={handleUpgrade}
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
            <h3 className="font-bold text-lg">Generated Messages</h3>
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
                        {item.toneTag}
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
              <span className="text-4xl">💸</span>
              <p>Generate messages and we'll show your options here.</p>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  );
}
