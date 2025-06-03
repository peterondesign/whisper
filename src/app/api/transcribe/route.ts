import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('Transcribe API called');
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      }, { status: 500 });
    }

    // Get the audio file from the form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('No audio file provided');
      return NextResponse.json({
        success: false,
        error: 'No audio file provided'
      }, { status: 400 });
    }

    console.log('Processing audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    });

    // Convert File to proper format for OpenAI
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type });
    
    // Create a File-like object that OpenAI expects
    const audioFileForOpenAI = new File([audioBlob], audioFile.name, {
      type: audioFile.type
    });

    // Call OpenAI Whisper API
    console.log('Calling OpenAI Whisper API...');
    const transcription = await openai.audio.transcriptions.create({
      file: audioFileForOpenAI,
      model: 'whisper-1',
      language: 'en', // You can make this configurable
      response_format: 'json',
      temperature: 0.2, // Lower temperature for more consistent results
    });

    console.log('Transcription successful:', transcription.text);

    return NextResponse.json({
      success: true,
      transcript: transcription.text
    });

  } catch (error) {
    console.error('Error in transcribe API:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to transcribe audio';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid OpenAI API key';
      } else if (error.message.includes('quota')) {
        errorMessage = 'OpenAI API quota exceeded';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded, please try again later';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}