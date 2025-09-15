import { createClientComponentClient } from './supabase'

export interface GenerateSentencesResponse {
  sentences: string[]
  cached: boolean
}

export interface GenerateImageResponse {
  imageUrl: string
  description?: string
  cached: boolean
  note?: string
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
      
      // Fallback sentences if API fails
      const fallbackSentences = [
        `The situation was quite ____ for everyone involved.`,
        `I found the book to be very ____ and engaging.`,
        `Her performance was absolutely ____ last night.`
      ].map(sentence => sentence.replace('____', word))

      return {
        sentences: fallbackSentences,
        cached: false
      }
    }
  }

  /**
   * Generate a memorable image for a word using AI via Supabase Edge Functions
   */
  async generateImage(word: string, userId: string): Promise<GenerateImageResponse> {
    try {
      const { data, error } = await this.supabase.functions.invoke('generate-image', {
        body: {
          word: word.trim(),
          userId
        }
      })

      if (error) {
        console.error('Error calling generate-image function:', error)
        throw new Error(`Failed to generate image: ${error.message}`)
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
      const fallbackImageUrl = `https://via.placeholder.com/400x300/6366F1/FFFFFF?text=${encodeURIComponent(word)}`
      
      return {
        imageUrl: fallbackImageUrl,
        cached: false,
        note: 'Using fallback placeholder due to API error'
      }
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
    sentences: string[]
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
        .select('*')
        .eq('word', word.toLowerCase())
        .eq('user_id', userId)
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
    sentences: string[],
    imageUrl?: string,
    imageDescription?: string
  ) {
    try {
      const { data, error } = await this.supabase
        .from('flashcards')
        .upsert({
          user_id: userId,
          word: word.toLowerCase(),
          sentences,
          image_url: imageUrl,
          image_description: imageDescription,
          generated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,word'
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
