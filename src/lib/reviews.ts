import { createClientComponentClient } from './supabase'
import { Review, SM2Result, TablesInsert, Word } from '@/types'
import { calculateSM2, buttonToQuality } from '@/utils/sm2'

const supabase = createClientComponentClient()

/**
 * Submit a review for a word and update SM-2 scheduling
 */
export async function submitReview({
  wordId,
  flashcardId,
  button,
  responseTimeMs
}: {
  wordId: string
  flashcardId?: string
  button: 'again' | 'hard' | 'good' | 'easy'
  responseTimeMs?: number
}): Promise<{ data: Review | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get the most recent review for this word to get current SM-2 values
    const { data: lastReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('word_id', wordId)
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .single()

    // Calculate new SM-2 values
    const quality = buttonToQuality(button)
    const sm2Result = calculateSM2({
      quality,
      ease_factor: lastReview?.ease_factor || 2.5,
      interval_days: lastReview?.interval_days || 1,
      repetitions: lastReview?.repetitions || 0
    })

    // Insert new review record
    const reviewData: TablesInsert<'reviews'> = {
      user_id: user.id,
      word_id: wordId,
      flashcard_id: flashcardId || null,
      quality,
      ease_factor: sm2Result.ease_factor,
      interval_days: sm2Result.interval_days,
      repetitions: sm2Result.repetitions,
      due_date: sm2Result.due_date.toISOString(),
      reviewed_at: new Date().toISOString(),
      response_time_ms: responseTimeMs || null
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get words due for review today
 */
export async function getDueWords(limit: number = 20): Promise<{
  data: Array<Word & { lastReview?: Review }> | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const today = new Date().toISOString().split('T')[0]

    // Get words with reviews due today or earlier
    const { data: dueReviews, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        word_id,
        ease_factor,
        interval_days,
        repetitions,
        due_date,
        quality,
        reviewed_at
      `)
      .eq('user_id', user.id)
      .lte('due_date', `${today}T23:59:59.999Z`)
      .order('due_date', { ascending: true })

    if (reviewError) {
      return { data: null, error: reviewError }
    }

    // Get latest review for each word (to avoid duplicates)
    const latestReviews = new Map<string, Review>()
    dueReviews?.forEach(review => {
      const existing = latestReviews.get(review.word_id)
      if (!existing || new Date(review.reviewed_at) > new Date(existing.reviewed_at)) {
        latestReviews.set(review.word_id, review as Review)
      }
    })

    // Get words that have never been reviewed
    const { data: unreviewed, error: unreviewedError } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', user.id)
      .not('id', 'in', `(${Array.from(latestReviews.keys()).map(id => `'${id}'`).join(',') || "''"})`)
      .limit(limit)

    if (unreviewedError) {
      return { data: null, error: unreviewedError }
    }

    // Get word details for reviewed words
    const reviewedWordIds = Array.from(latestReviews.keys()).slice(0, limit)
    const { data: reviewedWords, error: wordsError } = reviewedWordIds.length > 0 ? 
      await supabase
        .from('words')
        .select('*')
        .in('id', reviewedWordIds) : 
      { data: [], error: null }

    if (wordsError) {
      return { data: null, error: wordsError }
    }

    // Combine and format results
    const results = [
      // Add reviewed words with their last review data
      ...(reviewedWords || []).map(word => ({
        ...word,
        lastReview: latestReviews.get(word.id)
      })),
      // Add unreviewed words
      ...(unreviewed || [])
    ].slice(0, limit)

    return { data: results, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get review statistics for a user
 */
export async function getReviewStats(): Promise<{
  totalReviews: number
  todaysReviews: number
  wordsDueToday: number
  retentionRate: number
  averageEaseFactor: number
  currentStreak: number
  error?: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { 
        totalReviews: 0, 
        todaysReviews: 0, 
        wordsDueToday: 0, 
        retentionRate: 0, 
        averageEaseFactor: 2.5, 
        currentStreak: 0,
        error: 'User not authenticated' 
      }
    }

    const today = new Date().toISOString().split('T')[0]

    // Get all reviews for calculations
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('quality, ease_factor, reviewed_at, due_date')
      .eq('user_id', user.id)
      .order('reviewed_at', { ascending: false })

    if (reviewsError) {
      return { 
        totalReviews: 0, 
        todaysReviews: 0, 
        wordsDueToday: 0, 
        retentionRate: 0, 
        averageEaseFactor: 2.5, 
        currentStreak: 0,
        error: reviewsError 
      }
    }

    // Calculate statistics
    const totalReviews = reviews?.length || 0
    const todaysReviews = reviews?.filter(r => 
      r.reviewed_at.startsWith(today)
    ).length || 0

    const { data: dueWords } = await getDueWords(100)
    const wordsDueToday = dueWords?.length || 0

    const correctReviews = reviews?.filter(r => r.quality >= 3).length || 0
    const retentionRate = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0

    const easeFactors = reviews?.map(r => r.ease_factor).filter(ef => ef > 0) || []
    const averageEaseFactor = easeFactors.length > 0 ? 
      Math.round((easeFactors.reduce((sum, ef) => sum + ef, 0) / easeFactors.length) * 100) / 100 : 2.5

    // Calculate current streak (consecutive days with reviews)
    let currentStreak = 0
    const reviewDates = [...new Set(reviews?.map(r => r.reviewed_at.split('T')[0]) || [])]
    reviewDates.sort((a, b) => b.localeCompare(a)) // Most recent first

    for (let i = 0; i < reviewDates.length; i++) {
      const date = new Date(reviewDates[i])
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - i)
      
      if (date.toDateString() === expectedDate.toDateString()) {
        currentStreak++
      } else {
        break
      }
    }

    return {
      totalReviews,
      todaysReviews,
      wordsDueToday,
      retentionRate,
      averageEaseFactor,
      currentStreak
    }
  } catch (error) {
    return { 
      totalReviews: 0, 
      todaysReviews: 0, 
      wordsDueToday: 0, 
      retentionRate: 0, 
      averageEaseFactor: 2.5, 
      currentStreak: 0,
      error 
    }
  }
}

/**
 * Get next review prediction for a word
 */
export async function getNextReviewPrediction(wordId: string): Promise<{
  intervals: Record<'again' | 'hard' | 'good' | 'easy', number>
  dueDates: Record<'again' | 'hard' | 'good' | 'easy', Date>
  error?: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { 
        intervals: { again: 1, hard: 1, good: 6, easy: 6 }, 
        dueDates: { again: new Date(), hard: new Date(), good: new Date(), easy: new Date() },
        error: 'User not authenticated' 
      }
    }

    // Get last review for the word
    const { data: lastReview } = await supabase
      .from('reviews')
      .select('ease_factor, interval_days, repetitions')
      .eq('user_id', user.id)
      .eq('word_id', wordId)
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .single()

    const currentEaseFactor = lastReview?.ease_factor || 2.5
    const currentInterval = lastReview?.interval_days || 1
    const currentRepetitions = lastReview?.repetitions || 0

    // Calculate intervals for each button
    const buttons = ['again', 'hard', 'good', 'easy'] as const
    const intervals: Record<typeof buttons[number], number> = {} as any
    const dueDates: Record<typeof buttons[number], Date> = {} as any

    buttons.forEach(button => {
      const quality = buttonToQuality(button)
      const result = calculateSM2({
        quality,
        ease_factor: currentEaseFactor,
        interval_days: currentInterval,
        repetitions: currentRepetitions
      })
      intervals[button] = result.interval_days
      dueDates[button] = result.due_date
    })

    return { intervals, dueDates }
  } catch (error) {
    return { 
      intervals: { again: 1, hard: 1, good: 6, easy: 6 }, 
      dueDates: { again: new Date(), hard: new Date(), good: new Date(), easy: new Date() },
      error 
    }
  }
}

/**
 * Reset a word's review history (for debugging/admin)
 */
export async function resetWordProgress(wordId: string): Promise<{ error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('user_id', user.id)
      .eq('word_id', wordId)

    return { error }
  } catch (error) {
    return { error }
  }
}

/**
 * Get learning progress for a word
 */
export async function getWordProgress(wordId: string): Promise<{
  totalReviews: number
  currentEaseFactor: number
  currentInterval: number
  nextDueDate: Date | null
  difficultyTrend: 'improving' | 'stable' | 'declining'
  error?: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { 
        totalReviews: 0, 
        currentEaseFactor: 2.5, 
        currentInterval: 1, 
        nextDueDate: null, 
        difficultyTrend: 'stable',
        error: 'User not authenticated' 
      }
    }

    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('ease_factor, interval_days, quality, due_date, reviewed_at')
      .eq('user_id', user.id)
      .eq('word_id', wordId)
      .order('reviewed_at', { ascending: true })

    if (reviewsError) {
      return { 
        totalReviews: 0, 
        currentEaseFactor: 2.5, 
        currentInterval: 1, 
        nextDueDate: null, 
        difficultyTrend: 'stable',
        error: reviewsError 
      }
    }

    const totalReviews = reviews?.length || 0
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        currentEaseFactor: 2.5,
        currentInterval: 1,
        nextDueDate: null,
        difficultyTrend: 'stable'
      }
    }

    const latestReview = reviews[reviews.length - 1]
    const currentEaseFactor = latestReview.ease_factor
    const currentInterval = latestReview.interval_days
    const nextDueDate = new Date(latestReview.due_date)

    // Calculate difficulty trend based on recent ease factor changes
    let difficultyTrend: 'improving' | 'stable' | 'declining' = 'stable'
    if (reviews.length >= 3) {
      const recentReviews = reviews.slice(-3)
      const easeFactorTrend = recentReviews[2].ease_factor - recentReviews[0].ease_factor
      
      if (easeFactorTrend > 0.1) {
        difficultyTrend = 'improving'
      } else if (easeFactorTrend < -0.1) {
        difficultyTrend = 'declining'
      }
    }

    return {
      totalReviews,
      currentEaseFactor,
      currentInterval,
      nextDueDate,
      difficultyTrend
    }
  } catch (error) {
    return { 
      totalReviews: 0, 
      currentEaseFactor: 2.5, 
      currentInterval: 1, 
      nextDueDate: null, 
      difficultyTrend: 'stable',
      error 
    }
  }
}
