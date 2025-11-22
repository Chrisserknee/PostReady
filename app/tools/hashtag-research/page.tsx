import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { HashtagResearchTool } from '@/components/tools/HashtagResearchTool';

export const metadata = {
  title: 'Hashtag Deep Research | PostReady',
  description: 'Research and analyze hashtags to find the best ones for your content strategy.',
};

export default function HashtagResearchPage() {
  return (
    <ToolPageLayout
      title="Hashtag Deep Research"
      description="Research and analyze hashtags to find the best ones for your content strategy."
      icon="#️⃣"
    >
      <HashtagResearchTool />
    </ToolPageLayout>
  );
}
