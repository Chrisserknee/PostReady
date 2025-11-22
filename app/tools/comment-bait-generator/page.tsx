import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { CommentBaitGenerator } from '@/components/CommentBaitGenerator';

export const metadata = {
  title: 'Comment Bait Generator | PostReady',
  description: 'Generate high-engagement "first comments" to pin under your videos and spark real conversation.',
};

export default function CommentBaitPage() {
  return (
    <ToolPageLayout
      title="Comment Bait Generator"
      description="Generate high-engagement 'first comments' to pin under your videos and spark real conversation."
      icon="🎣"
    >
      <CommentBaitGenerator />
    </ToolPageLayout>
  );
}


