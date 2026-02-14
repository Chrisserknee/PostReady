import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { image, analysisType } = await request.json();

    // Input validation
    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Validate image is base64
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format. Please provide a base64 encoded image.' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('🔍 Analyzing social media page screenshot...');

    // Determine the analysis focus based on type
    const analysisPrompts: Record<string, string> = {
      content: 'Focus on the content quality, messaging, captions, and storytelling.',
      engagement: 'Focus on engagement metrics, audience interaction, and call-to-action effectiveness.',
      visual: 'Focus on visual design, aesthetics, color scheme, layout, and branding consistency.',
      overall: 'Provide a comprehensive analysis covering content, engagement, and visual aspects.'
    };

    const focusArea = analysisPrompts[analysisType || 'overall'] || analysisPrompts.overall;

    const systemPrompt = `You are an expert social media strategist and analyst with years of experience helping businesses optimize their social media presence. Your role is to analyze social media page screenshots and provide actionable, professional insights.

When analyzing a social media page, provide:
1. **Overview**: A brief 2-3 sentence summary of what you see
2. **Strengths**: 3-4 specific things done well
3. **Opportunities for Improvement**: 3-4 specific, actionable recommendations
4. **Content Analysis**: Evaluate the quality of captions, messaging, and storytelling
5. **Visual Assessment**: Analyze design, aesthetics, and brand consistency
6. **Engagement Strategy**: Comment on calls-to-action and audience interaction potential
7. **Priority Actions**: Top 3 immediate actions they should take

Be specific, constructive, and professional. Provide actionable advice that can be implemented immediately.`;

    const userPrompt = `Please analyze this social media page screenshot. ${focusArea}

Provide a detailed analysis with:
- Overview (2-3 sentences)
- Strengths (3-4 bullet points)
- Opportunities for Improvement (3-4 specific, actionable recommendations)
- Content Analysis
- Visual Assessment
- Engagement Strategy
- Priority Actions (Top 3 immediate steps)

Format your response in clear sections with headers and bullet points for easy reading.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Using gpt-4o which supports vision
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: image,
                detail: 'high', // Use high detail for better analysis
              },
            },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const analysis = completion.choices[0]?.message?.content?.trim();

    if (!analysis) {
      throw new Error('No analysis generated');
    }

    console.log('✅ Social media page analysis completed');

    return NextResponse.json({ 
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Social media page analysis error:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
    });

    return NextResponse.json(
      { 
        error: 'Failed to analyze social media page',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
