import { createClientComponentClient } from './supabase'
import { 
  Flashcard, 
  Word, 
  FlashcardWithWord,
  FlashcardSentence, 
  TablesInsert, 
  TablesUpdate 
} from '@/types'

const supabase = createClientComponentClient()

/**
 * Get flashcards with their associated words for a user
 */
export async function getUserFlashcards(options?: {
  limit?: number
  offset?: number
  wordIds?: string[]
}): Promise<{ data: FlashcardWithWord[] | null; error: any; count?: number }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    let query = supabase
      .from('flashcards')
      .select(`
        *,
        words!inner(*)
      `, { count: 'exact' })
      .eq('words.user_id', user.id)
      .eq('is_active', true)
      .order('generated_at', { ascending: false })

    // Filter by specific word IDs if provided
    if (options?.wordIds && options.wordIds.length > 0) {
      query = query.in('word_id', options.wordIds)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset !== undefined) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      return { data: null, error }
    }

    // Transform the data to match FlashcardWithWord interface
    const transformedData: FlashcardWithWord[] = data?.map(item => ({
      flashcard: {
        ...item,
        sentences: parseFlashcardSentences(item.sentences)
      },
      word: item.words as Word
    })) || []

    return { data: transformedData, error: null, count: count || 0 }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get flashcards due for review
 */
export async function getDueFlashcards(): Promise<{ data: FlashcardWithWord[] | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get review history (latest review per word determines due status)
    const { data: reviewRows, error: reviewError } = await supabase
      .from('reviews')
      .select('word_id, due_date, reviewed_at')
      .eq('user_id', user.id)
      .order('reviewed_at', { ascending: false })

    if (reviewError) {
      return { data: null, error: reviewError }
    }

    const latestReviewByWord = new Map<string, { due_date: string | null }>()
    const reviewedWordIds = new Set<string>()

    for (const row of reviewRows || []) {
      if (!row.word_id) continue
      reviewedWordIds.add(row.word_id)
      if (!latestReviewByWord.has(row.word_id)) {
        latestReviewByWord.set(row.word_id, { due_date: row.due_date })
      }
    }

    const now = new Date()
    const dueWordIds = Array.from(latestReviewByWord.entries())
      .filter(([, review]) => !!review.due_date && new Date(review.due_date) <= now)
      .map(([wordId]) => wordId)

    // Get words that have never been reviewed
    let unreviewedQuery = supabase
      .from('words')
      .select('id')
      .eq('user_id', user.id)

    // Exclude all reviewed words so only truly-new words remain
    if (reviewedWordIds.size > 0) {
      const reviewedWordIdsList = Array.from(reviewedWordIds)
      unreviewedQuery = unreviewedQuery.not('id', 'in', `(${reviewedWordIdsList.map(id => `'${id}'`).join(',')})`)
    }

    const { data: unreviewed, error: unreviewedError } = await unreviewedQuery

    if (unreviewedError) {
      return { data: null, error: unreviewedError }
    }

    const allWordIds = Array.from(new Set([
      ...dueWordIds,
      ...(unreviewed?.map(w => w.id) || [])
    ]))

    if (allWordIds.length === 0) {
      return { data: [], error: null }
    }

    // Get flashcards for these words
    return getUserFlashcards({ wordIds: allWordIds, limit: 20 })
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get a single flashcard by ID with its word
 */
export async function getFlashcardById(flashcardId: string): Promise<{ data: FlashcardWithWord | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('flashcards')
      .select(`
        *,
        words!inner(*)
      `)
      .eq('id', flashcardId)
      .eq('words.user_id', user.id)
      .single()

    if (error || !data) {
      return { data: null, error }
    }

    const transformedData: FlashcardWithWord = {
      flashcard: {
        ...data,
        sentences: parseFlashcardSentences(data.sentences)
      },
      word: data.words as Word
    }

    return { data: transformedData, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Create a new flashcard
 */
export async function createFlashcard(flashcardData: TablesInsert<'flashcards'>): Promise<{ data: Flashcard | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        ...flashcardData,
        generated_at: new Date().toISOString(),
        generation_version: 1,
        is_active: true
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Update a flashcard
 */
export async function updateFlashcard(flashcardId: string, updates: TablesUpdate<'flashcards'>): Promise<{ data: Flashcard | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .update(updates)
      .eq('id', flashcardId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Regenerate flashcard content (mark old as inactive, create new)
 */
export async function regenerateFlashcard(wordId: string, newContent: {
  sentences: FlashcardSentence[]
  image_url?: string
  audio_url?: string
}): Promise<{ data: Flashcard | null; error: any }> {
  try {
    // Mark existing flashcards as inactive
    const { error: deactivateError } = await supabase
      .from('flashcards')
      .update({ is_active: false })
      .eq('word_id', wordId)

    if (deactivateError) {
      return { data: null, error: deactivateError }
    }

    // Create new flashcard
    return createFlashcard({
      word_id: wordId,
      sentences: newContent.sentences as any,
      image_url: newContent.image_url,
      audio_url: newContent.audio_url
    })
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Delete a flashcard (mark as inactive)
 */
export async function deleteFlashcard(flashcardId: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('flashcards')
      .update({ is_active: false })
      .eq('id', flashcardId)

    return { error }
  } catch (error) {
    return { error }
  }
}

/**
 * Get flashcard statistics for a user
 */
export async function getFlashcardStats(): Promise<{
  total: number
  active: number
  withImages: number
  withAudio: number
  error?: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { total: 0, active: 0, withImages: 0, withAudio: 0, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('flashcards')
      .select(`
        is_active,
        image_url,
        audio_url,
        words!inner(user_id)
      `)
      .eq('words.user_id', user.id)

    if (error || !data) {
      return { total: 0, active: 0, withImages: 0, withAudio: 0, error }
    }

    const stats = {
      total: data.length,
      active: data.filter(f => f.is_active).length,
      withImages: data.filter(f => f.is_active && f.image_url).length,
      withAudio: data.filter(f => f.is_active && f.audio_url).length
    }

    return stats
  } catch (error) {
    return { total: 0, active: 0, withImages: 0, withAudio: 0, error }
  }
}

/**
 * Parse flashcard sentences from JSON or array format
 */
function parseFlashcardSentences(sentences: any): FlashcardSentence[] {
  try {
    if (Array.isArray(sentences)) {
      return sentences
    }
    if (typeof sentences === 'string') {
      const parsed = JSON.parse(sentences)
      return Array.isArray(parsed) ? parsed : []
    }
    return []
  } catch (error) {
    console.error('Error parsing flashcard sentences:', error)
    return []
  }
}

/**
 * Check if a word has an active flashcard
 */
export async function hasActiveFlashcard(wordId: string): Promise<{ hasFlashcard: boolean; flashcard?: Flashcard; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('word_id', wordId)
      .eq('is_active', true)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      return { hasFlashcard: false, error }
    }

    return { 
      hasFlashcard: !!data, 
      flashcard: data || undefined 
    }
  } catch (error) {
    return { hasFlashcard: false, error }
  }
}
