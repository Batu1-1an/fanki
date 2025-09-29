'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
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
import { searchUnsplashImages, trackUnsplashDownload, UnsplashPhoto, UnsplashRateLimit } from '@/lib/unsplash'
import { useToast } from '@/components/ui/toast'

interface AddWordFormProps {
  onWordAdded?: (word: Word) => void
  onCancel?: () => void
  isModal?: boolean
  selectedDesk?: Desk | null
}

export default function AddWordForm({ onWordAdded, onCancel, isModal = false, selectedDesk }: AddWordFormProps) {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [formData, setFormData] = useState({
    word: '',
    definition: '',
    difficulty: 3,
    category: 'General',
    pronunciation: '',
    deskId: selectedDesk?.id || ''
  })
  const deskId = formData.deskId
  
  const [desks, setDesks] = useState<Desk[]>([])
  const [defaultDesk, setDefaultDesk] = useState<Desk | null>(null)
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validFields, setValidFields] = useState<Record<string, boolean>>({})
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [liveValidationTimeout, setLiveValidationTimeout] = useState<NodeJS.Timeout | null>(null)
  const [imageSource, setImageSource] = useState<'unsplash' | 'gemini'>('unsplash')
  const [unsplashQuery, setUnsplashQuery] = useState('')
  const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([])
  const [unsplashRateLimit, setUnsplashRateLimit] = useState<UnsplashRateLimit | null>(null)
  const [isSearchingUnsplash, setIsSearchingUnsplash] = useState(false)
  const [imageSelectionError, setImageSelectionError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<{
    source: 'unsplash' | 'gemini'
    imageUrl: string
    description?: string
    attribution?: { name?: string; username?: string; profileUrl?: string }
    downloadLocation?: string
  } | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

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
        if (!selectedDesk && !deskId) {
          setFormData(prev => ({ ...prev, deskId: defaultDeskData.id }))
        }
      }
    }

    loadDesks()
  }, [selectedDesk, deskId])

  const handleUnsplashSearch = async () => {
    if (!unsplashQuery.trim()) {
      setImageSelectionError('Enter a search term to find images')
      showError?.({
        title: 'Unsplash search',
        description: 'Enter a keyword before searching Unsplash.'
      })
      return
    }

    setIsSearchingUnsplash(true)
    setImageSelectionError(null)

    try {
      const result = await searchUnsplashImages(unsplashQuery.trim(), {
        perPage: 12,
        orientation: 'landscape',
        contentFilter: 'high'
      })

      setUnsplashResults(result.results)
      setUnsplashRateLimit(result.rateLimit ?? null)

      if (result.results.length === 0) {
        setImageSelectionError('No images found. Try a different keyword.')
      }
    } catch (error) {
      console.error('Unsplash search failed:', error)
      const message = error instanceof Error ? error.message : 'Failed to search Unsplash'
      setImageSelectionError(message)
      showError?.({
        title: 'Unsplash search failed',
        description: message
      })
    } finally {
      setIsSearchingUnsplash(false)
    }
  }

  const handleSelectUnsplashImage = async (photo: UnsplashPhoto) => {
    try {
      await trackUnsplashDownload(photo.links.download_location)
      setSelectedImage({
        source: 'unsplash',
        imageUrl: photo.urls.regular,
        description: photo.alt_description || photo.description || undefined,
        attribution: {
          name: photo.user?.name,
          username: photo.user?.username,
          profileUrl: photo.user?.links?.html
        },
        downloadLocation: photo.links.download_location
      })
      setImageSelectionError(null)
      success?.({
        title: 'Image selected',
        description: 'Unsplash image registered successfully.'
      })
    } catch (error) {
      console.error('Failed to register Unsplash download:', error)
      const message = 'Failed to register download with Unsplash. Please try another image.'
      setImageSelectionError(message)
      showError?.({
        title: 'Unsplash download failed',
        description: message
      })
    }
  }

  const handleGenerateGeminiImage = async () => {
    if (!user) {
      setImageSelectionError('Please log in to generate AI images')
      showError?.({
        title: 'Sign in required',
        description: 'Log in to generate Gemini images.'
      })
      return
    }

    if (!formData.word.trim()) {
      setImageSelectionError('Enter a word before generating an image')
      showError?.({
        title: 'Word required',
        description: 'Please enter the word first.'
      })
      return
    }

    setIsGeneratingImage(true)
    setImageSelectionError(null)

    try {
      const response = await aiService.generateImage(formData.word, user.id, {
        allowMissingWord: true
      })
      setSelectedImage({
        source: 'gemini',
        imageUrl: response.imageUrl,
        description: response.description || undefined
      })
      success?.({
        title: 'Image generated',
        description: 'Gemini created an image for this word.'
      })
    } catch (error) {
      console.error('Gemini image generation failed:', error)
      const message = error instanceof Error ? error.message : 'Failed to generate AI image'
      setImageSelectionError(message)
      showError?.({
        title: 'Gemini image error',
        description: message
      })
    } finally {
      setIsGeneratingImage(false)
    }
  }

  useEffect(() => {
    setUnsplashQuery(formData.word.trim())
  }, [formData.word])

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
    setSelectedImage(null)
    handleFieldChange('word', value)
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

        if (selectedImage && user) {
          try {
            await aiService.saveFlashcard(
              data.word,
              user.id,
              [],
              selectedImage.imageUrl,
              selectedImage.description
            )
          } catch (error) {
            console.error('Failed to save selected image to flashcard cache:', error)
          }
        }
        
        // Generate AI content in the background
        if (user && !selectedImage) {
          setIsGeneratingAI(true)
          // Generate AI content asynchronously - don't block the UI
          const difficulty = (data.difficulty ?? 3) <= 2 ? 'beginner' : (data.difficulty ?? 3) >= 4 ? 'advanced' : 'intermediate'
          aiService.generateFlashcardContent(
            data.word,
            difficulty,
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
        setSelectedImage(null)
        setUnsplashResults([])
        setImageSelectionError(null)
        
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
              onChange={(e) => handleWordChange(e.target.value)}
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

        <div className="sm:col-span-2 space-y-3">
          <Label>Flashcard Image (Optional)</Label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant={imageSource === 'unsplash' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setImageSource('unsplash')
                setSelectedImage(null)
                setImageSelectionError(null)
              }}
              disabled={isLoading}
            >
              Unsplash Photos
            </Button>
            <Button
              type="button"
              variant={imageSource === 'gemini' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setImageSource('gemini')
                setImageSelectionError(null)
              }}
              disabled={isLoading}
            >
              Gemini AI
            </Button>
          </div>

          {imageSource === 'unsplash' && (
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={unsplashQuery}
                  onChange={(e) => setUnsplashQuery(e.target.value)}
                  placeholder="Search Unsplash for images"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  onClick={handleUnsplashSearch}
                  disabled={isLoading || isSearchingUnsplash}
                  className="sm:w-40"
                >
                  {isSearchingUnsplash ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </div>
                  ) : 'Search'}
                </Button>
              </div>

              {unsplashRateLimit && (
                <p className="text-xs text-muted-foreground">
                  Rate limit: {unsplashRateLimit.remaining ?? '—'} remaining of {unsplashRateLimit.limit ?? '—'} (reset {unsplashRateLimit.reset ?? '—'})
                </p>
              )}

              {imageSelectionError && imageSource === 'unsplash' && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
                  {imageSelectionError}
                </div>
              )}

              {selectedImage?.source === 'unsplash' && (
                <div className="border rounded-md overflow-hidden">
                  <div className="relative h-48 w-full">
                    <Image
                      src={selectedImage.imageUrl}
                      alt={selectedImage.description || 'Selected Unsplash image'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-2 text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      {selectedImage.attribution?.name}
                      {selectedImage.attribution?.username && (
                        <>
                          {' '}•{' '}
                          <a
                            href={`https://unsplash.com/@${selectedImage.attribution.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            @{selectedImage.attribution.username}
                          </a>
                        </>
                      )}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedImage(null)}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {unsplashResults.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    className={cn(
                      'relative group overflow-hidden rounded-md border focus:outline-none focus:ring-2 focus:ring-primary transition',
                      selectedImage?.imageUrl === photo.urls.regular ? 'border-primary ring-1 ring-primary' : 'border-transparent'
                    )}
                    onClick={() => handleSelectUnsplashImage(photo)}
                  >
                    <div className="relative h-32 w-full">
                      <Image
                        src={photo.urls.small}
                        alt={photo.alt_description || photo.description || 'Unsplash image'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs text-white">
                      Select
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {imageSource === 'gemini' && (
            <div className="space-y-3 border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Generate a custom image using Gemini AI. This might take a few seconds.
              </p>
              {imageSelectionError && imageSource === 'gemini' && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
                  {imageSelectionError}
                </div>
              )}
              <Button
                type="button"
                onClick={handleGenerateGeminiImage}
                disabled={isGeneratingImage || isLoading}
                className="w-full sm:w-40"
              >
                {isGeneratingImage ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>

              {selectedImage?.source === 'gemini' && (
                <div className="border rounded-md overflow-hidden">
                  <div className="relative h-48 w-full">
                    <Image
                      src={selectedImage.imageUrl}
                      alt={selectedImage.description || 'Gemini generated image'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-2 text-xs text-muted-foreground flex items-center justify-between">
                    <span>Generated with Gemini AI</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedImage(null)}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
              Definition looks good
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
