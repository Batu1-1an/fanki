'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlashcardComponent } from './FlashcardComponent'
import { ReviewButtons } from './ReviewButtons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Word, 
  FlashcardSentence, 
  ReviewResult, 
  StudySession as StudySessionType,
  SessionType 
} from '@/types'
import { submitReview, getWordProgress } from '@/lib/reviews'
import { getQueueManager } from '@/lib/queue-manager'
import { aiService } from '@/lib/ai-services'
import { useAuth } from '@/hooks/useAuth'
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

interface StudySessionProps {
  words: Word[]
  sessionType: SessionType
  sessionId?: string
  onSessionComplete: (session: Partial<StudySessionType>) => void
  onExit: () => void
  className?: string
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

interface RelearningCard extends Word {
  originalIndex: number
  timesRelearned: number
  addedToRelearningAt: Date
}

interface CardReview {
  wordId: string
  button: 'again' | 'hard' | 'good' | 'easy'
  responseTime: number
  timestamp: Date
}

export function StudySession({
  words,
  sessionType,
  sessionId: propSessionId,
  onSessionComplete,
  onExit,
  className
}: StudySessionProps) {
  const { user } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    cardsStudied: 0,
    cardsCorrect: 0,
    totalReviews: 0,
    accuracy: 0,
    startTime: new Date(),
    averageResponseTime: 0
  })
  
  // Dynamic content generation state
  const [currentSentences, setCurrentSentences] = useState<FlashcardSentence[] | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [currentImageDescription, setCurrentImageDescription] = useState<string | null>(null)
  const [isGeneratingContent, setIsGeneratingContent] = useState(true)
  const [contentGenerationError, setContentGenerationError] = useState<string | null>(null)
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [cardReviews, setCardReviews] = useState<CardReview[]>([])
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [dbSessionId, setDbSessionId] = useState<string | null>(propSessionId || null)
  const [isPaused, setIsPaused] = useState(false)
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null)
  const [totalPauseTime, setTotalPauseTime] = useState(0)
  
  // Re-learning queue for lapsed cards
  const [relearningQueue, setRelearningQueue] = useState<RelearningCard[]>([])
  const [currentlyShowingRelearning, setCurrentlyShowingRelearning] = useState(false)
  const [mainQueueCompleted, setMainQueueCompleted] = useState(false)

  // Get current word from either main queue or re-learning queue
  const currentWord = currentlyShowingRelearning && relearningQueue.length > 0
    ? relearningQueue[0] // Show first word from re-learning queue
    : (words && words[currentIndex]) // Show word from main queue (with bounds check)
  
  const totalCards = (words?.length || 0) + relearningQueue.length
  const completedCards = currentIndex + (relearningQueue.length - (currentlyShowingRelearning ? relearningQueue.length : 0))
  const progress = totalCards > 0 ? ((completedCards + 1) / totalCards) * 100 : 0

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

  // Initialize database session
  useEffect(() => {
    if (!dbSessionId) {
      initializeSession()
    }
  }, [])

  const initializeSession = async () => {
    const { data, error } = await createStudySession({
      sessionType
    })
    
    if (data) {
      setDbSessionId(data.id)
    } else {
      console.error('Failed to create session:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Generate dynamic content (sentences + image) for the current word
  const generateDynamicContent = useCallback(async () => {
    if (!currentWord || !user?.id) return

    setIsGeneratingContent(true)
    setContentGenerationError(null)
    setCurrentSentences(null)
    setCurrentImageUrl(null)
    setCurrentImageDescription(null)

    try {
      const difficulty = currentWord.difficulty <= 2 ? 'beginner' : 
                       currentWord.difficulty <= 4 ? 'intermediate' : 'advanced'
      
      // Fetch sentences and image in parallel for better performance
      const [sentenceResult, imageResult] = await Promise.all([
        aiService.generateSentences(currentWord.word, difficulty, user.id),
        aiService.generateImage(currentWord.word, user.id)
      ])
      
      setCurrentSentences(sentenceResult.sentences as FlashcardSentence[])
      setCurrentImageUrl(imageResult.imageUrl)
      setCurrentImageDescription(imageResult.description || null)
    } catch (error) {
      console.error('Failed to generate dynamic content:', error)
      setContentGenerationError('Failed to generate content. Click to retry.')
    } finally {
      setIsGeneratingContent(false)
    }
  }, [currentWord, user?.id])

  // Generate dynamic content when current word changes
  useEffect(() => {
    if (currentWord) {
      generateDynamicContent()
    }
  }, [generateDynamicContent])

  // Helper functions for re-learning queue management
  const addToRelearningQueue = useCallback((word: Word, originalIndex: number) => {
    const relearningCard: RelearningCard = {
      ...word,
      originalIndex,
      timesRelearned: 1,
      addedToRelearningAt: new Date()
    }
    
    setRelearningQueue(prev => {
      // Check if word is already in re-learning queue
      const existingIndex = prev.findIndex(c => c.id === word.id)
      if (existingIndex >= 0) {
        // Update existing entry - increase times relearned
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          timesRelearned: updated[existingIndex].timesRelearned + 1,
          addedToRelearningAt: new Date()
        }
        return updated
      } else {
        // Add new entry to the end of the queue
        return [...prev, relearningCard]
      }
    })
  }, [])

  const removeFromRelearningQueue = useCallback((wordId: string) => {
    setRelearningQueue(prev => prev.filter(word => word.id !== wordId))
  }, [])

  const shouldShowRelearningCard = useCallback(() => {
    // Show re-learning cards after every 3-4 regular cards, or when main queue is done
    return relearningQueue.length > 0 && (
      mainQueueCompleted || 
      (currentIndex > 0 && currentIndex % 3 === 0)
    )
  }, [relearningQueue.length, mainQueueCompleted, currentIndex])

  const handleReviewButton = useCallback(async (button: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentWord || isSubmittingReview) return
    
    setIsSubmittingReview(true)
    const responseTime = Date.now() - sessionStats.startTime.getTime()
    
    try {
      // Submit review to SM-2 system (no flashcard_id needed for dynamic sentences)
      const { error } = await submitReview({
        wordId: currentWord.id,
        button,
        responseTimeMs: responseTime
      })
      
      if (error) {
        console.error('Failed to submit review:', error)
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
        
        // Update database session
        if (dbSessionId) {
          updateStudySession(dbSessionId, {
            wordsStudied: newStats.cardsStudied,
            wordsCorrect: newStats.cardsCorrect,
            totalReviews: newStats.totalReviews,
            accuracyPercentage: newStats.accuracy
          })
        }
        
        return newStats
      })
      
      // Track review for session summary
      const review: CardReview = {
        wordId: currentWord.id,
        button,
        responseTime,
        timestamp: new Date()
      }
      setCardReviews(prev => [...prev, review])
      setResponseTimes(prev => [...prev, responseTime])
      
      // Handle "Again" button - add to re-learning queue instead of removing completely
      if (button === 'again') {
        if (currentlyShowingRelearning) {
          // If this is already a re-learning word, update its re-learning count
          const relearningWord = relearningQueue[0]
          addToRelearningQueue(relearningWord, relearningWord.originalIndex)
          // Remove current re-learning word (it will be re-added with updated count)
          removeFromRelearningQueue(currentWord.id)
        } else {
          // Add current word to re-learning queue
          addToRelearningQueue(currentWord, currentIndex)
        }
      } else {
        // For other buttons, remove from appropriate queue
        if (currentlyShowingRelearning) {
          removeFromRelearningQueue(currentWord.id)
        } else {
          const queueManager = getQueueManager()
          queueManager.removeFromQueue(currentWord.id)
        }
      }
      
    } catch (error) {
      console.error('Review submission failed:', error)
    } finally {
      setIsSubmittingReview(false)
      
      // Move to next card after a short delay
      setTimeout(() => {
        handleNext()
      }, 1000)
    }
  }, [currentWord, isSubmittingReview, sessionStats.startTime, currentlyShowingRelearning, relearningQueue, currentIndex, addToRelearningQueue, removeFromRelearningQueue])
  
  const handleReview = useCallback((result: ReviewResult) => {
    // Legacy support for existing ReviewResult interface
    const button = result.quality >= 5 ? 'easy' : 
                  result.quality >= 3 ? 'good' : 
                  result.quality >= 2 ? 'hard' : 'again'
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
    if (dbSessionId) {
      await completeStudySession(dbSessionId, {
        wordsStudied: finalStats.cardsStudied,
        wordsCorrect: finalStats.cardsCorrect,
        totalReviews: finalStats.totalReviews,
        sessionDurationSeconds: duration,
        accuracyPercentage: finalStats.accuracy
      })
    }

    // Call completion handler with session data
    onSessionComplete({
      session_type: sessionType,
      words_studied: finalStats.cardsStudied,
      words_correct: finalStats.cardsCorrect,
      total_reviews: finalStats.totalReviews,
      session_duration_seconds: duration,
      accuracy_percentage: finalStats.accuracy,
      started_at: finalStats.startTime.toISOString(),
      ended_at: endTime.toISOString()
    })
  }, [sessionStats, responseTimes, sessionType, onSessionComplete, sessionDuration, dbSessionId])

  const handleNext = useCallback(() => {
    if (currentlyShowingRelearning) {
      // We just finished a re-learning card, go back to main queue
      setCurrentlyShowingRelearning(false)
    } else {
      // We just finished a main queue card
      // Check if we should show a re-learning card next
      if (shouldShowRelearningCard() && !mainQueueCompleted) {
        setCurrentlyShowingRelearning(true)
        return
      }
      
      // Continue with main queue
      if (currentIndex < (words?.length || 0) - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        // Main queue completed
        setMainQueueCompleted(true)
        
        // If there are re-learning words, start showing them
        if (relearningQueue.length > 0) {
          setCurrentlyShowingRelearning(true)
        } else {
          // No re-learning words, session complete
          completeSession()
        }
      }
    }
    
    // If we're in re-learning mode but no cards left, complete session
    if (mainQueueCompleted && relearningQueue.length === 0) {
      completeSession()
    }
  }, [currentIndex, words?.length, currentlyShowingRelearning, shouldShowRelearningCard, mainQueueCompleted, relearningQueue.length, completeSession])

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
  }, [])

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

  // No cards available or no current word
  if (totalCards === 0 || !currentWord) {
    return (
      <div className={cn("max-w-2xl mx-auto", className)}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <Target className="w-12 h-12 mx-auto text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Cards Available</h3>
            <p className="text-muted-foreground mb-4">
              {totalCards === 0 
                ? "There are no words ready for this study session." 
                : "Loading study session..."}
            </p>
            <Button onClick={handleExitSession}>
              Return to Dashboard
            </Button>
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
                  {currentIndex + 1} / {words?.length || 0}
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

      {/* Main flashcard */}
      <AnimatePresence mode="wait">
        {currentWord && (
          <div className="flex-1 space-y-6 min-h-0">
            <FlashcardComponent
              key={currentWord.id}
              word={currentWord}
              sentences={currentSentences}
              imageUrl={currentImageUrl}
              imageDescription={currentImageDescription}
              isGeneratingContent={isGeneratingContent}
              contentGenerationError={contentGenerationError}
              onRegenerateContent={generateDynamicContent}
              onReview={handleReview}
              onNext={currentIndex < totalCards - 1 ? handleNext : undefined}
              onPrevious={currentIndex > 0 ? handlePrevious : undefined}
              showNavigation={false}
              autoFlip={false}
            />
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
