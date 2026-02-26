'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CardRenderer } from '@/components/cards/CardRenderer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Word, 
  ReviewResult, 
  StudySession as StudySessionType,
  SessionType,
  QueuedCard
} from '@/types'
import { QueuedWord } from '@/lib/queue-manager'
import { submitReview } from '@/lib/reviews'
import { getQueueManager } from '@/lib/queue-manager'
import { aiService } from '@/lib/ai-services'
import { 
  createStudySession, 
  updateStudySession, 
  completeStudySession, 
  pauseStudySession, 
  resumeStudySession,
  abandonStudySession
} from '@/lib/study-sessions'
import { 
  Clock, 
  Target, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  TrendingUp,
  Award,
  Pause,
  Play,
  StopCircle,
  Timer
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getBlankPosition } from '@/lib/flashcard-text'

const PREFETCH_THRESHOLD = 1 // Start fetching the next chunk when on the second card (1 card left)
const CHUNK_SIZE = 2 // Fetch next 2 cards in the background

// Helper function to convert QueuedWord to QueuedCard for backward compatibility
// This preserves legacy word data while creating a properly structured card
function convertWordToCard(word: QueuedWord): QueuedCard {
  return {
    cardId: word.id,
    noteId: word.id, // Use word ID as note ID for legacy
    noteTypeSlug: 'basic', // Legacy words are basic type (not 'basic-word')
    templateSlug: 'forward', // Use proper template slug
    reviewStatus: word.status === 'new' ? 'new' as const : 
                  word.status === 'learning' ? 'new' as const : 'due_today' as const,
    scheduling: {
      easeFactor: word.currentEaseFactor || 2.5,
      intervalDays: word.lastReview?.interval_days || 0,
      repetitions: word.lastReview?.repetitions || 0,
      dueDate: word.lastReview?.due_date || null,
      lastReviewedAt: word.lastReview?.reviewed_at || null,
      lastQuality: word.lastReview?.quality || null
    },
    // Construct render_payload from word data
    renderPayload: {
      word: word.word,
      definition: word.definition,
      pronunciation: word.pronunciation,
      image_url: word.imageUrl,
      image_description: word.imageDescription,
      sentences: word.sentences || []
    },
    // Construct fields matching basic note type schema
    fields: {
      front: word.word,
      back: word.definition,
      extra: word.pronunciation || ''
    },
    word: {
      id: word.id,
      word: word.word,
      definition: word.definition,
      pronunciation: word.pronunciation,
      difficulty: word.difficulty,
      status: word.status as any, // Type compatibility between WordStatus and ReviewStatus
      createdAt: word.created_at,
      updatedAt: word.updated_at
    },
    // Preserve QueuedWord-specific properties
    priority: word.priority,
    daysSinceLastReview: word.daysSinceLastReview,
    currentEaseFactor: word.currentEaseFactor,
    timesReviewed: word.timesReviewed,
    sentences: word.sentences,
    imageUrl: word.imageUrl,
    imageDescription: word.imageDescription
  }
}

interface StudySessionProps {
  words?: QueuedWord[] // Legacy support
  cards?: QueuedCard[] // New card-based
  sessionType: SessionType
  sessionId?: string
  onSessionComplete: (session: Partial<StudySessionType>) => void
  onExit: () => void
  className?: string
  userId?: string | null
}

interface SessionStats {
  cardsStudied: number
  cardsCorrect: number
  totalReviews: number
  accuracy: number
  startTime: Date
  endTime?: Date
  averageResponseTime: number
}

interface RelearningCard extends QueuedCard {
  originalIndex: number
  timesRelearned: number
  addedToRelearningAt: Date
}

interface CardReview {
  wordId: string
  cardId: string // NEW: Primary identifier
  button: 'again' | 'hard' | 'good' | 'easy'
  responseTime: number
  timestamp: Date
}

