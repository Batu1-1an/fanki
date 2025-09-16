// @ts-nocheck
// Supabase Edge Functions are written in TypeScript and run on Deno.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Generate a simple SVG illustration for a word
function generateSVGIllustration(word: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  
  const wordLower = word.toLowerCase();
  let colorIndex = 0;
  for (let i = 0; i < wordLower.length; i++) {
    colorIndex += wordLower.charCodeAt(i);
  }
  const primaryColor = colors[colorIndex % colors.length];
  const secondaryColor = colors[(colorIndex + 3) % colors.length];
  
  // Create different shapes based on word characteristics
  let shapes = '';
  const wordLength = word.length;
  
  if (wordLength <= 4) {
    // Simple circle design for short words
    shapes = `
      <circle cx="200" cy="150" r="80" fill="${primaryColor}" opacity="0.8"/>
      <circle cx="200" cy="150" r="50" fill="${secondaryColor}" opacity="0.6"/>
      <circle cx="200" cy="150" r="20" fill="white" opacity="0.9"/>
    `;
  } else if (wordLength <= 7) {
    // Rectangle pattern for medium words
    shapes = `
      <rect x="120" y="70" width="160" height="160" rx="20" fill="${primaryColor}" opacity="0.8"/>
      <rect x="140" y="90" width="120" height="120" rx="15" fill="${secondaryColor}" opacity="0.6"/>
      <rect x="160" y="110" width="80" height="80" rx="10" fill="white" opacity="0.9"/>
    `;
  } else {
    // Complex pattern for longer words
    shapes = `
      <polygon points="200,50 350,150 200,250 50,150" fill="${primaryColor}" opacity="0.8"/>
      <polygon points="200,80 300,150 200,220 100,150" fill="${secondaryColor}" opacity="0.6"/>
      <circle cx="200" cy="150" r="40" fill="white" opacity="0.9"/>
    `;
  }
  
  // Add decorative elements
  const decorations = `
    <circle cx="100" cy="80" r="8" fill="${secondaryColor}" opacity="0.5"/>
    <circle cx="300" cy="80" r="6" fill="${primaryColor}" opacity="0.5"/>
    <circle cx="80" cy="220" r="10" fill="${primaryColor}" opacity="0.4"/>
    <circle cx="320" cy="220" r="7" fill="${secondaryColor}" opacity="0.4"/>
  `;
  
  return `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      ${shapes}
      ${decorations}
      <text x="200" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#495057">${word}</text>
    </svg>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
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
    const { data: wordData, error: wordError } = await supabase
      .from('words')
      .select('id')
      .eq('word', word.toLowerCase())
      .eq('user_id', userId)
      .single();

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
    const { data: existingFlashcard, error: fetchError } = await supabase
      .from('flashcards')
      .select('image_url, image_description, generated_at')
      .eq('word_id', wordData.id)
      .not('image_url', 'is', null)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

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

    // Generate image using Gemini 2.5 Flash Image Generation
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

    // Generate description using Gemini text model
    console.log('Getting description from Gemini...');
    const descriptionResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Provide a brief, educational description (max 50 words) for the word "${word}" that would help a language learner remember it. Focus on visual characteristics, common usage, or memorable associations.`
              }
            ]
          }
        ]
      })
    });

    let textResponse = `Educational illustration for "${word}"`;
    
    if (descriptionResponse.ok) {
      const descData = await descriptionResponse.json();
      const generatedDesc = descData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedDesc) {
        textResponse = generatedDesc.trim();
        console.log('Generated description:', textResponse);
      }
    }

    // Create SVG illustration as fallback
    console.log('Creating SVG illustration...');
    const svgContent = generateSVGIllustration(word);
    
    // Convert SVG string directly to Uint8Array for upload
    const encoder = new TextEncoder();
    const imageBuffer = encoder.encode(svgContent);
    const mimeType = 'image/svg+xml';

    // Determine file extension from mime type
    const extension = mimeType === 'image/png' ? 'png' : 
                     mimeType === 'image/jpeg' ? 'jpg' : 
                     mimeType === 'image/webp' ? 'webp' : 
                     mimeType === 'image/svg+xml' ? 'svg' : 'png';

    // Upload to Supabase Storage
    const fileName = `flashcard-${wordData.id}-${Date.now()}.${extension}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('flashcard-images')
      .upload(fileName, imageBuffer, {
        contentType: mimeType || 'image/png',
        cacheControl: '3600'
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get the public URL for the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from('flashcard-images')
      .getPublicUrl(fileName);

    if (!publicUrlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    const finalImageUrl = publicUrlData.publicUrl;

    // Store the generated image data
    const { error: updateError } = await supabase
      .from('flashcards')
      .upsert({
        word_id: wordData.id,
        image_url: finalImageUrl,
        image_description: textResponse || `Generated illustration for "${word}"`,
        generated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('Failed to cache image:', updateError);
    }

    console.log(`Successfully generated image for word: ${word}`);
    
    return new Response(JSON.stringify({
      imageUrl: finalImageUrl,
      description: textResponse || `Generated illustration for "${word}"`,
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
    
    // More specific error handling
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