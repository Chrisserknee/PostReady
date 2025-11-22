import React from 'react';
import { Metadata } from 'next';
import { ToolPageLayout } from '@/components/layouts/ToolPageLayout';
import { SoraPromptTool } from '@/components/tools/SoraPromptTool';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Sora Prompt Generator | PostReady',
  description: 'Create advanced AI video prompts for cinematic results with detailed visual direction and style control.',
};

export default function SoraPromptPage() {
  return (
    <ToolPageLayout
      title="Sora Prompt Generator"
      description="Create advanced AI video prompts for cinematic results with detailed visual direction and style control."
      icon="🎬"
    >
      <SoraPromptTool />
      
      <div className="mt-8 pt-8 border-t border-border px-4">
        <h2 className="text-2xl font-bold mb-4">Sora Prompt Generator – Create Advanced AI Video Prompts for Cinematic Results</h2>
        <p className="mb-4 text-muted-foreground">
          The Sora Prompt Generator helps you create highly detailed prompts for Sora AI video generation, allowing you to control visual style, camera movement, mood, and atmosphere with precision. Instead of guessing how to describe a scene, this tool transforms your idea into structured, production-ready prompts designed for stunning AI-generated video output.
        </p>
        <p className="mb-8 text-muted-foreground">
          Whether you're creating cinematic sequences, futuristic concepts, storytelling visuals, or experimental video art, this generator gives you the language framework needed to unlock Sora's full creative potential.
        </p>

        <h3 className="text-xl font-semibold mb-3">What this tool does</h3>
        <p className="mb-8 text-muted-foreground">
          The Sora Prompt Generator structures your video idea into optimized AI prompts that include visual direction, shot style, camera motion, and emotional tone — ensuring higher-quality, more predictable results from Sora's video model.
        </p>

        <h3 className="text-xl font-semibold mb-3">How it enhances your video creation</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Generates detailed prompts for Sora AI video</li>
          <li>Adds cinematic structure and visual clarity</li>
          <li>Improves realism and scene coherence</li>
          <li>Controls style, movement, and mood</li>
          <li>Reduces failed or low-quality outputs</li>
          <li>Ideal for creators, filmmakers, and AI artists</li>
        </ul>

        <h3 className="text-xl font-semibold mb-3">Popular uses include:</h3>
        <ul className="list-disc pl-6 mb-8 space-y-2 text-muted-foreground">
          <li>Sora prompt generator</li>
          <li>AI video prompt creator</li>
          <li>Cinematic AI video prompts</li>
          <li>Sora video description tool</li>
          <li>AI filmmaking workflow</li>
          <li>High-quality AI scene prompts</li>
          <li>Video generation prompt builder</li>
        </ul>
        <p className="mb-8 text-muted-foreground">
          By using this tool, you turn simple ideas into professionally structured prompts that dramatically improve the quality, consistency, and creative control of your AI-generated videos.
        </p>
        <p className="text-muted-foreground">
          Use the Sora Prompt Generator above to design rich, cinematic prompts that bring your vision to life with clarity and precision.
        </p>
      </div>
    </ToolPageLayout>
  );
}
