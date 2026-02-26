import { createClientComponentClient } from './supabase/client'
import { Word, Review, FlashcardWithWord, WordStatus, LEARNING_STEPS } from '@/types'
import { getDueWords, getDueWordCounts, getWordProgress, getLearningWords } from './reviews'
import { getUserFlashcards } from './flashcards'
import { getDeskWords } from './desks'
import { getUserWords } from './words'
import { aiService } from './ai-services'
import { classifyDueDate } from './date-utils'
import { getBlankPosition } from './flashcard-text'

const INITIAL_CHUNK_SIZE = 2 // Fetch first 2 cards to start immediately

const supabase = createClientComponentClient()

export type QueuePriority = 'learning' | 'overdue' | 'due_today' | 'new' | 'review_soon'
export type StudyMode = 'mixed' | 'new_only' | 'review_only' | 'overdue_only' | 'due_today_only'

export interface QueuedWord extends Word {
  priority: QueuePriority
  daysSinceLastReview?: number
  currentEaseFactor?: number
  timesReviewed?: number
  lastReview?: Review
  flashcard?: FlashcardWithWord
  // Pre-fetched AI content for seamless study sessions
  sentences?: { sentence: string; blank_position: number; correct_word: string }[] | null
  imageUrl?: string | null
  imageDescription?: string | null
}

export interface QueueOptions {
  maxWords?: number
  studyMode?: StudyMode
  difficultyRange?: [number, number] // [min, max] ease factor
  prioritizeWeakWords?: boolean
  includeNewWords?: boolean
  deskId?: string // Filter by specific desk
  sortOrder?: 'recommended' | 'oldest' | 'easiest' | 'hardest' // RFC-006: Overdue sort order
  wordIds?: string[] // Target specific words (custom sessions, Today tab selections, etc.)
  includeLearning?: boolean // Include learning-phase (newly graduated) words
}

/**
 * Smart review queue manager that prioritizes words based on:
 * 1. Overdue status (highest priority)
 * 2. Difficulty (lower ease factor = higher priority)
 * 3. Time since last review
 * 4. Learning stage (new words vs review words)
 */
type PrefetchedContentUpdate = {
  sentences?: { sentence: string; blank_position: number; correct_word: string }[]
  imageUrl?: string | null
  imageDescription?: string | null
}

async function prefetchInitialContentForWords(
  words: QueuedWord[],
  userId: string | null
): Promise<Map<string, PrefetchedContentUpdate>> {
  const contentMap = new Map<string, PrefetchedContentUpdate>()

  if (!userId || INITIAL_CHUNK_SIZE <= 0 || words.length === 0) {
    return contentMap
  }

  const initialChunk = words.slice(0, INITIAL_CHUNK_SIZE)

  const results = await Promise.all(
    initialChunk.map(async (word) => {
      const hasSentences = Array.isArray(word.sentences) && word.sentences.length > 0
      const hasImage = !!word.imageUrl
      if (hasSentences && hasImage) {
        return null
      }

      try {
        const difficultyValue = word.difficulty ?? 3
        const difficulty = difficultyValue <= 2 ? 'beginner' : 
                         difficultyValue <= 4 ? 'intermediate' : 'advanced'

        const content = await aiService.generateFlashcardContent(word.word, difficulty, userId)

        const transformedSentences = Array.isArray(content.sentences)
          ? content.sentences.map((sentence: any) => {
              const sentenceText = typeof sentence === 'string' ? sentence : sentence.sentence || sentence.text || ''

              return {
                sentence: sentenceText,
                blank_position: getBlankPosition(sentenceText, sentence?.blank_position ?? 0),
                correct_word: word.word
              }
            })
          : []

        const update: PrefetchedContentUpdate = {}

        if (transformedSentences.length > 0) {
          update.sentences = transformedSentences
        }

        if (typeof content.imageUrl === 'string') {
          update.imageUrl = content.imageUrl
        }

        if (typeof content.imageDescription === 'string') {
          update.imageDescription = content.imageDescription
        }

        if (Object.keys(update).length === 0) {
          return null
        }

        return {
          wordId: word.id,
          content: update
        }
      } catch (error) {
        console.error(`Failed to pre-fetch content for word "${word.word}":`, error)
        return null
      }
    })
  )

  results.forEach(result => {
    if (result?.content) {
      contentMap.set(result.wordId, result.content)
    }
  })

  return contentMap
}

