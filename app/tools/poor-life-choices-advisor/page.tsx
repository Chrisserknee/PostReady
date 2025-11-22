import React from 'react';
import { Metadata } from 'next';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { PoorLifeChoicesAdvisor } from '@/components/PoorLifeChoicesAdvisor';

export const metadata: Metadata = {
  title: 'Poor Life Choices Advisor | PostReady',
  description: 'Get humorous, sarcastic advice about poor life choices. Perfect for entertainment and laughs.',
};

export default function PoorLifeChoicesAdvisorPage() {
  return (
    <ToolPageLayout
      title="Poor Life Choices Advisor"
      description="Get humorous, sarcastic advice about poor life choices. Perfect for entertainment and laughs."
      icon="🤦"
    >
      <PoorLifeChoicesAdvisor />
      
      <div className="mt-8 pt-8 border-t border-border px-4">
        <h2 className="text-2xl font-bold mb-4">Poor Life Choices Advisor – Get Humorous Advice About Bad Decisions</h2>
        <p className="mb-4 text-muted-foreground">
          The Poor Life Choices Advisor gives you humorous, sarcastic advice about poor life choices. Whether you're thinking about texting your ex at 2am, making an impulse purchase, or any other questionable decision, this tool provides entertaining "advice" that acknowledges it's probably a bad idea while being funny and relatable.
        </p>
        <p className="mb-8 text-muted-foreground">
          This tool is perfect for entertainment, laughs, and having fun with the poor decisions we all sometimes make. It's designed to be humorous and relatable, not to actually encourage harmful behavior.
        </p>

        <h3 className="text-xl font-semibold mb-3">What makes a poor life choice?</h3>
        <p className="mb-8 text-muted-foreground">
          Poor life choices are decisions that we know are probably bad ideas but make anyway - like texting an ex, making impulse purchases, staying up too late, or any other questionable decision. This tool provides humorous takes on these situations.
        </p>

        <h3 className="text-xl font-semibold mb-3">How this advisor helps</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Provides humorous, sarcastic advice</li>
          <li>Entertaining and relatable</li>
          <li>Acknowledges poor decisions with humor</li>
          <li>Perfect for entertainment content</li>
          <li>Great for comedy and laughs</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Popular uses include:</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Entertainment content</li>
          <li>Comedy videos and posts</li>
          <li>Relatable humor</li>
          <li>Social media engagement</li>
          <li>Funny advice content</li>
          <li>Comedy and entertainment</li>
        </ul>
        <p className="mb-8 text-muted-foreground">
          By using this tool, you can get humorous takes on poor life choices that are perfect for entertainment and laughs.
        </p>
        <p className="text-muted-foreground">
          Use the advisor above to get entertaining advice about questionable decisions.
        </p>
      </div>
    </ToolPageLayout>
  );
}

