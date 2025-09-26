'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClozeTestProps, FlashcardAnswer } from '@/types'
import { Check, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ClozeTest({ 
  sentence, 
  onAnswer, 
  isRevealed = false, 
  className 
}: ClozeTestProps) {
  const [userInput, setUserInput] = useState('')
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [startTime] = useState(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)

  // Split sentence at blank position (handle both formats)
  const blankMarker = '___'
  const blankPosition = sentence.sentence.indexOf(blankMarker)
  const correctWord = (sentence as any).blank || sentence.correct_word || ''
  
  const beforeBlank = blankPosition >= 0 
    ? sentence.sentence.substring(0, blankPosition)
    : sentence.sentence.substring(0, sentence.blank_position || 0)
  
  const afterBlank = blankPosition >= 0
    ? sentence.sentence.substring(blankPosition + blankMarker.length)
    : sentence.sentence.substring((sentence.blank_position || 0) + correctWord.length)

  const checkAnswer = useCallback(() => {
    if (isAnswered) return

    const responseTime = Date.now() - startTime
    const trimmedInput = userInput.trim().toLowerCase()
    const correctAnswer = correctWord.toLowerCase()
    const isAnswerCorrect = trimmedInput === correctAnswer

    setIsCorrect(isAnswerCorrect)
    setIsAnswered(true)

    const answer: FlashcardAnswer = {
      sentenceIndex: 0, // This would be passed from parent if needed
      userAnswer: userInput.trim(),
      isCorrect: isAnswerCorrect,
      responseTimeMs: responseTime
    }

    onAnswer(answer)
  }, [userInput, correctWord, isAnswered, startTime, onAnswer])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userInput.trim()) {
      checkAnswer()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const resetTest = useCallback(() => {
    setUserInput('')
    setIsAnswered(false)
    setIsCorrect(null)
  }, [])

  // Ensure the input does not stay focused after reveal/answer
  useEffect(() => {
    if (isRevealed || isAnswered) {
      inputRef.current?.blur()
    }
  }, [isRevealed, isAnswered])

  const getInputClassName = () => {
    if (!isAnswered && !isRevealed) return 'border-input'
    if (isCorrect === true) return 'border-green-500 bg-green-50 text-green-900'
    if (isCorrect === false) return 'border-red-500 bg-red-50 text-red-900'
    return 'border-input'
  }

  const getStatusIcon = () => {
    if (isCorrect === true) return <Check className="w-5 h-5 text-green-600" />
    if (isCorrect === false) return <X className="w-5 h-5 text-red-600" />
    return null
  }

  return (
    <motion.div
      className={cn("space-y-3", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Sentence with blank */}
      <div className="text-sm sm:text-base md:text-lg leading-relaxed px-1">
        <span className="text-foreground break-words">{beforeBlank}</span>
        
        {/* Input field or revealed answer */}
        <span  className="inline-block mx-1 relative">
          {!isRevealed && !isAnswered ? (
            <form onSubmit={handleSubmit} className="inline-block">
              <Input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className={cn(
                  "inline-block w-20 sm:w-24 md:w-32 h-8 text-center text-sm sm:text-base font-medium focus-ring",
                  getInputClassName()
                )}
                placeholder="___"
                disabled={isAnswered}
                autoComplete="off"
                spellCheck={false}
                aria-label={`Fill in the blank for: ${sentence.sentence}`}
                aria-describedby="cloze-instructions"
              />
            </form>
          ) : (
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded font-medium",
                isCorrect === true && "bg-green-100 text-green-900",
                isCorrect === false && "bg-red-100 text-red-900",
                isRevealed && !isAnswered && "bg-blue-100 text-blue-900"
              )}
            >
              {isAnswered ? userInput : correctWord}
              {getStatusIcon()}
            </motion.span>
          )}
        </span>
        
        <span className="text-foreground break-words">{afterBlank}</span>
      </div>

      {/* Answer controls */}
      <AnimatePresence>
        {!isAnswered && !isRevealed && userInput.trim() && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2"
          >
            <Button
              type="button"
              onClick={checkAnswer}
              size="sm"
              className="gap-2"
            >
              Check Answer
              <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-sm text-muted-foreground">
              or press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <Badge
                variant={isCorrect ? "default" : "destructive"}
                className="gap-1"
              >
                {getStatusIcon()}
                {isCorrect ? "Correct!" : "Incorrect"}
              </Badge>
              
              {!isCorrect && (
                <span className="text-sm text-muted-foreground">
                  Correct answer: <span className="font-medium text-foreground">{correctWord}</span>
                </span>
              )}
            </div>

            {!isCorrect && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetTest}
                className="gap-2"
              >
                Try Again
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revealed state helper text */}
      {isRevealed && !isAnswered && (
        <p className="text-sm text-muted-foreground">
          Answer revealed for review
        </p>
      )}
    </motion.div>
  )
}
