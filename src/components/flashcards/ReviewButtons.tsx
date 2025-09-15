'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatInterval, previewIntervals } from '@/utils/sm2'
import { getNextReviewPrediction } from '@/lib/reviews'
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewButtonsProps {
  wordId: string
  onReview: (button: 'again' | 'hard' | 'good' | 'easy') => void
  disabled?: boolean
  showPreview?: boolean
  currentEaseFactor?: number
  currentInterval?: number
  currentRepetitions?: number
  className?: string
}

interface ButtonConfig {
  key: 'again' | 'hard' | 'good' | 'easy'
  label: string
  shortcut: string
  description: string
  color: string
  hoverColor: string
  icon?: React.ReactNode
}

const buttonConfigs: ButtonConfig[] = [
  {
    key: 'again',
    label: 'Again',
    shortcut: '1',
    description: 'Complete blackout - start over',
    color: 'bg-red-500 text-white',
    hoverColor: 'hover:bg-red-600',
    icon: <TrendingDown className="w-4 h-4" />
  },
  {
    key: 'hard',
    label: 'Hard',
    shortcut: '2', 
    description: 'Difficult recall - reduce ease',
    color: 'bg-orange-500 text-white',
    hoverColor: 'hover:bg-orange-600',
    icon: <Minus className="w-4 h-4" />
  },
  {
    key: 'good',
    label: 'Good',
    shortcut: '3',
    description: 'Recalled with effort - normal progression',
    color: 'bg-blue-500 text-white', 
    hoverColor: 'hover:bg-blue-600',
    icon: <Clock className="w-4 h-4" />
  },
  {
    key: 'easy',
    label: 'Easy',
    shortcut: '4',
    description: 'Perfect recall - increase ease',
    color: 'bg-green-500 text-white',
    hoverColor: 'hover:bg-green-600',
    icon: <TrendingUp className="w-4 h-4" />
  }
]

export function ReviewButtons({
  wordId,
  onReview,
  disabled = false,
  showPreview = true,
  currentEaseFactor = 2.5,
  currentInterval = 1,
  currentRepetitions = 0,
  className
}: ReviewButtonsProps) {
  const [intervals, setIntervals] = useState<Record<string, number>>({})
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load interval predictions
  useEffect(() => {
    if (showPreview && wordId) {
      loadIntervalPredictions()
    } else {
      // Use current values for preview
      const previewData = previewIntervals(currentEaseFactor, currentInterval, currentRepetitions)
      setIntervals(previewData)
    }
  }, [wordId, showPreview, currentEaseFactor, currentInterval, currentRepetitions])

  const loadIntervalPredictions = async () => {
    setIsLoading(true)
    try {
      const { intervals: predictedIntervals } = await getNextReviewPrediction(wordId)
      setIntervals(predictedIntervals)
    } catch (error) {
      console.error('Failed to load interval predictions:', error)
      // Fallback to current values
      const previewData = previewIntervals(currentEaseFactor, currentInterval, currentRepetitions)
      setIntervals(previewData)
    } finally {
      setIsLoading(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (disabled) return
      
      const key = e.key
      const buttonConfig = buttonConfigs.find(config => config.shortcut === key)
      
      if (buttonConfig && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        onReview(buttonConfig.key)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [disabled, onReview])

  const handleButtonClick = (button: 'again' | 'hard' | 'good' | 'easy') => {
    if (disabled) return
    onReview(button)
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Interval Preview */}
      {showPreview && (
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Next Review Times
            {isLoading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            {buttonConfigs.map(config => (
              <div key={config.key} className="text-center">
                <div className="font-medium">{config.label}</div>
                <div className="text-muted-foreground">
                  {formatInterval(intervals[config.key] || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {buttonConfigs.map(config => (
          <div key={config.key} className="relative">
            <Button
              onClick={() => handleButtonClick(config.key)}
              onMouseEnter={() => setHoveredButton(config.key)}
              onMouseLeave={() => setHoveredButton(null)}
              disabled={disabled}
              className={cn(
                'w-full h-14 flex flex-col items-center justify-center gap-1 transition-all',
                config.color,
                config.hoverColor,
                'hover:scale-105 active:scale-95',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {config.icon}
              <span className="font-semibold">{config.label}</span>
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 w-6 h-6 p-0 flex items-center justify-center bg-black/20 text-white text-xs"
              >
                {config.shortcut}
              </Badge>
            </Button>

            {/* Tooltip */}
            {hoveredButton === config.key && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {config.description}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-xs text-muted-foreground text-center">
        Use keyboard shortcuts 1-4 for quick review
      </div>
    </div>
  )
}

export default ReviewButtons
