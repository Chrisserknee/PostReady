import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    const voiceId = 'TYkIHhDWzXPHalxGXze5'; // Trailer Voice
    const text = 'Red Flag Detected';

    // Call ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate voice' },
        { status: response.status }
      );
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    // Return as data URL format for easy playback
    return NextResponse.json({
      audio: `data:audio/mpeg;base64,${base64Audio}`,
      format: 'mp3',
    });
  } catch (error: any) {
    console.error('Red flag voice API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice', details: error.message },
      { status: 500 }
    );
  }
}

