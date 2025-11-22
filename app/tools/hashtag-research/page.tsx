import React from 'react';
import { Metadata } from 'next';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { HashtagResearchTool } from '@/components/tools/HashtagResearchTool';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Hashtag Deep Research – AI Hashtag Analyzer & Strategy Tool | PostReady',
  description: 'Discover the most effective hashtags for maximum reach and engagement with AI-powered hashtag research and analysis.',
};

export default function HashtagResearchPage() {
  return (
    <ToolPageLayout
      title="Hashtag Deep Research"
      description="Discover the most effective hashtags for maximum reach and engagement with AI-powered hashtag research and analysis."
      icon="#️⃣"
    >
      <HashtagResearchTool />
      
      <div className="mt-8 pt-8 border-t border-border px-4">
        <h2 className="text-2xl font-bold mb-4">Hashtag Deep Research – AI Hashtag Analyzer & Strategy Tool</h2>
        <p className="mb-4 text-muted-foreground">
          Hashtag Deep Research by PostReady helps you discover the most effective hashtags for maximum reach, engagement, and visibility across social media platforms. Instead of guessing which tags to use, this AI-powered hashtag research tool analyzes trends, relevance, and performance indicators to surface high-impact hashtags tailored to your niche.
        </p>
        <p className="mb-8 text-muted-foreground">
          Whether you're posting on Instagram, TikTok, or building a brand presence, this hashtag analyzer identifies strategic combinations of broad, mid-range, and niche hashtags that increase discoverability without triggering shadow bans or algorithm suppression.
        </p>

        <h3 className="text-xl font-semibold mb-3">This tool is ideal for:</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Content creators looking to grow faster</li>
          <li>Businesses optimizing reach and visibility</li>
          <li>Influencers improving post performance</li>
          <li>Social media managers building data-driven strategies</li>
        </ul>
        <p className="mb-8 text-muted-foreground">
          By using intelligent hashtag research, you can improve post ranking, attract the right audience, and stay aligned with trending topics in your industry — all from a single streamlined platform.
        </p>
        <p className="text-muted-foreground">
          PostReady's Hashtag Deep Research tool removes guesswork and replaces it with precision, helping your content perform more consistently and competitively.
        </p>
      </div>
    </ToolPageLayout>
  );
}
