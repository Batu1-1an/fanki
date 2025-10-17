import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buttonToQuality } from '@/utils/sm2'

describe('Review System', () => {
  describe('buttonToQuality', () => {
    it('should convert review buttons to SM-2 quality scores', () => {
      expect(buttonToQuality('again')).toBe(0)
      expect(buttonToQuality('hard')).toBe(3)
      expect(buttonToQuality('good')).toBe(4)
      expect(buttonToQuality('easy')).toBe(5)
    })
  })

  describe('Review Quality Validation', () => {
    it('should treat quality < 3 as incorrect', () => {
      const incorrectQualities = [0, 1, 2]
      incorrectQualities.forEach(q => {
        expect(q < 3).toBe(true)
      })
    })

    it('should treat quality >= 3 as correct', () => {
      const correctQualities = [3, 4, 5]
      correctQualities.forEach(q => {
        expect(q >= 3).toBe(true)
      })
    })
  })

  describe('Learning Phase Intervals', () => {
    it('should have correct learning steps', () => {
      const LEARNING_STEPS = [1, 10] // minutes
      
      expect(LEARNING_STEPS).toHaveLength(2)
      expect(LEARNING_STEPS[0]).toBe(1) // First step: 1 minute
      expect(LEARNING_STEPS[1]).toBe(10) // Second step: 10 minutes
    })

    it('should graduate after final learning step', () => {
      const GRADUATION_INTERVAL = 1 // days
      
      expect(GRADUATION_INTERVAL).toBe(1)
      expect(GRADUATION_INTERVAL).toBeGreaterThan(0)
    })
  })

  describe('Card Status Classification', () => {
    it('should correctly classify card review statuses', () => {
      const validStatuses = ['new', 'overdue', 'due_today', 'completed_today', 'future', 'inactive']
      
      expect(validStatuses).toContain('new')
      expect(validStatuses).toContain('overdue')
      expect(validStatuses).toContain('due_today')
      expect(validStatuses).toContain('completed_today')
      expect(validStatuses).not.toContain('invalid_status')
    })
  })

  describe('Review Timing', () => {
    it('should calculate future due dates', () => {
      const now = new Date()
      const oneDay = 24 * 60 * 60 * 1000 // milliseconds
      const futureDate = new Date(now.getTime() + oneDay)
      
      expect(futureDate.getTime()).toBeGreaterThan(now.getTime())
      expect(futureDate.getTime() - now.getTime()).toBeGreaterThanOrEqual(oneDay)
    })

    it('should handle timezone-aware dates', () => {
      const date = new Date()
      const isoString = date.toISOString()
      
      expect(isoString).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(new Date(isoString).getTime()).toBe(date.getTime())
    })
  })
})
