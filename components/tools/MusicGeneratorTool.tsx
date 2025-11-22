"use client";

import React, { useState } from 'react';
import { InputField } from "@/components/InputField";
import { SelectField } from "@/components/SelectField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

interface GeneratedMusic {
  url: string;
  prompt: string;
  type: string;
}

export function MusicGeneratorTool() {
  const { isPro } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("15");
  const [type, setType] = useState("Lo-Fi");
  const [result, setResult] = useState<GeneratedMusic | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError("");
    setResult(null);
    
    try {
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          duration: parseInt(duration),
          type
        })
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.requiresUpgrade) {
          throw new Error("This is a Pro feature. Please upgrade to use.");
        }
        throw new Error(data.error || 'Failed to generate music');
      }

      const data = await response.json();
      setResult({
        url: data.url || data.audioUrl, // Handle potential varying response formats
        prompt,
        type
      });
    } catch (err: any) {
      console.error('Music generation error:', err);
      setError(err.message || 'Failed to generate music.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Music Composer</CardTitle>
          <CardDescription>Generate unique background music for your videos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <InputField
              label="Music Description"
              value={prompt}
              onChange={setPrompt}
              placeholder="e.g. Upbeat lo-fi hip hop beat for studying"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Duration (Seconds)"
                value={duration}
                onChange={setDuration}
                options={["10", "15", "20", "30"]} // ElevenLabs limits might apply
                required
              />
              
              <SelectField
                label="Style / Genre"
                value={type}
                onChange={setType}
                options={["Lo-Fi", "Cinematic", "Upbeat", "Ambient", "Electronic", "Acoustic", "Jazz", "Rock"]}
                required
              />
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full font-bold text-lg py-6 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Composing...
                </>
              ) : (
                <>
                  <span className="mr-2 text-xl">🎵</span>
                  Generate Music
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="animate-fade-in border-2 border-indigo-500/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">🎵 Your Track is Ready!</h3>
            <p className="text-sm text-muted-foreground mb-4">{result.prompt} ({result.type})</p>
            
            <div className="bg-secondary/30 p-4 rounded-xl mb-4">
              <audio controls src={result.url} className="w-full" />
            </div>
            
            <a href={result.url} download={`music-${Date.now()}.mp3`}>
              <Button variant="outline">Download Track</Button>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


