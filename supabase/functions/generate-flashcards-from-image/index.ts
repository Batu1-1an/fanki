// @ts-nocheck
// Supabase Edge Functions run in Deno, IDE shows false TypeScript errors
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface ExtractedWord {
  word: string;
  definition: string;
}

interface RequestBody {
  imageData: string; // base64 encoded image
  mimeType: string;
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let requestBody: RequestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { imageData, mimeType, userId } = requestBody;

    // Validate input
    if (!imageData || !mimeType || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageData, mimeType, userId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify user exists and is authenticated
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found or not authorized' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Prepare the prompt for Gemini 2.5 Flash
    const prompt = `Analyze this image and extract all distinct words that would be useful for vocabulary learning. 

Requirements:
1. Extract only clear, readable words (minimum 3 letters)
2. Skip common words like: a, an, the, and, or, but, in, on, at, to, for, of, with, by
3. For each word, provide a concise, educational definition (1-2 sentences max)
4. Focus on nouns, verbs, adjectives, and adverbs that learners would benefit from studying
5. Return ONLY a valid JSON array with no additional text or formatting

Format your response exactly as:
[{"word": "example", "definition": "A thing characteristic of its kind or illustrating a general rule."}, {"word": "vocabulary", "definition": "The body of words used in a particular language or subject."}]

Important: Return ONLY the JSON array, no markdown code blocks, no explanatory text.`;

    // Call Gemini API with the image  
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: imageData
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1, // Low temperature for more consistent results
            candidateCount: 1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    
    // Extract the generated text
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    // Parse the JSON response
    let extractedWords: ExtractedWord[];
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedResponse = generatedText.trim();
      
      // Remove markdown code block formatting
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Additional cleanup - remove any remaining whitespace
      cleanedResponse = cleanedResponse.trim();
      
      extractedWords = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', generatedText);
      throw new Error('Invalid JSON response from AI model');
    }

    // Validate and filter the extracted words
    const validWords = extractedWords.filter((item): item is ExtractedWord => {
      return (
        typeof item === 'object' &&
        typeof item.word === 'string' &&
        typeof item.definition === 'string' &&
        item.word.length >= 3 &&
        /^[a-zA-Z\s-']+$/.test(item.word) && // Only alphabetic characters, spaces, hyphens, and apostrophes
        item.definition.length > 10 // Ensure definition is substantial
      );
    }).map(item => ({
      word: item.word.toLowerCase().trim(),
      definition: item.definition.trim()
    }));

    // Remove duplicates
    const uniqueWords = Array.from(
      new Map(validWords.map(item => [item.word, item])).values()
    );

    console.log(`Successfully extracted ${uniqueWords.length} words from image for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        words: uniqueWords,
        totalExtracted: uniqueWords.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-flashcards-from-image function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Failed to process image and extract words'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

