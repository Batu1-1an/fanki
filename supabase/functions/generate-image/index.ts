// @ts-nocheck
// Supabase Edge Functions are written in TypeScript and run on Deno.
// The IDE might show errors for Deno-specific APIs, but they will work correctly when deployed.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  word: string
  userId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { word, userId }: RequestBody = await req.json()

    if (!word || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: word, userId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if image already exists in cache
    const { data: existingFlashcard, error: fetchError } = await supabase
      .from('flashcards')
      .select('image_url, generated_at')
      .eq('word', word.toLowerCase())
      .eq('user_id', userId)
      .not('image_url', 'is', null)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    // Return cached image if it exists and is recent (within 30 days)
    if (existingFlashcard && !fetchError && existingFlashcard.image_url) {
      const generatedAt = new Date(existingFlashcard.generated_at)
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      if (generatedAt > monthAgo) {
        console.log(`Returning cached image for word: ${word}`)
        return new Response(
          JSON.stringify({ 
            imageUrl: existingFlashcard.image_url,
            cached: true 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Generate new image using Gemini API (Imagen)
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Create a memorable, exaggerated image prompt
    const imagePrompt = `Create a memorable, slightly exaggerated cartoon-style illustration that represents the word "${word}". The image should be:
- Colorful and eye-catching
- Educational and appropriate for language learning
- Clear and simple, good for flashcards
- Memorable and unique
- Professional cartoon/illustration style
- No text or words in the image

Style: Clean, modern illustration with vibrant colors, similar to educational materials or children's books.`

    // Note: Gemini's image generation might not be available in all regions
    // For now, we'll use a text-to-image description approach with placeholder
    
    // Generate an image description using Gemini text model first
    const descriptionResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a detailed visual description for a flashcard image representing the word "${word}". 
              The description should be for a memorable, colorful cartoon-style illustration that helps language learners remember this word.
              Keep it concise but vivid. Focus on visual elements that would make the word memorable.
              Response format: Just the description, no extra text.`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          }
        }),
      }
    )

    if (!descriptionResponse.ok) {
      throw new Error(`Gemini API error: ${descriptionResponse.status}`)
    }

    const descriptionData = await descriptionResponse.json()
    const imageDescription = descriptionData.candidates[0].content.parts[0].text

    // For now, create a placeholder image URL with the description
    // In production, you would integrate with an actual image generation API
    // like DALL-E, Midjourney, or Stable Diffusion
    const placeholderImageUrl = `https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=${encodeURIComponent(word)}`
    
    // Store the generated description and placeholder URL
    const { error: updateError } = await supabase
      .from('flashcards')
      .upsert({
        user_id: userId,
        word: word.toLowerCase(),
        image_url: placeholderImageUrl,
        image_description: imageDescription,
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,word'
      })

    if (updateError) {
      console.error('Failed to cache image:', updateError)
    }

    console.log(`Generated image description for word: ${word}`)
    return new Response(
      JSON.stringify({ 
        imageUrl: placeholderImageUrl,
        description: imageDescription,
        cached: false,
        note: "Using placeholder image. Integrate with DALL-E or similar service for actual image generation."
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generate-image function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate image',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
