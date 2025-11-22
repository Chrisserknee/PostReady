import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { PlaceholderTool } from '@/components/tools/PlaceholderTool';

export const metadata = {
  title: 'Page Analyzer | PostReady',
  description: 'Analyze your social media page for performance and growth opportunities.',
};

export default function PageAnalyzerPage() {
  return (
    <ToolPageLayout
      title="Page Analyzer"
      description="Analyze your social media page for performance and growth opportunities."
      icon="📊"
    >
      <PlaceholderTool 
        name="Page Analyzer" 
        description="Our AI-powered page analyzer is getting a major upgrade. We're adding deeper insights, competitor analysis, and actionable growth steps."
      />
    </ToolPageLayout>
  );
}





