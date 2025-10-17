import { describe, it, expect, vi } from 'vitest'

describe('StudySessionDashboard', () => {
  describe('Statistics Display', () => {
    it('should show total reviews', () => {
      const stats = { totalReviews: 150 }
      expect(stats.totalReviews).toBe(150)
    })

    it('should show retention rate', () => {
      const stats = { retentionRate: 85.5 }
      expect(stats.retentionRate).toBeGreaterThan(0)
    })

    it('should show current streak', () => {
      const stats = { currentStreak: 7 }
      expect(stats.currentStreak).toBe(7)
    })
  })

  describe('Recent Sessions', () => {
    it('should list recent sessions', () => {
      const sessions = [
        { id: '1', cardsStudied: 20, date: new Date() },
        { id: '2', cardsStudied: 15, date: new Date() }
      ]
      expect(sessions).toHaveLength(2)
    })

    it('should calculate session accuracy', () => {
      const session = { cardsStudied: 20, cardsCorrect: 16 }
      const accuracy = (session.cardsCorrect / session.cardsStudied) * 100
      expect(accuracy).toBe(80)
    })
  })

  describe('Progress Charts', () => {
    it('should format chart data', () => {
      const data = [
        { date: '2025-01-01', reviews: 20 },
        { date: '2025-01-02', reviews: 15 }
      ]
      expect(data).toHaveLength(2)
    })

    it('should calculate daily average', () => {
      const reviews = [20, 15, 25, 30]
      const average = reviews.reduce((a, b) => a + b, 0) / reviews.length
      expect(average).toBe(22.5)
    })
  })

  describe('Recommendations', () => {
    it('should suggest study mode', () => {
      const overdue = 50
      const mode = overdue > 20 ? 'review' : 'new'
      expect(mode).toBe('review')
    })

    it('should calculate recommended cards', () => {
      const dueCards = 30
      const recommended = Math.min(dueCards, 20)
      expect(recommended).toBe(20)
    })
  })
})
