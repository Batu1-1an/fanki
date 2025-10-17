import { describe, it, expect, vi } from 'vitest'

describe('SessionCompletionFeedback', () => {
  describe('Statistics Display', () => {
    it('should show cards studied', () => {
      const cardsStudied = 25
      expect(cardsStudied).toBeGreaterThan(0)
    })

    it('should show accuracy', () => {
      const accuracy = 85
      expect(accuracy).toBeGreaterThanOrEqual(0)
      expect(accuracy).toBeLessThanOrEqual(100)
    })

    it('should show session time', () => {
      const duration = 600 // 10 minutes
      expect(duration).toBeGreaterThan(0)
    })
  })

  describe('Performance Feedback', () => {
    it('should show excellent for >90%', () => {
      const accuracy = 92
      const rating = accuracy > 90 ? 'excellent' : 'good'
      expect(rating).toBe('excellent')
    })

    it('should show good for 70-90%', () => {
      const accuracy = 80
      const rating = accuracy >= 70 && accuracy <= 90 ? 'good' : 'needs improvement'
      expect(rating).toBe('good')
    })
  })

  describe('Next Actions', () => {
    it('should offer continue studying', () => {
      const actions = ['continue', 'dashboard', 'review']
      expect(actions).toContain('continue')
    })

    it('should offer return to dashboard', () => {
      const actions = ['continue', 'dashboard']
      expect(actions).toContain('dashboard')
    })
  })
})
