'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Eye, EyeOff, Image as ImageIcon, Type, Loader2 } from 'lucide-react'
import { Word } from '@/types'
import { aiService } from '@/lib/ai-services'
import { useAuth } from '@/hooks/useAuth'
import { FlashcardGenerator } from './FlashcardGenerator'

interface WordWithFlashcardProps {
  word: Word
  onEdit: (word: Word) => void
  onDelete: (wordId: string) => void
  isDeleting: boolean
}

export function WordWithFlashcard({ word, onEdit, onDelete, isDeleting }: WordWithFlashcardProps) {
  const { user } = useAuth()
  const [showFlashcard, setShowFlashcard] = useState(false)
  const [flashcardContent, setFlashcardContent] = useState<{
    sentences: string[]
    imageUrl: string
    imageDescription?: string
  } | null>(null)
  const [loadingFlashcard, setLoadingFlashcard] = useState(false)

  const getDifficultyBadge = (difficulty: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800', 
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    }
    const labels = {
      1: 'Beginner',
      2: 'Easy',
      3: 'Medium', 
      4: 'Hard',
      5: 'Expert'
    }
    
    return (
      <Badge className={colors[difficulty as keyof typeof colors] || colors[3]}>
        {labels[difficulty as keyof typeof labels] || 'Medium'}
      </Badge>
    )
  }

  const loadFlashcardContent = async () => {
    if (!user || loadingFlashcard || flashcardContent) return
    
    setLoadingFlashcard(true)
    try {
      // First check if cached content exists
      const cached = await aiService.getCachedFlashcard(word.word, user.id)
      if (cached && cached.sentences && cached.sentences.length > 0) {
        setFlashcardContent({
          sentences: cached.sentences,
          imageUrl: cached.image_url || `https://placehold.co/300x200/6366F1/FFFFFF?text=${encodeURIComponent(word.word)}`,
          imageDescription: cached.image_description
        })
      }
    } catch (error) {
      console.error('Error loading flashcard content:', error)
    } finally {
      setLoadingFlashcard(false)
    }
  }

  const handleShowFlashcard = () => {
    setShowFlashcard(!showFlashcard)
    if (!showFlashcard && !flashcardContent) {
      loadFlashcardContent()
    }
  }

  const handleContentGenerated = (content: {
    sentences: string[]
    imageUrl: string
    imageDescription?: string
  }) => {
    setFlashcardContent(content)
  }

  return (
    <div className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900 capitalize">
              {word.word}
            </h3>
            {getDifficultyBadge(word.difficulty)}
            <Badge variant="outline">{word.category}</Badge>
          </div>
          
          <p className="text-gray-600 text-sm mb-2">
            {word.definition}
          </p>
          
          {word.pronunciation && (
            <p className="text-xs text-gray-500 mb-2">
              <span className="font-medium">Pronunciation:</span> {word.pronunciation}
            </p>
          )}
          
          <p className="text-xs text-gray-400 mb-3">
            Added {new Date(word.created_at).toLocaleDateString()}
          </p>

          {/* Flashcard toggle */}
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowFlashcard}
              className="flex items-center gap-2"
            >
              {showFlashcard ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showFlashcard ? 'Hide' : 'Show'} AI Flashcard
            </Button>
            
            {loadingFlashcard && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(word)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(word.id)}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Flashcard Content */}
      {showFlashcard && (
        <div className="mt-4 border-t pt-4">
          {flashcardContent ? (
            <div className="space-y-4">
              {/* Sentences */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Type className="h-4 w-4 text-blue-500" />
                    Cloze Test Sentences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {flashcardContent.sentences.map((sentenceObj, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm">
                          {typeof sentenceObj === 'string' ? sentenceObj : (sentenceObj as any).sentence}
                        </p>
                        {typeof sentenceObj === 'object' && (sentenceObj as any).explanation && (
                          <p className="text-xs text-gray-600 mt-1 italic">
                            {(sentenceObj as any).explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Image */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-green-500" />
                    Visual Memory Aid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="rounded-md overflow-hidden bg-gray-100 flex items-center justify-center h-32">
                      <img
                        src={flashcardContent.imageUrl}
                        alt={`Visual representation of ${word.word}`}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = `https://placehold.co/300x200/6366F1/FFFFFF?text=${encodeURIComponent(word.word)}`
                        }}
                      />
                    </div>
                    {flashcardContent.imageDescription && (
                      <p className="text-xs text-gray-600">
                        {flashcardContent.imageDescription}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <FlashcardGenerator
              word={word.word}
              difficulty={word.difficulty <= 2 ? 'beginner' : word.difficulty >= 4 ? 'advanced' : 'intermediate'}
              onContentGenerated={handleContentGenerated}
            />
          )}
        </div>
      )}
    </div>
  )
}
