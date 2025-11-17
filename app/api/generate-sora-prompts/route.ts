import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { videoIdea, style, cameraMovement, mood } = await request.json();

    if (!videoIdea) {
      return NextResponse.json(
        { error: 'Video idea is required' },
        { status: 400 }
      );
    }

    // Build a detailed prompt for GPT
    const systemPrompt = `You are an expert AI video prompt engineer specializing in creating detailed, professional prompts for OpenAI's Sora video generation model. Your prompts should be highly descriptive, technical, and optimized to produce stunning, cinematic results.

When crafting Sora prompts, include:
- Vivid visual descriptions with specific details about lighting, composition, and atmosphere
- Technical cinematography terms (focal length, depth of field, lighting style)
- Specific camera movements and angles
- Color grading and mood descriptors
- Environmental details and context
- Subject descriptions with action and emotion
- Duration and pacing suggestions

Generate 3 distinct, creative variations of the video concept provided, each with a unique approach or perspective.`;

    // Add special instruction for hyper-bizarre mode
    const bizarreInstruction = mood === 'hyper-bizarre' 
      ? `\n\nIMPORTANT: The mood is "hyper-bizarre" - make these prompts EXTREMELY weird, surreal, and mind-bending. Push the boundaries of reality. Include unexpected juxtapositions, impossible physics, dreamlike logic, and unsettling yet fascinating imagery. Make it crazy and unforgettable!` 
      : '';

    const userPrompt = `Generate 3 professional Sora video prompts based on this concept:

Video Concept: ${videoIdea}
${style ? `Visual Style: ${style}` : ''}
${cameraMovement ? `Camera Movement: ${cameraMovement}` : ''}
${mood ? `Mood/Tone: ${mood}` : ''}${bizarreInstruction}

For each prompt, provide:
1. A short title (3-5 words)
2. A detailed, professional Sora prompt (2-4 sentences)
3. 3-5 relevant tags

Return ONLY valid JSON in this exact format:
{
  "prompts": [
    {
      "title": "Title Here",
      "prompt": "Detailed Sora prompt here...",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2500,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(responseText);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating Sora prompts:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompts', details: error.message },
      { status: 500 }
    );
  }
}

