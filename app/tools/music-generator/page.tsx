import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { MusicGeneratorTool } from '@/components/tools/MusicGeneratorTool';

export const metadata = {
  title: 'Music Generator | PostReady',
  description: 'Generate custom background music for your videos with AI-powered composition.',
};

export default function MusicGeneratorPage() {
  return (
    <ToolPageLayout
      title="Music Generator"
      description="Generate custom background music for your videos with AI-powered composition."
      icon="🎵"
    >
      <MusicGeneratorTool />
    </ToolPageLayout>
  );
}
