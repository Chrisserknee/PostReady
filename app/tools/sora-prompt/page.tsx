import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { SoraPromptTool } from '@/components/tools/SoraPromptTool';

export const metadata = {
  title: 'Sora Prompt Generator | PostReady',
  description: 'Generate detailed prompts for Sora AI video generation with style, camera movement, and mood settings.',
};

export default function SoraPromptPage() {
  return (
    <ToolPageLayout
      title="Sora Prompt Generator"
      description="Generate detailed prompts for Sora AI video generation with style, camera movement, and mood settings."
      icon="🎬"
    >
      <SoraPromptTool />
    </ToolPageLayout>
  );
}
