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
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  userId: string
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

    const { word, difficulty, userId }: RequestBody = await req.json()

    // Validate input
    if (!word || !difficulty || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: word, difficulty, userId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if sentences already exist in cache (flashcards table)
    const { data: existingFlashcard, error: fetchError } = await supabase
      .from('flashcards')
      .select('sentences, generated_at')
      .eq('word', word.toLowerCase())
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    // Return cached sentences if they exist and are recent (within 7 days)
    if (existingFlashcard && !fetchError) {
      const generatedAt = new Date(existingFlashcard.generated_at)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      if (generatedAt > weekAgo) {
        console.log(`Returning cached sentences for word: ${word}`)
        return new Response(
          JSON.stringify({ 
            sentences: existingFlashcard.sentences,
            cached: true 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Generate new sentences using Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const difficultyPrompts = {
      beginner: "simple, everyday contexts using basic vocabulary and short sentences",
      intermediate: "moderately complex situations with common idioms and varied sentence structures", 
      advanced: "sophisticated contexts with complex vocabulary, nuanced meanings, and varied grammatical structures"
    }

    const prompt = `Generate exactly 3 different cloze test sentences for the word "${word}". Each sentence should:
1. Use ${difficultyPrompts[difficulty]}
2. Have the word "${word}" replaced with "____" (exactly 4 underscores)
3. Be contextually rich and memorable for language learning
4. Be appropriate for flashcard study
5. Vary in context and usage

Format the response as a JSON array of strings, like this:
["Sentence 1 with ____.", "Sentence 2 with ____.", "Sentence 3 with ____."]

Make the sentences engaging and educational for someone learning English.`

    const geminiResponse = await fetch(
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
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const generatedText = geminiData.candidates[0].content.parts[0].text

    // Parse the JSON response from Gemini
    let sentences: string[]
    try {
      sentences = JSON.parse(generatedText.trim())
      if (!Array.isArray(sentences) || sentences.length !== 3) {
        throw new Error('Invalid sentence format')
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', generatedText)
      // Fallback sentences if parsing fails
      sentences = [
        `The ${word} was absolutely ____ in that situation.`,
        `I found the book quite ____ and engaging.`,
        `Her performance was truly ____ last night.`
      ]
    }

    // Cache the generated sentences in the database
    const { error: insertError } = await supabase
      .from('flashcards')
      .upsert({
        user_id: userId,
        word: word.toLowerCase(),
        sentences: sentences,
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,word'
      })

    if (insertError) {
      console.error('Failed to cache sentences:', insertError)
      // Continue anyway, don't fail the request
    }

    console.log(`Generated new sentences for word: ${word}`)
    return new Response(
      JSON.stringify({ 
        sentences,
        cached: false 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generate-sentences function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate sentences',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
