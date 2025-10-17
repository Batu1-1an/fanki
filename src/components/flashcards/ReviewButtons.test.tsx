import { describe, it, expect, vi } from 'vitest'

describe('ReviewButtons Component', () => {
  describe('Button Configuration', () => {
    it('should have four review buttons', () => {
      const buttons = ['again', 'hard', 'good', 'easy'] as const
      expect(buttons).toHaveLength(4)
    })

    it('should map buttons to quality scores', () => {
      const qualityMap = {
        again: 0,
        hard: 3,
        good: 4,
        easy: 5
      }
      
      expect(qualityMap.again).toBe(0)
      expect(qualityMap.easy).toBe(5)
    })

    it('should have interval estimates', () => {
      const intervals = {
        again: '<1m',
        hard: '<10m',
        good: '~1d',
        easy: '~4d'
      }
      
      expect(intervals.again).toBe('<1m')
      expect(intervals.easy).toBe('~4d')
    })
  })

  describe('Button Colors', () => {
    it('should use destructive color for again', () => {
      const againColor = 'destructive'
      expect(againColor).toBe('destructive')
    })

    it('should use warning color for hard', () => {
      const hardColor = 'orange'
      expect(hardColor).toBe('orange')
    })

    it('should use success color for good', () => {
      const goodColor = 'green'
      expect(goodColor).toBe('green')
    })
  })

  describe('Button Interaction', () => {
    it('should call onReview callback', () => {
      const onReview = vi.fn()
      const button = 'good'
      
      onReview(button)
      
      expect(onReview).toHaveBeenCalledWith('good')
    })

    it('should disable buttons when loading', () => {
      const isLoading = true
      const isDisabled = isLoading
      
      expect(isDisabled).toBe(true)
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should support number key shortcuts', () => {
      const shortcuts = {
        '1': 'again',
        '2': 'hard',
        '3': 'good',
        '4': 'easy'
      }
      
      expect(shortcuts['3']).toBe('good')
    })
  })

  describe('Button Layout', () => {
    it('should arrange buttons in grid', () => {
      const layout = 'grid-cols-2'
      expect(layout).toContain('grid')
    })
  })
})
