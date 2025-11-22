import React from 'react';
import { Metadata } from 'next';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { RandomExcuseGenerator } from '@/components/RandomExcuseGenerator';

export const metadata: Metadata = {
  title: 'Random Excuse Generator | PostReady',
  description: 'Generate creative, believable (or hilariously unbelievable) excuses for any situation.',
};

export default function RandomExcuseGeneratorPage() {
  return (
    <ToolPageLayout
      title="Random Excuse Generator"
      description="Generate creative, believable (or hilariously unbelievable) excuses for any situation."
      icon="🎭"
    >
      <RandomExcuseGenerator />
      
      <div className="mt-8 pt-8 border-t border-border px-4">
        <h2 className="text-2xl font-bold mb-4">Random Excuse Generator – Creative Excuses for Any Situation</h2>
        <p className="mb-4 text-muted-foreground">
          The Random Excuse Generator creates creative, believable (or hilariously unbelievable) excuses for any situation. Whether you need a realistic excuse for being late or want hilariously over-the-top excuses for entertainment, this tool generates excuses that match your needs.
        </p>
        <p className="mb-8 text-muted-foreground">
          Perfect for entertainment content, comedy, or when you need creative excuses for various situations. You can choose between believable excuses or hilariously unbelievable ones for maximum entertainment value.
        </p>

        <h3 className="text-xl font-semibold mb-3">What makes a good excuse?</h3>
        <p className="mb-8 text-muted-foreground">
          A good excuse is creative, appropriate for the situation, and matches the desired believability level. Whether you need something realistic or hilariously over-the-top, this generator creates excuses that fit your needs.
        </p>

        <h3 className="text-xl font-semibold mb-3">How this generator helps</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Creates creative excuses for any situation</li>
          <li>Customizable believability level</li>
          <li>Perfect for entertainment and comedy</li>
          <li>Generates multiple options</li>
          <li>Great for content creation</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Popular uses include:</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Comedy content creation</li>
          <li>Entertainment videos</li>
          <li>Funny social media posts</li>
          <li>Creative writing</li>
          <li>Humor and entertainment</li>
          <li>Content ideas</li>
        </ul>
        <p className="mb-8 text-muted-foreground">
          By using this tool, you can quickly generate creative excuses that are perfect for entertainment, comedy, or creative content.
        </p>
        <p className="text-muted-foreground">
          Use the generator above to create creative excuses for any situation.
        </p>
      </div>
    </ToolPageLayout>
  );
}

