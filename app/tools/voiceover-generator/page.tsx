import React from 'react';
import { Metadata } from 'next';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { VoiceoverGeneratorTool } from '@/components/tools/VoiceoverGeneratorTool';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Script & Voiceover Generator | PostReady',
  description: 'Write, edit, and generate professional AI voiceovers for your content in one seamless workflow.',
};

export default function VoiceoverGeneratorPage() {
  return (
    <ToolPageLayout
      title="Script & Voiceover Generator"
      description="Write, edit, and generate professional AI voiceovers for your content in one seamless workflow."
      icon="🎙️"
    >
      <VoiceoverGeneratorTool />
      
      <div className="mt-8 pt-8 border-t border-border px-4">
        <h2 className="text-2xl font-bold mb-4">Script & Voiceover Generator – Write, Edit, Then Generate a Professional Voiceover</h2>
        <p className="mb-4 text-muted-foreground">
          The Script & Voiceover Generator helps you create a complete script, refine it with full editing control, and then transform it into a high-quality AI voiceover using your chosen voice — all within one seamless workflow.
        </p>
        <p className="mb-4 text-muted-foreground">
          Start by entering your topic and the tool intelligently writes a polished script tailored to your content. You can then freely edit, adjust tone, refine wording, or reshape the message until it feels perfect. Once ready, generate a professional AI voiceover that brings your script to life with clarity, personality, and precision.
        </p>
        <p className="mb-8 text-muted-foreground">
          This streamlined process removes the need for multiple tools, manual recording, or complex audio setups — making high-quality narration fast, accessible, and efficient.
        </p>

        <h3 className="text-xl font-semibold mb-3">How this tool works</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Generates a professionally structured script</li>
          <li>Allows full editing and customization</li>
          <li>Converts your final script into a realistic AI voiceover</li>
          <li>Delivers polished narration ready for publishing</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">How it enhances your content</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Edit and refine scripts before voice generation</li>
          <li>Produces natural, high-quality AI narration</li>
          <li>Maintains script-to-voice consistency</li>
          <li>Speeds up video production workflows</li>
          <li>Improves clarity, tone, and storytelling impact</li>
          <li>Ideal for scalable content creation</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Popular uses include:</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Script and voiceover generator</li>
          <li>AI narration workflow tool</li>
          <li>Editable script to speech generator</li>
          <li>TikTok & YouTube voiceover creator</li>
          <li>Explainer video narration</li>
          <li>Professional AI voice production</li>
          <li>Content automation for creators</li>
        </ul>
        <p className="mb-8 text-muted-foreground">
          By combining script writing, editing control, and voiceover generation into one fluid process, this tool allows you to move from concept to finished narration with precision and speed.
        </p>
        <p className="text-muted-foreground">
          Use the generator above to write, refine, and produce professional voiceovers — all in one continuous creative flow.
        </p>
      </div>
    </ToolPageLayout>
  );
}
