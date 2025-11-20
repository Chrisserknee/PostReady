import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { topic, duration, voice, generateScriptOnly, guidance, currentScript } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Validate API keys
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    if (!generateScriptOnly && !ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
    }

    console.log(`🎙️ Generating voiceover: "${topic}" (${duration}s)`);

    // Step 1: Generate script with OpenAI
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    const targetWords = Math.floor(duration * 2.5); // ~2.5 words per second (natural speaking pace)
    
    const scriptPrompt = `You are a professional voiceover scriptwriter. Create an engaging voiceover script about: "${topic}"

${currentScript ? `\n📝 CURRENT SCRIPT:\n"${currentScript}"\n` : ''}
${guidance ? `\n🚨 USER GUIDANCE - FOLLOW THESE INSTRUCTIONS:\n"${guidance}"\n\n` : ''}

Requirements:
- Script should be approximately ${targetWords} words (for a ${duration}-second voiceover)
- Write in a natural, conversational tone that sounds great when spoken aloud
- NO stage directions, NO character names, NO formatting markers
- Just the pure script text that will be read by the voice actor
- Make it engaging and easy to follow when listening
- Use natural pauses (commas and periods) for better pacing
${guidance ? `- MOST IMPORTANT: Follow the user's guidance instructions above precisely\n` : ''}

Write ONLY the voiceover script text, nothing else:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert voiceover scriptwriter who creates engaging, natural-sounding scripts optimized for text-to-speech. You write clear, conversational scripts without any stage directions or formatting.${guidance ? ' When the user provides specific guidance, you MUST follow their instructions precisely and incorporate them into the script.' : ''}`,
        },
        {
          role: 'user',
          content: scriptPrompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const script = completion.choices[0]?.message?.content?.trim();

    if (!script) {
      throw new Error('Failed to generate script');
    }

    console.log(`✅ Script generated (${script.split(' ').length} words)`);

    // If only generating script, return it
    if (generateScriptOnly) {
      return NextResponse.json({
        success: true,
        script: script,
      }, { status: 200 });
    }

    // Step 2: Convert script to voiceover with ElevenLabs
    console.log(`🎙️ Converting script to voiceover with voice: ${voice}`);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("ElevenLabs API error:", error);
      return NextResponse.json(
        { error: "Failed to generate voiceover", details: error },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    console.log(`✅ Voiceover generated successfully (${audioBuffer.byteLength} bytes)`);

    return NextResponse.json({
      success: true,
      audio: `data:audio/mpeg;base64,${base64Audio}`,
      script: script,
      duration: duration,
      topic: topic,
      voice: voice,
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Error generating voiceover:", error);
    return NextResponse.json(
      { error: "Failed to generate voiceover", details: error.message },
      { status: 500 }
    );
  }
}

