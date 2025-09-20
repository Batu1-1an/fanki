// @ts-nocheck
// RFC-004: AI-Powered Memory Hook (Mnemonic) Generation
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
  definition: string
  userId: string
  wordId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { word, definition, userId, wordId }: RequestBody = await req.json()

    // Validate input
    if (!word || !definition || !userId || !wordId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: word, definition, userId, wordId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if memory hook already exists (avoid regeneration)
    const { data: existingWord, error: fetchError } = await supabase
      .from('words')
      .select('memory_hook')
      .eq('id', wordId)
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching existing word:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch word data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If memory hook already exists, return it
    if (existingWord?.memory_hook) {
      return new Response(
        JSON.stringify({ 
          memory_hook: existingWord.memory_hook,
          cached: true
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate new memory hook using Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const prompt = `Create a short, vivid, and memorable mnemonic (memory hook) for the English word "${word}" with the definition "${definition}".

The memory hook should:
1. Be a short, creative story or phrase (maximum 2-3 sentences)
2. Connect the word to its definition in a memorable way
3. Use vivid imagery, wordplay, or associations that make it stick in memory
4. Be appropriate for language learners
5. Be engaging and easy to remember
6. Use the word itself or words that sound similar to create connections

Examples of good memory hooks:
- For "meticulous" (very careful and precise): "The medical student was so meticulous, he counted every single molecule in his lab work."
- For "gregarious" (sociable): "Greg was so gregarious, he knew everyone in the area and loved gathering people together."
- For "ephemeral" (lasting for a very short time): "The elephant's memory was usually eternal, but this time it was ephemeral - gone in seconds!"

Generate ONLY the memory hook text, nothing else. Keep it concise and memorable.`

    // Retry logic for Gemini API with exponential backoff
    let geminiResponse
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts) {
      try {
        geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
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

        if (geminiResponse.ok) {
          break // Success, exit retry loop
        }

        const errorData = await geminiResponse.text()
        console.error(`Gemini API error (attempt ${attempts + 1}):`, errorData)
        
        // If it's a 503 (service unavailable), retry with backoff
        if (geminiResponse.status === 503 && attempts < maxAttempts - 1) {
          const backoffDelay = Math.pow(2, attempts) * 1000 // 1s, 2s, 4s
          console.log(`Retrying in ${backoffDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
          attempts++
          continue
        }
        
        throw new Error(`Gemini API error: ${geminiResponse.status}`)
      } catch (error) {
        attempts++
        if (attempts >= maxAttempts) {
          throw error
        }
        // Wait before retry for non-HTTP errors too
        const backoffDelay = Math.pow(2, attempts - 1) * 1000
        console.log(`Network error, retrying in ${backoffDelay}ms...`)
        await new Promise(resolve => setTimeout(resolve, backoffDelay))
      }
    }

    const geminiData = await geminiResponse.json()
    let memoryHook = geminiData.candidates[0].content.parts[0].text.trim()

    // Clean up the response (remove any unwanted formatting)
    memoryHook = memoryHook.replace(/^["']|["']$/g, '') // Remove quotes at start/end
    memoryHook = memoryHook.replace(/\n\n+/g, ' ') // Replace multiple newlines with space
    memoryHook = memoryHook.trim()

    // Validate that we got a reasonable response
    if (!memoryHook || memoryHook.length < 10) {
      // Fallback memory hook if generation fails
      memoryHook = `Remember "${word}" by connecting it to its meaning: ${definition.split('.')[0]}.`
    }

    // Update the database with the generated memory hook
    const { error: updateError } = await supabase
      .from('words')
      .update({ memory_hook: memoryHook })
      .eq('id', wordId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating memory hook:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to save memory hook' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Generated memory hook for word: ${word}`)
    return new Response(
      JSON.stringify({ 
        memory_hook: memoryHook,
        cached: false,
        word_id: wordId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generate-memory-hook function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate memory hook',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
