import React from 'react';
import { Metadata } from 'next';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { ViralVideoIdeaTool } from '@/components/tools/ViralVideoIdeaTool';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Viral Video Idea Generator | PostReady',
  description: 'Discover content ideas designed to go viral with AI-powered video concepts tailored to your niche.',
};

export default function IdeaGeneratorPage() {
  return (
    <ToolPageLayout
      title="Viral Video Idea Generator"
      description="Discover content ideas designed to go viral with AI-powered video concepts tailored to your niche."
      icon="💡"
    >
      <ViralVideoIdeaTool />
      
      <div className="mt-8 pt-8 border-t border-border px-4">
        <h2 className="text-2xl font-bold mb-4">Viral Video Idea Generator – Discover Content Ideas Designed to Go Viral</h2>
        <p className="mb-4 text-muted-foreground">
          The Viral Video Idea Generator helps you instantly generate high-performing video ideas tailored to your niche, audience, and goals. Powered by intelligent AI analysis, this tool delivers content concepts designed to trigger engagement, boost reach, and increase your chances of going viral across platforms.
        </p>
        <p className="mb-8 text-muted-foreground">
          Instead of guessing what to post next, you get targeted ideas based on trending formats, proven content patterns, and audience behavior. Whether you create for TikTok, YouTube Shorts, Instagram Reels, or full-length videos, this generator fuels consistent, strategic content creation.
        </p>

        <h3 className="text-xl font-semibold mb-3">What this tool does</h3>
        <p className="mb-8 text-muted-foreground">
          This AI-powered idea generator analyzes your niche and produces video concepts optimized for attention, curiosity, and shareability. Every idea is built to align with what performs well in your space right now.
        </p>

        <h3 className="text-xl font-semibold mb-3">How it helps you grow</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Generates viral video concepts instantly</li>
          <li>Removes creative block and content fatigue</li>
          <li>Sparks consistent posting momentum</li>
          <li>Aligns ideas with trends and audience interest</li>
          <li>Increases engagement and discoverability</li>
          <li>Helps you build a repeatable content system</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Popular uses include:</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Viral video idea generator</li>
          <li>TikTok video ideas</li>
          <li>YouTube content planning</li>
          <li>Social media content inspiration</li>
          <li>High-engagement video concepts</li>
          <li>Trend-based video ideas</li>
          <li>AI content strategy tool</li>
        </ul>
        <p className="mb-8 text-muted-foreground">
          By using this tool, you can quickly explore new formats, angles, and creative directions that keep your content fresh, relevant, and optimized for performance.
        </p>
        <p className="text-muted-foreground">
          Use the Viral Video Idea Generator above to unlock fresh ideas that attract attention, increase views, and grow your online presence consistently.
        </p>
      </div>
    </ToolPageLayout>
  );
}
