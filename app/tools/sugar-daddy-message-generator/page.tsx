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
    </ToolPageLayout>
  );
}

