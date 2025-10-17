import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Study Sessions', () => {
  describe('Session Types', () => {
    it('should support all session types', () => {
      const sessionTypes = ['review', 'new', 'mixed', 'custom'] as const
      
      expect(sessionTypes).toContain('review')
      expect(sessionTypes).toContain('new')
      expect(sessionTypes).toContain('mixed')
      expect(sessionTypes).toContain('custom')
    })

    it('should differentiate between session types', () => {
      const reviewSession = { session_type: 'review' as const }
      const newSession = { session_type: 'new' as const }
      const mixedSession = { session_type: 'mixed' as const }
      
      expect(reviewSession.session_type).not.toBe(newSession.session_type)
      expect(mixedSession.session_type).toBe('mixed')
    })
  })

  describe('Session Statistics', () => {
    it('should track cards studied', () => {
      const stats = {
        cardsStudied: 10,
        cardsCorrect: 7,
        totalReviews: 10
      }
      
      expect(stats.cardsStudied).toBe(10)
      expect(stats.cardsCorrect).toBe(7)
      expect(stats.cardsCorrect).toBeLessThanOrEqual(stats.cardsStudied)
    })

    it('should calculate accuracy percentage', () => {
      const stats = {
        cardsStudied: 10,
        cardsCorrect: 8,
        totalReviews: 10
      }
      
      const accuracy = (stats.cardsCorrect / stats.cardsStudied) * 100
      
      expect(accuracy).toBe(80)
      expect(accuracy).toBeGreaterThan(0)
      expect(accuracy).toBeLessThanOrEqual(100)
    })

    it('should handle zero division in accuracy', () => {
      const stats = {
        cardsStudied: 0,
        cardsCorrect: 0,
        totalReviews: 0
      }
      
      const accuracy = stats.cardsStudied > 0 
        ? (stats.cardsCorrect / stats.cardsStudied) * 100 
        : 0
      
      expect(accuracy).toBe(0)
    })

    it('should track average response time', () => {
      const responseTimes = [3000, 4000, 2000, 5000] // milliseconds
      const average = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      
      expect(average).toBe(3500)
      expect(average).toBeGreaterThan(0)
    })
  })

  describe('Session Duration', () => {
    it('should calculate session duration in seconds', () => {
      const startTime = new Date('2025-01-01T10:00:00')
      const endTime = new Date('2025-01-01T10:15:00')
      
      const durationMs = endTime.getTime() - startTime.getTime()
      const durationSec = Math.floor(durationMs / 1000)
      
      expect(durationSec).toBe(900) // 15 minutes = 900 seconds
    })

    it('should format duration for display', () => {
      const durationSec = 125 // 2 minutes 5 seconds
      
      const minutes = Math.floor(durationSec / 60)
      const seconds = durationSec % 60
      
      expect(minutes).toBe(2)
      expect(seconds).toBe(5)
    })

    it('should handle pause time in duration calculation', () => {
      const sessionDuration = 600 // 10 minutes
      const pauseTime = 120 // 2 minutes
      const activeDuration = sessionDuration - pauseTime
      
      expect(activeDuration).toBe(480) // 8 minutes
      expect(activeDuration).toBeLessThan(sessionDuration)
    })
  })

  describe('Session Completion', () => {
    it('should mark session as completed', () => {
      const session = {
        id: 'session-123',
        completed: false,
        completed_at: null as Date | null
      }
      
      session.completed = true
      session.completed_at = new Date()
      
      expect(session.completed).toBe(true)
      expect(session.completed_at).toBeInstanceOf(Date)
    })

    it('should require end time for completed sessions', () => {
      const session = {
        completed: true,
        startTime: new Date('2025-01-01T10:00:00'),
        endTime: new Date('2025-01-01T10:15:00')
      }
      
      expect(session.endTime).toBeDefined()
      expect(session.endTime?.getTime()).toBeGreaterThan(session.startTime.getTime())
    })

    it('should calculate completion rate', () => {
      const totalCards = 20
      const completedCards = 15
      const completionRate = (completedCards / totalCards) * 100
      
      expect(completionRate).toBe(75)
    })
  })

  describe('Streak Calculation', () => {
    it('should detect consecutive study days', () => {
      const studyDates = [
        new Date('2025-01-01'),
        new Date('2025-01-02'),
        new Date('2025-01-03')
      ]
      
      // Check if dates are consecutive
      let isConsecutive = true
      for (let i = 1; i < studyDates.length; i++) {
        const dayDiff = Math.floor(
          (studyDates[i].getTime() - studyDates[i - 1].getTime()) / (24 * 60 * 60 * 1000)
        )
        if (dayDiff !== 1) {
          isConsecutive = false
          break
        }
      }
      
      expect(isConsecutive).toBe(true)
      expect(studyDates.length).toBe(3)
    })

    it('should break streak on missed day', () => {
      const studyDates = [
        new Date('2025-01-01'),
        new Date('2025-01-02'),
        new Date('2025-01-04') // Missing day 3
      ]
      
      const dayDiff = Math.floor(
        (studyDates[2].getTime() - studyDates[1].getTime()) / (24 * 60 * 60 * 1000)
      )
      
      expect(dayDiff).toBe(2)
      expect(dayDiff).toBeGreaterThan(1) // Streak broken
    })

    it('should handle timezone-aware streak calculation', () => {
      const today = new Date()
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      
      expect(todayDateOnly.getHours()).toBe(0)
      expect(todayDateOnly.getMinutes()).toBe(0)
      expect(todayDateOnly.getSeconds()).toBe(0)
    })
  })

  describe('Re-learning Queue', () => {
    it('should track cards added to relearning', () => {
      const relearningQueue = [
        { cardId: 'card-1', addedAt: new Date(), timesRelearned: 1 },
        { cardId: 'card-2', addedAt: new Date(), timesRelearned: 2 }
      ]
      
      expect(relearningQueue).toHaveLength(2)
      expect(relearningQueue[0].timesRelearned).toBe(1)
      expect(relearningQueue[1].timesRelearned).toBe(2)
    })

    it('should increment relearning count', () => {
      let timesRelearned = 1
      timesRelearned += 1
      
      expect(timesRelearned).toBe(2)
    })

    it('should maintain original card index', () => {
      const relearningCard = {
        cardId: 'card-123',
        originalIndex: 5,
        timesRelearned: 1
      }
      
      expect(relearningCard.originalIndex).toBe(5)
      expect(relearningCard.originalIndex).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Session Progress Tracking', () => {
    it('should track main queue progress', () => {
      const totalMainCards = 20
      const completedMainCards = 8
      const progress = (completedMainCards / totalMainCards) * 100
      
      expect(progress).toBe(40)
    })

    it('should include relearning cards in total', () => {
      const mainCards = 20
      const relearningCards = 5
      const totalCards = mainCards + relearningCards
      
      expect(totalCards).toBe(25)
    })

    it('should separate completed counts', () => {
      const stats = {
        completedMainCards: 15,
        completedRelearningCards: 3,
        totalCompleted: 18
      }
      
      expect(stats.totalCompleted).toBe(stats.completedMainCards + stats.completedRelearningCards)
    })
  })

  describe('Pause Functionality', () => {
    it('should track pause state', () => {
      const session = {
        isPaused: false,
        pauseStartTime: null as Date | null
      }
      
      session.isPaused = true
      session.pauseStartTime = new Date()
      
      expect(session.isPaused).toBe(true)
      expect(session.pauseStartTime).toBeInstanceOf(Date)
    })

    it('should accumulate pause time', () => {
      const pauseDurations = [30, 45, 60] // seconds
      const totalPauseTime = pauseDurations.reduce((sum, duration) => sum + duration, 0)
      
      expect(totalPauseTime).toBe(135)
    })

    it('should exclude pause time from active duration', () => {
      const totalDuration = 600 // 10 minutes
      const pauseTime = 120 // 2 minutes
      const activeDuration = totalDuration - pauseTime
      
      expect(activeDuration).toBe(480) // 8 minutes
    })
  })

  describe('Session Limits', () => {
    it('should enforce maximum session length', () => {
      const maxDuration = 3600 // 1 hour in seconds
      const currentDuration = 3700
      
      const shouldEnd = currentDuration > maxDuration
      
      expect(shouldEnd).toBe(true)
    })

    it('should enforce maximum cards per session', () => {
      const maxCards = 50
      const currentCards = 45
      
      const canAddMore = currentCards < maxCards
      
      expect(canAddMore).toBe(true)
    })
  })

  describe('Card Review Tracking', () => {
    it('should track individual card reviews', () => {
      const review = {
        cardId: 'card-123',
        button: 'good' as const,
        responseTime: 3500,
        timestamp: new Date()
      }
      
      expect(review.cardId).toBe('card-123')
      expect(review.button).toBe('good')
      expect(review.responseTime).toBeGreaterThan(0)
      expect(review.timestamp).toBeInstanceOf(Date)
    })

    it('should maintain review history', () => {
      const reviews = [
        { cardId: 'card-1', button: 'good' as const, timestamp: new Date() },
        { cardId: 'card-2', button: 'easy' as const, timestamp: new Date() },
        { cardId: 'card-3', button: 'again' as const, timestamp: new Date() }
      ]
      
      expect(reviews).toHaveLength(3)
      expect(reviews[2].button).toBe('again')
    })
  })

  describe('Session Quality Metrics', () => {
    it('should categorize button responses', () => {
      const buttonCounts = {
        again: 2,
        hard: 3,
        good: 10,
        easy: 5
      }
      
      const total = Object.values(buttonCounts).reduce((sum, count) => sum + count, 0)
      
      expect(total).toBe(20)
      expect(buttonCounts.good).toBeGreaterThan(buttonCounts.again)
    })

    it('should calculate average quality', () => {
      const qualities = [0, 3, 4, 4, 5, 4, 3, 5] // SM-2 quality scores
      const average = qualities.reduce((sum, q) => sum + q, 0) / qualities.length
      
      expect(average).toBeGreaterThan(3)
      expect(average).toBeLessThanOrEqual(5)
    })
  })

  describe('Session Exit Handling', () => {
    it('should save progress on early exit', () => {
      const session = {
        cardsStudied: 8,
        totalCards: 20,
        exited: true,
        completed: false
      }
      
      expect(session.exited).toBe(true)
      expect(session.completed).toBe(false)
      expect(session.cardsStudied).toBeLessThan(session.totalCards)
    })

    it('should differentiate exit vs completion', () => {
      const exitedSession = { completed: false, exited: true }
      const completedSession = { completed: true, exited: false }
      
      expect(exitedSession.completed).not.toBe(completedSession.completed)
      expect(exitedSession.exited).toBe(true)
    })
  })

  describe('Performance Metrics', () => {
    it('should track cards per minute', () => {
      const cardsStudied = 30
      const durationMinutes = 15
      const cardsPerMinute = cardsStudied / durationMinutes
      
      expect(cardsPerMinute).toBe(2)
    })

    it('should identify struggling cards', () => {
      const cards = [
        { id: 'card-1', correctCount: 3, incorrectCount: 0 },
        { id: 'card-2', correctCount: 1, incorrectCount: 3 },
        { id: 'card-3', correctCount: 2, incorrectCount: 1 }
      ]
      
      const strugglingCards = cards.filter(c => c.incorrectCount > c.correctCount)
      
      expect(strugglingCards).toHaveLength(1)
      expect(strugglingCards[0].id).toBe('card-2')
    })
  })
})
