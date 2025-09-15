'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlashcardNavigationProps {
  onPrevious?: () => void
  onNext?: () => void
  canGoNext?: boolean
  className?: string
  totalCards?: number
  currentIndex?: number
}

export function FlashcardNavigation({
  onPrevious,
  onNext,
  canGoNext = true,
  className,
  totalCards,
  currentIndex
}: FlashcardNavigationProps) {
  return (
    <motion.div
      className={cn("flex items-center justify-between gap-4", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {/* Previous button */}
      <Button
        variant="outline"
        size="lg"
        onClick={onPrevious}
        disabled={!onPrevious}
        className="gap-2 min-w-[120px]"
      >
        <ChevronLeft className="w-5 h-5" />
        Previous
      </Button>

      {/* Progress indicator */}
      {totalCards && currentIndex !== undefined && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {currentIndex + 1}
          </span>
          <span>of</span>
          <span className="font-medium text-foreground">
            {totalCards}
          </span>
          
          {/* Progress bar */}
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden ml-2">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ 
                width: `${((currentIndex + 1) / totalCards) * 100}%` 
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Next button */}
      <Button
        variant={canGoNext ? "default" : "outline"}
        size="lg"
        onClick={onNext}
        disabled={!onNext || !canGoNext}
        className="gap-2 min-w-[120px]"
      >
        Next
        <ChevronRight className="w-5 h-5" />
      </Button>
    </motion.div>
  )
}
