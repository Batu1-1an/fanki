import { describe, it, expect } from 'vitest'
import {
  calculateSM2,
  buttonToQuality,
  getDifficultyLabel,
  calculateRetentionRate,
  previewIntervals,
  formatInterval
} from './sm2'

describe('SM-2 Algorithm', () => {
  describe('calculateSM2', () => {
    it('should initialize correctly for new cards', () => {
      const result = calculateSM2({
        quality: 4,
        ease_factor: 2.5,
        interval_days: 0,
        repetitions: 0
      })

      expect(result.ease_factor).toBeGreaterThanOrEqual(1.3)
      expect(result.interval_days).toBeGreaterThan(0)
      expect(result.repetitions).toBe(1)
      expect(result.due_date).toBeInstanceOf(Date)
    })

    it('should handle perfect response (quality 5)', () => {
      const result = calculateSM2({
        quality: 5,
        ease_factor: 2.5,
        interval_days: 6,
        repetitions: 2
      })

      expect(result.ease_factor).toBeGreaterThan(2.5)
      expect(result.interval_days).toBeGreaterThan(6)
      expect(result.repetitions).toBe(3)
    })

    it('should handle failed response (quality < 3)', () => {
      const result = calculateSM2({
        quality: 0,
        ease_factor: 2.5,
        interval_days: 10,
        repetitions: 3
      })

      expect(result.repetitions).toBe(0)
      expect(result.interval_days).toBe(1)
    })

    it('should maintain minimum ease factor of 1.3', () => {
      const result = calculateSM2({
        quality: 0,
        ease_factor: 1.3,
        interval_days: 1,
        repetitions: 0
      })

      expect(result.ease_factor).toBeGreaterThanOrEqual(1.3)
    })

    it('should handle first two intervals correctly', () => {
      // First review (repetition 0 -> 1)
      const first = calculateSM2({
        quality: 4,
        ease_factor: 2.5,
        interval_days: 0,
        repetitions: 0
      })
      expect(first.interval_days).toBe(1)

      // Second review (repetition 1 -> 2)
      const second = calculateSM2({
        quality: 4,
        ease_factor: first.ease_factor,
        interval_days: first.interval_days,
        repetitions: 1
      })
      expect(second.interval_days).toBe(6)
    })

    it('should calculate correct ease factor changes', () => {
      const perfectResponse = calculateSM2({
        quality: 5,
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 1
      })
      expect(perfectResponse.ease_factor).toBeGreaterThan(2.5)

      const hardResponse = calculateSM2({
        quality: 3,
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 1
      })
      expect(hardResponse.ease_factor).toBeLessThan(2.5)
    })
  })

  describe('buttonToQuality', () => {
    it('should convert buttons to correct quality scores', () => {
      expect(buttonToQuality('again')).toBe(0)
      expect(buttonToQuality('hard')).toBe(3)
      expect(buttonToQuality('good')).toBe(4)
      expect(buttonToQuality('easy')).toBe(5)
    })
  })

  describe('getDifficultyLabel', () => {
    it('should return correct difficulty labels', () => {
      expect(getDifficultyLabel(3.0)).toBe('Easy')
      expect(getDifficultyLabel(2.5)).toBe('Easy')
      expect(getDifficultyLabel(2.0)).toBe('Medium')
      expect(getDifficultyLabel(1.5)).toBe('Hard')
      expect(getDifficultyLabel(1.3)).toBe('Very Hard')
    })
  })

  describe('calculateRetentionRate', () => {
    it('should calculate correct retention rate', () => {
      const reviews = [5, 4, 3, 2, 4, 5, 3, 4, 0, 5]
      const rate = calculateRetentionRate(reviews)
      
      // 8 out of 10 are >= 3 (passing)
      expect(rate).toBe(80)
    })

    it('should handle empty reviews', () => {
      expect(calculateRetentionRate([])).toBe(0)
    })

    it('should handle all correct reviews', () => {
      const reviews = [5, 5, 5, 5, 5]
      expect(calculateRetentionRate(reviews)).toBe(100)
    })

    it('should handle all failed reviews', () => {
      const reviews = [0, 1, 2, 0, 1]
      expect(calculateRetentionRate(reviews)).toBe(0)
    })
  })

  describe('previewIntervals', () => {
    it('should preview intervals for all buttons', () => {
      const intervals = previewIntervals(2.5, 6, 2)
      
      expect(intervals).toHaveProperty('again')
      expect(intervals).toHaveProperty('hard')
      expect(intervals).toHaveProperty('good')
      expect(intervals).toHaveProperty('easy')
      
      // Easy should have longest interval
      expect(intervals.easy).toBeGreaterThan(intervals.good)
      expect(intervals.good).toBeGreaterThan(intervals.again)
    })
  })

  describe('formatInterval', () => {
    it('should format days correctly', () => {
      expect(formatInterval(0)).toBe('Today')
      expect(formatInterval(1)).toBe('1 day')
      expect(formatInterval(3)).toBe('3 days')
    })

    it('should format weeks correctly', () => {
      expect(formatInterval(7)).toBe('1 week')
      expect(formatInterval(14)).toBe('2 weeks')
    })

    it('should format months correctly', () => {
      expect(formatInterval(30)).toBe('1 month')
      expect(formatInterval(60)).toBe('2 months')
    })

    it('should format years correctly', () => {
      expect(formatInterval(365)).toBe('1 year')
      expect(formatInterval(730)).toBe('2 years')
    })
  })
})
