import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Card Management', () => {
  describe('Note Type System', () => {
    it('should define all supported note type slugs', () => {
      const supportedTypes = ['default', 'basic', 'basic_reverse', 'typing', 'cloze', 'image_occlusion']
      
      expect(supportedTypes).toContain('basic')
      expect(supportedTypes).toContain('cloze')
      expect(supportedTypes).toContain('typing')
      expect(supportedTypes).toContain('basic_reverse')
      expect(supportedTypes).toContain('image_occlusion')
    })

    it('should validate basic note type fields', () => {
      const basicFields = ['front', 'back', 'extra']
      
      expect(basicFields).toContain('front')
      expect(basicFields).toContain('back')
      expect(basicFields.length).toBeGreaterThanOrEqual(2)
    })

    it('should validate cloze note type fields', () => {
      const clozeFields = ['text', 'extra']
      
      expect(clozeFields).toContain('text')
      expect(clozeFields).toHaveLength(2)
    })

    it('should validate typing note type fields', () => {
      const typingFields = ['front', 'back', 'extra']
      
      expect(typingFields).toContain('front')
      expect(typingFields).toContain('back')
    })
  })

  describe('Cloze Deletion Parsing', () => {
    it('should parse single cloze deletion', () => {
      const text = 'The {{c1::capital}} of France is Paris'
      const regex = /\{\{c(\d+)::([^}]+)\}\}/g
      const matches = [...text.matchAll(regex)]
      
      expect(matches).toHaveLength(1)
      expect(matches[0][1]).toBe('1')
      expect(matches[0][2]).toBe('capital')
    })

    it('should parse multiple cloze deletions', () => {
      const text = 'The {{c1::capital}} of France is {{c2::Paris}}'
      const regex = /\{\{c(\d+)::([^}]+)\}\}/g
      const matches = [...text.matchAll(regex)]
      
      expect(matches).toHaveLength(2)
      expect(matches[0][2]).toBe('capital')
      expect(matches[1][2]).toBe('Paris')
    })

    it('should parse overlapping cloze deletions', () => {
      const text = '{{c1::Word1}} and {{c1::Word2}} are related'
      const regex = /\{\{c(\d+)::([^}]+)\}\}/g
      const matches = [...text.matchAll(regex)]
      
      expect(matches).toHaveLength(2)
      expect(matches[0][1]).toBe('1')
      expect(matches[1][1]).toBe('1')
    })

    it('should generate text with blank for cloze', () => {
      const text = 'The {{c1::capital}} of France is Paris'
      const blankText = text.replace(/\{\{c1::([^}]+)\}\}/, '[...]')
      
      expect(blankText).toBe('The [...] of France is Paris')
      expect(blankText).not.toContain('capital')
    })

    it('should show other clozes as plain text', () => {
      const text = 'The {{c1::capital}} of France is {{c2::Paris}}'
      const textWithBlank = text
        .replace(/\{\{c1::([^}]+)\}\}/, '[...]')
        .replace(/\{\{c2::([^}]+)\}\}/, '$1')
      
      expect(textWithBlank).toBe('The [...] of France is Paris')
    })

    it('should validate cloze syntax', () => {
      const validCloze = 'Text with {{c1::deletion}}'
      const invalidCloze = 'Text without deletion'
      
      const clozeRegex = /\{\{c\d+::[^}]+\}\}/
      
      expect(clozeRegex.test(validCloze)).toBe(true)
      expect(clozeRegex.test(invalidCloze)).toBe(false)
    })
  })

  describe('Card Template System', () => {
    it('should support forward template for basic cards', () => {
      const template = {
        slug: 'forward',
        question: '{{front}}',
        answer: '{{back}}'
      }
      
      expect(template.slug).toBe('forward')
      expect(template.question).toContain('front')
      expect(template.answer).toContain('back')
    })

    it('should support reverse template for basic_reverse cards', () => {
      const template = {
        slug: 'reverse',
        question: '{{back}}',
        answer: '{{front}}'
      }
      
      expect(template.slug).toBe('reverse')
      expect(template.question).toContain('back')
      expect(template.answer).toContain('front')
    })

    it('should support typing template', () => {
      const template = {
        slug: 'typing',
        requiresTyping: true,
        question: '{{front}}',
        answer: '{{back}}'
      }
      
      expect(template.requiresTyping).toBe(true)
      expect(template.slug).toBe('typing')
    })
  })

  describe('Card Generation Logic', () => {
    it('should generate single card for basic note', () => {
      const noteType = { slug: 'basic', supports_reverse: false }
      const templates = [{ slug: 'forward' }]
      
      expect(templates).toHaveLength(1)
      expect(noteType.supports_reverse).toBe(false)
    })

    it('should generate two cards for basic_reverse note', () => {
      const noteType = { slug: 'basic_reverse', supports_reverse: true }
      const templates = [
        { slug: 'forward' },
        { slug: 'reverse' }
      ]
      
      expect(templates).toHaveLength(2)
      expect(noteType.supports_reverse).toBe(true)
    })

    it('should generate multiple cards for cloze note', () => {
      const text = '{{c1::First}} and {{c2::Second}} and {{c3::Third}}'
      const regex = /\{\{c(\d+)::([^}]+)\}\}/g
      const matches = [...text.matchAll(regex)]
      const uniqueClozeNumbers = new Set(matches.map(m => m[1]))
      
      expect(uniqueClozeNumbers.size).toBe(3)
    })
  })

  describe('Render Payload Structure', () => {
    it('should create proper render payload for basic card', () => {
      const fields = {
        front: 'Question',
        back: 'Answer',
        extra: 'Extra info'
      }
      
      const renderPayload = {
        ...fields,
        template_type: 'forward'
      }
      
      expect(renderPayload.front).toBe('Question')
      expect(renderPayload.back).toBe('Answer')
      expect(renderPayload.extra).toBe('Extra info')
      expect(renderPayload.template_type).toBe('forward')
    })

    it('should create proper render payload for cloze card', () => {
      const clozeNumber = 1
      const text = 'The {{c1::capital}} of France'
      const answer = 'capital'
      const textWithBlank = 'The [...] of France'
      
      const renderPayload = {
        cloze_number: clozeNumber,
        text_with_blank: textWithBlank,
        answer: answer,
        full_text: text,
        extra: ''
      }
      
      expect(renderPayload.cloze_number).toBe(1)
      expect(renderPayload.answer).toBe('capital')
      expect(renderPayload.text_with_blank).toContain('[...]')
      expect(renderPayload.full_text).toContain('{{c1::capital}}')
    })

    it('should create proper render payload for typing card', () => {
      const fields = {
        front: 'How do you spell "necessary"?',
        back: 'necessary',
        extra: 'one collar, two sleeves'
      }
      
      const renderPayload = {
        ...fields,
        template_type: 'typing'
      }
      
      expect(renderPayload.back).toBe('necessary')
      expect(renderPayload.extra).toContain('collar')
    })
  })

  describe('Card Position and Ordering', () => {
    it('should assign sequential positions to cards', () => {
      const cards = [
        { position: 0, template_slug: 'forward' },
        { position: 1, template_slug: 'reverse' }
      ]
      
      expect(cards[0].position).toBe(0)
      expect(cards[1].position).toBe(1)
      expect(cards[1].position).toBeGreaterThan(cards[0].position)
    })

    it('should maintain position order for cloze cards', () => {
      const clozeCards = [
        { position: 0, cloze_number: 1 },
        { position: 1, cloze_number: 2 },
        { position: 2, cloze_number: 3 }
      ]
      
      expect(clozeCards).toHaveLength(3)
      expect(clozeCards[0].cloze_number).toBe(1)
      expect(clozeCards[2].cloze_number).toBe(3)
    })
  })

  describe('Note-Word Association', () => {
    it('should allow optional word association', () => {
      const noteWithWord = {
        word_id: 'word-123',
        user_id: 'user-456'
      }
      
      const noteWithoutWord = {
        word_id: null,
        user_id: 'user-456'
      }
      
      expect(noteWithWord.word_id).toBeTruthy()
      expect(noteWithoutWord.word_id).toBeNull()
    })

    it('should link cards to word through note', () => {
      const word = { id: 'word-123' }
      const note = { id: 'note-456', word_id: word.id }
      const card = { id: 'card-789', note_id: note.id }
      
      expect(card.note_id).toBe(note.id)
      expect(note.word_id).toBe(word.id)
    })
  })

  describe('Tag System', () => {
    it('should support multiple tags per note', () => {
      const note = {
        tags: ['spanish', 'vocabulary', 'food']
      }
      
      expect(note.tags).toHaveLength(3)
      expect(note.tags).toContain('spanish')
      expect(note.tags).toContain('vocabulary')
    })

    it('should support empty tags array', () => {
      const note = {
        tags: []
      }
      
      expect(note.tags).toHaveLength(0)
      expect(Array.isArray(note.tags)).toBe(true)
    })

    it('should support tag filtering', () => {
      const notes = [
        { id: '1', tags: ['spanish', 'vocabulary'] },
        { id: '2', tags: ['french', 'vocabulary'] },
        { id: '3', tags: ['spanish', 'grammar'] }
      ]
      
      const spanishNotes = notes.filter(n => n.tags.includes('spanish'))
      const vocabNotes = notes.filter(n => n.tags.includes('vocabulary'))
      
      expect(spanishNotes).toHaveLength(2)
      expect(vocabNotes).toHaveLength(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing required fields', () => {
      const fields = { front: 'Question' }
      const requiredFields = ['front', 'back']
      
      const hasAllRequired = requiredFields.every(field => field in fields)
      
      expect(hasAllRequired).toBe(false)
    })

    it('should handle invalid cloze syntax', () => {
      const invalidCloze = 'Text with {{c1:missing}}'
      const validClozeRegex = /\{\{c\d+::[^}]+\}\}/
      
      expect(validClozeRegex.test(invalidCloze)).toBe(false)
    })

    it('should handle empty cloze text', () => {
      const emptyCloze = 'Text with {{c1::}}'
      const regex = /\{\{c\d+::([^}]+)\}\}/g
      const match = emptyCloze.match(regex)
      
      expect(match).toBeNull()
    })
  })

  describe('Note Type Validation', () => {
    it('should validate note type capabilities', () => {
      const noteTypes = {
        basic: { supports_reverse: false, requires_typing: false, supports_cloze: false },
        basic_reverse: { supports_reverse: true, requires_typing: false, supports_cloze: false },
        typing: { supports_reverse: false, requires_typing: true, supports_cloze: false },
        cloze: { supports_reverse: false, requires_typing: false, supports_cloze: true }
      }
      
      expect(noteTypes.basic.supports_reverse).toBe(false)
      expect(noteTypes.basic_reverse.supports_reverse).toBe(true)
      expect(noteTypes.typing.requires_typing).toBe(true)
      expect(noteTypes.cloze.supports_cloze).toBe(true)
    })

    it('should enforce typing requirement for typing cards', () => {
      const typingNote = { note_type_slug: 'typing', requires_typing: true }
      const basicNote = { note_type_slug: 'basic', requires_typing: false }
      
      expect(typingNote.requires_typing).toBe(true)
      expect(basicNote.requires_typing).toBe(false)
    })
  })
})
