'use client'

import React, { useState } from 'react'
import { QueuedCard } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'

interface ClozeCardViewProps {
  card: QueuedCard
  onReview: (quality: 'again' | 'hard' | 'good' | 'easy') => void
  className?: string
}

interface ClozeSegment {
  text: string
  isCloze: boolean
  clozeNumber?: number
}

/**
 * Parse cloze text with {{c1::answer}} syntax
 * Example: "The {{c1::capital}} of France is {{c2::Paris}}"
 */
function parseClozeText(text: string): ClozeSegment[] {
  const segments: ClozeSegment[] = []
  const regex = /\{\{c(\d+)::([^}]+)\}\}/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before the cloze
    if (match.index > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, match.index),
        isCloze: false
      })
    }

    // Add the cloze deletion
    segments.push({
      text: match[2], // The answer text
      isCloze: true,
      clozeNumber: parseInt(match[1])
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      isCloze: false
    })
  }

  return segments
}

/**
 * Cloze Card View - Fill in the blank style cards
 * Supports multiple cloze deletions per card
 */
export function ClozeCardView({ card, onReview, className }: ClozeCardViewProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [currentClozeIndex, setCurrentClozeIndex] = useState(0)

  const { fields, word, renderPayload } = card

  // Extract cloze text
  const clozeText = 
    (fields as any)?.text || 
    (renderPayload as any)?.text ||
    (fields as any)?.front ||
    word?.definition ||
    'No cloze text available'

  const extra = (fields as any)?.extra || word?.word || ''

  // Parse the cloze deletions
  const segments = parseClozeText(clozeText)
  const clozeSegments = segments.filter(s => s.isCloze)
  const activeCloze = clozeSegments[currentClozeIndex]

  const handleReveal = () => {
    setIsRevealed(true)
  }

  const handleReview = (quality: 'again' | 'hard' | 'good' | 'easy') => {
    // If there are multiple clozes and we haven't revealed all, show next cloze
    if (!isRevealed && clozeSegments.length > 1 && currentClozeIndex < clozeSegments.length - 1) {
      setCurrentClozeIndex(currentClozeIndex + 1)
    } else {
      onReview(quality)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              Cloze
            </span>
            <span>Fill in the blank</span>
          </div>
          {clozeSegments.length > 1 && (
            <span className="text-xs text-gray-500">
              {currentClozeIndex + 1} / {clozeSegments.length}
            </span>
          )}
        </div>
        {extra && (
          <CardTitle className="text-lg text-gray-600">{extra}</CardTitle>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Cloze Text Display */}
        <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
          <p className="text-xl leading-relaxed">
            {segments.map((segment, index) => {
              if (!segment.isCloze) {
                return <span key={index}>{segment.text}</span>
              }

              // This is a cloze deletion
              const isCurrent = segment.clozeNumber === activeCloze?.clozeNumber
              const shouldShow = isRevealed || !isCurrent

              return (
                <span
                  key={index}
                  className={`inline-block mx-1 px-3 py-1 rounded transition-all ${
                    shouldShow
                      ? 'bg-blue-100 text-blue-900 font-semibold'
                      : 'bg-yellow-200 border-2 border-yellow-400 border-dashed'
                  }`}
                >
                  {shouldShow ? segment.text : '[...]'}
                </span>
              )
            })}
          </p>
        </div>

        {/* Action Buttons */}
        {!isRevealed ? (
          <Button
            onClick={handleReveal}
            className="w-full"
            size="lg"
          >
            <Eye className="mr-2 h-4 w-4" />
            Show Answer
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-center text-gray-600 font-medium">
              How well did you remember?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleReview('again')}
                variant="destructive"
                className="h-auto py-3"
              >
                <div className="text-center">
                  <div className="font-semibold">Again</div>
                  <div className="text-xs opacity-90">{'<1m'}</div>
                </div>
              </Button>
              <Button
                onClick={() => handleReview('hard')}
                variant="outline"
                className="h-auto py-3 border-orange-300 hover:bg-orange-50"
              >
                <div className="text-center">
                  <div className="font-semibold text-orange-700">Hard</div>
                  <div className="text-xs text-orange-600">{'<10m'}</div>
                </div>
              </Button>
              <Button
                onClick={() => handleReview('good')}
                variant="outline"
                className="h-auto py-3 border-green-300 hover:bg-green-50"
              >
                <div className="text-center">
                  <div className="font-semibold text-green-700">Good</div>
                  <div className="text-xs text-green-600">{'~1d'}</div>
                </div>
              </Button>
              <Button
                onClick={() => handleReview('easy')}
                variant="outline"
                className="h-auto py-3 border-blue-300 hover:bg-blue-50"
              >
                <div className="text-center">
                  <div className="font-semibold text-blue-700">Easy</div>
                  <div className="text-xs text-blue-600">{'~4d'}</div>
                </div>
              </Button>
            </div>
          </div>
        )}

        {/* Hints */}
        <div className="text-xs text-center text-gray-500 space-y-1">
          <p>Yellow blanks indicate the current cloze deletion</p>
          {clozeSegments.length > 1 && !isRevealed && (
            <p>Multiple deletions - they'll be shown one at a time</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
