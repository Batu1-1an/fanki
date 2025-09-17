// @ts-nocheck
// Supabase Edge Functions are written in TypeScript and run on Deno.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { word, userId } = requestBody;
    if (!word || !userId) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: word, userId'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get word ID first
    const { data: wordData, error: wordError } = await supabase.from('words').select('id').eq('word', word.toLowerCase()).eq('user_id', userId).single();
    if (wordError || !wordData) {
      return new Response(JSON.stringify({
        error: 'Word not found for this user'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Check if image already exists in cache
    const { data: existingFlashcard, error: fetchError } = await supabase.from('flashcards').select('image_url, image_description, generated_at').eq('word_id', wordData.id).not('image_url', 'is', null).order('generated_at', {
      ascending: false
    }).limit(1).single();
    // Return cached image if it exists and is recent (within 30 days)
    if (existingFlashcard && !fetchError && existingFlashcard.image_url) {
      const generatedAt = new Date(existingFlashcard.generated_at);
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (generatedAt > monthAgo) {
        console.log(`Returning cached image for word: ${word}`);
        return new Response(JSON.stringify({
          imageUrl: existingFlashcard.image_url,
          description: existingFlashcard.image_description,
          cached: true
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // Generate image using Gemini
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    // Create a memorable, educational image prompt
    const imagePrompt = `Generate a simple, colorful cartoon-style illustration that represents the word "${word}". 
The image should be:
- Educational and suitable for language learning flashcards
- Clean, bright, and visually appealing with vibrant colors
- Memorable and instantly recognizable
- Appropriate for all ages
- In a modern illustration style similar to educational materials
- Clear and uncluttered composition
- No text or words should appear in the image

Create a high-quality illustration that would help someone remember and learn the word "${word}".`;
    // Generate image with Gemini using the correct 'predict' endpoint and request body
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: imagePrompt
          }
        ],
        // --- MODIFICATION START ---
        // Removed the unsupported 'personGeneration' parameter
        parameters: {
          outputMimeType: "image/png",
          sampleCount: 1,
          aspectRatio: "1:1"
        }
      })
    });
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }
    const responseData = await geminiResponse.json();
    const prediction = responseData.predictions?.[0];
    if (!prediction || !prediction.bytesBase64Encoded) {
      console.error("Invalid response structure from Gemini:", JSON.stringify(responseData, null, 2));
      throw new Error('No image data received from Gemini. This may be due to content filtering or an API issue.');
    }
    const imageData = prediction.bytesBase64Encoded;
    const mimeType = prediction.mimeType || 'image/png';
    const textResponse = `Generated illustration for "${word}"`;
    // Convert base64 to Uint8Array for upload
    const imageBuffer = new Uint8Array(atob(imageData).split('').map((char)=>char.charCodeAt(0)));
    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png';
    // Upload to Supabase Storage
    const fileName = `flashcard-${wordData.id}-${Date.now()}.${extension}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('flashcard-images').upload(fileName, imageBuffer, {
      contentType: mimeType,
      cacheControl: '3600'
    });
    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }
    // Get the public URL for the uploaded image
    const { data: publicUrlData } = supabase.storage.from('flashcard-images').getPublicUrl(fileName);
    if (!publicUrlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }
    const finalImageUrl = publicUrlData.publicUrl;
    // Store the generated image data
    const { error: updateError } = await supabase.from('flashcards').upsert({
      word_id: wordData.id,
      image_url: finalImageUrl,
      image_description: textResponse,
      generated_at: new Date().toISOString()
    });
    if (updateError) {
      console.error('Failed to cache image in database:', updateError);
    }
    console.log(`Successfully generated image for word: ${word}`);
    return new Response(JSON.stringify({
      imageUrl: finalImageUrl,
      description: textResponse,
      cached: false
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in generate-image function:', error);
    console.error('Error stack:', error.stack);
    let errorMessage = error.message;
    let statusCode = 500;
    if (error.message.includes('403')) {
      errorMessage = 'API permission denied. Please check the Gemini API key and ensure it has image generation permissions.';
      statusCode = 403;
    } else if (error.message.includes('GEMINI_API_KEY not configured')) {
      errorMessage = 'Gemini API key is not configured in environment variables.';
      statusCode = 500;
    } else if (error.message.includes('No image data received')) {
      errorMessage = 'The AI service did not generate image data. This may be due to content filtering or API limitations.';
      statusCode = 422;
    }
    return new Response(JSON.stringify({
      error: 'Failed to generate image',
      message: errorMessage,
      details: error.message,
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
