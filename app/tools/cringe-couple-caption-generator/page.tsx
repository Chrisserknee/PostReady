import React from 'react';
import { Metadata } from 'next';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { CringeCoupleCaptionGenerator } from '@/components/CringeCoupleCaptionGenerator';

export const metadata: Metadata = {
  title: 'Cringe Couple Caption Generator | PostReady',
  description: 'Generate hilariously cringeworthy couple captions perfect for memes, parodies, or intentionally cringe content.',
};

export default function CringeCoupleCaptionPage() {
  return (
    <ToolPageLayout
      title="Cringe Couple Caption Generator"
      description="Generate hilariously cringeworthy couple captions perfect for memes, parodies, or intentionally cringe content."
      icon="💑"
    >
      <CringeCoupleCaptionGenerator />
      
      <div className="mt-8 pt-8 border-t border-border px-4">
        <h2 className="text-2xl font-bold mb-4">Cringe Couple Caption Generator – Create Hilariously Cringeworthy Content</h2>
        <p className="mb-4 text-muted-foreground">
          The Cringe Couple Caption Generator creates hilariously cringeworthy couple captions perfect for memes, parodies, satire, or intentionally cringe content. Whether you're making fun of overly romantic Instagram posts, creating parody content, or just need some laughs, this tool generates captions that are perfectly cheesy and cringe-worthy.
        </p>
        <p className="mb-8 text-muted-foreground">
          These captions capture the essence of those overly romantic, emoji-filled couple posts you see on social media - perfect for comedy, memes, or creating intentionally cringe content that gets engagement.
        </p>

        <h3 className="text-xl font-semibold mb-3">What makes a caption cringe?</h3>
        <p className="mb-8 text-muted-foreground">
          Cringe captions are overly romantic, cheesy, and use excessive emojis and romantic language. They're the type of captions that make people roll their eyes but also can't help but engage with - perfect for parody content, memes, or comedy.
        </p>

        <h3 className="text-xl font-semibold mb-3">How this generator helps</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Creates hilariously cringeworthy couple captions</li>
          <li>Perfect for memes and parody content</li>
          <li>Generates multiple caption options</li>
          <li>Customizable style and tone</li>
          <li>Great for comedy and entertainment content</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Popular uses include:</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Couple caption memes</li>
          <li>Parody social media content</li>
          <li>Comedy TikTok videos</li>
          <li>Satirical Instagram posts</li>
          <li>Cringe content creation</li>
          <li>Entertainment and humor</li>
        </ul>
        <p className="mb-8 text-muted-foreground">
          By using this tool, you can quickly generate cringe-worthy captions that are perfect for comedy content, memes, or just having fun with social media culture.
        </p>
        <p className="text-muted-foreground">
          Use the generator above to create hilariously cringeworthy couple captions that get laughs and engagement.
        </p>
      </div>
    </ToolPageLayout>
  );
}

