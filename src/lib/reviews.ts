import { createClientComponentClient } from './supabase'
import { Review, SM2Result, TablesInsert, Word, WordStatus, LEARNING_STEPS, GRADUATION_INTERVAL } from '@/types'
import { calculateSM2, buttonToQuality } from '@/utils/sm2'

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

    if (wordError) {
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

    const now = new Date().toISOString()

    // Get learning words with reviews due now or in the past
    const { data: learningReviews, error: reviewError } = await supabase
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
      .lte('due_date', now)
      .order('due_date', { ascending: true })

    if (reviewError) {
      return { data: null, error: reviewError }
    }

    // Get latest review for each word
    const latestReviews = new Map<string, Review>()
    learningReviews?.forEach(review => {
      const existing = latestReviews.get(review.word_id)
      if (!existing || new Date(review.reviewed_at) > new Date(existing.reviewed_at)) {
        latestReviews.set(review.word_id, review as Review)
      }
    })

    // Get words that are in learning status
    const reviewedWordIds = Array.from(latestReviews.keys()).slice(0, limit)
    const { data: learningWords, error: wordsError } = reviewedWordIds.length > 0 ? 
      await supabase
        .from('words')
        .select('*')
        .in('id', reviewedWordIds)
        .eq('status', 'learning') : 
      { data: [], error: null }

    if (wordsError) {
      return { data: null, error: wordsError }
    }

    // Format results with review data
    const results = (learningWords || []).map(word => ({
      ...word,
      lastReview: latestReviews.get(word.id)
    })).slice(0, limit)

    return { data: results, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get words due for review today with configurable sort order
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

    const today = new Date().toISOString().split('T')[0]
    const endOfToday = new Date(`${today}T23:59:59.999Z`)

    // Fetch latest reviews for each word (no due_date filter here)
    const { data: allReviews, error: reviewError } = await supabase
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
      .order('reviewed_at', { ascending: false })

    if (reviewError) {
      return { data: null, error: reviewError }
    }

    // Pick the latest review per word
    const latestReviews = new Map<string, Review>()
    ;(allReviews || []).forEach(review => {
      if (!latestReviews.has(review.word_id)) {
        latestReviews.set(review.word_id, review as Review)
      }
    })

    // Get overdue words based on their latest review
    const overdueReviews = Array.from(latestReviews.values())
      .filter(r => new Date(r.due_date) <= endOfToday)

    let dueReviewedWordIds: string[] = []

    if (sort === 'recommended') {
      // RFC-006: Shuffled Overdue Sampling
      // Shuffle overdue word IDs to provide variety in each session
      const shuffledIds = [...overdueReviews]
        .map(r => r.word_id)
        .sort(() => 0.5 - Math.random()) // Simple shuffle
      
      dueReviewedWordIds = shuffledIds.slice(0, limit)
      
      console.log(`Applied shuffled overdue sampling: ${shuffledIds.length} overdue cards shuffled, selected first ${dueReviewedWordIds.length}`)
    } else {
      // Apply specific sort orders for other modes
      let sortedReviews = [...overdueReviews]
      
      if (sort === 'oldest') {
        sortedReviews.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      } else if (sort === 'easiest') {
        sortedReviews.sort((a, b) => (b.ease_factor || 2.5) - (a.ease_factor || 2.5))
      } else if (sort === 'hardest') {
        sortedReviews.sort((a, b) => (a.ease_factor || 2.5) - (b.ease_factor || 2.5))
      }
      
      dueReviewedWordIds = sortedReviews
        .map(r => r.word_id)
        .slice(0, limit)
    }

    // Get words that have never been reviewed
    let unreviewedQuery = supabase
      .from('words')
      .select('*')
      .eq('user_id', user.id)

    if (latestReviews.size > 0) {
      const reviewedWordIds = Array.from(latestReviews.keys())
      unreviewedQuery = unreviewedQuery.not('id', 'in', `(${reviewedWordIds.join(',')})`)
    }

    const { data: unreviewed, error: unreviewedError } = await unreviewedQuery.limit(limit)

    if (unreviewedError) {
      return { data: null, error: unreviewedError }
    }

    // Get word details for due reviewed words
    const { data: reviewedWords, error: wordsError } = dueReviewedWordIds.length > 0 ? 
      await supabase
        .from('words')
        .select('*')
        .in('id', dueReviewedWordIds) : 
      { data: [], error: null }

    if (wordsError) {
      return { data: null, error: wordsError }
    }

    // Combine and format results
    let results = [
      // Add due reviewed words with their last review data
      ...(reviewedWords || []).map(word => ({
        ...word,
        lastReview: latestReviews.get(word.id)
      })),
      // Add unreviewed words
      ...(unreviewed || [])
    ]

    // Apply final sorting to maintain order for sorted modes
    if (sort !== 'recommended' && dueReviewedWordIds.length > 0) {
      // Create a map to preserve sort order for reviewed words
      const orderMap = new Map(dueReviewedWordIds.map((id, index) => [id, index]))
      
      const reviewedWordsWithOrder = results.filter(w => w.lastReview)
      const unreviewedWords = results.filter(w => !w.lastReview)
      
      // Sort reviewed words by their original order
      reviewedWordsWithOrder.sort((a, b) => {
        const aOrder = orderMap.get(a.id) ?? Infinity
        const bOrder = orderMap.get(b.id) ?? Infinity
        return aOrder - bOrder
      })
      
      results = [...reviewedWordsWithOrder, ...unreviewedWords]
    }

    return { data: results.slice(0, limit), error: null }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get review statistics for a user (optimized with database aggregation)
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

    // Use database aggregation for better performance
    const [
      { count: totalReviews },
      { count: todaysReviews },
      { count: correctReviews },
      { data: avgEaseFactor },
      { data: dueWords },
      { data: streakData }
    ] = await Promise.all([
      // Total reviews count
      supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      // Today's reviews count
      supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('reviewed_at', `${today}T00:00:00.000Z`)
        .lte('reviewed_at', `${today}T23:59:59.999Z`),
      
      // Correct reviews count (quality >= 3)
      supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('quality', 3),
      
      // Average ease factor - get recent reviews for calculation
      supabase
        .from('reviews')
        .select('ease_factor')
        .eq('user_id', user.id)
        .gt('ease_factor', 0)
        .order('reviewed_at', { ascending: false })
        .limit(100), // Get last 100 reviews for average
      
      // Words due today
      getDueWords(100),
      
      // Streak calculation - get distinct review dates from last 30 days
      supabase
        .from('reviews')
        .select('reviewed_at')
        .eq('user_id', user.id)
        .gte('reviewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('reviewed_at', { ascending: false })
    ])

    // Only count reviewed words that are due today (exclude brand-new/unreviewed)
    const wordsDueToday = (dueWords || []).filter((w: any) => !!w.lastReview).length
    const retentionRate = (totalReviews || 0) > 0 ? Math.round(((correctReviews || 0) / (totalReviews || 1)) * 100) : 0
    
    // Calculate average ease factor from recent reviews
    const easeFactors = avgEaseFactor?.map(r => r.ease_factor).filter(ef => ef > 0) || []
    const averageEaseFactor = easeFactors.length > 0 ? 
      easeFactors.reduce((sum, ef) => sum + ef, 0) / easeFactors.length : 2.5

    // Timezone-aware current streak (reviews-per-day)
    // Fetch user timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single()
    const userTimeZone = profile?.timezone || 'UTC'

    const formatDateInTimeZone = (date: Date, timeZone: string): string => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(date)
      const y = parts.find(p => p.type === 'year')?.value || '1970'
      const m = parts.find(p => p.type === 'month')?.value || '01'
      const d = parts.find(p => p.type === 'day')?.value || '01'
      return `${y}-${m}-${d}`
    }
    const addDaysISO = (isoDate: string, days: number): string => {
      const d = new Date(isoDate + 'T00:00:00.000Z')
      d.setUTCDate(d.getUTCDate() + days)
      return d.toISOString().split('T')[0]
    }

    let currentStreak = 0
    if (streakData && streakData.length > 0) {
      const reviewDays = new Set(
        streakData.map(r => formatDateInTimeZone(new Date(r.reviewed_at), userTimeZone))
      )
      const todayTz = formatDateInTimeZone(new Date(), userTimeZone)
      let probe = todayTz
      for (let i = 0; i < 365; i++) {
        if (reviewDays.has(probe)) {
          currentStreak++
          probe = addDaysISO(probe, -1)
        } else {
          break
        }
      }
    }

    return {
      totalReviews: totalReviews || 0,
      todaysReviews: todaysReviews || 0,
      wordsDueToday,
      retentionRate,
      averageEaseFactor: Math.round(averageEaseFactor * 100) / 100,
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
