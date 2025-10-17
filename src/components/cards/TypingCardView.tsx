'use client'

import React, { useState, useRef, useEffect } from 'react'
import { QueuedCard } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react'

interface TypingCardViewProps {
  card: QueuedCard
  onCorrect: () => void
  onIncorrect: () => void
  className?: string
}

/**
 * Typing Card View - Requires user to type the answer
 * Used for active recall and spelling practice
 */
export function TypingCardView({ card, onCorrect, onIncorrect, className }: TypingCardViewProps) {
  const [userInput, setUserInput] = useState('')
  const [isRevealed, setIsRevealed] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { fields, word, renderPayload } = card

  // Extract question and answer from card data
  const question = (fields as any)?.front || word?.word || 'Type the answer'
  const correctAnswer = (fields as any)?.back || word?.definition || ''
  const hint = (fields as any)?.extra || word?.pronunciation || ''

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
  }

  const checkAnswer = () => {
    const normalizedInput = normalizeText(userInput)
    const normalizedCorrect = normalizeText(correctAnswer)
    
    const correct = normalizedInput === normalizedCorrect
    setIsCorrect(correct)
    setIsRevealed(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isRevealed) {
      checkAnswer()
    } else {
      // After reveal, proceed based on correctness
      if (isCorrect) {
        onCorrect()
      } else {
        onIncorrect()
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              Typing
            </span>
            <span>Type your answer</span>
          </div>
          {hint && !isRevealed && (
            <span className="text-xs text-gray-500 italic">Hint: {hint}</span>
          )}
        </div>
        <CardTitle className="text-2xl">{question}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="answer-input" className="text-sm font-medium text-gray-700">
              Your Answer:
            </label>
            <Input
              ref={inputRef}
              id="answer-input"
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isRevealed}
              placeholder="Type your answer here..."
              className={`text-lg ${
                isRevealed
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : ''
              }`}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {!isRevealed && (
            <Button
              type="submit"
              disabled={!userInput.trim()}
              className="w-full"
            >
              Check Answer
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </form>

        {isRevealed && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Alert variant={isCorrect ? 'default' : 'destructive'}>
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <AlertDescription className="ml-2">
                {isCorrect ? (
                  <div>
                    <p className="font-semibold text-green-700">Correct! 🎉</p>
                    <p className="text-sm text-gray-600 mt-1">Your answer: {userInput}</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold">Not quite right</p>
                    <p className="text-sm mt-2">
                      <span className="text-gray-600">Your answer:</span>{' '}
                      <span className="line-through">{userInput}</span>
                    </p>
                    <p className="text-sm mt-1">
                      <span className="text-gray-600">Correct answer:</span>{' '}
                      <span className="font-semibold text-green-700">{correctAnswer}</span>
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={onIncorrect}
                variant="outline"
                className="flex-1"
              >
                Review Again
              </Button>
              <Button
                onClick={onCorrect}
                className="flex-1"
                disabled={!isCorrect}
              >
                {isCorrect ? 'Continue' : 'Mark as Known'}
              </Button>
            </div>
          </div>
        )}

        {!isRevealed && (
          <p className="text-xs text-center text-gray-500">
            Press Enter to check • Case insensitive • Punctuation ignored
          </p>
        )}
      </CardContent>
    </Card>
  )
}
