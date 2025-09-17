// @ts-nocheck - Supabase Edge Functions run in Deno, IDE shows false TypeScript errors
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import hash from 'npm:object-hash';
// We no longer need the ElevenLabsClient, as we will use fetch directly.
// import { ElevenLabsClient } from 'npm:elevenlabs'; 
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    const { word, wordId } = await req.json();
    if (!word || !wordId) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: word, wordId'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam - clear English voice
    // Create a hash for the audio content (word + settings)
    const audioHash = hash({
      word: word.toLowerCase().trim(),
      voice: voiceId,
      model: 'eleven_multilingual_v2',
      settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    });
    const fileName = `audio-${wordId}-${audioHash}.mp3`;
    // Check if audio already exists in storage
    const { data: publicUrlData } = supabase.storage.from('flashcard-audio').getPublicUrl(fileName);
    // A quick check to see if the URL is valid. A non-existent file will still return a URL but will 404.
    // A more robust check might involve a HEAD request, but this is often sufficient.
    // For simplicity, we'll proceed and let the upsert handle overwriting if needed.
    // A better check would be a database lookup first.
    const { data: existingFlashcard } = await supabase.from('flashcards').select('audio_url').eq('word_id', wordId).eq('audio_url', publicUrlData.publicUrl).single();
    if (existingFlashcard) {
      console.log(`Returning cached audio for word: ${word}`);
      return new Response(JSON.stringify({
        audioUrl: existingFlashcard.audio_url,
        cached: true
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // --- MODIFICATION START ---
    // Use a direct fetch call instead of the SDK's stream method
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: word.trim(),
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorBody}`);
    }
    const audioStream = response.body;
    // --- MODIFICATION END ---
    // Convert stream to Uint8Array for upload (your existing logic is perfect)
    const chunks = [];
    const reader = audioStream.getReader();
    while(true){
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const totalLength = chunks.reduce((acc, chunk)=>acc + chunk.length, 0);
    const audioData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks){
      audioData.set(chunk, offset);
      offset += chunk.length;
    }
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage.from('flashcard-audio').upload(fileName, audioData, {
      contentType: 'audio/mpeg',
      cacheControl: '3600',
      upsert: true // Use upsert to overwrite if a hash collision somehow occurs
    });
    if (uploadError) {
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }
    // Get the final public URL again after upload
    const { data: finalPublicUrlData } = supabase.storage.from('flashcard-audio').getPublicUrl(fileName);
    if (!finalPublicUrlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded audio');
    }
    const finalAudioUrl = finalPublicUrlData.publicUrl;
    // Update database with audio URL for persistence
    const { error: updateError } = await supabase.from('flashcards').update({
      audio_url: finalAudioUrl
    }).eq('word_id', wordId);
    if (updateError) {
      console.error('Failed to update flashcard with audio URL:', updateError);
    // Note: Don't throw here, as the audio is already generated and uploaded. 
    // The user can still get the URL, and a background job could fix the DB entry.
    }
    console.log(`Successfully generated audio for word: ${word}`);
    return new Response(JSON.stringify({
      audioUrl: finalAudioUrl,
      cached: false
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in generate-audio function:', error);
    let errorMessage = error?.message || 'Unknown error occurred';
    let statusCode = 500;
    if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
      errorMessage = 'ElevenLabs API authentication failed. Please check the API key.';
      statusCode = 401;
    } else if (error?.message?.includes('ELEVENLABS_API_KEY not configured')) {
      errorMessage = 'ElevenLabs API key is not configured in environment variables.';
      statusCode = 500;
    } else if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
      errorMessage = 'ElevenLabs API quota exceeded. Please check your account limits.';
      statusCode = 429;
    }
    return new Response(JSON.stringify({
      error: 'Failed to generate audio',
      message: errorMessage,
      details: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
