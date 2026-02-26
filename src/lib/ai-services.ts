import { createClientComponentClient } from './supabase/client'
import { FlashcardSentence } from '@/types'
import { PRIMARY_BLANK_TOKEN, getBlankPosition } from './flashcard-text'

export interface GenerateSentencesResponse {
  sentences: FlashcardSentence[]
  cached: boolean
}

export interface GenerateImageResponse {
  imageUrl: string
  description?: string
  cached: boolean
  note?: string
}

export interface GenerateAudioResponse {
  audioUrl: string
  cached: boolean
}

export class AIService {
  private supabase = createClientComponentClient()

  /**
   * Generate 3 cloze test sentences for a word using Gemini API via Supabase Edge Functions
   */
  async generateSentences(
    word: string, 
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    userId: string
  ): Promise<GenerateSentencesResponse> {
    try {
      const { data, error } = await this.supabase.functions.invoke('generate-sentences', {
        body: {
          word: word.trim(),
          difficulty,
          userId
        }
      })

      if (error) {
        console.error('Error calling generate-sentences function:', error)
        throw new Error(`Failed to generate sentences: ${error.message}`)
      }

      if (!data.sentences || !Array.isArray(data.sentences)) {
        throw new Error('Invalid response format from sentence generation service')
      }

      return {
        sentences: data.sentences,
        cached: data.cached || false
      }
    } catch (error) {
      console.error('AI Service - generateSentences error:', error)
      
      // Fallback sentences if API fails (keep blanks for active recall)
      const fallbackSentences: FlashcardSentence[] = [
        {
          sentence: `The situation was quite ${PRIMARY_BLANK_TOKEN} for everyone involved.`,
          blank_position: getBlankPosition(`The situation was quite ${PRIMARY_BLANK_TOKEN} for everyone involved.`),
          correct_word: word
        },
        {
          sentence: `I found the book to be very ${PRIMARY_BLANK_TOKEN} and engaging.`,
          blank_position: getBlankPosition(`I found the book to be very ${PRIMARY_BLANK_TOKEN} and engaging.`),
          correct_word: word
        },
        {
          sentence: `Her performance was absolutely ${PRIMARY_BLANK_TOKEN} last night.`,
          blank_position: getBlankPosition(`Her performance was absolutely ${PRIMARY_BLANK_TOKEN} last night.`),
          correct_word: word
        }
      ]

      return {
        sentences: fallbackSentences,
        cached: false
      }
    }
  }

  /**
   * Generate a memorable image for a word using AI via Supabase Edge Functions
   */
  async generateImage(
    word: string,
    userId: string,
    options?: { allowMissingWord?: boolean }
  ): Promise<GenerateImageResponse> {
    try {
      const { data, error } = await this.supabase.functions.invoke('generate-image', {
        body: {
          word: word.trim(),
          userId,
          allowMissingWord: options?.allowMissingWord ?? false
        }
      })

      if (error) {
        console.error('Error calling generate-image function:', error)
        throw new Error(`Failed to generate image: ${error.message}`)
      }

      if (!data?.imageUrl || typeof data.imageUrl !== 'string') {
        throw new Error('Invalid response format from image generation service')
      }

      return {
        imageUrl: data.imageUrl,
        description: data.description,
        cached: data.cached || false,
        note: data.note
      }
    } catch (error) {
      console.error('AI Service - generateImage error:', error)
      
      // Fallback placeholder image
      const fallbackImageUrl = `https://placehold.co/400x300/6366F1/FFFFFF?text=${encodeURIComponent(word)}`
      
      return {
        imageUrl: fallbackImageUrl,
        cached: false,
        note: 'Using fallback placeholder due to API error'
      }
    }
  }

  /**
   * Generate pronunciation audio for a word using ElevenLabs API via Supabase Edge Functions
   */
  async generateAudio(word: string, wordId: string): Promise<GenerateAudioResponse> {
    try {
      const { data, error } = await this.supabase.functions.invoke('generate-audio', {
        body: {
          word: word.trim(),
          wordId
        }
      })

      if (error) {
        console.error('Error calling generate-audio function:', error)
        throw new Error(`Failed to generate audio: ${error.message}`)
      }

      if (!data.audioUrl) {
        throw new Error('Invalid response format from audio generation service')
      }

      return {
        audioUrl: data.audioUrl,
        cached: data.cached || false
      }
    } catch (error) {
      console.error('AI Service - generateAudio error:', error)
      throw error // Re-throw to let the component handle the error
    }
  }

  /**
   * Generate complete flashcard content (sentences + image) for a word
   */
  async generateFlashcardContent(
    word: string, 
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    userId: string
  ): Promise<{
    sentences: FlashcardSentence[]
    imageUrl: string
    imageDescription?: string
    cached: { sentences: boolean; image: boolean }
  }> {
    // Run both API calls in parallel for better performance
    const [sentencesResult, imageResult] = await Promise.all([
      this.generateSentences(word, difficulty, userId),
      this.generateImage(word, userId)
    ])

    return {
      sentences: sentencesResult.sentences,
      imageUrl: imageResult.imageUrl,
      imageDescription: imageResult.description,
      cached: {
        sentences: sentencesResult.cached,
        image: imageResult.cached
      }
    }
  }

  /**
   * Get cached flashcard content from database
   */
  async getCachedFlashcard(word: string, userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('flashcards')
        .select(`
          *,
          words!inner(id, word, user_id)
        `)
        .eq('words.word', word.toLowerCase())
        .eq('words.user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching cached flashcard:', error)
      return null
    }
  }

  /**
   * Save flashcard content to database
   */
  async saveFlashcard(
    word: string,
    userId: string,
    sentences: FlashcardSentence[],
    imageUrl?: string,
    imageDescription?: string
  ) {
    try {
      // First, get or create the word record
      let { data: wordRecord, error: wordError } = await this.supabase
        .from('words')
        .select('id')
        .eq('word', word.toLowerCase())
        .eq('user_id', userId)
        .single()

      if (wordError && wordError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching word:', wordError)
        return { data: null, error: wordError }
      }

      // If word doesn't exist, create it
      if (!wordRecord) {
        const { data: newWord, error: createWordError } = await this.supabase
          .from('words')
          .insert({
            word: word.toLowerCase(),
            user_id: userId,
            language: 'en',
            difficulty: 1,
            status: 'new'
          })
          .select('id')
          .single()

        if (createWordError) {
          console.error('Error creating word:', createWordError)
          return { data: null, error: createWordError }
        }
        wordRecord = newWord
      }

      // Now save the flashcard
      const { data, error } = await this.supabase
        .from('flashcards')
        .upsert({
          word_id: wordRecord.id,
          sentences,
          image_url: imageUrl,
          image_description: imageDescription,
          generated_at: new Date().toISOString(),
          generation_version: 1,
          is_active: true
        }, {
          onConflict: 'word_id'
        })
        .select()

      if (error) {
        console.error('Error saving flashcard:', error)
        throw new Error('Failed to save flashcard content')
      }

      return data[0]
    } catch (error) {
      console.error('Error in saveFlashcard:', error)
      throw error
    }
  }
}

// Export singleton instance
export const aiService = new AIService()
