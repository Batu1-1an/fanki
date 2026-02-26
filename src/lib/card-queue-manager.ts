import { createClientComponentClient } from './supabase/client'
import { QueuedCard, ReviewCard, CardReviewStatus } from '@/types'
import { getDueCards } from './reviews'
import { aiService } from './ai-services'
import { getBlankPosition } from './flashcard-text'

const INITIAL_CHUNK_SIZE = 2 // Fetch first 2 cards to start immediately

const supabase = createClientComponentClient()

export type QueuePriority = 'learning' | 'overdue' | 'due_today' | 'new' | 'review_soon'
export type StudyMode = 'mixed' | 'new_only' | 'review_only' | 'overdue_only' | 'due_today_only'

export interface CardQueueOptions {
  maxCards?: number
  studyMode?: StudyMode
  difficultyRange?: [number, number] // [min, max] ease factor
  prioritizeWeakCards?: boolean
  includeNewCards?: boolean
  deskId?: string // Filter by specific desk
  sortOrder?: 'recommended' | 'oldest' | 'easiest' | 'hardest'
  cardIds?: string[] // Target specific cards
}

type PrefetchedContentUpdate = {
  sentences?: { sentence: string; blank_position: number; correct_word: string }[]
  imageUrl?: string | null
  imageDescription?: string | null
}

/**
 * Pre-fetch AI content for initial cards to enable instant session start
 */
