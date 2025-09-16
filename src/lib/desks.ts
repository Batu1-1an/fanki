import { createClientComponentClient } from './supabase'
import { TablesInsert, TablesUpdate } from '@/types'

const supabase = createClientComponentClient()

export interface Desk {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  icon: string
  is_default: boolean
  created_at: string
  updated_at: string
  word_count?: number
}

export interface WordDesk {
  id: string
  word_id: string
  desk_id: string
  added_at: string
}

/**
 * Get all desks for the current user
 */
export async function getUserDesks(): Promise<{
  data: Desk[] | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get desks with word count
    const { data, error } = await supabase
      .from('desks')
      .select(`
        *,
        word_count:word_desks(count)
      `)
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      return { data: null, error }
    }

    // Transform the data to include word_count as a number
    const transformedData = data?.map(desk => ({
      ...desk,
      word_count: desk.word_count?.[0]?.count || 0
    })) || []

    return { data: transformedData, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Create a new desk
 */
export async function createDesk({
  name,
  description,
  color = '#3B82F6',
  icon = 'book-open'
}: {
  name: string
  description?: string
  color?: string
  icon?: string
}): Promise<{
  data: Desk | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const deskData: TablesInsert<'desks'> = {
      user_id: user.id,
      name,
      description,
      color,
      icon,
      is_default: false
    }

    const { data, error } = await supabase
      .from('desks')
      .insert(deskData)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Update a desk
 */
export async function updateDesk(
  deskId: string,
  updates: {
    name?: string
    description?: string
    color?: string
    icon?: string
  }
): Promise<{
  data: Desk | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const updateData: TablesUpdate<'desks'> = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('desks')
      .update(updateData)
      .eq('id', deskId)
      .eq('user_id', user.id)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Delete a desk
 */
export async function deleteDesk(deskId: string): Promise<{ error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'User not authenticated' }
    }

    // Check if it's the default desk
    const { data: desk } = await supabase
      .from('desks')
      .select('is_default')
      .eq('id', deskId)
      .eq('user_id', user.id)
      .single()

    if (desk?.is_default) {
      return { error: 'Cannot delete the default desk' }
    }

    const { error } = await supabase
      .from('desks')
      .delete()
      .eq('id', deskId)
      .eq('user_id', user.id)

    return { error }
  } catch (error) {
    return { error }
  }
}

/**
 * Add a word to a desk
 */
export async function addWordToDesk(
  wordId: string,
  deskId: string
): Promise<{ error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'User not authenticated' }
    }

    // Verify the word belongs to the user
    const { data: word } = await supabase
      .from('words')
      .select('id')
      .eq('id', wordId)
      .eq('user_id', user.id)
      .single()

    if (!word) {
      return { error: 'Word not found' }
    }

    // Verify the desk belongs to the user
    const { data: desk } = await supabase
      .from('desks')
      .select('id')
      .eq('id', deskId)
      .eq('user_id', user.id)
      .single()

    if (!desk) {
      return { error: 'Desk not found' }
    }

    const { error } = await supabase
      .from('word_desks')
      .insert({
        word_id: wordId,
        desk_id: deskId
      })

    return { error }
  } catch (error) {
    return { error }
  }
}

/**
 * Remove a word from a desk
 */
export async function removeWordFromDesk(
  wordId: string,
  deskId: string
): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('word_desks')
      .delete()
      .eq('word_id', wordId)
      .eq('desk_id', deskId)

    return { error }
  } catch (error) {
    return { error }
  }
}

/**
 * Get words in a specific desk
 */
export async function getDeskWords(
  deskId: string,
  limit: number = 50
): Promise<{
  data: Array<any> | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('word_desks')
      .select(`
        added_at,
        words!inner(
          id,
          word,
          definition,
          language,
          difficulty,
          category,
          pronunciation,
          status,
          created_at,
          updated_at
        )
      `)
      .eq('desk_id', deskId)
      .eq('words.user_id', user.id)
      .order('added_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { data: null, error }
    }

    // Transform the data to flatten the words
    const transformedData = data?.map(item => ({
      ...item.words,
      added_to_desk_at: item.added_at
    })) || []

    return { data: transformedData, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get desks that contain a specific word
 */
export async function getWordDesks(wordId: string): Promise<{
  data: Desk[] | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('word_desks')
      .select(`
        desks!inner(
          id,
          user_id,
          name,
          description,
          color,
          icon,
          is_default,
          created_at,
          updated_at
        )
      `)
      .eq('word_id', wordId)
      .eq('desks.user_id', user.id)

    if (error) {
      return { data: null, error }
    }

    // Transform the data to flatten the desks
    const transformedData = (data?.map(item => item.desks) || []) as Desk[]

    return { data: transformedData, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Move words from one desk to another
 */
export async function moveWordsBetweenDesks(
  wordIds: string[],
  fromDeskId: string,
  toDeskId: string
): Promise<{ error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'User not authenticated' }
    }

    // Remove from old desk
    const { error: removeError } = await supabase
      .from('word_desks')
      .delete()
      .eq('desk_id', fromDeskId)
      .in('word_id', wordIds)

    if (removeError) {
      return { error: removeError }
    }

    // Add to new desk
    const insertData = wordIds.map(wordId => ({
      word_id: wordId,
      desk_id: toDeskId
    }))

    const { error: insertError } = await supabase
      .from('word_desks')
      .insert(insertData)

    return { error: insertError }
  } catch (error) {
    return { error }
  }
}

/**
 * Get default desk for user
 */
export async function getDefaultDesk(): Promise<{
  data: Desk | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('desks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
