import { createClientComponentClient } from './supabase'
import { Word, Review, FlashcardWithWord, WordStatus, LEARNING_STEPS } from '@/types'
import { getDueWords, getWordProgress, getLearningWords } from './reviews'
import { getUserFlashcards } from './flashcards'
import { getDeskWords } from './desks'
import { getUserWords } from './words'
import { aiService } from './ai-services'

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
}

/**
 * Smart review queue manager that prioritizes words based on:
 * 1. Overdue status (highest priority)
 * 2. Difficulty (lower ease factor = higher priority)
 * 3. Time since last review
 * 4. Learning stage (new words vs review words)
 */
export class ReviewQueueManager {
  private static instance: ReviewQueueManager
  private currentQueue: QueuedWord[] = []
  private queueGenerated: Date | null = null

  static getInstance(): ReviewQueueManager {
    if (!ReviewQueueManager.instance) {
      ReviewQueueManager.instance = new ReviewQueueManager()
    }
    return ReviewQueueManager.instance
  }

  /**
   * Generate optimized study queue
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
    error?: any
  }> {
    try {
      const {
        maxWords = 20,
        studyMode = 'mixed',
        difficultyRange = [1.3, 3.0],
        prioritizeWeakWords = true,
        includeNewWords = true,
        deskId
      } = options

      // Get learning words first (highest priority)
      const { data: learningWords, error: learningError } = await getLearningWords(50)
      if (learningError) {
        console.warn('Error fetching learning words:', learningError)
      }

      // Get due words with their review history
      const { data: dueWords, error: dueError } = await getDueWords(100)
      if (dueError) {
        return { 
          queue: [], 
          stats: { total: 0, overdue: 0, dueToday: 0, newWords: 0, averageDifficulty: 2.5 },
          error: dueError 
        }
      }

      // Combine learning and due words, avoiding duplicates
      const learningWordIds = new Set((learningWords || []).map(w => w.id))
      let allWords = [
        ...(learningWords || []),
        ...(dueWords || []).filter(word => !learningWordIds.has(word.id))
      ]

      // Filter by desk if specified
      if (deskId) {
        const { data: deskWords } = await getDeskWords(deskId)
        if (deskWords) {
          const deskWordIds = new Set(deskWords.map((w: any) => w.id))
          allWords = allWords.filter(word => deskWordIds.has(word.id))
        }
      }

      // Enrich words with queue metadata (optimized - no N+1 queries)
      const enrichedWords = allWords.map((word) => {
        const queuedWord: QueuedWord = {
          ...word,
          priority: this.calculatePriority(word, { 
            currentEaseFactor: word.lastReview?.ease_factor || 2.5,
            totalReviews: 1 // Will be calculated from existing data
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

      // Sort by priority and difficulty
      const sortedWords = this.sortByPriority(filteredWords, prioritizeWeakWords)

      // Limit to requested number
      const finalQueue = sortedWords.slice(0, maxWords)

      // Attach flashcards to queued words
      const queueWithFlashcards = await this.attachFlashcards(finalQueue)

      // Calculate statistics
      const stats = this.calculateQueueStats(queueWithFlashcards)

      // Cache the queue
      this.currentQueue = queueWithFlashcards
      this.queueGenerated = new Date()

      return { queue: queueWithFlashcards, stats }
    } catch (error) {
      return { 
        queue: [], 
        stats: { total: 0, overdue: 0, dueToday: 0, newWords: 0, averageDifficulty: 2.5 },
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

    // For review cards, compare by UTC date-only strings (aligns with getDueWords)
    const dueDateStr = new Date(word.lastReview.due_date).toISOString().split('T')[0]
    const todayStr = new Date().toISOString().split('T')[0]

    if (dueDateStr < todayStr) return 'overdue'
    if (dueDateStr === todayStr) return 'due_today'
    return 'review_soon'
  }

  /**
   * Calculate days since last review
   */
  private calculateDaysSinceLastReview(lastReview?: Review): number | undefined {
    if (!lastReview) return undefined
    
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
   * Sort words by priority and difficulty
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
        return aEase - bEase // Lower ease factor first (harder words)
      }

