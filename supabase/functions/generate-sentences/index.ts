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
      .select(`
        sentences, 
        generated_at,
        words!inner(id, word, user_id)
      `)
      .eq('words.word', word.toLowerCase())
      .eq('words.user_id', userId)
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

Format the response as a JSON array of objects, where each object has:
- "sentence": the sentence with ____ as the blank
- "correct_word": the word that goes in the blank
- "blank_position": the position where the blank starts in the sentence
- "explanation": a brief explanation of why this word fits in context

Example format:
[
  {
    "sentence": "The chef's ____ was evident in every dish he prepared.",
    "correct_word": "skill",
    "blank_position": 12,
    "explanation": "Shows mastery and expertise in cooking"
  }
]

Make the sentences engaging and educational for someone learning English.`

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
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
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
    const generatedText = geminiData.candidates[0].content.parts[0].text

    // Parse the JSON response from Gemini
    let sentences: any[]
    try {
      sentences = JSON.parse(generatedText.trim())
      if (!Array.isArray(sentences) || sentences.length !== 3) {
        throw new Error('Invalid sentence format')
      }
      // Validate that each sentence has the required structure
      for (const sentence of sentences) {
        if (!sentence.sentence || !sentence.correct_word || typeof sentence.blank_position !== 'number') {
          throw new Error('Invalid sentence object structure')
        }
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', generatedText)
      // Fallback sentences if parsing fails
      sentences = [
        {
          sentence: `The team's ____ helped them win the championship.`,
          correct_word: word.toLowerCase(),
          blank_position: 12,
          explanation: `Shows how ${word} contributes to success.`
        },
        {
          sentence: `Her ____ was evident in the quality of her work.`,
          correct_word: word.toLowerCase(),
          blank_position: 4,
          explanation: `Demonstrates ${word} through visible results.`
        },
        {
          sentence: `The project required a lot of ____ to complete successfully.`,
          correct_word: word.toLowerCase(),
          blank_position: 31,
          explanation: `Indicates the importance of ${word} for achievement.`
        }
      ]
    }

    // First, get or create the word record
    let { data: wordRecord, error: wordError } = await supabase
      .from('words')
      .select('id')
      .eq('word', word.toLowerCase())
      .eq('user_id', userId)
      .single()

    if (wordError && wordError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error fetching word:', wordError)
    }

    // If word doesn't exist, create it
    if (!wordRecord) {
      const { data: newWord, error: createWordError } = await supabase
        .from('words')
        .insert({
          word: word.toLowerCase(),
          user_id: userId,
          language: 'en',
          difficulty: difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 3 : 5,
          status: 'new'
        })
        .select('id')
        .single()

      if (createWordError) {
        console.error('Error creating word:', createWordError)
        // Continue anyway, don't fail the request
      } else {
        wordRecord = newWord
      }
    }

    // Cache the generated sentences in the flashcards table
    if (wordRecord) {
      const { error: insertError } = await supabase
        .from('flashcards')
        .upsert({
          word_id: wordRecord.id,
          sentences: sentences,
          generated_at: new Date().toISOString(),
          generation_version: 1,
          is_active: true
        }, {
          onConflict: 'word_id'
        })

      if (insertError) {
        console.error('Failed to cache sentences:', insertError)
        // Continue anyway, don't fail the request
      }
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
