'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Sparkles, Eye, EyeOff, Image as ImageIcon, Type, Loader2, MoreHorizontal, MoveRight, BookOpen } from 'lucide-react'
import { Word, FlashcardSentence } from '@/types'
import { getUserDesks, removeWordFromDesk, addWordToDesk, Desk } from '@/lib/desks'
import { aiService } from '@/lib/ai-services'
import { useAuth } from '@/hooks/useAuth'
import { FlashcardGenerator } from './FlashcardGenerator'
import { useToast } from '@/components/ui/toast'
import Image from 'next/image'

interface WordWithFlashcardProps {
  word: Word
  onEdit: (word: Word) => void
  onDelete: (wordId: string) => void
  isDeleting: boolean
  selectedDesk?: Desk | null
  isSelected?: boolean
  onSelectionChange?: (wordId: string, selected: boolean) => void
  showSelection?: boolean
}

export function WordWithFlashcard({ word, onEdit, onDelete, isDeleting, selectedDesk, isSelected = false, onSelectionChange, showSelection = false }: WordWithFlashcardProps) {
  const { user } = useAuth()
  const { success, error } = useToast()
  const [showFlashcard, setShowFlashcard] = useState(false)
  const [flashcardContent, setFlashcardContent] = useState<{
    sentences: FlashcardSentence[]
    imageUrl: string
    imageDescription?: string
  } | null>(null)
  const [loadingFlashcard, setLoadingFlashcard] = useState(false)
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string | null>(null)
  const [availableDesks, setAvailableDesks] = useState<Desk[]>([])
  const [movingToDeskId, setMovingToDeskId] = useState<string | null>(null)

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
      if (cached && cached.sentences && Array.isArray(cached.sentences) && cached.sentences.length > 0) {
        setFlashcardContent({
          sentences: cached.sentences as FlashcardSentence[],
          imageUrl: cached.image_url || `https://placehold.co/300x200/6366F1/FFFFFF?text=${encodeURIComponent(word.word)}`,
          imageDescription: undefined // Will be added to database schema later
        })
      }
    } catch (error) {
      console.error('Error loading flashcard content:', error)
    } finally {
      setLoadingFlashcard(false)
    }
  }

  const handleShowFlashcard = () => {
    const nextShowState = !showFlashcard
    setShowFlashcard(nextShowState)
    if (!nextShowState) {
      setFallbackImageUrl(null)
    }
    if (nextShowState && !flashcardContent) {
      loadFlashcardContent()
    }
  }

  const handleContentGenerated = (content: {
    sentences: FlashcardSentence[]
    imageUrl: string
    imageDescription?: string
    cached: { sentences: boolean; image: boolean }
  }) => {
    setFlashcardContent({
      sentences: content.sentences,
      imageUrl: content.imageUrl,
      imageDescription: content.imageDescription
    })
    setFallbackImageUrl(null)
  }

  // Load available desks for moving
  useEffect(() => {
    const loadDesks = async () => {
      const { data } = await getUserDesks()
      if (data) {
        setAvailableDesks(data.filter(desk => desk.id !== selectedDesk?.id))
      }
    }
    loadDesks()
  }, [selectedDesk])

  const handleMoveToDesk = async (targetDeskId: string) => {
    if (!selectedDesk) return
    
    setMovingToDeskId(targetDeskId)
    try {
      // Remove from current desk
      await removeWordFromDesk(word.id, selectedDesk.id)
      // Add to target desk
      await addWordToDesk(word.id, targetDeskId)
      
      const targetDesk = availableDesks.find(d => d.id === targetDeskId)
      success({
        title: 'Flashcard moved',
        description: `"${word.word}" moved to ${targetDesk?.name || 'selected deck'}`
      })
      
      // Trigger refresh by calling onEdit with a flag or similar
      window.location.reload() // Simple refresh for now
    } catch (err) {
      error({
        title: 'Error',
        description: 'Failed to move flashcard'
      })
    } finally {
      setMovingToDeskId(null)
    }
  }

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {showSelection && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked: boolean) => onSelectionChange?.(word.id, checked)}
                className="flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 capitalize truncate">
                  {word.word}
                </h3>
                {getDifficultyBadge(word.difficulty ?? 3)}
              </div>
              <Badge variant="outline" className="text-xs">{word.category}</Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(word)}>
                Edit Flashcard
              </DropdownMenuItem>
              {selectedDesk && availableDesks.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem>
                      <MoveRight className="h-4 w-4 mr-2" />
                      Move to Deck
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="left">
                    {availableDesks.map((deck) => (
                      <DropdownMenuItem
                        key={deck.id}
                        onClick={() => handleMoveToDesk(deck.id)}
                        disabled={movingToDeskId === deck.id}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: deck.color }}
                          />
                          {deck.name}
                          {movingToDeskId === deck.id && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(word.id)} 
                disabled={isDeleting}
                className="text-red-600"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {word.definition}
        </p>
        
        {word.pronunciation && (
          <p className="text-xs text-gray-500 mb-3">
            <span className="font-medium">🔊</span> {word.pronunciation}
          </p>
        )}

        {/* Flashcard toggle */}
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant={showFlashcard ? "default" : "outline"}
            size="sm"
            onClick={handleShowFlashcard}
            className="flex items-center gap-2 text-xs"
          >
            {showFlashcard ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showFlashcard ? 'Hide' : 'Study'}
          </Button>
          
          {loadingFlashcard && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading...
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Added {new Date(word.created_at || Date.now()).toLocaleDateString()}</span>
          {selectedDesk && (
            <div className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedDesk.color }}
              />
              <span>{selectedDesk.name}</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Flashcard Study Mode */}
      {showFlashcard && (
        <div className="border-t mt-4 pt-4">
          {flashcardContent ? (
            <div className="space-y-3">
              {/* Compact Sentences */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-md">
                <div className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                  <Type className="h-3 w-3" />
                  Practice Sentences
                </div>
                <div className="space-y-2">
                  {flashcardContent.sentences.slice(0, 2).map((sentenceObj, index) => (
                    <p key={index} className="text-xs text-gray-700">
                      {typeof sentenceObj === 'string' ? sentenceObj : (sentenceObj as any).sentence}
                    </p>
                  ))}
                  {flashcardContent.sentences.length > 2 && (
                    <p className="text-xs text-gray-500 italic">+{flashcardContent.sentences.length - 2} more...</p>
                  )}
                </div>
              </div>

              {/* Compact Image */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-md">
                <div className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Visual Aid
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={fallbackImageUrl ?? flashcardContent.imageUrl}
                      alt={`Visual for ${word.word}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                      onError={() => {
                        if (!fallbackImageUrl) {
                          setFallbackImageUrl(`https://placehold.co/64x48/6366F1/FFFFFF?text=${encodeURIComponent(word.word.charAt(0))}`)
                        }
                      }}
                      unoptimized
                    />
                  </div>
                  {flashcardContent.imageDescription && (
                    <p className="text-xs text-gray-600 flex-1">
                      {flashcardContent.imageDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-3 rounded-md">
              <FlashcardGenerator
                word={word.word}
                difficulty={(word.difficulty ?? 3) <= 2 ? 'beginner' : (word.difficulty ?? 3) >= 4 ? 'advanced' : 'intermediate'}
                onContentGenerated={handleContentGenerated}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
