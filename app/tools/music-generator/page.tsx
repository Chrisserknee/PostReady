import React from 'react';
import { Metadata } from 'next';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { MusicGeneratorTool } from '@/components/tools/MusicGeneratorTool';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'AI Music Generator | PostReady',
  description: 'Create custom background music for your videos instantly with AI-powered composition.',
};

export default function MusicGeneratorPage() {
  return (
    <ToolPageLayout
      title="AI Music Generator"
      description="Create custom background music for your videos instantly with AI-powered composition."
      icon="🎵"
    >
      <MusicGeneratorTool />
      
      <div className="mt-8 pt-8 border-t border-border px-4">
        <h2 className="text-2xl font-bold mb-4">AI Music Generator – Create Custom Background Music for Videos Instantly</h2>
        <p className="mb-4 text-muted-foreground">
          The PostReady AI Music Generator lets you create custom background music for your videos using intelligent, AI-powered composition. Instead of searching endlessly for generic stock audio, you can generate unique music tailored to your content's mood, style, and duration in seconds.
        </p>
        <p className="mb-8 text-muted-foreground">
          Whether you're creating TikToks, YouTube videos, Instagram Reels, ads, or cinematic content, the right background music dramatically improves retention, emotional impact, and professionalism. This tool gives you fast, original audio without copyright headaches or licensing complexity.
        </p>

        <h3 className="text-xl font-semibold mb-3">What this music generator does</h3>
        <p className="mb-8 text-muted-foreground">
          This AI-driven music generator creates original soundtracks based on your description and selected genre. You can control the vibe, tempo, and duration to match the exact tone of your content — from chill lo-fi to intense cinematic beats.
        </p>

        <h3 className="text-xl font-semibold mb-3">How it helps your content perform better</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Generates custom background music instantly</li>
          <li>Eliminates repetitive stock audio</li>
          <li>Enhances emotional impact and storytelling</li>
          <li>Boosts viewer retention and professionalism</li>
          <li>Saves time and production costs</li>
          <li>Ideal for creators, marketers, and brands</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Popular uses include:</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Background music for social media videos</li>
          <li>AI-generated music for TikTok & Reels</li>
          <li>YouTube intro music</li>
          <li>Lo-fi beats for content</li>
          <li>Cinematic background tracks</li>
          <li>Royalty-free video music</li>
        </ul>
        <p className="mb-8 text-muted-foreground">
          By using this tool, you can experiment with different musical styles and moods until you find the perfect sound that elevates your content and strengthens your brand identity.
        </p>
        <p className="text-muted-foreground">
          Use the Music Generator above to instantly create unique audio that fits your vision — no editing experience required.
        </p>
      </div>
    </ToolPageLayout>
  );
}
