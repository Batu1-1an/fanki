import { createClientComponentClient } from './supabase'
import { Word, TablesInsert, TablesUpdate } from '@/types'

const supabase = createClientComponentClient()

// Word difficulty levels
export const DIFFICULTY_LEVELS = {
  1: { label: 'Very Easy', color: 'bg-green-100 text-green-800' },
  2: { label: 'Easy', color: 'bg-blue-100 text-blue-800' },
  3: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  4: { label: 'Hard', color: 'bg-orange-100 text-orange-800' },
  5: { label: 'Very Hard', color: 'bg-red-100 text-red-800' }
} as const

// Predefined categories
export const WORD_CATEGORIES = [
  'General',
  'Business',
  'Academic',
  'Technology',
  'Travel',
  'Food & Dining',
  'Health & Medical',
  'Arts & Culture',
  'Science',
  'Sports',
  'Family & Relationships',
  'Nature & Environment',
  'Politics & Government',
  'Entertainment',
  'Fashion & Style'
] as const

// Create a new word
export async function createWord(wordData: TablesInsert<'words'>): Promise<{ data: Word | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Check for duplicates
    const { data: existingWord } = await supabase
      .from('words')
      .select('id, word')
      .eq('user_id', user.id)
      .eq('word', wordData.word.toLowerCase().trim())
      .single()

    if (existingWord) {
      return { 
        data: null, 
        error: { code: 'DUPLICATE_WORD', message: `The word "${wordData.word}" already exists in your vocabulary.` }
      }
    }

    const { data, error } = await supabase
      .from('words')
      .insert({
        ...wordData,
        user_id: user.id,
        word: wordData.word.toLowerCase().trim(),
        language: wordData.language || 'en',
        difficulty: wordData.difficulty || 3,
        category: wordData.category || 'General'
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Get all words for the current user
export async function getUserWords(options?: {
  category?: string
  difficulty?: number
  search?: string
  limit?: number
  offset?: number
}): Promise<{ data: Word[] | null; error: any; count?: number }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    let query = supabase
      .from('words')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (options?.category && options.category !== 'All') {
      query = query.eq('category', options.category)
    }
    
    if (options?.difficulty) {
      query = query.eq('difficulty', options.difficulty)
    }
    
    if (options?.search) {
      query = query.or(`word.ilike.%${options.search}%,definition.ilike.%${options.search}%`)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset !== undefined) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await query

    return { data, error, count: count || 0 }
  } catch (error) {
    return { data: null, error }
  }
}

// Get a single word by ID
export async function getWordById(wordId: string): Promise<{ data: Word | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('id', wordId)
      .eq('user_id', user.id)
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Update a word
export async function updateWord(wordId: string, updates: TablesUpdate<'words'>): Promise<{ data: Word | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // If updating the word text, check for duplicates
    if (updates.word) {
      const { data: existingWord } = await supabase
        .from('words')
        .select('id, word')
        .eq('user_id', user.id)
        .eq('word', updates.word.toLowerCase().trim())
        .neq('id', wordId)
        .single()

      if (existingWord) {
        return { 
          data: null, 
          error: { code: 'DUPLICATE_WORD', message: `The word "${updates.word}" already exists in your vocabulary.` }
        }
      }
    }

    const { data, error } = await supabase
      .from('words')
      .update({
        ...updates,
        word: updates.word ? updates.word.toLowerCase().trim() : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', wordId)
      .eq('user_id', user.id)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Delete a word and all its related data (reviews, flashcards)
export async function deleteWord(wordId: string): Promise<{ error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'User not authenticated' }
    }

    // Verify the word belongs to the current user before deletion
    const { data: word, error: fetchError } = await supabase
      .from('words')
      .select('id')
      .eq('id', wordId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !word) {
      return { error: fetchError || 'Word not found or access denied' }
    }

    // Use the RPC function to delete word and all dependent records atomically
    const { error } = await supabase.rpc('delete_word_and_dependents', {
      word_id_to_delete: wordId
    })

    return { error }
  } catch (error) {
    return { error }
  }
}

// Get word statistics for the current user (optimized with database function)
export async function getWordStats(): Promise<{ 
  total: number
  byDifficulty: Record<number, number>
  byCategory: Record<string, number>
  recentCount: number
  error?: any 
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { total: 0, byDifficulty: {}, byCategory: {}, recentCount: 0, error: 'User not authenticated' }
    }

    // Use optimized database function
    const { data: stats, error } = await supabase
      .rpc('get_user_word_stats', { p_user_id: user.id })

    if (error) {
      console.error('Error fetching word stats:', error)
      return { total: 0, byDifficulty: {}, byCategory: {}, recentCount: 0, error }
    }

    return {
      total: stats?.total || 0,
      byDifficulty: stats?.byDifficulty || {},
      byCategory: stats?.byCategory || {},
      recentCount: stats?.recentCount || 0
    }
  } catch (error) {
    console.error('Failed to get word stats:', error)
    return { total: 0, byDifficulty: {}, byCategory: {}, recentCount: 0, error }
  }
}

// Search words with advanced filtering
export async function searchWords(query: string): Promise<{ data: Word[] | null; error: any }> {
  if (!query.trim()) {
    return getUserWords({ limit: 20 })
  }

  return getUserWords({ 
    search: query.trim(),
    limit: 50 
  })
}

// Check if word exists (for duplicate detection)
export async function checkWordExists(word: string): Promise<{ exists: boolean; wordData?: Word; error?: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { exists: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', user.id)
      .eq('word', word.toLowerCase().trim())
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      return { exists: false, error }
    }

    return { 
      exists: !!data, 
      wordData: data || undefined 
    }
  } catch (error) {
    return { exists: false, error }
  }
}
