import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!elevenLabsApiKey) {
      console.log('ElevenLabs API key not found, using fallback');
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 400 });
    }

    // Use a default voice ID (you can change this to any ElevenLabs voice)
    const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Bella voice, or use any other voice ID
    
    console.log('Calling ElevenLabs TTS API...');
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      console.error('ElevenLabs API error:', response.status, response.statusText);
      return NextResponse.json({ error: 'ElevenLabs API failed' }, { status: response.status });
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    
    console.log('ElevenLabs TTS successful');
    
    // Return the audio data
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error in speech API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}