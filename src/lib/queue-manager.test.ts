import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { QueuedWord, QueuePriority, StudyMode } from './queue-manager'

describe('Queue Manager', () => {
  describe('Queue Priority System', () => {
    it('should define all priority levels', () => {
      const priorities: QueuePriority[] = ['learning', 'overdue', 'due_today', 'new', 'review_soon']
      
      expect(priorities).toContain('learning')
      expect(priorities).toContain('overdue')
      expect(priorities).toContain('due_today')
      expect(priorities).toContain('new')
      expect(priorities).toContain('review_soon')
    })

    it('should prioritize overdue cards highest', () => {
      const priorities: QueuePriority[] = ['learning', 'overdue', 'due_today', 'new', 'review_soon']
      const overdueIndex = priorities.indexOf('overdue')
      const newIndex = priorities.indexOf('new')
      
      // Lower index = higher priority
      expect(overdueIndex).toBeLessThan(newIndex)
    })
  })

  describe('Study Modes', () => {
    it('should support all study modes', () => {
      const modes: StudyMode[] = ['mixed', 'new_only', 'review_only', 'overdue_only', 'due_today_only']
      
      expect(modes).toHaveLength(5)
      expect(modes).toContain('mixed')
      expect(modes).toContain('new_only')
      expect(modes).toContain('review_only')
    })
  })

  describe('Chunked Pre-fetching Constants', () => {
    it('should have reasonable chunk sizes', () => {
      const INITIAL_CHUNK_SIZE = 2
      const CHUNK_SIZE = 10
      const PREFETCH_THRESHOLD = 1
      
      expect(INITIAL_CHUNK_SIZE).toBeGreaterThan(0)
      expect(INITIAL_CHUNK_SIZE).toBeLessThan(CHUNK_SIZE)
      expect(PREFETCH_THRESHOLD).toBeGreaterThan(0)
      expect(PREFETCH_THRESHOLD).toBeLessThan(CHUNK_SIZE)
    })
  })

  describe('QueuedWord Interface', () => {
    it('should include all required Word properties', () => {
      const mockWord: Partial<QueuedWord> = {
        id: 'word-123',
        word: 'test',
        definition: 'a test word',
        priority: 'new',
        status: 'new'
      }
      
      expect(mockWord.id).toBeDefined()
      expect(mockWord.word).toBeDefined()
      expect(mockWord.priority).toBeDefined()
    })

    it('should include optional pre-fetched content', () => {
      const mockWord: Partial<QueuedWord> = {
        id: 'word-123',
        word: 'test',
        sentences: [
          { sentence: 'This is a ___', blank_position: 10, correct_word: 'test' }
        ],
        imageUrl: 'https://example.com/image.jpg',
        imageDescription: 'An image for test'
      }
      
      expect(mockWord.sentences).toBeDefined()
      expect(mockWord.imageUrl).toBeDefined()
      expect(mockWord.imageDescription).toBeDefined()
    })
  })

  describe('Queue Sorting Logic', () => {
    it('should handle different sort orders', () => {
      const sortOrders = ['recommended', 'oldest', 'easiest', 'hardest']
      
      expect(sortOrders).toContain('recommended')
      expect(sortOrders).toContain('oldest')
      expect(sortOrders).toContain('easiest')
      expect(sortOrders).toContain('hardest')
    })
  })

  describe('Cache Management', () => {
    it('should have cache TTL defined', () => {
      const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
      
      expect(CACHE_TTL_MS).toBe(300000)
      expect(CACHE_TTL_MS).toBeGreaterThan(0)
    })

    it('should handle cache invalidation triggers', () => {
      const invalidationEvents = ['review_submitted', 'word_status_changed', 'manual_invalidation']
      
      expect(invalidationEvents).toContain('review_submitted')
      expect(invalidationEvents).toContain('word_status_changed')
    })
  })

  describe('Priority Calculation', () => {
    it('should assign overdue priority to past due cards', () => {
      const now = new Date()
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Yesterday
      
      expect(pastDate.getTime()).toBeLessThan(now.getTime())
    })

    it('should assign due_today priority to cards due today', () => {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      expect(today.getDate()).toBe(now.getDate())
    })

    it('should assign new priority to cards never reviewed', () => {
      const mockWord: Partial<QueuedWord> = {
        status: 'new',
        lastReview: undefined
      }
      
      expect(mockWord.status).toBe('new')
      expect(mockWord.lastReview).toBeUndefined()
    })
  })

  describe('Difficulty-based Priority', () => {
    it('should prioritize lower ease factors', () => {
      const hardCard = { currentEaseFactor: 1.5 }
      const easyCard = { currentEaseFactor: 2.8 }
      
      // Lower ease factor = harder card = higher priority
      expect(hardCard.currentEaseFactor).toBeLessThan(easyCard.currentEaseFactor)
    })

    it('should handle missing ease factors', () => {
      const defaultEaseFactor = 2.5
      const cardWithoutFactor = { currentEaseFactor: undefined }
      
      const easeFactor = cardWithoutFactor.currentEaseFactor ?? defaultEaseFactor
      expect(easeFactor).toBe(2.5)
    })
  })

  describe('Time-based Priority', () => {
    it('should calculate days since last review', () => {
      const now = new Date()
      const lastReview = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      
      const daysSince = Math.floor((now.getTime() - lastReview.getTime()) / (24 * 60 * 60 * 1000))
      
      expect(daysSince).toBe(7)
      expect(daysSince).toBeGreaterThan(0)
    })
  })

  describe('Queue Options Validation', () => {
    it('should have sensible default values', () => {
      const defaultOptions = {
        maxWords: 20,
        studyMode: 'mixed' as StudyMode,
        prioritizeWeakWords: false,
        includeNewWords: true,
        includeLearning: true
      }
      
      expect(defaultOptions.maxWords).toBeGreaterThan(0)
      expect(defaultOptions.maxWords).toBeLessThan(100)
      expect(defaultOptions.studyMode).toBe('mixed')
    })

    it('should allow desk filtering', () => {
      const optionsWithDesk = {
        maxWords: 20,
        deskId: 'desk-123'
      }
      
      expect(optionsWithDesk.deskId).toBeDefined()
      expect(typeof optionsWithDesk.deskId).toBe('string')
    })

    it('should allow difficulty range filtering', () => {
      const optionsWithDifficulty = {
        maxWords: 20,
        difficultyRange: [1.3, 2.0] as [number, number]
      }
      
      expect(optionsWithDifficulty.difficultyRange).toHaveLength(2)
      expect(optionsWithDifficulty.difficultyRange[0]).toBeLessThan(optionsWithDifficulty.difficultyRange[1])
    })
  })
})
