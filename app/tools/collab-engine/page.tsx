import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { CollabEngineTool } from '@/components/tools/CollabEngineTool';

export const metadata = {
  title: 'TikTok Collab Engine | PostReady',
  description: 'Find real TikTok creators in your niche with similar follower counts to collaborate with.',
};

export default function CollabEnginePage() {
  return (
    <ToolPageLayout
      title="TikTok Collab Engine"
      description="Find real TikTok creators in your niche with similar follower counts to collaborate with."
      icon="🤝"
    >
      <CollabEngineTool />
    </ToolPageLayout>
  );
}
