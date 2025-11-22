import React from 'react';
import { Metadata } from 'next';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { RedFlagTranslator } from '@/components/RedFlagTranslator';

export const metadata: Metadata = {
  title: 'Red Flag Detector | PostReady',
  description: 'Detect hidden meanings and identify red flags in text messages, social media posts, and conversations.',
};

export default function RedFlagTranslatorPage() {
  return (
    <ToolPageLayout
      title="Red Flag Detector"
      description="Detect hidden meanings and identify red flags in text messages, social media posts, and conversations."
      icon="🚩"
    >
      <RedFlagTranslator />
      
      <div className="mt-8 pt-8 border-t border-border px-4">
        <h2 className="text-2xl font-bold mb-4">Red Flag Detector – Identify Hidden Meanings and Warning Signs</h2>
        <p className="mb-4 text-muted-foreground">
          The Red Flag Detector helps you identify what people REALLY mean when they say things that seem innocent but are actually warning signs. Whether it's a text message from a dating app match, a comment from an ex, or a message from a coworker, this tool detects hidden meanings, passive-aggressive language, and subtle red flags with beautiful, animated visual feedback.
        </p>
        <p className="mb-8 text-muted-foreground">
          Understanding the true meaning behind words can help you make better decisions, avoid toxic situations, and protect your emotional well-being. This tool analyzes text and identifies problematic patterns, manipulative language, and warning signs you might miss, presenting the analysis in a clear, visually appealing format.
        </p>

        <h3 className="text-xl font-semibold mb-3">What are red flags in communication?</h3>
        <p className="mb-8 text-muted-foreground">
          Red flags are warning signs that indicate potential problems, manipulation, or toxic behavior. They can include passive-aggressive language, guilt-tripping, gaslighting, boundary violations, and other problematic communication patterns.
        </p>

        <h3 className="text-xl font-semibold mb-3">How this detector helps</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Detects hidden meanings in text messages and posts</li>
          <li>Identifies red flags and warning signs with visual animations</li>
          <li>Provides beautiful, clear analysis of why language is problematic</li>
          <li>Offers context-aware detection</li>
          <li>Helps you make informed decisions about relationships</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Popular uses include:</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Dating app message analysis</li>
          <li>Relationship red flag detection</li>
          <li>Workplace communication analysis</li>
          <li>Social media post decoding</li>
          <li>Text message interpretation</li>
          <li>Identifying manipulative language</li>
        </ul>
        <p className="mb-8 text-muted-foreground">
          By using this tool, you can gain clarity on confusing messages and make better decisions about who to trust and how to respond. The animated visual feedback makes it easy to understand when red flags are detected.
        </p>
        <p className="text-muted-foreground">
          Use the detector above to identify hidden meanings and red flags in any text with beautiful, animated analysis.
        </p>
      </div>
    </ToolPageLayout>
  );
}

