import React from 'react';
import { Metadata } from 'next';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { SugarDaddyMessageGeneratorTool } from '@/components/tools/SugarDaddyMessageGeneratorTool';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Sugar Daddy Message Generator | PostReady',
  description: 'Generate persuasive messages for requesting financial support tailored to your situation and relationship dynamic.',
};

/**
 * To add a new tool page:
 * 1. Duplicate this file to app/tools/<your-tool-slug>/page.tsx
 * 2. Update the metadata (title, description)
 * 3. Update the ToolPageLayout props (title, description, icon)
 * 4. Import and use your tool component instead of SugarDaddyMessageGeneratorTool
 * 5. Add the tool to app/tools/page.tsx tools array
 */
export default function SugarDaddyMessageGeneratorPage() {
  return (
    <ToolPageLayout
      title="Sugar Daddy Message Generator"
      description="Generate persuasive messages for requesting financial support tailored to your situation and relationship dynamic."
      icon="💸"
    >
      <SugarDaddyMessageGeneratorTool />
      
      <div className="mt-8 pt-8 border-t border-border px-4">
        <h2 className="text-2xl font-bold mb-4">Sugar Daddy Message Generator – Craft the Perfect Request With Confidence</h2>
        <p className="mb-4 text-muted-foreground">
          Navigating sugar dating conversations can feel intimidating, especially when asking for financial support. The right words matter. Tone, timing, and emotional intelligence all play a role in whether your request feels respectful, natural, and effective. That’s exactly why this Sugar Daddy Message Generator exists.
        </p>
        <p className="mb-8 text-muted-foreground">
          This tool helps you create thoughtful, persuasive messages tailored to your unique situation — whether you need assistance with rent, unexpected bills, travel expenses, or lifestyle support. By adjusting the tone and relationship type, you’ll receive messages that feel authentic while maintaining the trust and dynamic of your arrangement.
        </p>

        <h3 className="text-xl font-semibold mb-3">Why clear communication matters in sugar relationships</h3>
        <p className="mb-8 text-muted-foreground">
          A healthy sugar relationship thrives on honesty, mutual respect, and clarity. Poorly worded requests can create discomfort, while well-crafted communication builds confidence and stability. Using example messages and structured phrasing helps ensure your intentions are understood without sounding pushy or awkward.
        </p>

        <h3 className="text-xl font-semibold mb-3">How this generator helps</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Creates natural, emotionally intelligent requests</li>
          <li>Adapts to short-term or long-term relationships</li>
          <li>Offers multiple message styles to choose from</li>
          <li>Removes the stress of “what should I say?”</li>
        </ul>
        <p className="mb-8 text-muted-foreground">
          Whether you’re new to sugar dating or experienced, these curated messaging examples provide a reliable foundation for confident communication.
        </p>

        <h3 className="text-xl font-semibold mb-3">Popular uses include:</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Sugar daddy text examples</li>
          <li>How to ask a sugar daddy for money politely</li>
          <li>Sweet or bold financial request messages</li>
          <li>Sugar baby communication tips</li>
          <li>Custom messages for ongoing arrangements</li>
        </ul>
        <p className="text-muted-foreground">
          Use the generator above to explore different approaches and find the voice that best fits your relationship dynamic.
        </p>
      </div>
    </ToolPageLayout>
  );
}
