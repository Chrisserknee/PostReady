import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { VoiceoverGeneratorTool } from '@/components/tools/VoiceoverGeneratorTool';

export const metadata = {
  title: 'Script & Voiceover Generator | PostReady',
  description: 'Create professional scripts and generate AI voiceovers for your content.',
};

export default function VoiceoverGeneratorPage() {
  return (
    <ToolPageLayout
      title="Script & Voiceover Generator"
      description="Create professional scripts and generate AI voiceovers for your content."
      icon="🎙️"
    >
      <VoiceoverGeneratorTool />
    </ToolPageLayout>
  );
}
