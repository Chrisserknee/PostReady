"use client";

import React, { useState } from 'react';
import { InputField } from "@/components/InputField";
import { SelectField } from "@/components/SelectField";
import { TextAreaField } from "@/components/TextAreaField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

// ElevenLabs Voice Mapping
const ELEVENLABS_VOICES = {
  "TYkIHhDWzXPHalxGXze5": "Trailer Voice",
  "pNInz6obpgDQGcFmaJgB": "Adam",
  "EXAVITQu4vr4xnSDxMaL": "Bella",
  "21m00Tcm4TlvDq8ikWAM": "Rachel",
  // Add more ElevenLabs voice IDs here as needed
  // Format: "voice_id": "Display Name"
};

export function VoiceoverGeneratorTool() {
  const { isPro } = useAuth();
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("30");
  const [voice, setVoice] = useState("TYkIHhDWzXPHalxGXze5"); // Default to Trailer Voice
  const [script, setScript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setError("");
    setAudioUrl("");
    
    try {
      const response = await fetch('/api/generate-voiceover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          duration: parseInt(duration),
          voice,
          // If we have a script, use it, otherwise generate one
          currentScript: script || undefined,
          generateScriptOnly: false 
        })
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.requiresUpgrade) {
          throw new Error("This is a Pro feature. Please upgrade to use.");
        }
        throw new Error(data.error || 'Failed to generate voiceover');
      }

      const data = await response.json();
      setScript(data.script);
      setAudioUrl(data.audioUrl);
    } catch (err: any) {
      console.error('Voiceover error:', err);
      setError(err.message || 'Failed to generate voiceover.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Professional Voiceovers</CardTitle>
          <CardDescription>Generate AI-powered scripts and voiceovers for your content.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <InputField
              label="Topic / Description"
              value={topic}
              onChange={setTopic}
              placeholder="e.g. The benefits of meditation for busy professionals"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Duration (Seconds)"
                value={duration}
                onChange={setDuration}
                options={["15", "30", "60", "90"]}
                required
              />
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Voice <span className="text-red-500">*</span>
                </Label>
                <Select value={voice} onValueChange={setVoice} required>
                  <SelectTrigger className="w-full bg-card text-foreground border-input">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ELEVENLABS_VOICES).map(([voiceId, voiceName]) => (
                      <SelectItem key={voiceId} value={voiceId}>
                        {voiceName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {script && (
              <TextAreaField
                label="Script (Editable)"
                value={script}
                onChange={setScript}
                rows={6}
              />
            )}

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full font-bold text-lg py-6"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                  Generating...
                </>
              ) : (
                <>
                  <span className="mr-2 text-xl">🎙️</span>
                  {script ? "Regenerate Voiceover" : "Generate Script & Voiceover"}
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

      {audioUrl && (
        <Card className="animate-fade-in border-2 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-4">🎧 Your Voiceover is Ready!</h3>
            <audio controls src={audioUrl} className="w-full mb-4" />
            <a href={audioUrl} download="voiceover.mp3">
              <Button variant="outline">Download MP3</Button>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


