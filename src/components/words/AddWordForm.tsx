'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createWord, checkWordExists, DIFFICULTY_LEVELS, WORD_CATEGORIES } from '@/lib/words'
import { getUserDesks, addWordToDesk, getDefaultDesk, Desk } from '@/lib/desks'
import { Word } from '@/types'
import { aiService } from '@/lib/ai-services'
import { useAuth } from '@/hooks/useAuth'

interface AddWordFormProps {
  onWordAdded?: (word: Word) => void
  onCancel?: () => void
  isModal?: boolean
  selectedDesk?: Desk | null
}

export default function AddWordForm({ onWordAdded, onCancel, isModal = false, selectedDesk }: AddWordFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    word: '',
    definition: '',
    difficulty: 3,
    category: 'General',
    pronunciation: '',
    deskId: selectedDesk?.id || ''
  })
  
  const [desks, setDesks] = useState<Desk[]>([])
  const [defaultDesk, setDefaultDesk] = useState<Desk | null>(null)
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validFields, setValidFields] = useState<Record<string, boolean>>({})
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [liveValidationTimeout, setLiveValidationTimeout] = useState<NodeJS.Timeout | null>(null)

  // Load desks on component mount
  useEffect(() => {
    const loadDesks = async () => {
      const { data: desksData } = await getUserDesks()
      const { data: defaultDeskData } = await getDefaultDesk()
      
      if (desksData) {
        setDesks(desksData)
      }
      if (defaultDeskData) {
        setDefaultDesk(defaultDeskData)
        // Set default desk if no desk is pre-selected
        if (!selectedDesk && !formData.deskId) {
          setFormData(prev => ({ ...prev, deskId: defaultDeskData.id }))
        }
      }
    }
    loadDesks()
  }, [selectedDesk])

  // Real-time validation for individual fields
  const validateField = useCallback((field: string, value: any) => {
    let error = ''
    let isValid = false

    switch (field) {
      case 'word':
        if (!value.trim()) {
          error = 'Word is required'
        } else if (value.trim().length < 2) {
          error = 'Word must be at least 2 characters long'
        } else if (!/^[a-zA-Z\s-']+$/.test(value.trim())) {
          error = 'Word can only contain letters, spaces, hyphens, and apostrophes'
        } else {
          isValid = true
        }
        break
        
      case 'definition':
        if (!value.trim()) {
          error = 'Definition is required'
        } else if (value.trim().length < 10) {
          error = `Definition should be at least 10 characters long (${value.trim().length}/10)`
        } else {
          isValid = true
        }
        break
        
      case 'pronunciation':
        if (value.trim() && !/^[a-zA-Z\s\/\-ˈˌ]+$/.test(value.trim())) {
          error = 'Invalid pronunciation format'
        } else {
          isValid = true
        }
        break
        
      case 'difficulty':
        if (value < 1 || value > 5) {
          error = 'Difficulty must be between 1 and 5'
        } else {
          isValid = true
        }
        break
    }

    return { error, isValid }
  }, [])

  // Debounced validation
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFieldTouched(prev => ({ ...prev, [field]: true }))
    
    // Clear existing timeout
    if (liveValidationTimeout) {
      clearTimeout(liveValidationTimeout)
    }
    
    // Set new timeout for validation
    const timeout = setTimeout(() => {
      const validation = validateField(field, value)
      
      setErrors(prev => ({
        ...prev,
        [field]: validation.error
      }))
      
      setValidFields(prev => ({
        ...prev,
        [field]: validation.isValid
      }))
      
      // Check for duplicates on word field
      if (field === 'word' && validation.isValid && value.trim()) {
        checkForDuplicate(value.trim())
      }
    }, 500)
    
    setLiveValidationTimeout(timeout)
  }, [liveValidationTimeout, validateField])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    const newValidFields: Record<string, boolean> = {}
    
    // Validate all fields
    Object.keys(formData).forEach(field => {
      const validation = validateField(field, formData[field as keyof typeof formData])
      if (validation.error) {
        newErrors[field] = validation.error
      }
      newValidFields[field] = validation.isValid
    })
    
    setErrors(newErrors)
    setValidFields(newValidFields)
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
        language: 'en',
        user_id: user!.id
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
        // Add word to selected desk
        const targetDeskId = formData.deskId || defaultDesk?.id
        if (targetDeskId) {
          await addWordToDesk(data.id, targetDeskId)
        }
        
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
          pronunciation: '',
          deskId: selectedDesk?.id || defaultDesk?.id || ''
        })
        setErrors({})
        setValidFields({})
        setFieldTouched({})
        
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
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            {selectedDesk ? `Add Flashcard to ${selectedDesk.name}` : 'Create New Flashcard'}
          </h2>
          <p className="text-sm text-gray-600">
            {selectedDesk 
              ? `Add a new flashcard to your "${selectedDesk.name}" deck.`
              : 'Create a new flashcard and choose which deck to add it to.'}
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
          <Label htmlFor="word" className="flex items-center gap-2">
            Word *
            {isCheckingDuplicate && (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            )}
            {!isCheckingDuplicate && validFields.word && (
              <CheckCircle className="w-3 h-3 text-success-500" />
            )}
          </Label>
          <div className="relative">
            <Input
              id="word"
              type="text"
              value={formData.word}
              onChange={(e) => handleFieldChange('word', e.target.value)}
              placeholder="Enter the word"
              className={cn(
                "pr-8",
                errors.word ? 'border-error-300 focus:border-error-500' : 
                validFields.word && fieldTouched.word ? 'border-success-300 focus:border-success-500' : ''
              )}
              disabled={isLoading}
            />
            {fieldTouched.word && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {validFields.word ? (
                  <CheckCircle className="w-4 h-4 text-success-500" />
                ) : errors.word ? (
                  <AlertCircle className="w-4 h-4 text-error-500" />
                ) : null}
              </div>
            )}
          </div>
          {errors.word && (
            <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.word}
            </p>
          )}
          {validFields.word && fieldTouched.word && !errors.word && (
            <p className="mt-1 text-sm text-success-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Looks good!
            </p>
          )}
        </div>
        
        <div className="sm:col-span-2">
          <Label htmlFor="definition" className="flex items-center gap-2">
            Definition *
            {validFields.definition && fieldTouched.definition && (
              <CheckCircle className="w-3 h-3 text-success-500" />
            )}
          </Label>
          <div className="relative">
            <Textarea
              id="definition"
              value={formData.definition}
              onChange={(e) => handleFieldChange('definition', e.target.value)}
              placeholder="Enter the definition or meaning"
              rows={3}
              className={cn(
                errors.definition ? 'border-error-300 focus:border-error-500' : 
                validFields.definition && fieldTouched.definition ? 'border-success-300 focus:border-success-500' : ''
              )}
              disabled={isLoading}
            />
          </div>
          {errors.definition && (
            <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.definition}
            </p>
          )}
          {validFields.definition && fieldTouched.definition && !errors.definition && (
            <p className="mt-1 text-sm text-success-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Perfect length for a clear definition
            </p>
          )}
        </div>
        
        <div>
          <Label htmlFor="difficulty">Difficulty Level</Label>
          <Select
            value={formData.difficulty.toString()}
            onValueChange={(value) => handleFieldChange('difficulty', parseInt(value))}
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
            onValueChange={(value) => handleFieldChange('category', value)}
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
          <Label htmlFor="pronunciation" className="flex items-center gap-2">
            Pronunciation (Optional)
            {validFields.pronunciation && fieldTouched.pronunciation && (
              <CheckCircle className="w-3 h-3 text-success-500" />
            )}
          </Label>
          <div className="relative">
            <Input
              id="pronunciation"
              type="text"
              value={formData.pronunciation}
              onChange={(e) => handleFieldChange('pronunciation', e.target.value)}
              placeholder="e.g., /həˈloʊ/ or huh-LOH"
              className={cn(
                "pr-8",
                errors.pronunciation ? 'border-error-300 focus:border-error-500' : 
                validFields.pronunciation && fieldTouched.pronunciation ? 'border-success-300 focus:border-success-500' : ''
              )}
              disabled={isLoading}
            />
            {fieldTouched.pronunciation && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {validFields.pronunciation ? (
                  <CheckCircle className="w-4 h-4 text-success-500" />
                ) : errors.pronunciation ? (
                  <AlertCircle className="w-4 h-4 text-error-500" />
                ) : null}
              </div>
            )}
          </div>
          {errors.pronunciation && (
            <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.pronunciation}
            </p>
          )}
        </div>
        
        <div className="sm:col-span-2">
          <Label htmlFor="deck">Flashcard Deck</Label>
          <Select
            value={formData.deskId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, deskId: value }))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a deck" />
            </SelectTrigger>
            <SelectContent>
              {desks.map((desk) => (
                <SelectItem key={desk.id} value={desk.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: desk.color }}
                    />
                    {desk.name}
                    {desk.is_default && <span className="text-xs text-gray-500">(Default)</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            {selectedDesk 
              ? `Adding to "${selectedDesk.name}" deck` 
              : 'Choose which deck to add this flashcard to'}
          </p>
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
