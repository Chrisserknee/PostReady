import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { TrendRadarTool } from '@/components/tools/TrendRadarTool';

export const metadata = {
  title: 'Trend Radar | PostReady',
  description: 'Discover trending topics and hashtags across social media platforms.',
};

export default function TrendRadarPage() {
  return (
    <ToolPageLayout
      title="Trend Radar"
      description="Discover trending topics and hashtags across social media platforms."
      icon="📡"
    >
      <TrendRadarTool />
    </ToolPageLayout>
  );
}
