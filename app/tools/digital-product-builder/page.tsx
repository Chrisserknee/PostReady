import React from 'react';
import { Metadata } from 'next';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { DigitalProductBuilderTool } from '@/components/tools/DigitalProductBuilderTool';

export const metadata: Metadata = {
  title: 'Digital Product Builder | PostReady',
  description: 'Build your digital product from idea to launch. A complete 7-step guided pathway to create, price, and launch your digital product.',
};

export default function DigitalProductBuilderPage() {
  return (
    <ToolPageLayout
      title="Digital Product Builder"
      description="Build your digital product from idea to launch. A complete 7-step guided pathway to create, price, and launch your digital product."
      icon="📦"
    >
      <DigitalProductBuilderTool />
      
      <div className="mt-8 pt-8 border-t border-border px-4">
        <h2 className="text-2xl font-bold mb-4">Digital Product Builder – From Idea to Launch</h2>
        <p className="mb-4 text-muted-foreground">
          Creating a digital product can feel overwhelming. Where do you start? What should you create? How do you price it? The Digital Product Builder guides you through every step of the process.
        </p>
        <p className="mb-8 text-muted-foreground">
          This tool works as a guided pathway, not just a generator. Each step builds on the previous one, creating a complete product ready to launch.
        </p>

        <h3 className="text-xl font-semibold mb-3">The 7-Step Process</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li><strong>Step 1: Product Discovery</strong> – Answer quick prompts to discover 3-5 tailored product ideas that fit your niche, audience, and strengths</li>
          <li><strong>Step 2: Product Blueprint</strong> – Generate a complete structure with modules, promises, and key outcomes</li>
          <li><strong>Step 3: Content Builder</strong> – Build the actual content with outlines, templates, or course materials</li>
          <li><strong>Step 4: Pricing & Positioning</strong> – Get strategic pricing tiers and value positioning</li>
          <li><strong>Step 5: Sales Copy</strong> – Professional sales page copy with headlines, benefits, FAQs, and objection handling</li>
          <li><strong>Step 6: Launch Plan</strong> – A 7-14 day launch strategy with daily content ideas, hooks, and CTAs</li>
          <li><strong>Step 7: Platform Suggestions</strong> – Recommendations for where to host and deliver your product</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">What Makes This Tool Powerful</h3>
        <p className="mb-4 text-muted-foreground">
          Unlike generic generators, the Digital Product Builder:
        </p>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Creates a complete product from start to finish</li>
          <li>Provides actionable, ready-to-use content</li>
          <li>Includes strategic pricing and positioning guidance</li>
          <li>Generates professional sales copy</li>
          <li>Creates a detailed launch plan with daily actions</li>
          <li>Recommends the best platforms for your product type</li>
          <li>Tracks your progress through each step</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Perfect For</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Creators who want to monetize their expertise</li>
          <li>Entrepreneurs launching their first digital product</li>
          <li>Coaches and consultants creating resources</li>
          <li>Anyone with knowledge to share but unsure where to start</li>
        </ul>

        <p className="text-muted-foreground">
          Start building your digital product today. Each step is designed to be achievable and rewarding, guiding you from idea to launch.
        </p>
      </div>
    </ToolPageLayout>
  );
}

