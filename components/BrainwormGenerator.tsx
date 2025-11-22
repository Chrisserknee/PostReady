"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainwormItem, BrainwormRequest, BrainwormResponse } from '@/types';

export function BrainwormGenerator() {
  // Form State
  const [context, setContext] = useState("");
  const [vibe, setVibe] = useState("Suspense / Mystery");
  const [count, setCount] = useState("5");

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<BrainwormItem[]>([]);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setIsLoading(true);
    setError("");
    setResults([]);

    try {
      const requestBody: BrainwormRequest = {
        context,
        vibe: vibe.split(' (')[0], 
        count: parseInt(count)
      };

      const response = await fetch('/api/brainworm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate brainworms');
      }

      const data: BrainwormResponse = await response.json();
      setResults(data.items);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="w-full border-2 shadow-md animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧠</span>
          <div>
            <CardTitle className="text-2xl font-bold">Brainworm Phrase Generator</CardTitle>
            <CardDescription>
              Create irresistibly engaging phrases that make viewers pause and want to watch more using sophisticated psychological hooks.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT: Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="context">Video Context (Optional)</Label>
              <Input 
                id="context" 
                placeholder="e.g. Cooking, Storytime, Tech Review..." 
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Vibe / Intensity</Label>
              <Select value={vibe} onValueChange={setVibe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Suspense / Mystery">Suspense / Mystery</SelectItem>
                  <SelectItem value="Urgency / FOMO">Urgency / FOMO</SelectItem>
                  <SelectItem value="Insider / Secret">Insider / Secret (Exclusivity)</SelectItem>
                  <SelectItem value="Emotional / Haunted">Emotional / Haunted</SelectItem>
                  <SelectItem value="Pattern Interrupt">Pattern Interrupt (Stop Scrolling)</SelectItem>
                  <SelectItem value="Social Proof / Bandwagon">Social Proof / Bandwagon</SelectItem>
                  <SelectItem value="Shock / Controversy">Shock / Controversy</SelectItem>
                  <SelectItem value="Command / Imperative">Command / Imperative (Direct Orders)</SelectItem>
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
                  <SelectItem value="3">3 Phrases</SelectItem>
                  <SelectItem value="5">5 Phrases</SelectItem>
                  <SelectItem value="10">10 Phrases</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full font-bold" 
              size="lg" 
              onClick={handleGenerate}
              disabled={isLoading}
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Infecting Minds...
                </>
              ) : (
                "Generate Brainworms 🧠"
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* RIGHT: Output */}
          <div className="space-y-4 bg-muted/30 p-6 rounded-xl border min-h-[300px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Sticky Phrases</h3>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3">
                {results.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-all animate-scale-in group relative flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <p className="text-lg font-bold leading-tight text-foreground">{item.text}</p>
                      {item.explanation && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{item.explanation}</p>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(item.text)}
                      title="Copy"
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
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2 opacity-60">
                <span className="text-4xl">😵‍💫</span>
                <p>Generate phrases to hook your audience instantly.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

