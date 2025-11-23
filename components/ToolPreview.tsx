"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface ToolPreviewProps {
  toolId: string;
  title: string;
  description: string;
  features: string[];
  icon: string;
  color?: string;
}

const toolData: Record<string, Omit<ToolPreviewProps, 'toolId'>> = {
  'red-flag-detector': {
    title: 'Red Flag Detector',
    description: 'Detect hidden meanings and identify red flags in text messages, social media posts, and conversations.',
    features: [
      'Decode hidden meanings',
      'Identify warning signs',
      'Beautiful animated analysis',
      'Context-aware detection'
    ],
    icon: '🚩',
    color: '#ef4444'
  },
  'digital-products': {
    title: 'Premium Collection',
    description: 'Browse and access premium digital products and resources.',
    features: [
      'Curated digital products',
      'Premium resources',
      'Exclusive content',
      'Regular updates'
    ],
    icon: '💎',
    color: '#DAA520'
  },
  'comment-bait': {
    title: 'Comment Bait Generator',
    description: 'Generate engaging comments designed to spark conversations and increase engagement on your posts.',
    features: [
      'Engagement-focused comments',
      'Multiple styles',
      'Platform-specific',
      'Viral potential'
    ],
    icon: '🎣',
    color: '#2979FF'
  },
  'brainworm-generator': {
    title: 'Brainworm Phrase Generator',
    description: 'Create catchy, memorable phrases that stick in people\'s minds.',
    features: [
      'Memorable phrases',
      'Catchy hooks',
      'Viral potential',
      'Multiple variations'
    ],
    icon: '🧠',
    color: '#8B5CF6'
  },
  'sugar-daddy-messages': {
    title: 'Sugar Daddy Message Generator',
    description: 'Generate professional and engaging messages for business communications.',
    features: [
      'Professional tone',
      'Multiple templates',
      'Context-aware',
      'Customizable'
    ],
    icon: '💼',
    color: '#10B981'
  },
  'music-generator': {
    title: 'Music Generator',
    description: 'Generate music ideas, beats, and sound concepts for your content.',
    features: [
      'Music ideas',
      'Beat concepts',
      'Genre-specific',
      'Creative inspiration'
    ],
    icon: '🎵',
    color: '#F59E0B'
  },
  'voiceover-generator': {
    title: 'Script & Voiceover Generator',
    description: 'Create scripts and generate voiceovers using AI-powered voices.',
    features: [
      'AI-generated scripts',
      'Multiple voice options',
      'ElevenLabs integration',
      'Professional quality'
    ],
    icon: '🎙️',
    color: '#EC4899'
  },
  'collab-engine': {
    title: 'Collab Engine',
    description: 'Find perfect collaboration partners based on your niche, audience, and goals.',
    features: [
      'Smart matching',
      'Niche filtering',
      'Audience analysis',
      'Real user verification'
    ],
    icon: '🤝',
    color: '#FF4F78'
  },
  'trend-radar': {
    title: 'Trend Radar',
    description: 'Discover trending topics and analyze what\'s hot in your industry.',
    features: [
      'Real-time trends',
      'In-depth analysis',
      'Platform metrics',
      'Actionable insights'
    ],
    icon: '📡',
    color: '#06B6D4'
  },
  'idea-generator': {
    title: 'Viral Video Idea Generator',
    description: 'Generate viral video ideas that are proven to engage and convert.',
    features: [
      'Viral concepts',
      'Multiple angles',
      'Engagement scores',
      'Trending topics'
    ],
    icon: '💡',
    color: '#F97316'
  },
  'sora-prompt': {
    title: 'Sora Prompt Generator',
    description: 'Create detailed prompts for AI video generation using Sora.',
    features: [
      'Detailed prompts',
      'Scene descriptions',
      'Style options',
      'Optimized for AI'
    ],
    icon: '🎬',
    color: '#6366F1'
  },
  'hashtag-research': {
    title: 'Hashtag Research',
    description: 'Research and find the best hashtags for your content to maximize reach.',
    features: [
      'Trending hashtags',
      'Engagement metrics',
      'Competitor analysis',
      'Optimal combinations'
    ],
    icon: '#️⃣',
    color: '#14B8A6'
  },
  'page-analyzer': {
    title: 'Page Analyzer',
    description: 'Analyze social media profiles and pages to understand performance and strategy.',
    features: [
      'Profile insights',
      'Performance metrics',
      'Content analysis',
      'Strategy recommendations'
    ],
    icon: '📊',
    color: '#8B5CF6'
  },
  'cringe-couple-caption': {
    title: 'Cringe Couple Caption Generator',
    description: 'Generate hilariously cringeworthy couple captions perfect for memes and parodies.',
    features: [
      'Cringe-worthy content',
      'Multiple styles',
      'Meme-ready',
      'Entertainment value'
    ],
    icon: '💑',
    color: '#EC4899'
  },
  'comment-fight-starter': {
    title: 'Comment Fight Starter Generator',
    description: 'Generate controversial, debate-provoking comments designed to spark engagement.',
    features: [
      'Debate starters',
      'Controversial topics',
      'Engagement-focused',
      'Multiple tones'
    ],
    icon: '💥',
    color: '#EF4444'
  },
  'poor-life-choices-advisor': {
    title: 'Poor Life Choices Advisor',
    description: 'Get humorous, sarcastic advice about poor life choices. Perfect for entertainment.',
    features: [
      'Humorous advice',
      'Sarcastic tone',
      'Entertainment',
      'Relatable content'
    ],
    icon: '🤦',
    color: '#F59E0B'
  },
  'random-excuse': {
    title: 'Random Excuse Generator',
    description: 'Generate creative, believable (or hilariously unbelievable) excuses for any situation.',
    features: [
      'Creative excuses',
      'Believability levels',
      'Situation-specific',
      'Entertainment value'
    ],
    icon: '🎭',
    color: '#8B5CF6'
  }
};

