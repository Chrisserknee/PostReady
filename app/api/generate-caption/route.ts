import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { businessInfo, ideaTitle, videoDescription, selectedIdea, guidance, currentCaption } = await request.json();

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

    console.log('🎨 Generating AI caption...', guidance ? `with guidance: ${guidance}` : '');

    // Use selectedIdea if provided, otherwise use ideaTitle/videoDescription
    const title = selectedIdea?.title || ideaTitle;
    const description = selectedIdea?.description || videoDescription;

    // Check if guidance is asking for longer/shorter and if we have current caption
    const isLongerRequest = guidance && /longer|more words|expand|extend/i.test(guidance);
    const isShorterRequest = guidance && /shorter|fewer words|condense|brief/i.test(guidance);
    
    // Remove hashtags from current caption for length comparison (hashtags are added separately)
    const captionWithoutHashtags = currentCaption ? currentCaption.split('\n\n').filter((line: string) => !line.trim().startsWith('#')).join('\n\n').trim() : '';
    const currentCaptionLength = captionWithoutHashtags.length;
    
    const basePrompt = `You are a social media caption writer who creates natural, engaging, and authentic captions for small businesses.

Business Details:
- Business Name: ${businessInfo.businessName}
- Type: ${businessInfo.businessType}
- Location: ${businessInfo.location}
- Platform: ${businessInfo.platform}
${title ? `- Post Idea: ${title}` : ''}
${description ? `- Video Description: ${description}` : ''}
${currentCaption && captionWithoutHashtags ? `- Current Caption (${currentCaptionLength} characters, hashtags excluded): "${captionWithoutHashtags}"` : ''}

${guidance ? `\n🚨 CRITICAL USER INSTRUCTIONS - THESE OVERRIDE ALL OTHER RULES:\n"${guidance}"\n\n` : ''}
${isLongerRequest && currentCaptionLength > 0 ? `⚠️ LENGTH REQUIREMENT: The user wants a LONGER caption. The current caption is ${currentCaptionLength} characters (hashtags excluded). You MUST create a caption that is SIGNIFICANTLY longer - aim for at least ${Math.round(currentCaptionLength * 1.8)} characters or more. Add more detail, expand on points, include more context, add more sentences. Make it substantially longer than the current version. Each time the user asks for "longer", you should make it progressively longer.\n` : ''}
${isShorterRequest && currentCaptionLength > 0 ? `⚠️ LENGTH REQUIREMENT: The user wants a SHORTER caption. The current caption is ${currentCaptionLength} characters (hashtags excluded). You MUST create a caption that is SIGNIFICANTLY shorter - aim for ${Math.round(currentCaptionLength * 0.6)} characters or less. Be concise, remove redundancy, keep only essential information.\n` : ''}
${guidance && !isLongerRequest && !isShorterRequest ? `You MUST follow these instructions exactly. If the user asks for more emojis, add more. These instructions take absolute priority.\n` : ''}

Write a natural, conversational caption that:
1. Feels authentic and human (not overly promotional or corporate)
${guidance ? '' : '2. Is 2-4 sentences long'}
3. Includes a subtle call-to-action or question to encourage engagement
4. References the location naturally if relevant
${guidance ? '' : '5. Uses 1-2 emojis maximum (only where they feel natural)'}
6. Sounds like something a real person would write, not an AI
7. Is graceful and well-written but not overdone or flowery
8. Connects with the local community

DO NOT include hashtags - those will be added separately.
DO NOT use excessive emojis or exclamation marks${guidance ? ' (unless the user specifically requests more)' : ''}.
DO NOT sound like marketing copy.

${isLongerRequest ? `\nREMEMBER: The user wants it LONGER. ${currentCaptionLength > 0 ? `Current length: ${currentCaptionLength} chars (hashtags excluded). Target: ${Math.round(currentCaptionLength * 1.8)}+ chars.` : 'Make it substantially longer than typical captions.'} Add more sentences, more detail, more context, more elaboration. Expand significantly. The more times the user requests "longer", the longer it should become.\n` : ''}
${isShorterRequest ? `\nREMEMBER: The user wants it SHORTER. ${currentCaptionLength > 0 ? `Current length: ${currentCaptionLength} chars (hashtags excluded). Target: ${Math.round(currentCaptionLength * 0.6)} chars or less.` : 'Make it concise.'} Remove unnecessary words, be direct, keep it brief.\n` : ''}
${guidance && !isLongerRequest && !isShorterRequest ? `\nREMEMBER: The user's instruction "${guidance}" is the most important requirement. Follow it precisely.\n` : ''}

Write the caption now:`;

    const prompt = basePrompt;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert social media caption writer who creates natural, authentic, and engaging captions for small businesses. Your captions feel human and conversational, never robotic or overly promotional.${guidance ? ' When the user provides specific instructions, you MUST follow them precisely and incorporate them into the caption.' : ''}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.9,
      max_tokens: guidance ? 300 : 200,
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
