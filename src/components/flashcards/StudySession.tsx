'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlashcardComponent } from './FlashcardComponent'
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
import { 
  Clock, 
  Target, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  TrendingUp,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StudySessionProps {
  flashcards: FlashcardWithWord[]
  sessionType: SessionType
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

export function StudySession({
  flashcards,
  sessionType,
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

  const currentCard = flashcards[currentIndex]
  const totalCards = flashcards.length
  const progress = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0

  // Session timer
  const [sessionDuration, setSessionDuration] = useState(0)
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const duration = Math.floor((now.getTime() - sessionStats.startTime.getTime()) / 1000)
      setSessionDuration(duration)
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionStats.startTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleReview = useCallback((result: ReviewResult) => {
    const isCorrect = result.quality >= 3 // Quality 3+ is considered correct
    
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

    if (result.response_time_ms) {
      setResponseTimes(prev => [...prev, result.response_time_ms!])
    }

    // Move to next card after a short delay
    setTimeout(() => {
      handleNext()
    }, 1000)
  }, [])

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

  const completeSession = useCallback(() => {
    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - sessionStats.startTime.getTime()) / 1000)
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
  }, [sessionStats, responseTimes, sessionType, onSessionComplete])

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
    setIsSessionComplete(false)
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
                onClick={onExit}
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
            <Button onClick={onExit}>
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={onExit}
              >
                Exit Session
              </Button>
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
          <FlashcardComponent
            key={currentCard.flashcard.id}
            word={currentCard.word}
            flashcard={currentCard.flashcard}
            onReview={handleReview}
            onNext={currentIndex < totalCards - 1 ? handleNext : undefined}
            onPrevious={currentIndex > 0 ? handlePrevious : undefined}
            showNavigation={true}
            autoFlip={false}
          />
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