export function StudySession({
  words,
  cards,
  sessionType,
  sessionId: propSessionId,
  onSessionComplete,
  onExit,
  className,
  userId
}: StudySessionProps) {
  // Support both legacy words and new cards
  const sessionItems = cards || words || []
  const isCardBased = !!cards
  
  // Convert words to cards if needed for unified handling
  const initialCards: QueuedCard[] = isCardBased 
    ? (sessionItems as QueuedCard[])
    : (sessionItems as QueuedWord[]).map(convertWordToCard)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [enrichedWords, setEnrichedWords] = useState<QueuedCard[]>(initialCards)
  const [isFetchingNextChunk, setIsFetchingNextChunk] = useState(false)
  const fetchedChunks = useRef(new Set([0])) // Keep track of which chunks are fetched (chunk 0 is initial)
  const initialMainCardCount = useRef(sessionItems.length)
  const completedMainWordIds = useRef<Set<string>>(new Set())
  const [completedMainCards, setCompletedMainCards] = useState(0)
  
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    cardsStudied: 0,
    cardsCorrect: 0,
    totalReviews: 0,
    accuracy: 0,
    startTime: new Date(),
    averageResponseTime: 0
  })
  
  // Chunked pre-fetching system manages AI content in background
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [cardReviews, setCardReviews] = useState<CardReview[]>([])
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(null)
  const [reviewCompleted, setReviewCompleted] = useState(false)
  const [dbSessionId, setDbSessionId] = useState<string | null>(propSessionId || null)
  const [isPaused, setIsPaused] = useState(false)
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null)
  const [totalPauseTime, setTotalPauseTime] = useState(0)
  const [currentCardStartTime, setCurrentCardStartTime] = useState(() => Date.now())
  const [hasReviewedCurrentCard, setHasReviewedCurrentCard] = useState(false)
  const lastSyncedReviewCount = useRef(0)
  const pendingCompletionRef = useRef<{
    wordsStudied: number
    wordsCorrect: number
    totalReviews: number
    sessionDurationSeconds: number
    accuracyPercentage: number
  } | null>(null)
  
  // Re-learning queue for lapsed cards
  const [relearningQueue, setRelearningQueue] = useState<RelearningCard[]>([])
  const [currentlyShowingRelearning, setCurrentlyShowingRelearning] = useState(false)
  const [mainQueueCompleted, setMainQueueCompleted] = useState(false)
  const [completedRelearningCount, setCompletedRelearningCount] = useState(0)
  const [isGeneratingByCardId, setIsGeneratingByCardId] = useState<Record<string, boolean>>({})
  const [contentGenerationErrors, setContentGenerationErrors] = useState<Record<string, string>>({})

  // Get current word from either main queue or re-learning queue
  const currentWord = currentlyShowingRelearning && relearningQueue.length > 0
    ? relearningQueue[0] // Show first word from re-learning queue
    : (enrichedWords && enrichedWords[currentIndex]) // Show word from enriched main queue (with bounds check)
  
  const totalMainCards = initialMainCardCount.current
  const totalRelearningCards = completedRelearningCount + relearningQueue.length
  const totalCards = totalMainCards + totalRelearningCards
  const completedCards = completedMainCards + completedRelearningCount
  const progress = totalCards > 0 ? (completedCards / totalCards) * 100 : 0
  const displayedMainPosition = totalMainCards > 0
    ? Math.min(
        currentlyShowingRelearning ? completedMainCards : completedMainCards + (currentWord && !currentlyShowingRelearning ? 1 : 0),
        totalMainCards
      )
    : 0

  // Session timer
  const [sessionDuration, setSessionDuration] = useState(0)
  
  useEffect(() => {
    if (isPaused) return
    
    const timer = setInterval(() => {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - sessionStats.startTime.getTime()) / 1000)
      setSessionDuration(elapsed - totalPauseTime)
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionStats.startTime, isPaused, totalPauseTime])

  useEffect(() => {
    if (currentWord) {
      setCurrentCardStartTime(Date.now())
      setHasReviewedCurrentCard(false)
    }
  }, [currentWord])

  useEffect(() => {
    initialMainCardCount.current = initialCards.length
    completedMainWordIds.current = new Set(
      Array.from(completedMainWordIds.current).filter(id => 
        initialCards.some(card => card.cardId === id)
      )
    )
    setCompletedMainCards(completedMainWordIds.current.size)
  }, [initialCards])

  const initializeSession = useCallback(async () => {
    const { data, error } = await createStudySession({
      sessionType
    })
    
    if (data) {
      setDbSessionId(data.id)
    } else {
      console.error('Failed to create session:', error)
    }
  }, [sessionType])

  // Initialize database session
  useEffect(() => {
    if (!dbSessionId) {
      initializeSession()
    }
  }, [dbSessionId, initializeSession])

  useEffect(() => {
    if (!dbSessionId) {
      return
    }

    if (sessionStats.totalReviews <= lastSyncedReviewCount.current) {
      return
    }

    lastSyncedReviewCount.current = sessionStats.totalReviews
    void updateStudySession(dbSessionId, {
      wordsStudied: sessionStats.cardsStudied,
      wordsCorrect: sessionStats.cardsCorrect,
      totalReviews: sessionStats.totalReviews,
      accuracyPercentage: sessionStats.accuracy
    })
  }, [dbSessionId, sessionStats.cardsStudied, sessionStats.cardsCorrect, sessionStats.totalReviews, sessionStats.accuracy])

  useEffect(() => {
    if (!dbSessionId || !pendingCompletionRef.current) {
      return
    }

    const completion = pendingCompletionRef.current
    pendingCompletionRef.current = null
    void completeStudySession(dbSessionId, completion)
  }, [dbSessionId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const fetchNextChunk = useCallback(async (chunkIndex: number, currentWords: QueuedCard[]) => {
    if (!userId) return
    setIsFetchingNextChunk(true)
    fetchedChunks.current.add(chunkIndex)
    
    const startIndex = chunkIndex * CHUNK_SIZE
    const endIndex = Math.min(startIndex + CHUNK_SIZE, currentWords.length)
    const chunkToFetch = currentWords.slice(startIndex, endIndex)
    const cardsToGenerate = chunkToFetch.filter(word => {
      const hasSentences = Array.isArray(word.sentences) && word.sentences.length > 0
      const hasImage = !!word.imageUrl
      return !(hasSentences && hasImage) && word.noteTypeSlug === 'default'
    })

    if (cardsToGenerate.length > 0) {
      setIsGeneratingByCardId(prev => {
        const next = { ...prev }
        cardsToGenerate.forEach(card => {
          next[card.cardId] = true
        })
        return next
      })
    }

    console.log(`Pre-fetching content for next 2 cards (${startIndex + 1} to ${endIndex})...`)

    try {
      const contentPromises = chunkToFetch.map(async (word) => {
        const hasSentences = Array.isArray(word.sentences) && word.sentences.length > 0
        const hasImage = !!word.imageUrl

        if (hasSentences && hasImage) return null
        
        // Only generate AI content for 'default' note type
        // Basic cards use only user-provided content (Anki standard)
        if (word.noteTypeSlug !== 'default') return null
        
        const wordDifficulty = word.word?.difficulty || (word as any).difficulty || 3
        const difficulty = wordDifficulty <= 2 ? 'beginner' : 
                          wordDifficulty <= 4 ? 'intermediate' : 'advanced'
        
        const wordText = isCardBased ? word.word?.word : (word as any).word
        return aiService.generateFlashcardContent(wordText, difficulty, userId)
      })
      
      const contentResults = await Promise.all(contentPromises)

      // Update the enriched words array
      setEnrichedWords(prevWords => {
        const newWords = [...prevWords]
        contentResults.forEach((content, index) => {
          if (!content) return // Skip if content was already there
          
          const originalIndex = startIndex + index
          const transformedSentences = content.sentences.map((sentence: any) => {
            const sentenceText = typeof sentence === 'string' ? sentence : sentence.sentence || sentence.text || ''
            
            return {
              sentence: sentenceText,
              blank_position: getBlankPosition(sentenceText, sentence?.blank_position ?? 0),
              correct_word: isCardBased ? newWords[originalIndex].word?.word : (newWords[originalIndex] as any).word
            }
          })
          
          newWords[originalIndex] = {
            ...newWords[originalIndex],
            sentences: transformedSentences,
            imageUrl: content.imageUrl,
            imageDescription: content.imageDescription || null,
          }
        })
        return newWords
      })

      setContentGenerationErrors(prev => {
        const next = { ...prev }
        cardsToGenerate.forEach(card => {
          delete next[card.cardId]
        })
        return next
      })
      
      console.log(`Content for next 2 cards (${startIndex + 1} to ${endIndex}) is ready.`)
    } catch (error) {
      console.error(`Failed to pre-fetch chunk ${chunkIndex}:`, error)
      fetchedChunks.current.delete(chunkIndex) // Allow re-fetching on next trigger

      const errorMessage = error instanceof Error ? error.message : 'Failed to generate content for this card.'
      setContentGenerationErrors(prev => {
        const next = { ...prev }
        cardsToGenerate.forEach(card => {
          next[card.cardId] = errorMessage
        })
        return next
      })
    } finally {
      if (cardsToGenerate.length > 0) {
        setIsGeneratingByCardId(prev => {
          const next = { ...prev }
          cardsToGenerate.forEach(card => {
            next[card.cardId] = false
          })
          return next
        })
      }

      setIsFetchingNextChunk(false)
    }
  }, [userId, isCardBased])

  const regenerateCardContent = useCallback(async (card: QueuedCard) => {
    if (!userId || card.noteTypeSlug !== 'default') {
      return
    }

    setIsGeneratingByCardId(prev => ({ ...prev, [card.cardId]: true }))
    setContentGenerationErrors(prev => {
      const next = { ...prev }
      delete next[card.cardId]
      return next
    })

    try {
      const wordDifficulty = card.word?.difficulty || (card as any).difficulty || 3
      const difficulty = wordDifficulty <= 2 ? 'beginner' : wordDifficulty <= 4 ? 'intermediate' : 'advanced'
      const wordText = card.word?.word

      if (!wordText) {
        throw new Error('Missing word text for regeneration')
      }

      const content = await aiService.generateFlashcardContent(wordText, difficulty, userId)
      const transformedSentences = content.sentences.map((sentence: any) => {
        const sentenceText = typeof sentence === 'string' ? sentence : sentence.sentence || sentence.text || ''

        return {
          sentence: sentenceText,
          blank_position: getBlankPosition(sentenceText, sentence?.blank_position ?? 0),
          correct_word: wordText
        }
      })

      setEnrichedWords(prev => prev.map(item =>
        item.cardId === card.cardId
          ? {
              ...item,
              sentences: transformedSentences,
              imageUrl: content.imageUrl,
              imageDescription: content.imageDescription || null
            }
          : item
      ))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate card content.'
      setContentGenerationErrors(prev => ({ ...prev, [card.cardId]: errorMessage }))
    } finally {
      setIsGeneratingByCardId(prev => ({ ...prev, [card.cardId]: false }))
    }
  }, [userId])

  // Predictive chunk fetching - loads next chunk in background
  useEffect(() => {
    if (!userId || isPaused || currentlyShowingRelearning) return

    const currentChunkIndex = Math.floor(currentIndex / CHUNK_SIZE)
    const nextChunkIndex = currentChunkIndex + 1
    const cardsLeftInChunk = (currentChunkIndex + 1) * CHUNK_SIZE - (currentIndex + 1)

    if (
      cardsLeftInChunk <= PREFETCH_THRESHOLD &&
      !isFetchingNextChunk &&
      !fetchedChunks.current.has(nextChunkIndex) &&
      (nextChunkIndex * CHUNK_SIZE) < enrichedWords.length
    ) {
      fetchNextChunk(nextChunkIndex, enrichedWords)
    }
  }, [currentIndex, enrichedWords, isFetchingNextChunk, userId, isPaused, currentlyShowingRelearning, fetchNextChunk])

  // Helper functions for re-learning queue management
  const addToRelearningQueue = useCallback((card: QueuedCard, originalIndex: number) => {
    const relearningCard: RelearningCard = {
      ...card,
      originalIndex,
      timesRelearned: 1,
      addedToRelearningAt: new Date()
    }
    
    setRelearningQueue(prev => {
      // Check if card is already in re-learning queue
      const cardId = isCardBased ? card.cardId : (card as any).id
      const existingIndex = prev.findIndex(c => (isCardBased ? c.cardId : (c as any).id) === cardId)
      if (existingIndex >= 0) {
        // Update existing entry - increase times relearned
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          timesRelearned: updated[existingIndex].timesRelearned + 1,
          addedToRelearningAt: new Date()
        }
        const [existingCard] = updated.splice(existingIndex, 1)
        return [...updated, existingCard]
      } else {
        // Add new entry to the end of the queue
        return [...prev, relearningCard]
      }
    })
  }, [isCardBased])

  const cycleRelearningCard = useCallback((itemId: string) => {
    setRelearningQueue(prev => {
      const index = prev.findIndex(item => (isCardBased ? item.cardId : (item as any).id) === itemId)
      if (index === -1) return prev

      const card = {
        ...prev[index],
        timesRelearned: prev[index].timesRelearned + 1,
        addedToRelearningAt: new Date()
      }

      const queueWithoutCard = [...prev]
      queueWithoutCard.splice(index, 1)
      return [...queueWithoutCard, card]
    })
  }, [isCardBased])

  const removeFromRelearningQueue = useCallback((itemId: string, markCompleted: boolean = false) => {
    setRelearningQueue(prev => {
      const index = prev.findIndex(item => (isCardBased ? item.cardId : (item as any).id) === itemId)
      if (index === -1) return prev

      const updated = [...prev]
      updated.splice(index, 1)

      if (markCompleted) {
        setCompletedRelearningCount(prevCount => prevCount + 1)
      }

      return updated
    })
  }, [isCardBased])

  const shouldTransitionToRelearning = useCallback((mainQueueFinished: boolean) => {
    if (relearningQueue.length === 0) return false
    if (mainQueueFinished) return true

    return completedMainCards > 0 && completedMainCards % 3 === 0
  }, [relearningQueue.length, completedMainCards])

  const handleReviewButton = useCallback(async (button: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentWord || isSubmittingReview || isPaused) return
    
    setIsSubmittingReview(true)
    setReviewSubmitError(null)
    const responseTime = Date.now() - currentCardStartTime
    
    const currentItemId = currentWord.cardId
    const wordId = currentWord.word?.id || currentWord.cardId
    
    try {
      // Submit review to SM-2 system (now always using card-based system)
      const { error } = await submitReview({
        wordId: wordId || '',
        cardId: currentWord.cardId, // Always use cardId for proper card tracking
        button,
        responseTimeMs: responseTime
      })
      
      if (error) {
        console.error('Failed to submit review:', error)
        setReviewSubmitError(typeof error === 'string' ? error : 'Failed to save your review. Please try again.')
        return
      }
      
      // Update local stats
      const isCorrect = button === 'good' || button === 'easy'
      
      setSessionStats(prev => {
        const newStats = {
          ...prev,
          cardsStudied: prev.cardsStudied + 1,
          cardsCorrect: prev.cardsCorrect + (isCorrect ? 1 : 0),
          totalReviews: prev.totalReviews + 1,
          accuracy: ((prev.cardsCorrect + (isCorrect ? 1 : 0)) / (prev.cardsStudied + 1)) * 100
        }
        
        return newStats
      })
      
      // Track review for session summary
      const review: CardReview = {
        wordId: wordId || '',
        cardId: currentItemId,
        button,
        responseTime,
        timestamp: new Date()
      }
      setCardReviews(prev => [...prev, review])
      setResponseTimes(prev => [...prev, responseTime])

      if (!currentlyShowingRelearning && !completedMainWordIds.current.has(currentItemId)) {
        completedMainWordIds.current.add(currentItemId)
        setCompletedMainCards(completedMainWordIds.current.size)
      }
      
      // Handle "Again" button - add to re-learning queue instead of removing completely
      if (button === 'again') {
        if (currentlyShowingRelearning) {
          cycleRelearningCard(currentItemId)
        } else {
          // Add current card to re-learning queue
          addToRelearningQueue(currentWord, currentIndex)
        }
      } else {
        // For other buttons, remove from appropriate queue
        if (currentlyShowingRelearning) {
          removeFromRelearningQueue(currentItemId, true)
        } else if (!isCardBased) {
          const queueManager = getQueueManager()
          queueManager.removeFromQueue(currentItemId)
        }
      }

      setHasReviewedCurrentCard(true)
      setReviewCompleted(true)
      
    } catch (error) {
      console.error('Review submission failed:', error)
      setReviewSubmitError('Failed to save your review. Please try again.')
    } finally {
      setIsSubmittingReview(false)
    }
  }, [currentWord, isSubmittingReview, isPaused, currentCardStartTime, currentlyShowingRelearning, currentIndex, addToRelearningQueue, removeFromRelearningQueue, cycleRelearningCard, isCardBased])
  
  const handleReview = useCallback((result: ReviewResult) => {
    // Legacy quality mapping (buttons use 1-4, keyboard may send 0-5)
    const qualityToButton: Record<number, 'again' | 'hard' | 'good' | 'easy'> = {
      0: 'again',
      1: 'again',
      2: 'hard',
      3: 'good',
      4: 'easy',
      5: 'easy'
    }
    const button = qualityToButton[result.quality] || 'again'
    handleReviewButton(button)
  }, [handleReviewButton])

  const completeSession = useCallback(async () => {
    const endTime = new Date()
    const duration = sessionDuration
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0

    const finalStats = {
      ...sessionStats,
      endTime,
      averageResponseTime: avgResponseTime
    }

    setSessionStats(finalStats)
    setIsSessionComplete(true)

    // Complete session in database
    const completionPayload = {
      wordsStudied: finalStats.cardsStudied,
      wordsCorrect: finalStats.cardsCorrect,
      totalReviews: finalStats.totalReviews,
      sessionDurationSeconds: duration,
      accuracyPercentage: finalStats.accuracy
    }

    if (dbSessionId) {
      await completeStudySession(dbSessionId, completionPayload)
    } else {
      pendingCompletionRef.current = completionPayload
    }

    // Call completion handler with session data
    onSessionComplete({
      session_type: sessionType,
      words_studied: finalStats.cardsStudied,
      words_correct: finalStats.cardsCorrect,
      total_reviews: finalStats.totalReviews,
      session_duration_seconds: duration,
      accuracy_percentage: finalStats.accuracy
    })
  }, [sessionStats, responseTimes, sessionType, onSessionComplete, sessionDuration, dbSessionId])

  const handleNext = useCallback(() => {
    if (isPaused || isSubmittingReview) {
      return
    }

    if (!hasReviewedCurrentCard) {
      return
    }

    if (currentlyShowingRelearning) {
      if (relearningQueue.length === 0) {
        setCurrentlyShowingRelearning(false)

        if (mainQueueCompleted) {
          completeSession()
        }
      }
      return
    }

    const totalMainCards = enrichedWords?.length ?? 0
    const hasMoreMainCards = currentIndex < totalMainCards - 1

    if (hasMoreMainCards) {
      setCurrentIndex(prev => prev + 1)
      setHasReviewedCurrentCard(false)
    } else if (!mainQueueCompleted) {
      setMainQueueCompleted(true)
    }

    const mainQueueJustFinished = !hasMoreMainCards
    const routeToRelearning = shouldTransitionToRelearning(mainQueueJustFinished)

    if (routeToRelearning) {
      setCurrentlyShowingRelearning(true)
      return
    }

    if (mainQueueJustFinished && relearningQueue.length === 0) {
      completeSession()
    }
  }, [isPaused, isSubmittingReview, hasReviewedCurrentCard, currentlyShowingRelearning, relearningQueue.length, mainQueueCompleted, completeSession, enrichedWords, currentIndex, shouldTransitionToRelearning])

  // Handle review completion with fast animation-driven transition
  useEffect(() => {
    if (reviewCompleted) {
      const timeoutId = setTimeout(() => {
        handleNext()
        setReviewCompleted(false) // Reset flag
      }, 300) // Reduced from 1000ms to 300ms for responsive experience

      // Cleanup timeout on unmount or if reviewCompleted changes
      return () => clearTimeout(timeoutId)
    }
  }, [reviewCompleted, handleNext])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  const handlePauseResume = useCallback(async () => {
    if (isPaused) {
      // Resume session
      if (pauseStartTime) {
        const pauseDuration = Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000)
        setTotalPauseTime(prev => prev + pauseDuration)
        setCurrentCardStartTime(prev => prev + pauseDuration * 1000)
      }
      setIsPaused(false)
      setPauseStartTime(null)
      
      if (dbSessionId) {
        await resumeStudySession(dbSessionId)
      }
    } else {
      // Pause session
      setIsPaused(true)
      setPauseStartTime(new Date())
      
      if (dbSessionId) {
        await pauseStudySession(dbSessionId)
      }
    }
  }, [isPaused, pauseStartTime, dbSessionId])

  const handleExitSession = useCallback(async () => {
    if (dbSessionId && !isSessionComplete) {
      await abandonStudySession(dbSessionId)
    }
    onExit()
  }, [dbSessionId, isSessionComplete, onExit])

  const restartSession = useCallback(() => {
    setCurrentIndex(0)
    setSessionStats({
      cardsStudied: 0,
      cardsCorrect: 0,
      totalReviews: 0,
      accuracy: 0,
      startTime: new Date(),
      averageResponseTime: 0
    })
    setResponseTimes([])
    setCardReviews([])
    setIsSessionComplete(false)
    setIsPaused(false)
    setPauseStartTime(null)
    setTotalPauseTime(0)
    setDbSessionId(null)
    completedMainWordIds.current.clear()
    setCompletedMainCards(0)
    setCompletedRelearningCount(0)
    setCurrentCardStartTime(Date.now())
    initialMainCardCount.current = initialCards.length
  }, [initialCards])

  // Session completion screen
  if (isSessionComplete) {
    return (
      <motion.div
        className={cn("max-w-2xl mx-auto space-y-6", className)}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">
              Session Complete!
            </CardTitle>
            <p className="text-green-700">
              Great job on completing your {sessionType} session
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {sessionStats.cardsStudied}
                </div>
                <div className="text-sm text-muted-foreground">Cards Studied</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sessionStats.cardsCorrect}
                </div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sessionStats.accuracy.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatTime(sessionDuration)}
                </div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
            </div>

            {/* Progress visualization */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Session Progress</span>
                <span>{sessionStats.cardsCorrect}/{sessionStats.cardsStudied}</span>
              </div>
              <Progress value={sessionStats.accuracy} className="h-2" />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={restartSession}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Study Again
              </Button>
              
              <Button
                onClick={handleExitSession}
                className="gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // No cards available
  if (totalCards === 0) {
    return (
      <div className={cn("max-w-2xl mx-auto", className)}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <Target className="w-12 h-12 mx-auto text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Cards Available</h3>
            <p className="text-muted-foreground mb-4">
              There are no words ready for this study session.
            </p>
            <Button onClick={handleExitSession}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentWord) {
    return (
      <div className={cn("max-w-2xl mx-auto", className)}>
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <h3 className="text-xl font-semibold">Preparing next card</h3>
            <p className="text-muted-foreground">
              We are syncing your queue. This should only take a moment.
            </p>
            <Button variant="outline" onClick={handleExitSession}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main study interface
  return (
    <div className={cn("max-w-4xl mx-auto h-screen flex flex-col gap-1 sm:gap-2 md:gap-4 py-1 sm:py-2", className)}>
      {/* Session header */}
      <Card className="border-0 shadow-sm bg-muted/30 flex-shrink-0">
        <CardContent className="p-1.5 sm:p-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Badge variant="secondary" className="capitalize text-xs py-0.5 px-1.5">
                {sessionType} Session
              </Badge>
              
              {currentlyShowingRelearning && (
                <Badge variant="destructive" className="animate-pulse text-xs py-0.5 px-1.5">
                  Re-learning
                </Badge>
              )}
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatTime(sessionDuration)}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                <div className="text-left sm:text-right">
                <div className="text-xs text-muted-foreground leading-tight">Progress</div>
                <div className="text-sm font-semibold leading-tight">
                  {displayedMainPosition} / {totalMainCards || 0}
                </div>
                {relearningQueue.length > 0 && (
                  <div className="text-xs text-orange-600 leading-tight">
                    +{relearningQueue.length} re-learning
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePauseResume}
                  disabled={isSubmittingReview}
                  className="text-xs h-6 px-1.5"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3 h-3 mr-0.5" />
                      <span className="hidden xs:inline">Resume</span>
                      <span className="xs:hidden">▶</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3 mr-0.5" />
                      <span className="hidden xs:inline">Pause</span>
                      <span className="xs:hidden">⏸</span>
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExitSession}
                  className="text-xs h-6 px-1.5"
                >
                  <StopCircle className="w-3 h-3 mr-0.5" />
                  <span className="hidden xs:inline">Exit</span>
                  <span className="xs:hidden">✕</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-1 sm:mt-1.5">
            <Progress value={progress} className="h-1 sm:h-1.5" />
          </div>
        </CardContent>
      </Card>

      {/* Main flashcard - Now using CardRenderer to support multiple card types */}
      <AnimatePresence mode="wait">
        {currentWord && (
          <div className="relative flex-1 space-y-6 min-h-0">
            <CardRenderer
              key={currentWord.cardId}
              card={currentWord}
              isGeneratingContent={Boolean(isGeneratingByCardId[currentWord.cardId])}
              contentGenerationError={contentGenerationErrors[currentWord.cardId] || null}
              onRegenerateContent={() => regenerateCardContent(currentWord)}
              onReview={handleReview}
              isInteractionDisabled={isSubmittingReview || isPaused}
              onNext={currentIndex < totalCards - 1 ? handleNext : undefined}
              onPrevious={currentIndex > 0 ? handlePrevious : undefined}
              showNavigation={false}
              onWordUpdated={(updatedWord) => {
                // Update the current word if edited
                setEnrichedWords(prev => 
                  prev.map(w => w.cardId === currentWord.cardId 
                    ? { ...w, word: { ...w.word, ...updatedWord } as any }
                    : w
                  )
                )
              }}
            />

            {isPaused && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">Session paused</p>
                  <p className="text-xs text-muted-foreground">Resume to continue reviewing cards.</p>
                </div>
              </div>
            )}

            {reviewSubmitError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-3 text-sm text-red-700 flex items-center justify-between gap-3">
                  <span>{reviewSubmitError}</span>
                  <Button size="sm" variant="outline" onClick={() => setReviewSubmitError(null)}>
                    Dismiss
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Session stats sidebar */}
      <Card className="bg-muted/30 border-0 shadow-sm flex-shrink-0">
        <CardContent className="p-2 sm:p-3">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
            <div>
              <div className="text-base sm:text-lg font-semibold text-green-600">
                {sessionStats.cardsCorrect}
              </div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            
            <div>
              <div className="text-base sm:text-lg font-semibold text-red-600">
                {sessionStats.cardsStudied - sessionStats.cardsCorrect}
              </div>
              <div className="text-xs text-muted-foreground">Incorrect</div>
            </div>
            
            <div>
              <div className="text-base sm:text-lg font-semibold text-blue-600">
                {sessionStats.accuracy.toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
            
            <div>
              <div className="text-base sm:text-lg font-semibold text-orange-600">
                {relearningQueue.length}
              </div>
              <div className="text-xs text-muted-foreground">Re-learning</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
