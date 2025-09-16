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
  FlashcardWithWord, 
  ReviewResult, 
  StudySession as StudySessionType,
  SessionType 
} from '@/types'
import { submitReview, getWordProgress } from '@/lib/reviews'
import { getQueueManager } from '@/lib/queue-manager'
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
  flashcards: FlashcardWithWord[]
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

interface CardReview {
  wordId: string
  button: 'again' | 'hard' | 'good' | 'easy'
  responseTime: number
  timestamp: Date
}

export function StudySession({
  flashcards,
  sessionType,
  sessionId: propSessionId,
  onSessionComplete,
  onExit,
  className
}: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    cardsStudied: 0,
    cardsCorrect: 0,
    totalReviews: 0,
    accuracy: 0,
    startTime: new Date(),
    averageResponseTime: 0
  })
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const [responseTimes, setResponseTimes] = useState<number[]>([])
  const [cardReviews, setCardReviews] = useState<CardReview[]>([])
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [dbSessionId, setDbSessionId] = useState<string | null>(propSessionId || null)
  const [isPaused, setIsPaused] = useState(false)
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null)
  const [totalPauseTime, setTotalPauseTime] = useState(0)

  const currentCard = flashcards[currentIndex]
  const totalCards = flashcards.length
  const progress = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0

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

  const handleReviewButton = useCallback(async (button: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard || isSubmittingReview) return
    
    setIsSubmittingReview(true)
    const responseTime = Date.now() - sessionStats.startTime.getTime()
    
    try {
      // Submit review to SM-2 system
      const { error } = await submitReview({
        wordId: currentCard.word.id,
        flashcardId: currentCard.flashcard.id,
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
        wordId: currentCard.word.id,
        button,
        responseTime,
        timestamp: new Date()
      }
      setCardReviews(prev => [...prev, review])
      setResponseTimes(prev => [...prev, responseTime])
      
      // Remove from queue
      const queueManager = getQueueManager()
      queueManager.removeFromQueue(currentCard.word.id)
      
    } catch (error) {
      console.error('Review submission failed:', error)
    } finally {
      setIsSubmittingReview(false)
      
      // Move to next card after a short delay
      setTimeout(() => {
        handleNext()
      }, 1000)
    }
  }, [currentCard, isSubmittingReview, sessionStats.startTime])
  
  const handleReview = useCallback((result: ReviewResult) => {
    // Legacy support for existing ReviewResult interface
    const button = result.quality >= 5 ? 'easy' : 
                  result.quality >= 3 ? 'good' : 
                  result.quality >= 2 ? 'hard' : 'again'
    handleReviewButton(button)
  }, [handleReviewButton])

  const handleNext = useCallback(() => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      completeSession()
    }
  }, [currentIndex, totalCards])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

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
              There are no flashcards ready for this study session.
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
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Session header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="capitalize">
                {sessionType} Session
              </Badge>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {formatTime(sessionDuration)}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="font-semibold">
                  {currentIndex + 1} / {totalCards}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePauseResume}
                  disabled={isSubmittingReview}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExitSession}
                >
                  <StopCircle className="w-4 h-4 mr-1" />
                  Exit
                </Button>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Main flashcard */}
      <AnimatePresence mode="wait">
        {currentCard && (
          <div className="space-y-6">
            <FlashcardComponent
              key={currentCard.flashcard.id}
              word={currentCard.word}
              flashcard={currentCard.flashcard}
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
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">
                {sessionStats.cardsCorrect}
              </div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            
            <div>
              <div className="text-lg font-semibold text-red-600">
                {sessionStats.cardsStudied - sessionStats.cardsCorrect}
              </div>
              <div className="text-xs text-muted-foreground">Incorrect</div>
            </div>
            
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {sessionStats.accuracy.toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
