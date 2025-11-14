import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { businessInfo, caption, selectedIdea, existingHashtags } = await request.json();

    // Input validation
    if (!businessInfo) {
      return NextResponse.json(
        { error: 'Business information is required' },
        { status: 400 }
      );
    }

    // Validate businessInfo structure
    if (!businessInfo.businessName || !businessInfo.businessType || !businessInfo.location || !businessInfo.platform) {
      return NextResponse.json(
        { error: 'Invalid business information format' },
        { status: 400 }
      );
    }

    // Sanitize and limit input lengths to prevent DoS
    const sanitizedCaption = caption ? String(caption).trim().substring(0, 2000) : '';
    const sanitizedBusinessName = String(businessInfo.businessName).trim().substring(0, 200);
    const sanitizedLocation = String(businessInfo.location).trim().substring(0, 200);
    const sanitizedBusinessType = String(businessInfo.businessType).trim().substring(0, 100);
    const sanitizedPlatform = String(businessInfo.platform).trim().substring(0, 50);

    // Validate existingHashtags is an array
    const sanitizedExistingHashtags = Array.isArray(existingHashtags) 
      ? existingHashtags.slice(0, 50).map((tag: any) => String(tag).trim().substring(0, 100))
      : [];

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
    const existingTags = sanitizedExistingHashtags;
    const existingTagsLower = existingTags.map((tag: string) => tag.toLowerCase());

    // Get caption text without hashtags for context
    const captionText = sanitizedCaption ? sanitizedCaption.split('\n\n').filter((line: string) => !line.trim().startsWith('#')).join('\n\n').trim() : '';
    
    // Sanitize selectedIdea fields
    const title = selectedIdea?.title ? String(selectedIdea.title).trim().substring(0, 200) : '';
    const description = selectedIdea?.description ? String(selectedIdea.description).trim().substring(0, 1000) : '';

    const prompt = `You are a social media hashtag expert. Generate 8-12 additional relevant hashtags for this post.

Business Details:
- Business Name: ${sanitizedBusinessName}
- Type: ${sanitizedBusinessType}
- Location: ${sanitizedLocation}
- Platform: ${sanitizedPlatform}
${title ? `- Post Title: ${title}` : ''}
${description ? `- Post Description: ${description}` : ''}
${captionText ? `- Caption Content: "${captionText.substring(0, 300)}"` : ''}
${existingTags.length > 0 ? `- Existing Hashtags (avoid duplicates): ${existingTags.join(', ')}` : ''}

Generate 8-12 NEW hashtags that:
1. Are highly relevant to the business type, location, and content
2. Are popular and commonly searched on ${sanitizedPlatform}
3. Mix broad and niche hashtags for maximum reach
4. Include location-based hashtags (e.g., #montereyca, #montereycafood)
5. Include content-specific hashtags based on the post title/description
6. Are appropriate for ${sanitizedPlatform} platform
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


