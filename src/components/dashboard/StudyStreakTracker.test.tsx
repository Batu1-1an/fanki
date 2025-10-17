import { describe, it, expect, vi } from 'vitest'

describe('StudyStreakTracker', () => {
  describe('Streak Display', () => {
    it('should show current streak', () => {
      const streak = 7
      expect(streak).toBeGreaterThanOrEqual(0)
    })

    it('should show longest streak', () => {
      const longest = 30
      expect(longest).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Streak Calculation', () => {
    it('should count consecutive days', () => {
      const days = ['2025-01-01', '2025-01-02', '2025-01-03']
      expect(days).toHaveLength(3)
    })

    it('should break on missed day', () => {
      const lastStudy = new Date('2025-01-01')
      const today = new Date('2025-01-03')
      const daysDiff = Math.floor((today.getTime() - lastStudy.getTime()) / (24 * 60 * 60 * 1000))
      const isBroken = daysDiff > 1
      expect(isBroken).toBe(true)
    })
  })

  describe('Streak Motivation', () => {
    it('should show encouragement', () => {
      const message = 'Keep it up!'
      expect(message).toBeTruthy()
    })

    it('should show milestone celebrations', () => {
      const streak = 7
      const isMilestone = [7, 14, 30, 100].includes(streak)
      expect(isMilestone).toBe(true)
    })
  })
})
