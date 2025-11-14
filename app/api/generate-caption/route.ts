import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { businessInfo, ideaTitle, videoDescription, selectedIdea } = await request.json();

    if (!businessInfo) {
      return NextResponse.json(
        { error: 'Business information is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Initialize OpenAI client lazily (only when route is called)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('🎨 Generating AI caption...');

    // Use selectedIdea if provided, otherwise use ideaTitle/videoDescription
    const title = selectedIdea?.title || ideaTitle;
    const description = selectedIdea?.description || videoDescription;

    const prompt = `You are a social media caption writer who creates natural, engaging, and authentic captions for small businesses.

Business Details:
- Business Name: ${businessInfo.businessName}
- Type: ${businessInfo.businessType}
- Location: ${businessInfo.location}
- Platform: ${businessInfo.platform}
${title ? `- Post Idea: ${title}` : ''}
${description ? `- Video Description: ${description}` : ''}

Write a natural, conversational caption that:
1. Feels authentic and human (not overly promotional or corporate)
2. Is 2-4 sentences long
3. Includes a subtle call-to-action or question to encourage engagement
4. References the location naturally if relevant
5. Uses 1-2 emojis maximum (only where they feel natural)
6. Sounds like something a real person would write, not an AI
7. Is graceful and well-written but not overdone or flowery
8. Connects with the local community

DO NOT include hashtags - those will be added separately.
DO NOT use excessive emojis or exclamation marks.
DO NOT sound like marketing copy.

Write the caption now:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert social media caption writer who creates natural, authentic, and engaging captions for small businesses. Your captions feel human and conversational, never robotic or overly promotional.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const caption = completion.choices[0]?.message?.content?.trim();

    if (!caption) {
      throw new Error('No caption generated');
    }

    console.log('✅ AI caption generated successfully');

    return NextResponse.json({ caption });
  } catch (error: any) {
    console.error('❌ Caption generation error:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
    });

    return NextResponse.json(
      { 
        error: 'Failed to generate caption',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
