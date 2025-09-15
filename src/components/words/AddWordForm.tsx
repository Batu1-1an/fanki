'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createWord, checkWordExists, DIFFICULTY_LEVELS, WORD_CATEGORIES } from '@/lib/words'
import { Word } from '@/types'
import { aiService } from '@/lib/ai-services'
import { useAuth } from '@/hooks/useAuth'

interface AddWordFormProps {
  onWordAdded?: (word: Word) => void
  onCancel?: () => void
  isModal?: boolean
}

export default function AddWordForm({ onWordAdded, onCancel, isModal = false }: AddWordFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    word: '',
    definition: '',
    difficulty: 3,
    category: 'General',
    pronunciation: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

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

  const checkForDuplicate = async (word: string) => {
    if (!word.trim() || word.trim().length < 2) return
    
    setIsCheckingDuplicate(true)
    const { exists, wordData } = await checkWordExists(word)
    
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
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      const { data, error } = await createWord({
        word: formData.word.trim(),
        definition: formData.definition.trim(),
        difficulty: formData.difficulty,
        category: formData.category,
        pronunciation: formData.pronunciation.trim() || null,
        language: 'en'
      })
      
      if (error) {
        if (error.code === 'DUPLICATE_WORD') {
          setErrors({ word: error.message })
        } else {
          setErrors({ form: 'Failed to add word. Please try again.' })
        }
        return
      }
      
      if (data) {
        // Generate AI content in the background
        if (user) {
          setIsGeneratingAI(true)
          // Generate AI content asynchronously - don't block the UI
          aiService.generateFlashcardContent(
            data.word,
            data.difficulty <= 2 ? 'beginner' : data.difficulty >= 4 ? 'advanced' : 'intermediate',
            user.id
          ).catch(error => {
            console.error('Background AI generation failed:', error)
            // Don't show error to user - this is background generation
          }).finally(() => {
            setIsGeneratingAI(false)
          })
        }
        
        // Reset form
        setFormData({
          word: '',
          definition: '',
          difficulty: 3,
          category: 'General',
          pronunciation: ''
        })
        setErrors({})
        
        onWordAdded?.(data)
      }
    } catch (error) {
      setErrors({ form: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const containerClass = isModal 
    ? "space-y-6" 
    : "bg-white shadow rounded-lg p-6 space-y-6"

  return (
    <form onSubmit={handleSubmit} className={containerClass}>
      {!isModal && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Add New Word</h2>
          <p className="text-sm text-gray-600">
            Add a new word to your vocabulary with definition and difficulty level.
          </p>
        </div>
      )}
      
      {errors.form && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {errors.form}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="word">
            Word *
            {isCheckingDuplicate && (
              <span className="ml-2 text-xs text-gray-500">Checking...</span>
            )}
          </Label>
          <Input
            id="word"
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
        
        <div className="sm:col-span-2">
          <Label htmlFor="definition">Definition *</Label>
          <Textarea
            id="definition"
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
        
        <div>
          <Label htmlFor="difficulty">Difficulty Level</Label>
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
          <Label htmlFor="category">Category</Label>
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
        
        <div className="sm:col-span-2">
          <Label htmlFor="pronunciation">Pronunciation (Optional)</Label>
          <Input
            id="pronunciation"
            type="text"
            value={formData.pronunciation}
            onChange={(e) => setFormData(prev => ({ ...prev, pronunciation: e.target.value }))}
            placeholder="e.g., /həˈloʊ/ or huh-LOH"
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading || isCheckingDuplicate}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Adding...
            </>
          ) : (
            'Add Word'
          )}
        </Button>
      </div>
      
      {isGeneratingAI && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Generating AI flashcard content in the background...
        </div>
      )}
    </form>
  )
}
