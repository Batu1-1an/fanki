/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * Based on the original SuperMemo SM-2 algorithm
 */

import { SM2Result, ReviewResult } from '@/types'

const HARD_INTERVAL_MULTIPLIER = 1.2
const EASY_INTERVAL_BONUS = 1.3

/**
 * Calculate the next review date using SM-2 algorithm
 * @param quality - User's response quality (0-5)
 * @param ease_factor - Current ease factor (minimum 1.3)
 * @param interval_days - Current interval in days
 * @param repetitions - Number of consecutive correct responses
 * @returns SM2Result with updated values
 */
export function calculateSM2({
  quality,
  ease_factor = 2.5,
  interval_days = 1,
  repetitions = 0
}: {
  quality: number
  ease_factor?: number
  interval_days?: number
  repetitions?: number
}): SM2Result {
  // Ensure quality is within valid range
  const q = Math.max(0, Math.min(5, Math.round(quality)))
  
  let newEaseFactor = ease_factor
  let newInterval = interval_days
  let newRepetitions = repetitions

  // Update ease factor based on quality before calculating next interval
  newEaseFactor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

  // Ensure ease factor doesn't go below 1.3
  newEaseFactor = Math.max(1.3, newEaseFactor)

  if (q >= 3) {
    // Correct response
    if (newRepetitions === 0) {
      newInterval = 1
    } else if (newRepetitions === 1) {
      newInterval = 6
    } else {
      if (q === 3) {
        newInterval = Math.max(1, Math.ceil(interval_days * HARD_INTERVAL_MULTIPLIER))
      } else if (q === 5) {
        newInterval = Math.ceil(interval_days * newEaseFactor * EASY_INTERVAL_BONUS)
      } else {
        // Use Math.ceil to avoid underscheduling due to rounding down
        newInterval = Math.ceil(interval_days * newEaseFactor)
      }
    }
    newRepetitions += 1
  } else {
    // Incorrect response
    newRepetitions = 0
    newInterval = 1
  }

  // Calculate due date
  const due_date = new Date()
  // Standardize to ceil to ensure at-least-this-many-days semantics
  due_date.setDate(due_date.getDate() + Math.ceil(newInterval))

  return {
    ease_factor: Math.round(newEaseFactor * 100) / 100, // Round to 2 decimal places
    interval_days: newInterval,
    repetitions: newRepetitions,
    due_date
  }
}

/**
 * Convert button press to quality score
 * @param button - Button pressed by user
 * @returns Quality score (0-5)
 */
export function buttonToQuality(button: 'again' | 'hard' | 'good' | 'easy'): number {
  switch (button) {
    case 'again':
      return 0 // Complete blackout
    case 'hard': // Hard must be a passing grade (>=3)
      return 3 // Correct response recalled with difficulty
    case 'good': // Good recall, but not perfect
      return 4 // Correct response recalled with minor difficulty
    case 'easy':
      return 5 // Perfect response
    default:
      return 3
  }
}

/**
 * Get difficulty label based on ease factor
 * @param easeFactor - Current ease factor
 * @returns Difficulty description
 */
export function getDifficultyLabel(easeFactor: number): string {
  if (easeFactor >= 2.5) return 'Easy'
  if (easeFactor >= 2.0) return 'Medium'
  if (easeFactor >= 1.5) return 'Hard'
  return 'Very Hard'
}

/**
 * Calculate retention rate based on reviews
 * @param reviews - Array of review quality scores
 * @returns Retention percentage (0-100)
 */
export function calculateRetentionRate(reviews: number[]): number {
  if (reviews.length === 0) return 0
  
  const correctReviews = reviews.filter(quality => quality >= 3).length
  return Math.round((correctReviews / reviews.length) * 100)
}

/**
 * Predict next intervals for button preview
 * @param currentEaseFactor - Current ease factor
 * @param currentInterval - Current interval in days
 * @param repetitions - Current repetitions
 * @returns Object with intervals for each button
 */
export function previewIntervals(
  currentEaseFactor: number,
  currentInterval: number,
  repetitions: number
) {
  const buttons = ['again', 'hard', 'good', 'easy'] as const
  const intervals: Record<typeof buttons[number], number> = {} as any

  buttons.forEach(button => {
    const quality = buttonToQuality(button)
    const result = calculateSM2({
      quality,
      ease_factor: currentEaseFactor,
      interval_days: currentInterval,
      repetitions
    })
    intervals[button] = result.interval_days
  })

  return intervals
}

/**
 * Format interval for display
 * @param days - Number of days
 * @returns Formatted string
 */
export function formatInterval(days: number): string {
  if (days < 1) return 'Today'
  if (days === 1) return '1 day'
  if (days < 7) return `${days} days`
  if (days < 30) {
    const weeks = Math.round(days / 7)
    return weeks === 1 ? '1 week' : `${weeks} weeks`
  }
  if (days < 365) {
    const months = Math.round(days / 30)
    return months === 1 ? '1 month' : `${months} months`
  }
  const years = Math.round(days / 365)
  return years === 1 ? '1 year' : `${years} years`
}
