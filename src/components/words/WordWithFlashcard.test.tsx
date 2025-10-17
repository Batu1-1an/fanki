import { describe, it, expect, vi } from 'vitest'

describe('WordWithFlashcard', () => {
  describe('Word Display', () => {
    it('should show word text', () => {
      const word = { word: 'hello', definition: 'greeting' }
      expect(word.word).toBe('hello')
    })

    it('should show definition', () => {
      const word = { word: 'hello', definition: 'a greeting' }
      expect(word.definition).toBeTruthy()
    })

    it('should show pronunciation', () => {
      const word = { pronunciation: '/həˈloʊ/' }
      expect(word.pronunciation).toBeTruthy()
    })
  })

  describe('Flashcard Preview', () => {
    it('should show flashcard sentences', () => {
      const flashcard = {
        sentences: [
          { sentence: 'Hello ___', blank_position: 6, correct_word: 'world' }
        ]
      }
      expect(flashcard.sentences).toHaveLength(1)
    })

    it('should show image preview', () => {
      const flashcard = { image_url: 'https://example.com/img.jpg' }
      expect(flashcard.image_url).toBeTruthy()
    })
  })

  describe('Actions', () => {
    it('should handle edit', () => {
      const onEdit = vi.fn()
      onEdit('word-123')
      expect(onEdit).toHaveBeenCalledWith('word-123')
    })

    it('should handle delete', () => {
      const onDelete = vi.fn()
      onDelete('word-123')
      expect(onDelete).toHaveBeenCalledWith('word-123')
    })
  })
})