      // Otherwise sort by days since last review
      const aDays = a.daysSinceLastReview || 0
      const bDays = b.daysSinceLastReview || 0
      return bDays - aDays // More days since review first
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
    let { queue, error } = await queueManager.generateQueue(options)

    if (error) {
      return { words: [], sessionId: '', estimatedTimeMinutes: 0, error }
    }

    // --- FALLBACK LOGIC: Practice Session ---
    // If the main queue is empty, create a practice session with recent words
    // Only for 'mixed' mode to avoid surprising users when they request specific filters
    if (queue.length === 0 && (!options.studyMode || options.studyMode === 'mixed')) {
      console.log("No due cards found. Generating a practice session as a fallback.");
      
      const { data: recentWords, error: wordsError } = await getUserWords({ limit: 10 });

      if (wordsError) {
        console.error("Fallback failed: could not fetch user words.", wordsError);
        return { words: [], sessionId: '', estimatedTimeMinutes: 0, error: wordsError };
      }

      if (recentWords && recentWords.length > 0) {
        // Enrich these words to match the QueuedWord type
        queue = recentWords.map(word => ({
          ...word,
          priority: 'review_soon' as QueuePriority, // Assign lower priority to indicate it's for practice
          daysSinceLastReview: undefined,
          currentEaseFactor: 2.5,
          timesReviewed: 0,
          lastReview: undefined
        }));
        
        // Attach flashcards to practice words
        const wordIds = queue.map(w => w.id)
        const { data: flashcards } = await getUserFlashcards({ wordIds })
        
        const flashcardMap = new Map<string, FlashcardWithWord>()
        flashcards?.forEach(fc => {
          flashcardMap.set(fc.word.id, fc)
        })

        queue = queue.map(word => ({
          ...word,
          flashcard: flashcardMap.get(word.id)
        }));
      }
    }
    // --- END OF FALLBACK LOGIC ---

    // Pre-fetch AI content for ONLY the initial chunk for fast session start
    if (queue.length > 0) {
      try {
        // Get current user from Supabase Auth
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (user && !userError) {
          const initialChunk = queue.slice(0, INITIAL_CHUNK_SIZE)
          console.log(`Pre-fetching AI content for initial ${initialChunk.length} words...`)
          
          const contentPromises = initialChunk.map(async (word, index) => {
            try {
              const difficulty = word.difficulty <= 2 ? 'beginner' : 
                               word.difficulty <= 4 ? 'intermediate' : 'advanced'
              
              // Use the existing generateFlashcardContent method for consistency
              const content = await aiService.generateFlashcardContent(word.word, difficulty, user.id)
              
              // Transform sentences to the expected format
              const transformedSentences = content.sentences.map((sentence: any) => {
                const sentenceText = typeof sentence === 'string' ? sentence : sentence.sentence || sentence.text || ''
                const blankMarker = '___'
                
                return {
                  sentence: sentenceText,
                  blank_position: sentenceText.indexOf(blankMarker) >= 0 ? sentenceText.indexOf(blankMarker) : 0,
                  correct_word: word.word
                }
              })
              
              // Update the word in the original queue
              queue[index] = {
                ...queue[index],
                sentences: transformedSentences,
                imageUrl: content.imageUrl,
                imageDescription: content.imageDescription || null
              }
            } catch (error) {
              console.error(`Failed to pre-fetch content for word "${word.word}":`, error)
              // Leave word without AI content if fetching fails - will be fetched later
            }
          })
          
          // Wait for initial chunk content to be fetched
          await Promise.all(contentPromises)
          console.log(`Successfully pre-fetched AI content for initial ${initialChunk.length} words`)
        }
      } catch (error) {
        console.error('Failed to pre-fetch initial chunk, continuing without pre-fetching:', error)
        // Continue without pre-fetching if there's an error
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
    const queueManager = getQueueManager()
    const { stats } = await queueManager.generateQueue({ maxWords: 100 })

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
