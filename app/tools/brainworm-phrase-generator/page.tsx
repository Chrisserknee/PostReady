import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { BrainwormGenerator } from '@/components/BrainwormGenerator';

export const metadata = {
  title: 'Brainworm Phrase Generator | PostReady',
  description: 'Create irresistibly engaging phrases that make viewers pause and want to watch more.',
};

export default function BrainwormPage() {
  return (
    <ToolPageLayout
      title="Brainworm Phrase Generator"
      description="Create irresistibly engaging phrases that make viewers pause and want to watch more."
      icon="🧠"
    >
      <BrainwormGenerator />
    </ToolPageLayout>
  );
}


