import React from 'react';
import { Metadata } from 'next';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { BrainwormGenerator } from '@/components/BrainwormGenerator';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Brainworm Phrase Generator | PostReady',
  description: 'Create irresistibly engaging phrases that make viewers pause and want to watch more.',
};

export default function BrainwormPage() {
  return (
    <ToolPageLayout
      title="Brainworm Phrase Generator"
      description="Create irresistibly engaging phrases that make viewers pause and want to watch more."
      icon="🧠"
    >
      <BrainwormGenerator />
      
      <div className="mt-8 pt-8 border-t border-border px-4">
        <h2 className="text-2xl font-bold mb-4">Brainworm Phrase Generator – Create Addictive Hooks That Stop the Scroll</h2>
        <p className="mb-4 text-muted-foreground">
          The Brainworm Phrase Generator is designed to create short, irresistible phrases that embed themselves in your viewer's mind — the kind that make people pause, rewatch, and engage. These psychologically sticky phrases are perfect for social media videos, captions, thumbnails, voiceovers, and on-screen text that need to spark curiosity or suspense instantly.
        </p>
        <p className="mb-8 text-muted-foreground">
          Whether you're making TikToks, YouTube Shorts, Instagram Reels, or ads, the right hook can mean the difference between being ignored and going viral. This tool helps you generate compelling, scroll-stopping phrases built to trigger emotional and psychological responses in your audience.
        </p>

        <h3 className="text-xl font-semibold mb-3">What are brainworm phrases?</h3>
        <p className="mb-8 text-muted-foreground">
          Brainworm phrases are short, memorable statements that linger in the mind. They create tension, curiosity, intrigue, or emotional pull — encouraging viewers to stay engaged longer and interact with your content.
        </p>

        <h3 className="text-xl font-semibold mb-3">How this generator helps</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Creates viral hook phrases for videos and reels</li>
          <li>Generates suspense, mystery, and curiosity-driven language</li>
          <li>Enhances viewer retention and watch time</li>
          <li>Makes your content more shareable and addictive</li>
          <li>Removes creative block when writing captions or intros</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Popular uses include:</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Viral video hook ideas</li>
          <li>Scroll-stopping phrases</li>
          <li>Psychological trigger captions</li>
          <li>TikTok and Reels intro lines</li>
          <li>Content engagement phrases</li>
          <li>High-retention content hooks</li>
        </ul>
        <p className="mb-8 text-muted-foreground">
          By using this tool, you can quickly experiment with different tones and emotional intensities to find phrases that align perfectly with your content style and audience behavior.
        </p>
        <p className="text-muted-foreground">
          Use the generator above to instantly create memorable phrases that keep your audience thinking long after the video ends.
        </p>
      </div>
    </ToolPageLayout>
  );
}


