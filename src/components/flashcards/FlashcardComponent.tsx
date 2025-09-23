'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FlashcardState, 
  FlashcardAnswer, 
  FlashcardSentence,
  ReviewQuality,
  ReviewResult,
  Word
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
  Clock,
  Edit,
  Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DIFFICULTY_LEVELS } from '@/lib/words'
import WordEditModal from '@/components/words/WordEditModal'
import { aiService } from '@/lib/ai-services'

const FLIP_ANIMATION = {
  initial: { rotateY: 0 },
  animate: { rotateY: 180 },
  exit: { rotateY: 0 }
}

const CARD_VARIANTS = {
  enter: { scale: 0.95, opacity: 0, x: 50 },
  center: { scale: 1, opacity: 1, x: 0 },
  exit: { scale: 0.95, opacity: 0, x: -50 }
}

interface FlashcardComponentProps {
  word: Word
  sentences: FlashcardSentence[] | null
  imageUrl: string | null
  imageDescription?: string | null
  isGeneratingContent: boolean
  contentGenerationError?: string | null
  onRegenerateContent?: () => void
  onReview: (result: ReviewResult) => void
  onNext?: () => void
  onPrevious?: () => void
  showNavigation?: boolean
  autoFlip?: boolean
  className?: string
  onWordUpdated?: (updatedWord: Word) => void
}

