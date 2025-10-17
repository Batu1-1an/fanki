import { createClientComponentClient } from './supabase'
import { Word, Card, Review, StudySession } from '@/types'

const supabase = createClientComponentClient()

export interface ExportData {
  version: string
  exportDate: string
  userId: string
  words: Word[]
  cards?: Card[]
  reviews: Review[]
  studySessions: StudySession[]
  desks?: any[]
}

/**
 * Export all user data to JSON format
 */
export async function exportToJSON(): Promise<{
  data: string | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Fetch all user data in parallel
    const [
      { data: words },
      { data: cards },
      { data: reviews },
      { data: studySessions },
      { data: desks }
    ] = await Promise.all([
      supabase.from('words').select('*').eq('user_id', user.id),
      supabase.from('cards')
        .select('*, notes!inner(*)')
        .eq('notes.user_id', user.id),
      supabase.from('reviews').select('*').eq('user_id', user.id),
      supabase.from('study_sessions').select('*').eq('user_id', user.id),
      supabase.from('desks').select('*').eq('user_id', user.id)
    ])

    const exportData: ExportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      userId: user.id,
      words: words || [],
      cards: cards || [],
      reviews: reviews || [],
      studySessions: studySessions || [],
      desks: desks || []
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    return { data: jsonString, error: null }
  } catch (error) {
    console.error('Export to JSON error:', error)
    return { data: null, error }
  }
}

/**
 * Export user data to CSV format
 */
export async function exportToCSV(): Promise<{
  data: { words: string; reviews: string } | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Fetch data
    const [{ data: words }, { data: reviews }] = await Promise.all([
      supabase.from('words').select('*').eq('user_id', user.id),
      supabase.from('reviews').select('*').eq('user_id', user.id)
    ])

    if (!words || !reviews) {
      return { data: null, error: 'Failed to fetch data' }
    }

    // Convert words to CSV
    const wordsCSV = convertToCSV(words, [
      'id',
      'word',
      'definition',
      'language',
      'difficulty',
      'pronunciation',
      'status',
      'created_at',
      'updated_at'
    ])

    // Convert reviews to CSV
    const reviewsCSV = convertToCSV(reviews, [
      'id',
      'word_id',
      'quality',
      'ease_factor',
      'interval_days',
      'repetitions',
      'due_date',
      'reviewed_at'
    ])

    return {
      data: {
        words: wordsCSV,
        reviews: reviewsCSV
      },
      error: null
    }
  } catch (error) {
    console.error('Export to CSV error:', error)
    return { data: null, error }
  }
}

/**
 * Helper function to convert array of objects to CSV
 */
function convertToCSV(data: any[], columns: string[]): string {
  // Header row
  const header = columns.join(',')
  
  // Data rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col]
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return ''
      }
      
      // Handle objects/arrays
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`
      }
      
      // Handle strings with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      
      return value
    }).join(',')
  })
  
  return [header, ...rows].join('\n')
}

/**
 * Download data as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'application/json') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  
  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Export to Anki format (APKG package format)
 * Note: This is a simplified version. Full APKG export would require
 * creating a SQLite database and ZIP file, which is complex in the browser.
 * This exports to a format that can be imported via Anki's text import.
 */
export async function exportToAnki(): Promise<{
  data: string | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Fetch words with their flashcards
    const { data: words, error: wordsError } = await supabase
      .from('words')
      .select('*, flashcards(*)')
      .eq('user_id', user.id)

    if (wordsError || !words) {
      return { data: null, error: wordsError || 'Failed to fetch words' }
    }

    // Convert to Anki text format (tab-separated: Front TAB Back TAB Tags)
    const ankiLines = words.map(word => {
      const front = word.word
      const back = word.definition || ''
      const tags = `fanki difficulty:${word.difficulty}`
      
      // Escape tabs and newlines
      const escapedFront = front.replace(/\t/g, ' ').replace(/\n/g, '<br>')
      const escapedBack = back.replace(/\t/g, ' ').replace(/\n/g, '<br>')
      
      return `${escapedFront}\t${escapedBack}\t${tags}`
    })

    // Add header
    const header = '#separator:Tab\n#html:true\n#deck:Fanki Import\n#tags column:3\n'
    const ankiText = header + ankiLines.join('\n')

    return { data: ankiText, error: null }
  } catch (error) {
    console.error('Export to Anki error:', error)
    return { data: null, error }
  }
}

/**
 * Import data from JSON
 */
export async function importFromJSON(jsonString: string): Promise<{
  imported: { words: number; reviews: number }
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { imported: { words: 0, reviews: 0 }, error: 'User not authenticated' }
    }

    const exportData: ExportData = JSON.parse(jsonString)
    
    // Validate format
    if (!exportData.version || !exportData.words) {
      return { imported: { words: 0, reviews: 0 }, error: 'Invalid import format' }
    }

    // Import words (update user_id to current user)
    const wordsToImport = exportData.words.map(word => ({
      ...word,
      user_id: user.id,
      id: undefined // Let database generate new IDs
    }))

    const { data: importedWords, error: wordsError } = await supabase
      .from('words')
      .insert(wordsToImport)
      .select()

    if (wordsError) {
      return { imported: { words: 0, reviews: 0 }, error: wordsError }
    }

    return {
      imported: {
        words: importedWords?.length || 0,
        reviews: 0 // Reviews are linked to specific words, so we don't import them
      },
      error: null
    }
  } catch (error) {
    console.error('Import from JSON error:', error)
    return { imported: { words: 0, reviews: 0 }, error }
  }
}

/**
 * Get export statistics
 */
export async function getExportStats(): Promise<{
  data: {
    totalWords: number
    totalCards: number
    totalReviews: number
    totalSessions: number
    estimatedSizeKB: number
  } | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get counts
    const [
      { count: wordsCount },
      { count: cardsCount },
      { count: reviewsCount },
      { count: sessionsCount }
    ] = await Promise.all([
      supabase.from('words').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('cards')
        .select('*, notes!inner(*)', { count: 'exact', head: true })
        .eq('notes.user_id', user.id),
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('study_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    ])

    // Estimate size (rough calculation)
    const avgWordSize = 500 // bytes
    const avgReviewSize = 200 // bytes
    const estimatedBytes = 
      (wordsCount || 0) * avgWordSize +
      (reviewsCount || 0) * avgReviewSize +
      10000 // overhead

    return {
      data: {
        totalWords: wordsCount || 0,
        totalCards: cardsCount || 0,
        totalReviews: reviewsCount || 0,
        totalSessions: sessionsCount || 0,
        estimatedSizeKB: Math.ceil(estimatedBytes / 1024)
      },
      error: null
    }
  } catch (error) {
    console.error('Get export stats error:', error)
    return { data: null, error }
  }
}
