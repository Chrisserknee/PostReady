"use client";

import React, { useState } from 'react';
import { InputField } from "@/components/InputField";
import { SelectField } from "@/components/SelectField";
import { TextAreaField } from "@/components/TextAreaField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface SoraPrompt {
  id: string;
  prompt: string;
  style: string;
  camera: string;
  mood: string;
}

export function SoraPromptTool() {
  const [idea, setIdea] = useState("");
  const [style, setStyle] = useState("Cinematic");
  const [camera, setCamera] = useState("Drone Shot");
  const [mood, setMood] = useState("Epic");
  const [results, setResults] = useState<SoraPrompt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    
    setIsGenerating(true);
    setError("");
    
    try {
      const response = await fetch('/api/generate-sora-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea,
          style,
          camera,
          mood,
          count: 3
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate prompts');
      }

      const data = await response.json();
      setResults(data.prompts);
    } catch (err: any) {
      console.error('Sora generation error:', err);
      setError(err.message || 'Failed to generate prompts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Toast would go here
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Your Video Concept</CardTitle>
          <CardDescription>Describe your idea and choose the visual style.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <TextAreaField
              label="Video Idea"
              value={idea}
              onChange={setIdea}
              placeholder="A futuristic city with flying cars in rain..."
              rows={4}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectField
                label="Visual Style"
                value={style}
                onChange={setStyle}
                options={["Cinematic", "Anime", "3D Render", "Realistic", "Abstract", "Vintage Film", "Cyberpunk", "Watercolor"]}
                required
              />
              
              <SelectField
                label="Camera Movement"
                value={camera}
                onChange={setCamera}
                options={["Drone Shot", "Pan Left", "Zoom In", "Handheld", "Static", "Tracking Shot", "FPV"]}
                required
              />
              
              <SelectField
                label="Mood / Atmosphere"
                value={mood}
                onChange={setMood}
                options={["Epic", "Peaceful", "Dark", "Energetic", "Nostalgic", "Dreamy", "Tense"]}
                required
              />
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !idea.trim()}
              className="w-full font-bold text-lg py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Generating Prompts...
                </>
              ) : (
                <>
                  <span className="mr-2 text-xl">🎬</span>
                  Generate Sora Prompts
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

      {results.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">✨</span> Your Prompts
          </h3>
          
          <div className="grid gap-6">
            {results.map((result, index) => (
              <Card key={index} className="overflow-hidden border-2 hover:border-purple-500/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-bold uppercase">{result.style}</span>
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold uppercase">{result.camera}</span>
                    <span className="px-2 py-1 rounded bg-pink-100 text-pink-700 text-xs font-bold uppercase">{result.mood}</span>
                  </div>
                  
                  <p className="text-lg leading-relaxed mb-6 font-medium text-foreground/90">
                    {result.prompt}
                  </p>
                  
                  <Button 
                    onClick={() => copyToClipboard(result.prompt)}
                    variant="outline" 
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                  >
                    📋 Copy Prompt
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}