async function prefetchInitialContentForCards(
  cards: QueuedCard[],
  userId: string | null
): Promise<Map<string, PrefetchedContentUpdate>> {
  const contentMap = new Map<string, PrefetchedContentUpdate>()

  if (!userId || INITIAL_CHUNK_SIZE <= 0 || cards.length === 0) {
    return contentMap
  }

  const initialChunk = cards.slice(0, INITIAL_CHUNK_SIZE)

  const results = await Promise.all(
    initialChunk.map(async (card) => {
      // Only pre-fetch for cards that need content
      const hasSentences = Array.isArray(card.sentences) && card.sentences.length > 0
      const hasImage = !!card.imageUrl

      if (hasSentences && hasImage) {
        return null
      }

      // Only generate AI content for 'default' note type
      // Basic, cloze, typing, etc. use only user-provided content
      if (card.noteTypeSlug !== 'default') {
        return null
      }

      // Only generate content for word-based cards
      if (!card.word?.word) {
        return null
      }

      try {
        const difficulty = card.word.difficulty && card.word.difficulty <= 2 ? 'beginner' : 
                         card.word.difficulty && card.word.difficulty <= 4 ? 'intermediate' : 'advanced'

        const content = await aiService.generateFlashcardContent(card.word.word, difficulty, userId)

        const transformedSentences = Array.isArray(content.sentences)
          ? content.sentences.map((sentence: any) => {
              const sentenceText = typeof sentence === 'string' ? sentence : sentence.sentence || sentence.text || ''

              return {
                sentence: sentenceText,
                blank_position: getBlankPosition(sentenceText, sentence?.blank_position ?? 0),
                correct_word: card.word!.word
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
          cardId: card.cardId,
          content: update
        }
      } catch (error) {
        console.error(`Failed to pre-fetch content for card "${card.cardId}":`, error)
        return null
      }
    })
  )

  results.forEach(result => {
    if (result?.content) {
      contentMap.set(result.cardId, result.content)
    }
  })

  return contentMap
}

/**
 * Card-based review queue manager for multi-template support
 */
export class CardQueueManager {
  private static instance: CardQueueManager
  private currentQueue: QueuedCard[] = []
  private queueGenerated: Date | null = null
  private cacheByOptions: Map<string, { queue: QueuedCard[], stats: any, timestamp: Date, userId: string | null }> = new Map()

  static getInstance(): CardQueueManager {
    if (!CardQueueManager.instance) {
      CardQueueManager.instance = new CardQueueManager()
      CardQueueManager.instance.setupCacheInvalidation()
    }
    return CardQueueManager.instance
  }

  /**
   * Set up cache invalidation on review submissions
   */
  private setupCacheInvalidation(): void {
    const channel = supabase
      .channel('card_queue_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reviews'
      }, () => {
        this.invalidateCache()
      })
      .subscribe()
  }

  /**
   * Clear all cached queues
   */
  invalidateCache(): void {
    this.cacheByOptions.clear()
    console.log('Card queue cache invalidated')
  }

  /**
   * Generate a study queue from due cards
   */
  async generateQueue(options: CardQueueOptions = {}): Promise<{
    queue: QueuedCard[]
    stats: any
    error?: any
    userId: string | null
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { queue: [], stats: {}, error: 'User not authenticated', userId: null }
      }

      // Generate cache key
      const cacheKey = JSON.stringify({ ...options, userId: user.id })
      
      // Check cache (5 minute TTL)
      const cached = this.cacheByOptions.get(cacheKey)
      if (cached && cached.userId === user.id) {
        const age = Date.now() - cached.timestamp.getTime()
        if (age < 5 * 60 * 1000) {
          console.log(`Using cached card queue (${Math.round(age / 1000)}s old)`)
          this.currentQueue = cached.queue
          return { queue: cached.queue, stats: cached.stats, userId: user.id }
        }
      }

      const {
        maxCards = 20,
        sortOrder = 'recommended',
        deskId,
        cardIds,
        difficultyRange,
        includeNewCards = true
      } = options

      // Fetch due cards using new card-based system
      const { data: dueCards, error: dueError } = await getDueCards(maxCards * 2, sortOrder, deskId)

      if (dueError) {
        console.error('Error fetching due cards:', dueError)
        return { queue: [], stats: {}, error: dueError, userId: user.id }
      }

      if (!dueCards || dueCards.length === 0) {
        console.log('No due cards found')
        return { queue: [], stats: { total: 0, overdue: 0, dueToday: 0, newCards: 0 }, userId: user.id }
      }

      // Convert ReviewCard to QueuedCard
      let queue: QueuedCard[] = dueCards.map(card => this.enrichCardWithPriority(card))

      if (!includeNewCards) {
        queue = queue.filter(card => card.reviewStatus !== 'new')
      }

      if (difficultyRange) {
        queue = queue.filter(card => {
          const ease = card.currentEaseFactor ?? 2.5
          return ease >= difficultyRange[0] && ease <= difficultyRange[1]
        })
      }

      if (cardIds && cardIds.length > 0) {
        const cardIdSet = new Set(cardIds)
        queue = queue.filter(card => cardIdSet.has(card.cardId))
      }

      // Apply study mode filter
      queue = this.applyStudyModeFilter(queue, options.studyMode)

      queue = queue.slice(0, maxCards)

      // Sort by priority if needed
      if (options.prioritizeWeakCards) {
        queue = this.sortByPriority(queue, true)
      }

      // Calculate stats
      const stats = this.calculateQueueStats(queue)

      // Pre-fetch initial content
      const contentUpdates = await prefetchInitialContentForCards(queue, user.id)
      if (contentUpdates.size > 0) {
        queue = queue.map(card => {
          const update = contentUpdates.get(card.cardId)
          if (!update) return card

          return {
            ...card,
            sentences: update.sentences ?? card.sentences,
            imageUrl: update.imageUrl ?? card.imageUrl,
            imageDescription: update.imageDescription ?? card.imageDescription
          }
        })
      }

      // Cache the result
      this.cacheByOptions.set(cacheKey, {
        queue,
        stats,
        timestamp: new Date(),
        userId: user.id
      })

      this.currentQueue = queue
      this.queueGenerated = new Date()

      return { queue, stats, userId: user.id }
    } catch (error) {
      console.error('Error generating card queue:', error)
      return { queue: [], stats: {}, error, userId: null }
    }
  }

  /**
   * Enrich a ReviewCard with priority and metadata for the queue
   */
  private enrichCardWithPriority(card: ReviewCard): QueuedCard {
    const priority = this.calculatePriority(card)
    const daysSinceLastReview = this.calculateDaysSinceLastReview(card)

    return {
      ...card,
      priority,
      daysSinceLastReview,
      currentEaseFactor: card.scheduling.easeFactor ?? undefined,
      timesReviewed: card.scheduling.repetitions ?? undefined
    }
  }

  /**
   * Calculate priority based on card's review status and scheduling
   */
  private calculatePriority(card: ReviewCard): QueuePriority {
    // Map CardReviewStatus to QueuePriority
    switch (card.reviewStatus) {
      case 'new':
        return 'new'
      case 'overdue':
        return 'overdue'
      case 'due_today':
        return 'due_today'
      case 'completed_today':
      case 'inactive':
        return 'review_soon'
      case 'future':
        return 'review_soon'
      default:
        return 'review_soon'
    }
  }

  /**
   * Calculate days since last review
   */
  private calculateDaysSinceLastReview(card: ReviewCard): number | undefined {
    if (!card.scheduling.lastReviewedAt) return undefined
    
    const lastReviewDate = new Date(card.scheduling.lastReviewedAt)
    const today = new Date()
    return Math.floor((today.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  /**
   * Apply study mode filter to queue
   */
  private applyStudyModeFilter(cards: QueuedCard[], mode?: StudyMode): QueuedCard[] {
    if (!mode || mode === 'mixed') {
      return cards
    }

    switch (mode) {
      case 'new_only':
        return cards.filter(card => card.priority === 'new')
      case 'due_today_only':
        return cards.filter(card => card.priority === 'due_today')
      case 'review_only':
        return cards.filter(card => card.priority !== 'new')
      case 'overdue_only':
        return cards.filter(card => card.priority === 'overdue')
      default:
        return cards
    }
  }

  /**
   * Sort cards by priority and difficulty
   */
  private sortByPriority(cards: QueuedCard[], prioritizeWeakCards: boolean): QueuedCard[] {
    return cards.sort((a, b) => {
      // Priority ranking
      const priorityOrder = { 'learning': 5, 'overdue': 4, 'due_today': 3, 'new': 2, 'review_soon': 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      
      if (priorityDiff !== 0) {
        return priorityDiff
      }

      // Within same priority, sort by difficulty if enabled
      if (prioritizeWeakCards) {
        const aEase = a.currentEaseFactor || 2.5
        const bEase = b.currentEaseFactor || 2.5
        const easeDiff = aEase - bEase

        // Tie-breaking randomization for similar ease factors
        if (Math.abs(easeDiff) < 0.1) {
          return Math.random() - 0.5
        }
        
        return easeDiff
      }

      // Otherwise sort by days since review
      const aDays = a.daysSinceLastReview || 0
      const bDays = b.daysSinceLastReview || 0
      const daysDiff = bDays - aDays
      
      if (daysDiff === 0) {
        return Math.random() - 0.5
      }
      
      return daysDiff
    })
  }

  /**
   * Calculate queue statistics
   */
  private calculateQueueStats(queue: QueuedCard[]) {
    const total = queue.length
    const overdue = queue.filter(c => c.priority === 'overdue').length
    const dueToday = queue.filter(c => c.priority === 'due_today').length
    const newCards = queue.filter(c => c.priority === 'new').length
    
    const easeFactors = queue
      .map(c => c.currentEaseFactor)
      .filter((ef): ef is number => ef !== undefined)
    
    const averageDifficulty = easeFactors.length > 0 ? 
      Math.round((easeFactors.reduce((sum, ef) => sum + ef, 0) / easeFactors.length) * 100) / 100 : 
      2.5

    return {
      total,
      overdue,
      dueToday,
      newCards,
      averageDifficulty
    }
  }

  /**
   * Get current queue
   */
  getQueue(): QueuedCard[] {
    return this.currentQueue
  }

  /**
   * Remove a card from queue after review
   */
  removeFromQueue(cardId: string): void {
    this.currentQueue = this.currentQueue.filter(card => card.cardId !== cardId)
  }

  /**
   * Get next card from queue
   */
  getNextCard(): QueuedCard | null {
    return this.currentQueue.length > 0 ? this.currentQueue[0] : null
  }
}

/**
 * Get card queue manager instance
 */
export function getCardQueueManager(): CardQueueManager {
  return CardQueueManager.getInstance()
}

/**
 * Generate study session with cards
 */
export async function generateCardStudySession(options: CardQueueOptions = {}): Promise<{
  cards: QueuedCard[]
  sessionId: string
  estimatedTimeMinutes: number
  error?: any
}> {
  try {
    const queueManager = getCardQueueManager()
    const { queue, error, userId } = await queueManager.generateQueue(options)

    if (error) {
      return { cards: [], sessionId: '', estimatedTimeMinutes: 0, error }
    }

    // Estimate time
    const estimatedTimeMinutes = Math.max(5, Math.ceil(queue.length * 1.5))

    return {
      cards: queue,
      sessionId: '', // Will be generated when session created in DB
      estimatedTimeMinutes
    }
  } catch (error) {
    console.error("Error generating card study session:", error)
    return { cards: [], sessionId: '', estimatedTimeMinutes: 0, error }
  }
}