export function FlashcardComponent({
  word,
  sentences,
  imageUrl,
  imageDescription,
  isGeneratingContent,
  contentGenerationError,
  onRegenerateContent,
  onReview,
  onNext,
  onPrevious,
  showNavigation = false,
  autoFlip = false,
  className,
  onWordUpdated
}: FlashcardComponentProps) {
  const [state, setState] = useState<FlashcardState>({
    isFlipped: false,
    currentSentenceIndex: 0,
    userInput: '',
    isCorrect: undefined,
    showFeedback: false,
    responseTime: 0
  })

  const [startTime] = useState(Date.now())
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentWord, setCurrentWord] = useState<Word>(word)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Reset audio state when word changes
  useEffect(() => {
    setCurrentWord(word)
    setAudioUrl(null)
    setAudioError(null)
    setIsLoadingAudio(false)
  }, [word])

  const handleFlip = useCallback(() => {
    setState(prev => ({
      ...prev,
      isFlipped: !prev.isFlipped,
      responseTime: Date.now() - startTime
    }))
  }, [startTime])

  const handleShowAnswer = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!state.isFlipped) {
      handleFlip()
    }
  }, [state.isFlipped, handleFlip])

  const handleClozeAnswer = useCallback((answer: FlashcardAnswer) => {
    setState(prev => ({
      ...prev,
      isCorrect: answer.isCorrect,
      showFeedback: true,
      responseTime: answer.responseTimeMs
    }))

    // Auto-flip immediately after answer submission (new active recall flow)
    setTimeout(() => {
      setState(prev => ({ ...prev, isFlipped: true }))
    }, 800)
  }, [])

  const handleReview = useCallback((quality: ReviewQuality) => {
    onReview({
      quality,
      response_time_ms: state.responseTime
    })
  }, [onReview, state.responseTime])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (!state.isFlipped) {
            handleFlip()
          }
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
  }, [state.isFlipped, onNext, onPrevious, handleFlip, handleReview])

  const fetchAudio = useCallback(async () => {
    if (!currentWord.id) return
    
    setIsLoadingAudio(true)
    setAudioError(null)
    
    try {
      const { audioUrl: newAudioUrl } = await aiService.generateAudio(
        currentWord.word, 
        currentWord.id
      )
      setAudioUrl(newAudioUrl)
    } catch (error) {
      console.error('Failed to generate audio:', error)
      setAudioError('Failed to load audio')
    } finally {
      setIsLoadingAudio(false)
    }
  }, [currentWord.id, currentWord.word])

  const playAudio = useCallback(() => {
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.play().catch(console.error)
      } else {
        // Create a new audio element if ref is not available
        const audio = new Audio(audioUrl)
        audio.play().catch(console.error)
      }
    } else if (!isLoadingAudio && !audioError) {
      // First time - fetch the audio
      fetchAudio()
    }
  }, [audioUrl, isLoadingAudio, audioError, fetchAudio])

  const resetCard = useCallback(() => {
    setState({
      isFlipped: false,
      currentSentenceIndex: 0,
      userInput: '',
      isCorrect: undefined,
      showFeedback: false,
      responseTime: 0
    })
    // Reset audio state
    setAudioUrl(null)
    setAudioError(null)
    setIsLoadingAudio(false)
  }, [])

  // Touch/swipe gestures
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left') {
      onNext?.()
    } else if (direction === 'right') {
      onPrevious?.()
    }
  }, [onNext, onPrevious])

  const handleEditWord = useCallback(() => {
    setShowEditModal(true)
  }, [])

  const handleWordUpdated = useCallback((updatedWord: Word) => {
    setCurrentWord(updatedWord)
    setShowEditModal(false)
    onWordUpdated?.(updatedWord)
  }, [onWordUpdated])

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false)
  }, [])

  return (
    <motion.div 
      className={cn("relative w-full max-w-2xl mx-auto", className)}
      variants={CARD_VARIANTS}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          className="sr-only"
        />
      )}

      {/* Main flashcard */}
      <div 
        ref={cardRef}
        className="relative h-[500px] sm:h-[480px] md:h-[520px] lg:h-[580px] perspective-1000"
        role="button"
        aria-label={`Flashcard for word ${currentWord.word}. ${state.isFlipped ? 'Back side showing word and definition' : 'Front side showing practice exercises'}`}
        tabIndex={0}
      >
        <motion.div
          className="relative w-full h-full preserve-3d"
          animate={{ rotateY: state.isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Front of card - Now shows cloze test exercises */}
          <Card 
            className="absolute inset-0 backface-hidden border-2 border-primary/20"
            role="main"
            aria-label="Flashcard exercises - fill in the blanks to practice active recall"
          >
            <CardContent className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold truncate">Practice</h3>
                  <Badge 
                    variant="secondary"
                    className={DIFFICULTY_LEVELS[currentWord.difficulty as keyof typeof DIFFICULTY_LEVELS]?.color}
                  >
                    {DIFFICULTY_LEVELS[currentWord.difficulty as keyof typeof DIFFICULTY_LEVELS]?.label}
                  </Badge>
                  {currentWord.category && (
                    <Badge variant="outline">{currentWord.category}</Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowAnswer}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm"
                  title="Reveal the answer without guessing"
                >
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Show Answer</span>
                  <span className="sm:hidden">Show</span>
                </Button>
              </div>

              {/* Cloze test sentences - with dynamic loading states */}
              <div className="flex-1 space-y-4 sm:space-y-4 md:space-y-6 overflow-y-auto">
                {isGeneratingContent ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                    <p className="text-center text-muted-foreground">
                      Generating fresh content for practice...
                    </p>
                  </div>
                ) : contentGenerationError ? (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-red-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Generation Failed
                      </h3>
                      <p className="text-red-600 mb-4">{contentGenerationError}</p>
                      {onRegenerateContent && (
                        <Button onClick={onRegenerateContent} variant="outline" size="sm">
                          Try Again
                        </Button>
                      )}
                    </div>
                  </div>
                ) : sentences && sentences.length > 0 ? (
                  <>
                    <div className="text-center mb-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        Fill in the blanks with the correct word:
                      </p>
                    </div>
                    {sentences.map((sentence, index) => (
                      <ClozeTest
                        key={index}
                        sentence={sentence}
                        onAnswer={handleClozeAnswer}
                        isRevealed={state.showFeedback}
                      />
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No sentences available
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Think about the context, then type your answer and press Enter
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back of card - Now shows word, definition, image, and review buttons */}
          <Card 
            className="absolute inset-0 backface-hidden rotate-y-180 border-2 border-border/50 hover:border-primary/20 transition-colors"
            role="img"
            aria-label={`Answer revealed - Word: ${currentWord.word}. Definition: ${currentWord.definition}`}
          >
            <CardContent className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
              {/* Header with controls */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      playAudio()
                    }}
                    disabled={isLoadingAudio || !!audioError}
                    className="gap-2"
                    title={
                      audioError 
                        ? audioError 
                        : isLoadingAudio 
                        ? 'Generating audio...' 
                        : 'Play pronunciation'
                    }
                  >
                    {isLoadingAudio ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    ) : (
                      <Volume2 className={cn("w-4 h-4", audioError && "text-red-500")} />
                    )}
                  </Button>
                </div>
                <div className="flex gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditWord()
                    }}
                    className="gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetCard}
                    className="gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                </div>
              </div>

              {/* Answer content */}
              <div className="flex-1 flex flex-col justify-center items-center space-y-6">
                {/* Word and metadata */}
                <div className="text-center space-y-4">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-foreground break-words">
                    {currentWord.word}
                  </h2>
                  
                  {currentWord.pronunciation && (
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-mono">
                      /{currentWord.pronunciation}/
                    </p>
                  )}

                  {currentWord.definition && (
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-sm sm:max-w-md mx-auto leading-relaxed px-2">
                      {currentWord.definition}
                    </p>
                  )}

                  {/* Memory Hook (Mnemonic) - RFC-004 */}
                  {currentWord.memory_hook && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 max-w-sm sm:max-w-md mx-auto">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">Memory Hook</p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                            {currentWord.memory_hook}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dynamic Image display */}
                <div className="w-full max-w-md">
                  {isGeneratingContent ? (
                    <div className="h-32 sm:h-40 md:h-48 bg-muted rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : imageUrl ? (
                    <FlashcardImage 
                      imageUrl={imageUrl}
                      alt={`Visual representation of ${currentWord.word}`}
                      className="h-32 sm:h-40 md:h-48 w-full"
                    />
                  ) : (
                    <div className="h-32 sm:h-40 md:h-48 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">No image available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Review buttons */}
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    How well did you recall this word?
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-1 sm:gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReview(1)}
                    className="gap-1 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Again </span>
                    <span>(1)</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReview(2)}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden xs:inline">Hard </span>
                    <span>(2)</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReview(3)}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden xs:inline">Good </span>
                    <span>(3)</span>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleReview(4)}
                    className="gap-1 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Easy </span>
                    <span>(4)</span>
                  </Button>
                </div>
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
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd> submit answer • 
          <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">Space</kbd> show answer • 
          <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">1-4</kbd> rate difficulty
        </p>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <WordEditModal
          word={currentWord}
          onWordUpdated={handleWordUpdated}
          onClose={handleCloseEditModal}
        />
      )}
    </motion.div>
  )
}