export function ToolPreview({ toolId, x, y, onMouseLeave }: { toolId: string; x: number; y: number; onMouseLeave?: () => void }) {
  const tool = toolData[toolId];
  
  if (!tool) return null;

  // Calculate position with bounds checking
  const getPosition = () => {
    if (typeof window === 'undefined') return { left: x, top: y };
    return {
      left: Math.min(x, window.innerWidth - 340),
      top: Math.min(y, Math.max(20, window.innerHeight - 400))
    };
  };

  const position = getPosition();

  return (
    <Card 
      className="fixed z-[100] w-80 shadow-2xl border-2 animate-in fade-in-0 zoom-in-95 duration-200 pointer-events-auto"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        backgroundColor: 'var(--card-bg)',
        borderColor: tool.color || '#2979FF',
        boxShadow: `0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px ${tool.color}20`,
      }}
      onMouseLeave={onMouseLeave}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">{tool.icon}</span>
          <div className="flex-1">
            <h3 
              className="text-lg font-bold mb-1"
              style={{ color: tool.color }}
            >
              {tool.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tool.description}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Features
          </p>
          <ul className="space-y-1.5">
            {tool.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <span 
                  className="text-xs"
                  style={{ color: tool.color }}
                >
                  ✓
                </span>
                <span className="text-foreground/80">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div 
          className="mt-4 pt-4 border-t text-xs text-center text-muted-foreground"
          style={{ borderColor: `${tool.color}20` }}
        >
          Click to explore →
        </div>
      </CardContent>
    </Card>
  );
}


import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface ToolPreviewProps {
  toolId: string;
  title: string;
  description: string;
  features: string[];
  icon: string;
  color?: string;
}

