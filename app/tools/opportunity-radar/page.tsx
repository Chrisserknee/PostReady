import React from 'react';
import { Metadata } from 'next';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { OpportunityRadar } from '@/components/OpportunityRadar';

export const metadata: Metadata = {
  title: 'Niche Radar | PostReady',
  description: 'Discover profitable niches with low competition. Find where your skills meet untapped opportunities for maximum success.',
};

export default function OpportunityRadarPage() {
  return (
    <ToolPageLayout
      title="Niche Radar"
      description="Discover profitable niches with low competition. Find where your skills meet untapped opportunities for maximum success."
      icon="🎯"
    >
      <OpportunityRadar />
      
      <div className="mt-8 pt-8 border-t border-border px-4">
        <h2 className="text-2xl font-bold mb-4">Niche Radar – Find Low-Competition, High-Value Opportunities</h2>
        <p className="mb-4 text-muted-foreground">
          Most successful businesses and creators find their edge in niches with low competition but high value. Niche Radar helps you discover these untapped opportunities by analyzing competition levels and market value.
        </p>
        <p className="mb-8 text-muted-foreground">
          Simply input your interests, skills, budget, and time commitment. We'll analyze niches to find where competition is low but value is high - the perfect sweet spot for success.
        </p>

        <h3 className="text-xl font-semibold mb-3">How it works</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Enter your interests, skills, budget, and time commitment</li>
          <li>We analyze competition levels and market value for various niches</li>
          <li>See niches visualized on a graph showing competition vs value</li>
          <li>Get detailed insights on why each niche has low competition</li>
          <li>Understand entry barriers and earning potential</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">What you'll see</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li><strong>Live Graph:</strong> Visual map showing niches by competition level and value</li>
          <li><strong>Sweet Spot Zone:</strong> Low competition + High value = Best opportunities</li>
          <li><strong>Competition Score:</strong> Lower is better - less competition means easier to stand out</li>
          <li><strong>Value Score:</strong> Higher is better - more potential earnings and demand</li>
          <li><strong>Opportunity Score:</strong> Combined metric showing overall potential</li>
          <li><strong>Growth Trend:</strong> Whether the niche is rising, stable, or declining</li>
          <li><strong>Entry Barrier:</strong> How easy or hard it is to get started</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Why this tool is powerful</h3>
        <p className="mb-4 text-muted-foreground">
          Finding the right niche is often the difference between struggling and thriving. Niche Radar helps you:
        </p>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Identify underserved markets before they become crowded</li>
          <li>See visual representation of competition vs value</li>
          <li>Find niches that match your skills and interests</li>
          <li>Understand why certain niches have less competition</li>
          <li>Make data-driven decisions about where to focus your efforts</li>
          <li>Avoid highly competitive markets where it's hard to stand out</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">The Sweet Spot</h3>
        <p className="mb-4 text-muted-foreground">
          The best niches are in the "Sweet Spot" - low competition (left side of graph) and high value (top of graph). These niches offer:
        </p>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Easier to rank and get visibility</li>
          <li>Less saturated market</li>
          <li>Higher conversion rates</li>
          <li>Better profit margins</li>
          <li>Room to grow and establish yourself</li>
        </ul>

        <p className="text-muted-foreground">
          Use the tool above to discover your perfect niche. Find where low competition meets high value for maximum success potential.
        </p>
      </div>
    </ToolPageLayout>
  );
}

