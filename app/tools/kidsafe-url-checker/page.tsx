import React from 'react';
import { Metadata } from 'next';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { KidSafeUrlChecker } from '@/components/KidSafeUrlChecker';

export const metadata: Metadata = {
  title: 'KidSafe URL Checker | PostReady',
  description: 'Check if a website is safe for children under 13. Get instant safety ratings with clear explanations.',
};

export default function KidSafeUrlCheckerPage() {
  return (
    <ToolPageLayout
      title="KidSafe URL Checker"
      description="Check if a website is safe for children under 13. Get instant safety ratings with clear explanations."
      icon="🛡️"
    >
      <KidSafeUrlChecker />
      
      <div className="mt-8 pt-8 border-t border-border px-4">
        <h2 className="text-2xl font-bold mb-4">KidSafe URL Checker – Verify Website Safety for Children</h2>
        <p className="mb-4 text-muted-foreground">
          The KidSafe URL Checker helps parents and guardians verify if a website is safe for children under 13. Get instant safety ratings with clear explanations about content appropriateness, privacy practices, advertising, and overall safety concerns.
        </p>
        <p className="mb-8 text-muted-foreground">
          Perfect for parents who want to verify website content safety before allowing their kids to visit. This tool analyzes websites and provides comprehensive safety assessments with specific concerns and recommendations.
        </p>

        <h3 className="text-xl font-semibold mb-3">What makes a website safe for children?</h3>
        <p className="mb-8 text-muted-foreground">
          A child-safe website should have age-appropriate content, clear privacy policies, minimal or no advertising, no data collection from children, and a safe online environment. The checker evaluates all these factors to provide a comprehensive safety rating.
        </p>

        <h3 className="text-xl font-semibold mb-3">How this checker helps</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Instant safety ratings (0-100 score)</li>
          <li>Clear safety status (Safe/Not Safe)</li>
          <li>Specific safety concerns identified</li>
          <li>Detailed explanations of safety issues</li>
          <li>Actionable recommendations for parents</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Popular uses include:</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Verifying educational websites</li>
          <li>Checking gaming sites before allowing access</li>
          <li>Reviewing social media platforms</li>
          <li>Validating content sharing sites</li>
          <li>Assessing online learning platforms</li>
          <li>Checking entertainment websites</li>
        </ul>
        <p className="mb-8 text-muted-foreground">
          By using this tool, you can make informed decisions about which websites are appropriate for your children. The detailed analysis helps you understand potential risks and take appropriate precautions.
        </p>
        <p className="text-muted-foreground">
          Use the checker above to verify any website's safety for children with instant, comprehensive analysis.
        </p>
      </div>
    </ToolPageLayout>
  );
}

