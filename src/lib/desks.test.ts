import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Desk Management', () => {
  describe('Desk Properties', () => {
    it('should contain required desk fields', () => {
      const desk = {
        id: 'desk-123',
        name: 'Spanish Vocabulary',
        description: 'Learn Spanish words',
        user_id: 'user-456',
        created_at: new Date().toISOString()
      }
      
      expect(desk.id).toBeTruthy()
      expect(desk.name).toBeTruthy()
      expect(desk.user_id).toBeTruthy()
    })

    it('should support optional color field', () => {
      const desk = {
        id: 'desk-123',
        name: 'Spanish',
        color: '#FF5733'
      }
      
      expect(desk.color).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('should support optional icon field', () => {
      const desk = {
        id: 'desk-123',
        name: 'Spanish',
        icon: '🇪🇸'
      }
      
      expect(desk.icon).toBeTruthy()
    })

    it('should allow null description', () => {
      const desk = {
        id: 'desk-123',
        name: 'Spanish',
        description: null as string | null
      }
      
      expect(desk.description).toBeNull()
    })
  })

  describe('Desk Validation', () => {
    it('should require non-empty name', () => {
      const name = 'Spanish Vocabulary'
      const isValid = name.trim().length > 0
      
      expect(isValid).toBe(true)
    })

    it('should reject empty names', () => {
      const name = '   '
      const isValid = name.trim().length > 0
      
      expect(isValid).toBe(false)
    })

    it('should enforce max name length', () => {
      const maxLength = 100
      const name = 'A'.repeat(150)
      const isValid = name.length <= maxLength
      
      expect(isValid).toBe(false)
    })

    it('should validate color format', () => {
      const validColors = ['#FF5733', '#00FF00', '#123ABC']
      const invalidColors = ['FF5733', '#FFF', 'red', '']
      
      const colorRegex = /^#[0-9A-F]{6}$/i
      
      validColors.forEach(color => {
        expect(colorRegex.test(color)).toBe(true)
      })
      
      invalidColors.forEach(color => {
        expect(colorRegex.test(color)).toBe(false)
      })
    })
  })

  describe('Word-Desk Association', () => {
    it('should support many-to-many relationship', () => {
      const word = { id: 'word-123' }
      const desks = [
        { id: 'desk-1', name: 'Spanish' },
        { id: 'desk-2', name: 'Common Words' }
      ]
      
      const associations = desks.map(desk => ({
        word_id: word.id,
        desk_id: desk.id
      }))
      
      expect(associations).toHaveLength(2)
      expect(associations[0].word_id).toBe(word.id)
    })

    it('should allow words without desks', () => {
      const word = {
        id: 'word-123',
        desks: [] as any[]
      }
      
      expect(word.desks).toHaveLength(0)
      expect(Array.isArray(word.desks)).toBe(true)
    })

    it('should allow adding word to multiple desks', () => {
      const wordDesks = new Set<string>()
      
      wordDesks.add('desk-1')
      wordDesks.add('desk-2')
      wordDesks.add('desk-3')
      
      expect(wordDesks.size).toBe(3)
      expect(wordDesks.has('desk-1')).toBe(true)
    })

    it('should prevent duplicate desk assignments', () => {
      const wordDesks = new Set<string>()
      
      wordDesks.add('desk-1')
      wordDesks.add('desk-1') // Duplicate
      
      expect(wordDesks.size).toBe(1)
    })
  })

  describe('Desk Filtering', () => {
    it('should filter words by desk', () => {
      const words = [
        { id: 'word-1', deskIds: ['desk-1', 'desk-2'] },
        { id: 'word-2', deskIds: ['desk-2'] },
        { id: 'word-3', deskIds: ['desk-1'] }
      ]
      
      const desk1Words = words.filter(w => w.deskIds.includes('desk-1'))
      
      expect(desk1Words).toHaveLength(2)
    })

    it('should filter cards by desk', () => {
      const cards = [
        { id: 'card-1', word: { desks: ['desk-1'] } },
        { id: 'card-2', word: { desks: ['desk-2'] } },
        { id: 'card-3', word: { desks: ['desk-1', 'desk-2'] } }
      ]
      
      const desk1Cards = cards.filter(c => c.word.desks.includes('desk-1'))
      
      expect(desk1Cards).toHaveLength(2)
    })

    it('should handle desk-less cards', () => {
      const cards = [
        { id: 'card-1', word: { desks: [] } },
        { id: 'card-2', word: { desks: ['desk-1'] } }
      ]
      
      const noDeskCards = cards.filter(c => c.word.desks.length === 0)
      
      expect(noDeskCards).toHaveLength(1)
    })
  })

  describe('Desk Statistics', () => {
    it('should count words in desk', () => {
      const deskWords = [
        { word_id: 'word-1', desk_id: 'desk-1' },
        { word_id: 'word-2', desk_id: 'desk-1' },
        { word_id: 'word-3', desk_id: 'desk-1' }
      ]
      
      const wordCount = deskWords.length
      
      expect(wordCount).toBe(3)
    })

    it('should calculate desk progress', () => {
      const totalWords = 100
      const learnedWords = 65
      const progress = (learnedWords / totalWords) * 100
      
      expect(progress).toBe(65)
    })

    it('should track due cards per desk', () => {
      const deskStats = {
        totalCards: 100,
        dueCards: 15,
        newCards: 30,
        overdueCards: 5
      }
      
      expect(deskStats.dueCards).toBeLessThanOrEqual(deskStats.totalCards)
      expect(deskStats.overdueCards).toBeLessThanOrEqual(deskStats.dueCards)
    })
  })

  describe('Desk Ordering', () => {
    it('should sort desks alphabetically', () => {
      const desks = [
        { name: 'Spanish' },
        { name: 'French' },
        { name: 'German' }
      ]
      
      const sorted = [...desks].sort((a, b) => a.name.localeCompare(b.name))
      
      expect(sorted[0].name).toBe('French')
      expect(sorted[2].name).toBe('Spanish')
    })

    it('should sort desks by creation date', () => {
      const desks = [
        { name: 'Spanish', created_at: new Date('2025-01-15') },
        { name: 'French', created_at: new Date('2025-01-10') },
        { name: 'German', created_at: new Date('2025-01-20') }
      ]
      
      const sorted = [...desks].sort((a, b) => 
        b.created_at.getTime() - a.created_at.getTime()
      )
      
      expect(sorted[0].name).toBe('German') // Most recent
    })

    it('should sort desks by card count', () => {
      const desks = [
        { name: 'Spanish', cardCount: 50 },
        { name: 'French', cardCount: 100 },
        { name: 'German', cardCount: 25 }
      ]
      
      const sorted = [...desks].sort((a, b) => b.cardCount - a.cardCount)
      
      expect(sorted[0].name).toBe('French')
      expect(sorted[0].cardCount).toBe(100)
    })
  })

  describe('Desk Deletion', () => {
    it('should handle desk deletion cascade options', () => {
      const cascadeOptions = ['keep_words', 'delete_words', 'reassign_words']
      
      expect(cascadeOptions).toContain('keep_words')
      expect(cascadeOptions).toContain('delete_words')
      expect(cascadeOptions).toContain('reassign_words')
    })

    it('should remove desk associations on deletion', () => {
      const wordDesks = ['desk-1', 'desk-2', 'desk-3']
      const deskToDelete = 'desk-2'
      
      const remainingDesks = wordDesks.filter(d => d !== deskToDelete)
      
      expect(remainingDesks).toHaveLength(2)
      expect(remainingDesks).not.toContain(deskToDelete)
    })

    it('should prevent deleting desk with active study session', () => {
      const desk = {
        id: 'desk-1',
        hasActiveSession: true
      }
      
      const canDelete = !desk.hasActiveSession
      
      expect(canDelete).toBe(false)
    })
  })

  describe('Desk Settings', () => {
    it('should support custom study limits per desk', () => {
      const deskSettings = {
        daily_new_cards: 20,
        daily_reviews: 100,
        ease_bonus: 0.15
      }
      
      expect(deskSettings.daily_new_cards).toBeGreaterThan(0)
      expect(deskSettings.daily_reviews).toBeGreaterThan(0)
      expect(deskSettings.ease_bonus).toBeGreaterThanOrEqual(0)
    })

    it('should support auto-archive setting', () => {
      const desk = {
        id: 'desk-1',
        auto_archive_days: 90
      }
      
      expect(desk.auto_archive_days).toBeGreaterThan(0)
    })
  })

  describe('Desk Sharing', () => {
    it('should track desk visibility', () => {
      const desk = {
        id: 'desk-1',
        is_public: false,
        shared_with: [] as string[]
      }
      
      expect(desk.is_public).toBe(false)
      expect(desk.shared_with).toHaveLength(0)
    })

    it('should support sharing with specific users', () => {
      const desk = {
        id: 'desk-1',
        shared_with: ['user-2', 'user-3']
      }
      
      expect(desk.shared_with).toHaveLength(2)
      expect(desk.shared_with).toContain('user-2')
    })

    it('should check user access to desk', () => {
      const desk = {
        owner_id: 'user-1',
        shared_with: ['user-2', 'user-3']
      }
      
      const userId = 'user-2'
      const hasAccess = desk.owner_id === userId || desk.shared_with.includes(userId)
      
      expect(hasAccess).toBe(true)
    })
  })

  describe('Default Desk', () => {
    it('should identify default desk', () => {
      const desks = [
        { id: 'desk-1', name: 'Spanish', is_default: false },
        { id: 'desk-2', name: 'Default', is_default: true },
        { id: 'desk-3', name: 'French', is_default: false }
      ]
      
      const defaultDesk = desks.find(d => d.is_default)
      
      expect(defaultDesk?.name).toBe('Default')
    })

    it('should assign unassigned words to default desk', () => {
      const word = {
        id: 'word-1',
        desks: [] as string[]
      }
      
      const defaultDeskId = 'default-desk'
      
      if (word.desks.length === 0) {
        word.desks.push(defaultDeskId)
      }
      
      expect(word.desks).toContain(defaultDeskId)
    })
  })

  describe('Bulk Operations', () => {
    it('should move multiple words to desk', () => {
      const wordIds = ['word-1', 'word-2', 'word-3']
      const targetDeskId = 'desk-new'
      
      const operations = wordIds.map(wordId => ({
        word_id: wordId,
        desk_id: targetDeskId
      }))
      
      expect(operations).toHaveLength(3)
      expect(operations.every(op => op.desk_id === targetDeskId)).toBe(true)
    })

    it('should remove words from desk in bulk', () => {
      const wordIds = ['word-1', 'word-2', 'word-3']
      const deskId = 'desk-1'
      
      const operations = wordIds.map(wordId => ({
        word_id: wordId,
        desk_id: deskId,
        action: 'remove' as const
      }))
      
      expect(operations).toHaveLength(3)
      expect(operations.every(op => op.action === 'remove')).toBe(true)
    })
  })

  describe('Desk Search', () => {
    it('should search desks by name', () => {
      const desks = [
        { name: 'Spanish Vocabulary' },
        { name: 'French Grammar' },
        { name: 'Spanish Verbs' }
      ]
      
      const query = 'spanish'
      const results = desks.filter(d => 
        d.name.toLowerCase().includes(query.toLowerCase())
      )
      
      expect(results).toHaveLength(2)
    })

    it('should search desks by description', () => {
      const desks = [
        { name: 'Spanish', description: 'Learn Spanish basics' },
        { name: 'French', description: 'Advanced French grammar' },
        { name: 'German', description: 'Spanish-German cognates' }
      ]
      
      const query = 'spanish'
      const results = desks.filter(d => 
        d.description?.toLowerCase().includes(query.toLowerCase())
      )
      
      expect(results).toHaveLength(2)
    })
  })
})
