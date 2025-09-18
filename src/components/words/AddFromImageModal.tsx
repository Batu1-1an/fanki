'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toast'
import { Upload, Image as ImageIcon, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createWord } from '@/lib/words'
import { addWordToDesk, getDefaultDesk } from '@/lib/desks'
import { useAuth } from '@/hooks/useAuth'
import { createClientComponentClient } from '@/lib/supabase'
import { Word } from '@/types'

interface ExtractedWord {
  word: string
  definition: string
}

interface AddFromImageModalProps {
  isOpen: boolean
  onClose: () => void
  onWordsAdded: (words: Word[]) => void
  selectedDeskId?: string | null
}

// Helper function to convert File to base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      } else {
        reject(new Error('Failed to convert file to base64'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export default function AddFromImageModal({ isOpen, onClose, onWordsAdded, selectedDeskId }: AddFromImageModalProps) {
  const [step, setStep] = useState<'upload' | 'analyze' | 'select' | 'create'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [extractedWords, setExtractedWords] = useState<ExtractedWord[]>([])
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set())
  const [editingDefinitions, setEditingDefinitions] = useState<Record<string, string>>({})
  const [creationProgress, setCreationProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    // Create a fake input event to reuse the file validation logic
    const fakeEvent = {
      target: { files: [file] }
    } as React.ChangeEvent<HTMLInputElement>
    handleFileSelect(fakeEvent)
  }, [handleFileSelect])

  const uploadImageAndAnalyze = async () => {
    if (!selectedFile || !user) return

    setIsAnalyzing(true)
    setError(null)
    setStep('analyze')

    try {
      // Convert image to base64
      const base64Data = await convertFileToBase64(selectedFile)
      
      // Call the Supabase Edge Function directly
      const { data, error } = await supabase.functions.invoke('generate-flashcards-from-image', {
        body: {
          imageData: base64Data,
          mimeType: selectedFile.type,
          userId: user.id
        }
      })

      if (error) {
        throw new Error(error.message || 'Failed to analyze image')
      }

      const { words } = data
      setExtractedWords(words)
      
      // Select all words by default
      setSelectedWords(new Set(words.map((w: ExtractedWord) => w.word)))
      
      setIsAnalyzing(false)
      setStep('select')

      toast({
        title: 'Success!',
        description: `Found ${words.length} words in your image`,
        variant: 'success'
      })

    } catch (error) {
      console.error('Error analyzing image:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsAnalyzing(false)
      setStep('upload')
    }
  }

  const toggleWordSelection = (word: string) => {
    const newSelection = new Set(selectedWords)
    if (newSelection.has(word)) {
      newSelection.delete(word)
    } else {
      newSelection.add(word)
    }
    setSelectedWords(newSelection)
  }

  const updateDefinition = (word: string, newDefinition: string) => {
    setEditingDefinitions(prev => ({
      ...prev,
      [word]: newDefinition
    }))
  }

  const createFlashcards = async () => {
    if (!user) return

    setIsCreating(true)
    setStep('create')
    
    const selectedWordsList = extractedWords.filter(w => selectedWords.has(w.word))
    const createdWords: Word[] = []
    
    setCreationProgress({ current: 0, total: selectedWordsList.length })

    try {
      // Get default desk if no desk is selected
      let targetDeskId = selectedDeskId
      if (!targetDeskId) {
        const defaultDesk = await getDefaultDesk()
        targetDeskId = defaultDesk?.id || null
      }

      for (let i = 0; i < selectedWordsList.length; i++) {
        const wordData = selectedWordsList[i]
        const definition = editingDefinitions[wordData.word] || wordData.definition

        try {
          // Create the word
          const { data: word, error } = await createWord({
            word: wordData.word,
            definition,
            difficulty: 3, // Default to medium difficulty
            category: 'General',
            language: 'en',
            user_id: user.id
          })

          if (error) {
            if (error.code === 'DUPLICATE_WORD') {
              console.log(`Skipping duplicate word: ${wordData.word}`)
            } else {
              console.error(`Error creating word ${wordData.word}:`, error)
            }
          } else if (word) {
            // Add to desk if specified
            if (targetDeskId) {
              await addWordToDesk(word.id, targetDeskId)
            }
            createdWords.push(word)
          }

        } catch (error) {
          console.error(`Error creating word ${wordData.word}:`, error)
        }

        setCreationProgress({ current: i + 1, total: selectedWordsList.length })
      }

      toast({
        title: 'Flashcards Created!',
        description: `Successfully created ${createdWords.length} flashcards`,
        variant: 'success'
      })

      onWordsAdded(createdWords)
      handleClose()

    } catch (error) {
      console.error('Error creating flashcards:', error)
      setError(error instanceof Error ? error.message : 'Failed to create flashcards')
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setStep('upload')
    setSelectedFile(null)
    setImagePreview(null)
    setExtractedWords([])
    setSelectedWords(new Set())
    setEditingDefinitions({})
    setError(null)
    setIsAnalyzing(false)
    setIsCreating(false)
    setCreationProgress({ current: 0, total: 0 })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Create Flashcards from Image
          </DialogTitle>
          <DialogDescription>
            Upload an image with text to automatically extract vocabulary words and create flashcards.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors",
                "hover:border-gray-400 cursor-pointer",
                selectedFile && "border-blue-500 bg-blue-50"
              )}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
                  />
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Image ready to analyze
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium text-blue-600 cursor-pointer">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={uploadImageAndAnalyze}
                disabled={!selectedFile || isAnalyzing}
                className="relative"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Image'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'analyze' && (
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing your image</h3>
            <p className="text-gray-600">AI is extracting words and creating definitions...</p>
          </div>
        )}

        {step === 'select' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Select words to create flashcards</h3>
              <Badge variant="secondary">
                {selectedWords.size} of {extractedWords.length} selected
              </Badge>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-3">
              {extractedWords.map((item) => (
                <div key={item.word} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={selectedWords.has(item.word)}
                    onCheckedChange={() => toggleWordSelection(item.word)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 capitalize">{item.word}</h4>
                    </div>
                    <Input
                      value={editingDefinitions[item.word] || item.definition}
                      onChange={(e) => updateDefinition(item.word, e.target.value)}
                      className="mt-2 text-sm"
                      placeholder="Edit definition..."
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button 
                onClick={createFlashcards}
                disabled={selectedWords.size === 0}
                className="relative"
              >
                Create {selectedWords.size} Flashcards
              </Button>
            </div>
          </div>
        )}

        {step === 'create' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Creating your flashcards</h3>
            <div className="max-w-xs mx-auto">
              <Progress 
                value={creationProgress.total > 0 ? (creationProgress.current / creationProgress.total) * 100 : 0}
                className="w-full"
              />
              <p className="text-sm text-gray-600 mt-2">
                {creationProgress.current} of {creationProgress.total} completed
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
