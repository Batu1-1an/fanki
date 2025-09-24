import { createClientComponentClient } from './supabase'
import { Review, SM2Result, TablesInsert, Word, WordStatus, LEARNING_STEPS, GRADUATION_INTERVAL } from '@/types'
import { calculateSM2, buttonToQuality } from '@/utils/sm2'
import { getStudySessionStats } from '@/lib/study-sessions'

const supabase = createClientComponentClient()

/**
 * Submit a review for a word and update SM-2 scheduling or learning phase
 * RFC-001: flashcardId is optional and will be null for dynamic sentence generation
 */
export async function submitReview({
  wordId,
  flashcardId,
  button,
  responseTimeMs
}: {
  wordId: string
  flashcardId?: string | null
  button: 'again' | 'hard' | 'good' | 'easy'
  responseTimeMs?: number
}): Promise<{ data: Review | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get word and its current status
    const { data: word, error: wordError } = await supabase
      .from('words')
      .select('status')
      .eq('id', wordId)
      .single()

    if (wordError && Object.keys(wordError).length > 0) {
      return { data: null, error: wordError }
    }

    // Get the most recent review for this word
    const { data: lastReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('word_id', wordId)
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .single()

    const quality = buttonToQuality(button)
    let reviewData: TablesInsert<'reviews'>
    let newWordStatus: WordStatus = word.status

    // Handle learning phase differently from regular SM-2
    if (word.status === 'new' || word.status === 'learning') {
      const result = await handleLearningPhase({
        wordId,
        quality,
        button,
        lastReview,
        currentStatus: word.status
      })
      
      reviewData = {
        user_id: user.id,
        word_id: wordId,
        flashcard_id: flashcardId || null, // RFC-001: null for dynamic sentences
        quality,
        ease_factor: result.ease_factor,
        interval_days: result.interval_days,
        repetitions: result.repetitions,
        due_date: result.due_date.toISOString(),
        reviewed_at: new Date().toISOString(),
        response_time_ms: responseTimeMs || null
      }
      
      newWordStatus = result.newStatus
    } else {
      // Regular SM-2 for review cards
      const sm2Result = calculateSM2({
        quality,
        ease_factor: lastReview?.ease_factor || 2.5,
        interval_days: lastReview?.interval_days || 1,
        repetitions: lastReview?.repetitions || 0
      })

      reviewData = {
        user_id: user.id,
        word_id: wordId,
        flashcard_id: flashcardId || null, // RFC-001: null for dynamic sentences
        quality,
        ease_factor: sm2Result.ease_factor,
        interval_days: sm2Result.interval_days,
        repetitions: sm2Result.repetitions,
        due_date: sm2Result.due_date.toISOString(),
        reviewed_at: new Date().toISOString(),
        response_time_ms: responseTimeMs || null
      }
    }

    // Insert review record
    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    // Update word status if it changed
    if (newWordStatus !== word.status) {
      await supabase
        .from('words')
        .update({ status: newWordStatus })
        .eq('id', wordId)
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Handle learning phase progression
 */
async function handleLearningPhase({
  wordId,
  quality,
  button,
  lastReview,
  currentStatus
}: {
  wordId: string
  quality: number
  button: 'again' | 'hard' | 'good' | 'easy'
  lastReview?: Review
  currentStatus: WordStatus
}): Promise<{
  ease_factor: number
  interval_days: number
  repetitions: number
  due_date: Date
  newStatus: WordStatus
}> {
  const now = new Date()
  let newStatus: WordStatus = currentStatus
  let ease_factor = 2.5
  let interval_days = 0
  let repetitions = lastReview?.repetitions || 0

  if (currentStatus === 'new') {
    // New card - move to learning phase
    newStatus = 'learning'
    repetitions = 0
  }

  if (button === 'again') {
    // Reset to first learning step
    interval_days = 0 // Show again in 1 minute (handled by queue manager)
    const dueDate = new Date(now.getTime() + LEARNING_STEPS[0] * 60 * 1000)
    return {
      ease_factor,
      interval_days,
      repetitions,
      due_date: dueDate,
      newStatus: 'learning'
    }
  }

  if (currentStatus === 'learning') {
    if (button === 'good' || button === 'hard') {
      // Move to next learning step or graduate
      const currentStep = lastReview ? Math.min(lastReview.repetitions, LEARNING_STEPS.length - 1) : 0
      
      if (currentStep < LEARNING_STEPS.length - 1) {
        // Move to next learning step
        const nextStep = currentStep + 1
        repetitions = nextStep
        interval_days = 0
        const dueDate = new Date(now.getTime() + LEARNING_STEPS[nextStep] * 60 * 1000)
        return {
          ease_factor,
          interval_days,
          repetitions,
          due_date: dueDate,
          newStatus: 'learning'
        }
      } else {
        // Graduate to review
        newStatus = 'review'
        repetitions = 1
        interval_days = GRADUATION_INTERVAL
        ease_factor = 2.5
        const dueDate = new Date(now.getTime() + interval_days * 24 * 60 * 60 * 1000)
        return {
          ease_factor,
          interval_days,
          repetitions,
          due_date: dueDate,
          newStatus: 'review'
        }
      }
    }
    
    if (button === 'easy') {
      // Graduate immediately
      newStatus = 'review'
      repetitions = 1
      interval_days = 4 // Easy graduation gets 4 days
      ease_factor = 2.6
      const dueDate = new Date(now.getTime() + interval_days * 24 * 60 * 60 * 1000)
      return {
        ease_factor,
        interval_days,
        repetitions,
        due_date: dueDate,
        newStatus: 'review'
      }
    }
  }

  // Default fallback
  const dueDate = new Date(now.getTime() + LEARNING_STEPS[0] * 60 * 1000)
  return {
    ease_factor,
    interval_days: 0,
    repetitions,
    due_date: dueDate,
    newStatus: 'learning'
  }
}

/**
 * Get words currently in learning phase (due for review in current session)
 */
export async function getLearningWords(limit: number = 20): Promise<{
  data: Array<Word & { lastReview?: Review }> | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Use the new optimized database function
    const { data: learningWords, error: learningError } = await supabase
      .rpc('get_learning_words_optimized', {
        p_user_id: user.id,
        p_limit: limit
      })

    if (learningError && Object.keys(learningError).length > 0) {
      console.error('Error fetching learning words:', learningError)
      return { data: null, error: learningError }
    }

    if (!learningWords || learningWords.length === 0) {
      return { data: [], error: null }
    }

    // Transform the database results to match the expected format
    const results = learningWords.map((row: any) => {
      const word: Word & { lastReview?: Review } = {
        id: row.word_id,
        user_id: user.id,
        word: row.word,
        definition: row.definition,
        language: 'en', // Default language
        difficulty: row.difficulty,
        category: null, // Default category
        pronunciation: row.pronunciation,
        status: row.status as WordStatus,
        memory_hook: null, // Default memory hook
        created_at: row.created_at,
        updated_at: row.created_at
      }

      // Add review data (should always exist for learning words)
      word.lastReview = {
        id: `${row.word_id}_latest`,
        user_id: user.id,
        word_id: row.word_id,
        flashcard_id: null,
        quality: row.quality,
        ease_factor: Number(row.ease_factor),
        interval_days: row.interval_days,
        repetitions: row.repetitions,
        due_date: row.due_date,
        reviewed_at: row.reviewed_at,
        response_time_ms: null,
        created_at: row.reviewed_at
      }

      return word
    })

    return { data: results, error: null }
  } catch (error) {
    console.error('Failed to get learning words:', error)
    return { data: null, error }
  }
}

/**
 * Get words due for review today with configurable sort order (optimized database version)
 */
export async function getDueWords(limit: number = 20, sort: 'recommended' | 'oldest' | 'easiest' | 'hardest' = 'recommended'): Promise<{
  data: Array<Word & { lastReview?: Review }> | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Use the new optimized database function
    const { data: dueWords, error: dueError } = await supabase
      .rpc('get_due_words_optimized', {
        p_user_id: user.id,
        p_limit: limit,
        p_sort_order: sort
      })

    if (dueError && Object.keys(dueError).length > 0) {
      console.error('Error fetching due words:', dueError)
      return { data: null, error: dueError }
    }

    if (!dueWords || dueWords.length === 0) {
      return { data: [], error: null }
    }

    // Transform the database results to match the expected format
    const results = dueWords.map((row: any) => {
      const word: Word & { lastReview?: Review } = {
        id: row.word_id,
        user_id: user.id,
        word: row.word,
        definition: row.definition,
        language: 'en', // Default language - should ideally be stored in database
        difficulty: row.difficulty,
        category: null, // Default category
        pronunciation: row.pronunciation,
        status: row.status as WordStatus,
        memory_hook: null, // Default memory hook
        created_at: row.created_at,
        updated_at: row.created_at // Use created_at as fallback
      }

      // Add review data if it exists
      if (row.reviewed_at) {
        word.lastReview = {
          id: `${row.word_id}_latest`, // Placeholder ID since we don't return it from function
          user_id: user.id,
          word_id: row.word_id,
          flashcard_id: null,
          quality: row.quality,
          ease_factor: Number(row.ease_factor),
          interval_days: row.interval_days,
          repetitions: row.repetitions,
          due_date: row.due_date,
          reviewed_at: row.reviewed_at,
          response_time_ms: null,
          created_at: row.reviewed_at // Use reviewed_at as created_at for reviews
        }
      }

      return word
    })

    // Add logging for recommended mode to track shuffle behavior
    if (sort === 'recommended' && results.length > 0) {
      const overdueCount = results.filter((w: Word & { lastReview?: Review }) => 
        w.lastReview && new Date(w.lastReview.due_date) < new Date()
      ).length
      console.log(`Applied optimized shuffled sampling: ${overdueCount} overdue cards in result set of ${results.length}`)
    }

    return { data: results, error: null }
  } catch (error) {
    console.error('Failed to get due words:', error)
    return { data: null, error }
  }
}

/**
 * Get review statistics for a user (optimized with database functions)
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

    // Use the new optimized database function for accurate statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_review_statistics', { p_user_id: user.id })

    if (statsError) {
      console.error('Error fetching review statistics:', statsError)
      throw statsError
    }

    // RFC-007: Fetch streak data from the authoritative source
    const { currentStreak: streakFromSessions } = await getStudySessionStats()

    const statsRow = stats?.[0]
    if (!statsRow) {
      return {
        totalReviews: 0,
        todaysReviews: 0,
        wordsDueToday: 0,
        retentionRate: 0,
        averageEaseFactor: 2.5,
        currentStreak: streakFromSessions
      }
    }

    const retentionRate = statsRow.total_reviews > 0 ? 
      Math.round((statsRow.correct_reviews / statsRow.total_reviews) * 100) : 0

    return {
      totalReviews: Number(statsRow.total_reviews) || 0,
      todaysReviews: Number(statsRow.todays_reviews) || 0,
      wordsDueToday: Number(statsRow.words_due_today) || 0,
      retentionRate,
      averageEaseFactor: Math.round(Number(statsRow.avg_ease_factor || 2.5) * 100) / 100,
      currentStreak: streakFromSessions
    }
  } catch (error) {
    console.error('Failed to get review stats:', error)
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
 * Get accurate due word counts without limits (using optimized database function)
 */
export async function getDueWordCounts(deskId?: string): Promise<{
  totalDue: number
  overdue: number
  dueToday: number
  newWords: number
  error?: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { 
        totalDue: 0, 
        overdue: 0, 
        dueToday: 0, 
        newWords: 0, 
        error: 'User not authenticated' 
      }
    }

    // Use the new optimized database function for accurate counts
    const { data: counts, error: countsError } = await supabase
      .rpc('get_due_word_counts', { 
        p_user_id: user.id,
        p_desk_id: deskId || null
      })

    if (countsError) {
      console.error('Error fetching due word counts:', countsError)
      throw countsError
    }

    const countRow = counts?.[0]
    if (!countRow) {
      return {
        totalDue: 0,
        overdue: 0,
        dueToday: 0,
        newWords: 0
      }
    }

    return {
      totalDue: Number(countRow.total_due) || 0,
      overdue: Number(countRow.overdue) || 0,
      dueToday: Number(countRow.due_today) || 0,
      newWords: Number(countRow.new_words) || 0
    }
  } catch (error) {
    console.error('Failed to get due word counts:', error)
    return { 
      totalDue: 0, 
      overdue: 0, 
      dueToday: 0, 
      newWords: 0, 
      error 
    }
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