export class ReviewQueueManager {
  private static instance: ReviewQueueManager
  private currentQueue: QueuedWord[] = []
  private queueGenerated: Date | null = null
  private cacheByOptions: Map<string, { queue: QueuedWord[], stats: any, timestamp: Date, userId: string | null }> = new Map()

  static getInstance(): ReviewQueueManager {
    if (!ReviewQueueManager.instance) {
      ReviewQueueManager.instance = new ReviewQueueManager()
      // Set up cache invalidation listener
      ReviewQueueManager.instance.setupCacheInvalidation()
    }
    return ReviewQueueManager.instance
  }

  /**
   * Set up database cache invalidation listening
   */
  private setupCacheInvalidation(): void {
    try {
      // Listen for queue cache invalidation notifications from the database
      supabase
        .channel('queue_cache_invalidation')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'reviews' 
        }, () => {
          console.log('Queue cache invalidated due to review changes')
          this.invalidateCache()
        })
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'words' 
        }, () => {
          console.log('Queue cache invalidated due to word status changes')
          this.invalidateCache()
        })
        .subscribe()
    } catch (error) {
      console.warn('Failed to setup cache invalidation listener:', error)
    }
  }

  /**
   * Invalidate all cached queues
   */
  private invalidateCache(): void {
    this.currentQueue = []
    this.queueGenerated = null
    this.cacheByOptions.clear()
  }

  /**
   * Generate cache key from options
   */
  private getCacheKey(options: QueueOptions): string {
    return JSON.stringify({
      maxWords: options.maxWords,
      studyMode: options.studyMode,
      difficultyRange: options.difficultyRange,
      prioritizeWeakWords: options.prioritizeWeakWords,
      includeNewWords: options.includeNewWords,
      deskId: options.deskId,
      sortOrder: options.sortOrder,
      includeLearning: options.includeLearning
    })
  }

  /**
   * Generate optimized study queue with caching and desk filtering
   */
  async generateQueue(options: QueueOptions = {}): Promise<{
    queue: QueuedWord[]
    stats: {
      total: number
      overdue: number
      dueToday: number
      newWords: number
      averageDifficulty: number
    }
    userId: string | null
    error?: any
  }> {
    try {
      const {
        maxWords = 20,
        studyMode = 'mixed',
        difficultyRange = [1.3, 3.0],
        prioritizeWeakWords = true,
        includeNewWords = true,
        deskId,
        sortOrder = 'recommended',
        wordIds,
        includeLearning = true
      } = options

      const shouldUseCache = !wordIds || wordIds.length === 0
      let cacheKey: string | null = null

      if (shouldUseCache) {
        cacheKey = this.getCacheKey(options)
        const cached = this.cacheByOptions.get(cacheKey)
        const cacheExpired = !cached || Date.now() - cached.timestamp.getTime() > 5 * 60 * 1000 // 5 minutes

        if (!cacheExpired && cached) {
          console.log('Returning cached queue for options:', cacheKey)
          return { queue: cached.queue, stats: cached.stats, userId: cached.userId }
        }
      }

      // Get user for database queries
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }
      const userId = user.id

      // Use optimized database functions
      const [learningResult, dueWordsResult] = await Promise.all([
        includeLearning ? getLearningWords(50) : Promise.resolve({ data: [], error: null }),
        getDueWords(maxWords * 2, sortOrder, deskId && deskId !== 'all' ? deskId : undefined)
      ])

      if (learningResult.error) {
        console.warn('Error fetching learning words:', learningResult.error)
      }
      if (dueWordsResult.error) {
        return { 
          queue: [], 
          stats: { total: 0, overdue: 0, dueToday: 0, newWords: 0, averageDifficulty: 2.5 },
          userId,
          error: dueWordsResult.error 
        }
      }

      // Combine learning and due words, avoiding duplicates
      const learningWordIds = new Set((learningResult.data || []).map(w => w.id))
      let allWords = [
        ...(learningResult.data || []),
        ...(dueWordsResult.data || []).filter(word => !learningWordIds.has(word.id))
      ]

      // Filter to specific word IDs when provided (custom sessions)
      if (wordIds && wordIds.length > 0) {
        const wordIdSet = new Set(wordIds)
        allWords = allWords.filter(word => wordIdSet.has(word.id))
      }

      // Enrich words with queue metadata
      const enrichedWords = allWords.map((word) => {
        const queuedWord: QueuedWord = {
          ...word,
          priority: this.calculatePriority(word, { 
            currentEaseFactor: word.lastReview?.ease_factor || 2.5,
            totalReviews: 1
          }),
          daysSinceLastReview: this.calculateDaysSinceLastReview(word.lastReview),
          currentEaseFactor: word.lastReview?.ease_factor || 2.5,
          timesReviewed: word.lastReview?.repetitions || 0,
          lastReview: word.lastReview
        }
        return queuedWord
      })

      // Apply filters based on study mode
      let filteredWords = this.applyStudyModeFilter(enrichedWords, studyMode)

      // Apply difficulty filter
      if (difficultyRange) {
        filteredWords = filteredWords.filter(word => 
          (word.currentEaseFactor || 2.5) >= difficultyRange[0] && 
          (word.currentEaseFactor || 2.5) <= difficultyRange[1]
        )
      }

      // Sort by priority and difficulty (database should handle most sorting, but apply final touches)
      const sortedWords = this.sortByPriority(filteredWords, prioritizeWeakWords)

      // Limit to requested number
      const finalQueue = sortedWords.slice(0, maxWords)

      // Attach flashcards to queued words
      const [flashcardsResult, aiPrefetchResult] = await Promise.allSettled([
        this.attachFlashcards(finalQueue),
        prefetchInitialContentForWords(finalQueue, userId)
      ])

      let queueWithFlashcards: QueuedWord[] = finalQueue

      if (flashcardsResult.status === 'fulfilled') {
        queueWithFlashcards = flashcardsResult.value
      } else {
        console.error('Failed to attach flashcards to queue:', flashcardsResult.reason)
      }

      if (aiPrefetchResult.status === 'fulfilled') {
        const updates = aiPrefetchResult.value
        if (updates.size > 0) {
          queueWithFlashcards = queueWithFlashcards.map(word => {
            const update = updates.get(word.id)
            if (!update) {
              return word
            }

            return {
              ...word,
              sentences: update.sentences ?? word.sentences ?? null,
              imageUrl: update.imageUrl ?? word.imageUrl ?? null,
              imageDescription: update.imageDescription ?? word.imageDescription ?? null
            }
          })
        }
      } else {
        console.error('Failed to pre-fetch initial AI content:', aiPrefetchResult.reason)
      }

      // Calculate statistics
      const stats = this.calculateQueueStats(queueWithFlashcards)

      // Cache the results
      if (shouldUseCache && cacheKey) {
        this.cacheByOptions.set(cacheKey, {
          queue: queueWithFlashcards,
          stats,
          timestamp: new Date(),
          userId
        })
      }

      // Also update the simple cache for backwards compatibility
      this.currentQueue = queueWithFlashcards
      this.queueGenerated = new Date()

      return { queue: queueWithFlashcards, stats, userId }
    } catch (error) {
      console.error('Failed to generate queue:', error)
      return { 
        queue: [], 
        stats: { total: 0, overdue: 0, dueToday: 0, newWords: 0, averageDifficulty: 2.5 },
        userId: null,
        error 
      }
    }
  }

  /**
   * Get current cached queue or generate new one
   */
  async getCurrentQueue(forceRefresh: boolean = false): Promise<QueuedWord[]> {
    const cacheExpired = !this.queueGenerated || 
      Date.now() - this.queueGenerated.getTime() > 5 * 60 * 1000 // 5 minutes

    if (forceRefresh || cacheExpired || this.currentQueue.length === 0) {
      const { queue } = await this.generateQueue()
      return queue
    }

    return this.currentQueue
  }

  /**
   * Remove a word from the current queue (after review)
   */
  removeFromQueue(wordId: string): void {
    this.currentQueue = this.currentQueue.filter(word => word.id !== wordId)
  }

  /**
   * Get next word from queue
   */
  getNextWord(): QueuedWord | null {
    return this.currentQueue.length > 0 ? this.currentQueue[0] : null
  }

  /**
   * Calculate priority based on due date, review history, and learning status
   */
  private calculatePriority(
    word: Word & { lastReview?: Review }, 
    progress: any
  ): QueuePriority {
    // Check if word is in learning phase (highest priority)
    if (word.status === 'learning') {
      return 'learning'
    }

    if (!word.lastReview) {
      return 'new'
    }

    const dueClassification = classifyDueDate(word.lastReview.due_date || new Date())

    if (dueClassification === 'overdue') return 'overdue'
    if (dueClassification === 'due_today') return 'due_today'
    return 'review_soon'
  }

  /**
   * Calculate days since last review
   */
  private calculateDaysSinceLastReview(lastReview?: Review): number | undefined {
    if (!lastReview || !lastReview.reviewed_at) return undefined
    
    const lastReviewDate = new Date(lastReview.reviewed_at)
    const today = new Date()
    return Math.floor((today.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  /**
   * Apply study mode filter
   */
  private applyStudyModeFilter(words: QueuedWord[], mode: StudyMode): QueuedWord[] {
    switch (mode) {
      case 'new_only':
        return words.filter(word => word.priority === 'new')
      case 'due_today_only':
        return words.filter(word => word.priority === 'due_today' || word.priority === 'learning')
      case 'review_only':
        return words.filter(word => word.priority !== 'new')
      case 'overdue_only':
        return words.filter(word => word.priority === 'overdue')
      case 'mixed':
      default:
        return words
    }
  }

  /**
   * Sort words by priority and difficulty with subtle tie-breaking randomization
   */
  private sortByPriority(words: QueuedWord[], prioritizeWeakWords: boolean): QueuedWord[] {
    return words.sort((a, b) => {
      // Priority ranking: learning > overdue > due_today > new > review_soon
      const priorityOrder = { 'learning': 5, 'overdue': 4, 'due_today': 3, 'new': 2, 'review_soon': 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      
      if (priorityDiff !== 0) {
        return priorityDiff
      }

      // Within same priority, sort by difficulty if enabled
      if (prioritizeWeakWords) {
        const aEase = a.currentEaseFactor || 2.5
        const bEase = b.currentEaseFactor || 2.5
        const easeDiff = aEase - bEase // Lower ease factor first (harder words)
        
        // RFC-006: Add subtle tie-breaking randomization for cards with same priority and ease factor
        if (Math.abs(easeDiff) < 0.1) { // Consider ease factors within 0.1 as "tied"
          return Math.random() - 0.5 // Random tie-breaker
        }
        
        return easeDiff
      }

      // Otherwise sort by days since last review
      const aDays = a.daysSinceLastReview || 0
      const bDays = b.daysSinceLastReview || 0
      const daysDiff = bDays - aDays // More days since review first
      
      // RFC-006: Add subtle tie-breaking randomization for same review timing
      if (daysDiff === 0) {
        return Math.random() - 0.5 // Random tie-breaker
      }
      
      return daysDiff
    })
  }

  /**
   * Attach flashcards to words
   */
  private async attachFlashcards(words: QueuedWord[]): Promise<QueuedWord[]> {
    const wordIds = words.map(w => w.id)
    const { data: flashcards } = await getUserFlashcards({ wordIds })
    
    const flashcardMap = new Map<string, FlashcardWithWord>()
    flashcards?.forEach(fc => {
      flashcardMap.set(fc.word.id, fc)
    })

    return words.map(word => ({
      ...word,
      flashcard: flashcardMap.get(word.id)
    }))
  }

  /**
   * Calculate queue statistics
   */
  private calculateQueueStats(queue: QueuedWord[]) {
    const total = queue.length
    const overdue = queue.filter(w => w.priority === 'overdue').length
    // Treat learning items as due today for UI parity with Today's Cards
    const dueToday = queue.filter(w => w.priority === 'due_today' || w.priority === 'learning').length
    const newWords = queue.filter(w => w.priority === 'new').length
    
    const easeFactors = queue
      .map(w => w.currentEaseFactor)
      .filter((ef): ef is number => ef !== undefined)
    
    const averageDifficulty = easeFactors.length > 0 ? 
      Math.round((easeFactors.reduce((sum, ef) => sum + ef, 0) / easeFactors.length) * 100) / 100 : 
      2.5

    return {
      total,
      overdue,
      dueToday,
      newWords,
      averageDifficulty
    }
  }
}

/**
 * Helper functions for queue management
 */

/**
 * Get queue manager instance
 */
export function getQueueManager(): ReviewQueueManager {
  return ReviewQueueManager.getInstance()
}

/**
 * Generate study session with optimal word selection and pre-fetched AI content
 */
export async function generateStudySession(options: QueueOptions = {}): Promise<{
  words: QueuedWord[]
  sessionId: string
  estimatedTimeMinutes: number
  error?: any
}> {
  try {
    const queueManager = getQueueManager()
    let { queue, error, userId } = await queueManager.generateQueue(options)
    const generatedQueueWasEmpty = queue.length === 0

    if (error) {
      return { words: [], sessionId: '', estimatedTimeMinutes: 0, error }
    }

    // --- FALLBACK LOGIC: Practice Session ---
    // If the main queue is empty, create a practice session with recent words
    // Only for 'mixed' mode to avoid surprising users when they request specific filters
    if (
      queue.length === 0 &&
      (!options.studyMode || options.studyMode === 'mixed') &&
      (!options.wordIds || options.wordIds.length === 0)
    ) {
      console.log("No due cards found. Generating a practice session as a fallback.");

      const fallbackLimit = Math.max(1, Math.min(options.maxWords ?? 20, 10));
      const usingDeskFilter = options.deskId && options.deskId !== 'all';

      let practiceSource: Word[] | null = null
      let practiceError: any = null

      if (usingDeskFilter) {
        const { data, error } = await getDeskWords(options.deskId!, fallbackLimit)
        practiceSource = data
        practiceError = error
      } else {
        const { data, error } = await getUserWords({ limit: fallbackLimit })
        practiceSource = data
        practiceError = error
      }

      if (practiceError) {
        console.error("Fallback failed: could not fetch practice words.", practiceError)
        return { words: [], sessionId: '', estimatedTimeMinutes: 0, error: practiceError }
      }

      if (practiceSource && practiceSource.length > 0) {
        // Enrich these words to match the QueuedWord type
        const practiceQueue = practiceSource.map(word => ({
          ...word,
          priority: 'review_soon' as QueuePriority, // Assign lower priority to indicate it's for practice
          daysSinceLastReview: undefined,
          currentEaseFactor: 2.5,
          timesReviewed: 0,
          lastReview: undefined
        }))

        // Attach flashcards to practice words
        const wordIds = practiceQueue.map(w => w.id)
        const { data: flashcards } = await getUserFlashcards({ wordIds })

        const flashcardMap = new Map<string, FlashcardWithWord>()
        flashcards?.forEach(fc => {
          flashcardMap.set(fc.word.id, fc)
        })

        queue = practiceQueue.map(word => ({
          ...word,
          flashcard: flashcardMap.get(word.id)
        }))
      }
    }

    // Ensure fallback queues get initial content if needed
    if (generatedQueueWasEmpty && queue.length > 0 && userId) {
      const updates = await prefetchInitialContentForWords(queue, userId)
      if (updates.size > 0) {
        queue = queue.map(word => {
          const update = updates.get(word.id)
          if (!update) {
            return word
          }

          return {
            ...word,
            sentences: update.sentences ?? word.sentences ?? null,
            imageUrl: update.imageUrl ?? word.imageUrl ?? null,
            imageDescription: update.imageDescription ?? word.imageDescription ?? null
          }
        })
      }
    }

    // Generate session ID - let Supabase generate UUID automatically
    const sessionId = undefined // Will be auto-generated by database

    // Estimate time based on word count and difficulty
    const estimatedTimeMinutes = Math.max(5, Math.ceil(queue.length * 1.5)) // ~1.5 min per word

    return {
      words: queue,
      sessionId: '', // Will be generated when session is created in database
      estimatedTimeMinutes
    }
  } catch (error) {
    console.error("Error generating study session:", error)
    return { words: [], sessionId: '', estimatedTimeMinutes: 0, error }
  }
}

/**
 * Get recommended study mode based on user's current situation
 */
export async function getRecommendedStudyMode(): Promise<{
  mode: StudyMode
  reasoning: string
  priority: 'high' | 'medium' | 'low'
}> {
  try {
    const counts = await getDueWordCounts()

    if (counts.error) {
      throw counts.error
    }

    const stats = {
      overdue: counts.overdue,
      dueToday: counts.dueToday,
      newWords: counts.newWords
    }

    if (stats.overdue > 10) {
      return {
        mode: 'overdue_only',
        reasoning: `You have ${stats.overdue} overdue words. Focus on catching up!`,
        priority: 'high'
      }
    }

    if (stats.dueToday > 20) {
      return {
        mode: 'due_today_only',
        reasoning: `${stats.dueToday} words are due today. Focus on reviews first.`,
        priority: 'medium'
      }
    }

    if (stats.newWords < 5) {
      return {
        mode: 'mixed',
        reasoning: 'Good balance of new and review words. Keep up the momentum!',
        priority: 'low'
      }
    }

    return {
      mode: 'mixed',
      reasoning: 'Balanced study session recommended.',
      priority: 'low'
    }
  } catch (error) {
    return {
      mode: 'mixed',
      reasoning: 'Mixed mode is always a safe choice.',
      priority: 'low'
    }
  }
}
