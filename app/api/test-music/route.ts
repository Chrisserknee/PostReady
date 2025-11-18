import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, duration, type } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
    }

    console.log(`🎵 Generating music: "${prompt}" (${duration}s, ${type})`);

    // Try the sound effects endpoint
    const response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: duration,
        prompt_influence: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("ElevenLabs API error:", error);
      console.error("Status:", response.status);
      console.error("Response headers:", Object.fromEntries(response.headers.entries()));
      return NextResponse.json(
        { error: "Failed to generate music", details: error, status: response.status },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    console.log(`✅ Music generated successfully (${audioBuffer.byteLength} bytes)`);

    return NextResponse.json({
      success: true,
      audio: `data:audio/mpeg;base64,${base64Audio}`,
      duration: duration,
      prompt: prompt,
      type: type
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Error generating music:", error);
    return NextResponse.json(
      { error: "Failed to generate music", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return NextResponse.json({ message: "Music generation API is ready!" }, { status: 200 });
}
