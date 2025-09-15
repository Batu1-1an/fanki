'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { updateWord, checkWordExists, DIFFICULTY_LEVELS, WORD_CATEGORIES } from '@/lib/words'
import { Word } from '@/types'

interface WordEditModalProps {
  word: Word
  onWordUpdated: (updatedWord: Word) => void
  onClose: () => void
}

export default function WordEditModal({ word, onWordUpdated, onClose }: WordEditModalProps) {
  const [formData, setFormData] = useState({
    word: word.word,
    definition: word.definition || '',
    difficulty: word.difficulty,
    category: word.category || 'General',
    pronunciation: word.pronunciation || ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    // Check if form has changes
    const changed = 
      formData.word !== word.word ||
      formData.definition !== (word.definition || '') ||
      formData.difficulty !== word.difficulty ||
      formData.category !== (word.category || 'General') ||
      formData.pronunciation !== (word.pronunciation || '')
    
    setHasChanges(changed)
  }, [formData, word])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.word.trim()) {
      newErrors.word = 'Word is required'
    } else if (formData.word.trim().length < 2) {
      newErrors.word = 'Word must be at least 2 characters long'
    } else if (!/^[a-zA-Z\s-']+$/.test(formData.word.trim())) {
      newErrors.word = 'Word can only contain letters, spaces, hyphens, and apostrophes'
    }
    
    if (!formData.definition.trim()) {
      newErrors.definition = 'Definition is required'
    } else if (formData.definition.trim().length < 10) {
      newErrors.definition = 'Definition should be at least 10 characters long'
    }
    
    if (formData.difficulty < 1 || formData.difficulty > 5) {
      newErrors.difficulty = 'Difficulty must be between 1 and 5'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkForDuplicate = async (newWord: string) => {
    if (!newWord.trim() || newWord.trim().length < 2 || newWord.trim() === word.word) return
    
    setIsCheckingDuplicate(true)
    const { exists, wordData } = await checkWordExists(newWord)
    
    if (exists && wordData) {
      setErrors(prev => ({
        ...prev,
        word: `"${wordData.word}" already exists in your vocabulary`
      }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.word
        return newErrors
      })
    }
    
    setIsCheckingDuplicate(false)
  }

  const handleWordChange = (value: string) => {
    setFormData(prev => ({ ...prev, word: value }))
    
    // Clear previous word errors
    if (errors.word) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.word
        return newErrors
      })
    }
    
    // Debounce duplicate check
    const timeoutId = setTimeout(() => {
      checkForDuplicate(value)
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !hasChanges) return
    
    setIsLoading(true)
    
    try {
      const updates: Partial<Word> = {}
      
      if (formData.word.trim() !== word.word) {
        updates.word = formData.word.trim()
      }
      if (formData.definition.trim() !== (word.definition || '')) {
        updates.definition = formData.definition.trim()
      }
      if (formData.difficulty !== word.difficulty) {
        updates.difficulty = formData.difficulty
      }
      if (formData.category !== (word.category || 'General')) {
        updates.category = formData.category
      }
      if (formData.pronunciation.trim() !== (word.pronunciation || '')) {
        updates.pronunciation = formData.pronunciation.trim() || null
      }
      
      const { data, error } = await updateWord(word.id, updates)
      
      if (error) {
        if (error.code === 'DUPLICATE_WORD') {
          setErrors({ word: error.message })
        } else {
          setErrors({ form: 'Failed to update word. Please try again.' })
        }
        return
      }
      
      if (data) {
        onWordUpdated(data)
      }
    } catch (error) {
      setErrors({ form: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Word</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.form && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {errors.form}
            </div>
          )}
          
          <div>
            <Label htmlFor="edit-word">
              Word *
              {isCheckingDuplicate && (
                <span className="ml-2 text-xs text-gray-500">Checking...</span>
              )}
            </Label>
            <Input
              id="edit-word"
              type="text"
              value={formData.word}
              onChange={(e) => handleWordChange(e.target.value)}
              placeholder="Enter the word"
              className={errors.word ? 'border-red-300 focus:border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.word && (
              <p className="mt-1 text-sm text-red-600">{errors.word}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="edit-definition">Definition *</Label>
            <Textarea
              id="edit-definition"
              value={formData.definition}
              onChange={(e) => setFormData(prev => ({ ...prev, definition: e.target.value }))}
              placeholder="Enter the definition or meaning"
              rows={3}
              className={errors.definition ? 'border-red-300 focus:border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.definition && (
              <p className="mt-1 text-sm text-red-600">{errors.definition}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-difficulty">Difficulty Level</Label>
              <Select
                value={formData.difficulty.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: parseInt(value) }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DIFFICULTY_LEVELS).map(([level, { label, color }]) => (
                    <SelectItem key={level} value={level}>
                      <div className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${color.split(' ')[0]}`}></span>
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORD_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-pronunciation">Pronunciation (Optional)</Label>
            <Input
              id="edit-pronunciation"
              type="text"
              value={formData.pronunciation}
              onChange={(e) => setFormData(prev => ({ ...prev, pronunciation: e.target.value }))}
              placeholder="e.g., /həˈloʊ/ or huh-LOH"
              disabled={isLoading}
            />
          </div>
        </form>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || isCheckingDuplicate || !hasChanges}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
