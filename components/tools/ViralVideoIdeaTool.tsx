"use client";

import React, { useState } from 'react';
import { InputField } from "@/components/InputField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ViralIdea {
  title: string;
  description: string;
  angle: string;
  score: number;
}

export function ViralVideoIdeaTool() {
  const [topic, setTopic] = useState("");
  const [ideas, setIdeas] = useState<ViralIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setError("");
    
    try {
      const response = await fetch('/api/generate-viral-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          count: 5
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate ideas');
      }

      const data = await response.json();
      setIdeas(data.ideas);
    } catch (err: any) {
      console.error('Idea generation error:', err);
      setError(err.message || 'Failed to generate ideas. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Enter Your Niche or Topic</CardTitle>
          <CardDescription>We'll generate viral concepts based on what's working now.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <InputField
                label="Topic / Niche"
                value={topic}
                onChange={setTopic}
                placeholder="e.g. Personal Finance, Vegan Cooking, DIY Crafts..."
                required
              />
            </div>
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="mb-2 py-6 text-lg font-bold px-8"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Thinking...
                </>
              ) : (
                "Generate Ideas 💡"
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

      {ideas.length > 0 && (
        <div className="grid gap-6 animate-fade-in">
          {ideas.map((idea, index) => (
            <Card key={index} className="overflow-hidden border-2 hover:border-primary/50 transition-all group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                      {idea.angle}
                    </Badge>
                    <Badge variant="secondary">
                      Viral Score: {idea.score}/100
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(`${idea.title}\n\n${idea.description}`)}
                  >
                    📋 Copy
                  </Button>
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-foreground">
                  {idea.title}
                </h3>
                <p className="text-muted-foreground">
                  {idea.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}