const toolData: Record<string, Omit<ToolPreviewProps, 'toolId'>> = {
  'red-flag-detector': {
    title: 'Red Flag Detector',
    description: 'Detect hidden meanings and identify red flags in text messages, social media posts, and conversations.',
    features: [
      'Decode hidden meanings',
      'Identify warning signs',
      'Beautiful animated analysis',
      'Context-aware detection'
    ],
    icon: '🚩',
    color: '#ef4444'
  },
  'digital-products': {
    title: 'Premium Collection',
    description: 'Browse and access premium digital products and resources.',
    features: [
      'Curated digital products',
      'Premium resources',
      'Exclusive content',
      'Regular updates'
    ],
    icon: '💎',
    color: '#DAA520'
  },
  'comment-bait': {
    title: 'Comment Bait Generator',
    description: 'Generate engaging comments designed to spark conversations and increase engagement on your posts.',
    features: [
      'Engagement-focused comments',
      'Multiple styles',
      'Platform-specific',
      'Viral potential'
    ],
    icon: '🎣',
    color: '#2979FF'
  },
  'brainworm-generator': {
    title: 'Brainworm Phrase Generator',
    description: 'Create catchy, memorable phrases that stick in people\'s minds.',
    features: [
      'Memorable phrases',
      'Catchy hooks',
      'Viral potential',
      'Multiple variations'
    ],
    icon: '🧠',
    color: '#8B5CF6'
  },
  'sugar-daddy-messages': {
    title: 'Sugar Daddy Message Generator',
    description: 'Generate professional and engaging messages for business communications.',
    features: [
      'Professional tone',
      'Multiple templates',
      'Context-aware',
      'Customizable'
    ],
    icon: '💼',
    color: '#10B981'
  },
  'music-generator': {
    title: 'Music Generator',
    description: 'Generate music ideas, beats, and sound concepts for your content.',
    features: [
      'Music ideas',
      'Beat concepts',
      'Genre-specific',
      'Creative inspiration'
    ],
    icon: '🎵',
    color: '#F59E0B'
  },
  'voiceover-generator': {
    title: 'Script & Voiceover Generator',
    description: 'Create scripts and generate voiceovers using AI-powered voices.',
    features: [
      'AI-generated scripts',
      'Multiple voice options',
      'ElevenLabs integration',
      'Professional quality'
    ],
    icon: '🎙️',
    color: '#EC4899'
  },
  'collab-engine': {
    title: 'Collab Engine',
    description: 'Find perfect collaboration partners based on your niche, audience, and goals.',
    features: [
      'Smart matching',
      'Niche filtering',
      'Audience analysis',
      'Real user verification'
    ],
    icon: '🤝',
    color: '#FF4F78'
  },
  'trend-radar': {
    title: 'Trend Radar',
    description: 'Discover trending topics and analyze what\'s hot in your industry.',
    features: [
      'Real-time trends',
      'In-depth analysis',
      'Platform metrics',
      'Actionable insights'
    ],
    icon: '📡',
    color: '#06B6D4'
  },
  'idea-generator': {
    title: 'Viral Video Idea Generator',
    description: 'Generate viral video ideas that are proven to engage and convert.',
    features: [
      'Viral concepts',
      'Multiple angles',
      'Engagement scores',
      'Trending topics'
    ],
    icon: '💡',
    color: '#F97316'
  },
  'sora-prompt': {
    title: 'Sora Prompt Generator',
    description: 'Create detailed prompts for AI video generation using Sora.',
    features: [
      'Detailed prompts',
      'Scene descriptions',
      'Style options',
      'Optimized for AI'
    ],
    icon: '🎬',
    color: '#6366F1'
  },
  'hashtag-research': {
    title: 'Hashtag Research',
    description: 'Research and find the best hashtags for your content to maximize reach.',
    features: [
      'Trending hashtags',
      'Engagement metrics',
      'Competitor analysis',
      'Optimal combinations'
    ],
    icon: '#️⃣',
    color: '#14B8A6'
  },
  'page-analyzer': {
    title: 'Page Analyzer',
    description: 'Analyze social media profiles and pages to understand performance and strategy.',
    features: [
      'Profile insights',
      'Performance metrics',
      'Content analysis',
      'Strategy recommendations'
    ],
    icon: '📊',
    color: '#8B5CF6'
  },
  'cringe-couple-caption': {
    title: 'Cringe Couple Caption Generator',
    description: 'Generate hilariously cringeworthy couple captions perfect for memes and parodies.',
    features: [
      'Cringe-worthy content',
      'Multiple styles',
      'Meme-ready',
      'Entertainment value'
    ],
    icon: '💑',
    color: '#EC4899'
  },
  'comment-fight-starter': {
    title: 'Comment Fight Starter Generator',
    description: 'Generate controversial, debate-provoking comments designed to spark engagement.',
    features: [
      'Debate starters',
      'Controversial topics',
      'Engagement-focused',
      'Multiple tones'
    ],
    icon: '💥',
    color: '#EF4444'
  },
  'poor-life-choices-advisor': {
    title: 'Poor Life Choices Advisor',
    description: 'Get humorous, sarcastic advice about poor life choices. Perfect for entertainment.',
    features: [
      'Humorous advice',
      'Sarcastic tone',
      'Entertainment',
      'Relatable content'
    ],
    icon: '🤦',
    color: '#F59E0B'
  },
  'random-excuse': {
    title: 'Random Excuse Generator',
    description: 'Generate creative, believable (or hilariously unbelievable) excuses for any situation.',
    features: [
      'Creative excuses',
      'Believability levels',
      'Situation-specific',
      'Entertainment value'
    ],
    icon: '🎭',
    color: '#8B5CF6'
  }
};

export function ToolPreview({ toolId, x, y, onMouseLeave }: { toolId: string; x: number; y: number; onMouseLeave?: () => void }) {
  const tool = toolData[toolId];
  
  if (!tool) return null;

  // Calculate position with bounds checking
  const getPosition = () => {
    if (typeof window === 'undefined') return { left: x, top: y };
    return {
      left: Math.min(x, window.innerWidth - 340),
      top: Math.min(y, Math.max(20, window.innerHeight - 400))
    };
  };

  const position = getPosition();

  return (
    <Card 
      className="fixed z-[100] w-80 shadow-2xl border-2 animate-in fade-in-0 zoom-in-95 duration-200 pointer-events-auto"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        backgroundColor: 'var(--card-bg)',
        borderColor: tool.color || '#2979FF',
        boxShadow: `0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px ${tool.color}20`,
      }}
      onMouseLeave={onMouseLeave}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">{tool.icon}</span>
          <div className="flex-1">
            <h3 
              className="text-lg font-bold mb-1"
              style={{ color: tool.color }}
            >
              {tool.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tool.description}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Features
          </p>
          <ul className="space-y-1.5">
            {tool.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <span 
                  className="text-xs"
                  style={{ color: tool.color }}
                >
                  ✓
                </span>
                <span className="text-foreground/80">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div 
          className="mt-4 pt-4 border-t text-xs text-center text-muted-foreground"
          style={{ borderColor: `${tool.color}20` }}
        >
          Click to explore →
        </div>
      </CardContent>
    </Card>
  );
}

