'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FlashcardProps, 
  FlashcardState, 
  FlashcardAnswer, 
  FlashcardSentence,
  ReviewQuality 
} from '@/types'
import { ClozeTest } from './ClozeTest'
import { FlashcardImage } from './FlashcardImage'
import { FlashcardNavigation } from './FlashcardNavigation'
import { 
  Volume2, 
  RotateCcw, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DIFFICULTY_LEVELS } from '@/lib/words'

const FLIP_ANIMATION = {
  initial: { rotateY: 0 },
  animate: { rotateY: 180 },
  exit: { rotateY: 0 }
}

const CARD_VARIANTS = {
  enter: { scale: 0.9, opacity: 0, x: 100 },
  center: { scale: 1, opacity: 1, x: 0 },
  exit: { scale: 0.9, opacity: 0, x: -100 }
}

export function FlashcardComponent({
  word,
  flashcard,
  onReview,
  onNext,
  onPrevious,
  showNavigation = false,
  autoFlip = false,
  className
}: FlashcardProps) {
  const [state, setState] = useState<FlashcardState>({
    isFlipped: false,
    currentSentenceIndex: 0,
    userInput: '',
    isCorrect: undefined,
    showFeedback: false,
    responseTime: 0
  })

  const [startTime] = useState(Date.now())
  const [sentences, setSentences] = useState<FlashcardSentence[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Parse flashcard sentences
  useEffect(() => {
    try {
      const parsedSentences = Array.isArray(flashcard.sentences) 
        ? flashcard.sentences 
        : JSON.parse(flashcard.sentences as string)
      setSentences(parsedSentences)
    } catch (error) {
      console.error('Error parsing flashcard sentences:', error)
      setSentences([])
    }
  }, [flashcard.sentences])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      
      switch (e.key) {
        case ' ':
          e.preventDefault()
          handleFlip()
          break
        case 'ArrowLeft':
          e.preventDefault()
          onPrevious?.()
          break
        case 'ArrowRight':
          e.preventDefault()
          if (state.isFlipped) onNext?.()
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          if (state.isFlipped) {
            handleReview(parseInt(e.key) as ReviewQuality)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [state.isFlipped, onNext, onPrevious])

  const handleFlip = useCallback(() => {
    setState(prev => ({
      ...prev,
      isFlipped: !prev.isFlipped,
      responseTime: Date.now() - startTime
    }))
  }, [startTime])

  const handleClozeAnswer = useCallback((answer: FlashcardAnswer) => {
    setState(prev => ({
      ...prev,
      isCorrect: answer.isCorrect,
      showFeedback: true,
      responseTime: answer.responseTimeMs
    }))

    // Auto-flip after showing feedback
    setTimeout(() => {
      if (autoFlip) {
        setState(prev => ({ ...prev, isFlipped: true }))
      }
    }, 1500)
  }, [autoFlip])

  const handleReview = useCallback((quality: ReviewQuality) => {
    onReview({
      quality,
      response_time_ms: state.responseTime
    })
  }, [onReview, state.responseTime])

  const playAudio = useCallback(() => {
    if (flashcard.audio_url && audioRef.current) {
      audioRef.current.play().catch(console.error)
    }
  }, [flashcard.audio_url])

  const resetCard = useCallback(() => {
    setState({
      isFlipped: false,
      currentSentenceIndex: 0,
      userInput: '',
      isCorrect: undefined,
      showFeedback: false,
      responseTime: 0
    })
  }, [])

  // Touch/swipe gestures
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left') {
      onNext?.()
    } else if (direction === 'right') {
      onPrevious?.()
    }
  }, [onNext, onPrevious])

  return (
    <motion.div 
      className={cn("relative w-full max-w-2xl mx-auto", className)}
      variants={CARD_VARIANTS}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Audio element */}
      {flashcard.audio_url && (
        <audio ref={audioRef} preload="metadata">
          <source src={flashcard.audio_url} type="audio/mpeg" />
        </audio>
      )}

      {/* Main flashcard */}
      <div 
        ref={cardRef}
        className="relative h-96 md:h-[500px] cursor-pointer perspective-1000"
        onClick={!state.isFlipped ? handleFlip : undefined}
        role="button"
        aria-label={`Flashcard for word ${word.word}. ${state.isFlipped ? 'Back side showing exercises' : 'Front side showing word definition'}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            if (!state.isFlipped) handleFlip()
          }
        }}
      >
        <motion.div
          className="relative w-full h-full preserve-3d"
          animate={{ rotateY: state.isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Front of card */}
          <Card 
            className="absolute inset-0 backface-hidden border-2 border-border/50 hover:border-primary/20 transition-colors"
            role="img"
            aria-label={`Word: ${word.word}. Definition: ${word.definition}`}
          >
            <CardContent className="p-8 h-full flex flex-col justify-between">
              {/* Word and metadata */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Badge 
                    variant="secondary"
                    className={DIFFICULTY_LEVELS[word.difficulty as keyof typeof DIFFICULTY_LEVELS]?.color}
                  >
                    {DIFFICULTY_LEVELS[word.difficulty as keyof typeof DIFFICULTY_LEVELS]?.label}
                  </Badge>
                  {word.category && (
                    <Badge variant="outline">{word.category}</Badge>
                  )}
                </div>
                
                <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-2">
                  {word.word}
                </h2>
                
                {word.pronunciation && (
                  <p className="text-lg text-muted-foreground font-mono">
                    /{word.pronunciation}/
                  </p>
                )}

                {word.definition && (
                  <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
                    {word.definition}
                  </p>
                )}
              </div>

              {/* Image display */}
              {flashcard.image_url && (
                <FlashcardImage 
                  imageUrl={flashcard.image_url}
                  alt={`Visual representation of ${word.word}`}
                  className="flex-1 max-h-48"
                />
              )}

              {/* Front controls */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {flashcard.audio_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        playAudio()
                      }}
                      className="gap-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      Play
                    </Button>
                  )}
                </div>
                
                <Button variant="ghost" size="sm" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Tap to flip
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Back of card */}
          <Card 
            className="absolute inset-0 backface-hidden rotate-y-180 border-2 border-primary/20"
            role="main"
            aria-label="Flashcard exercises - fill in the blanks and rate difficulty"
          >
            <CardContent className="p-8 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold">{word.word}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetCard}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>

              {/* Cloze test sentences */}
              <div className="flex-1 space-y-6">
                {sentences.map((sentence, index) => (
                  <ClozeTest
                    key={index}
                    sentence={sentence}
                    onAnswer={handleClozeAnswer}
                    isRevealed={state.showFeedback}
                  />
                ))}
              </div>

              {/* Review buttons */}
              <div className="grid grid-cols-4 gap-2 mt-6">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReview(1)}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Again (1)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReview(2)}
                >
                  Hard (2)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReview(3)}
                >
                  Good (3)
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleReview(4)}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Easy (4)
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Navigation */}
      {showNavigation && (
        <FlashcardNavigation
          onPrevious={onPrevious}
          onNext={onNext}
          canGoNext={state.isFlipped}
          className="mt-6"
        />
      )}

      {/* Keyboard shortcuts help */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd> to flip • 
          <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">←→</kbd> navigate • 
          <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">1-4</kbd> rate difficulty
        </p>
      </div>
    </motion.div>
  )
}
