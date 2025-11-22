import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { ViralVideoIdeaTool } from '@/components/tools/ViralVideoIdeaTool';

export const metadata = {
  title: 'Viral Video Idea Generator | PostReady',
  description: 'Get AI-powered video ideas designed to go viral based on your niche and goals.',
};

export default function IdeaGeneratorPage() {
  return (
    <ToolPageLayout
      title="Viral Video Idea Generator"
      description="Get AI-powered video ideas designed to go viral based on your niche and goals."
      icon="💡"
    >
      <ViralVideoIdeaTool />
    </ToolPageLayout>
  );
}
