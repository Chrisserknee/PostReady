import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { businessInfo, caption, selectedIdea, existingHashtags } = await request.json();

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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('🏷️ Generating additional hashtags...');

    // Extract existing hashtags to avoid duplicates
    const existingTags = existingHashtags || [];
    const existingTagsLower = existingTags.map((tag: string) => tag.toLowerCase());

    // Get caption text without hashtags for context
    const captionText = caption ? caption.split('\n\n').filter(line => !line.trim().startsWith('#')).join('\n\n').trim() : '';
    
    const title = selectedIdea?.title || '';
    const description = selectedIdea?.description || '';

    const prompt = `You are a social media hashtag expert. Generate 8-12 additional relevant hashtags for this post.

Business Details:
- Business Name: ${businessInfo.businessName}
- Type: ${businessInfo.businessType}
- Location: ${businessInfo.location}
- Platform: ${businessInfo.platform}
${title ? `- Post Title: ${title}` : ''}
${description ? `- Post Description: ${description}` : ''}
${captionText ? `- Caption Content: "${captionText.substring(0, 300)}"` : ''}
${existingTags.length > 0 ? `- Existing Hashtags (avoid duplicates): ${existingTags.join(', ')}` : ''}

Generate 8-12 NEW hashtags that:
1. Are highly relevant to the business type, location, and content
2. Are popular and commonly searched on ${businessInfo.platform}
3. Mix broad and niche hashtags for maximum reach
4. Include location-based hashtags (e.g., #montereyca, #montereycafood)
5. Include content-specific hashtags based on the post title/description
6. Are appropriate for ${businessInfo.platform} platform
7. Do NOT duplicate any existing hashtags
8. Are formatted correctly (start with #, no spaces, lowercase)

Return ONLY the hashtags, separated by spaces, like this:
#hashtag1 #hashtag2 #hashtag3

Do not include any explanation or other text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert social media hashtag generator. You create relevant, popular hashtags that help posts reach the right audience. Return only hashtags separated by spaces, no other text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 150,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      throw new Error('No hashtags generated');
    }

    // Parse hashtags from response
    const newHashtags = response
      .split(/\s+/)
      .filter(tag => tag.startsWith('#'))
      .map(tag => tag.toLowerCase())
      .filter(tag => !existingTagsLower.includes(tag)); // Remove duplicates

    console.log('✅ Generated', newHashtags.length, 'new hashtags');

    return NextResponse.json({ hashtags: newHashtags });
  } catch (error: any) {
    console.error('❌ Hashtag generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate hashtags',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}


