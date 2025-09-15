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

  // Split sentence at blank position
  const beforeBlank = sentence.sentence.substring(0, sentence.blank_position)
  const afterBlank = sentence.sentence.substring(
    sentence.blank_position + sentence.correct_word.length
  )

  const checkAnswer = useCallback(() => {
    if (isAnswered) return

    const responseTime = Date.now() - startTime
    const trimmedInput = userInput.trim().toLowerCase()
    const correctAnswer = sentence.correct_word.toLowerCase()
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
  }, [userInput, sentence.correct_word, isAnswered, startTime, onAnswer])

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
    inputRef.current?.focus()
  }, [])

  // Focus input when component mounts
  useEffect(() => {
    if (!isRevealed && !isAnswered) {
      inputRef.current?.focus()
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
      <div className="text-lg leading-relaxed">
        <span className="text-foreground">{beforeBlank}</span>
        
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
                  "inline-block w-32 h-8 text-center font-medium focus-ring",
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
              {isAnswered ? userInput : sentence.correct_word}
              {getStatusIcon()}
            </motion.span>
          )}
        </span>
        
        <span className="text-foreground">{afterBlank}</span>
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
                  Correct answer: <span className="font-medium text-foreground">{sentence.correct_word}</span>
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
