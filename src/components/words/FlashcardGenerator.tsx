'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, Image as ImageIcon, Type, RefreshCw } from 'lucide-react'
import { aiService } from '@/lib/ai-services'
import { useAuth } from '@/hooks/useAuth'
import { FlashcardSentence } from '@/types'
import NextImage from 'next/image'

interface FlashcardGeneratorProps {
  word: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  onContentGenerated?: (content: {
    sentences: FlashcardSentence[]
    imageUrl: string
    imageDescription?: string
    cached: { sentences: boolean; image: boolean }
  }) => void
}

export function FlashcardGenerator({ word, difficulty, onContentGenerated }: FlashcardGeneratorProps) {
  const { user } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<{
    sentences: FlashcardSentence[]
    imageUrl: string
    imageDescription?: string
    cached: { sentences: boolean; image: boolean }
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string | null>(null)

  useEffect(() => {
    setFallbackImageUrl(null)
  }, [generatedContent?.imageUrl])

  const handleGenerate = async () => {
    if (!user) {
      setError('Please log in to generate flashcard content')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const content = await aiService.generateFlashcardContent(
        word,
        difficulty,
        user.id
      )

      setGeneratedContent(content)
      setFallbackImageUrl(null)
      onContentGenerated?.(content)
    } catch (err) {
      console.error('Error generating flashcard content:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate content')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = async () => {
    // Clear existing content and regenerate
    setGeneratedContent(null)
    await handleGenerate()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-semibold">AI Content Generator</h3>
          <Badge variant="secondary" className="text-xs">
            {difficulty}
          </Badge>
        </div>
        
        {generatedContent && (
          <Button
            onClick={handleRegenerate}
            variant="outline"
            size="sm"
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </Button>
        )}
      </div>

      {!generatedContent && !isGenerating && (
        <Card className="p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Type className="h-4 w-4" />
                3 Cloze Sentences
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                Memorable Image
              </div>
            </div>
            <p className="text-muted-foreground">
              Generate AI-powered flashcard content for &quot;<strong>{word}</strong>&quot;
            </p>
            <Button 
              onClick={handleGenerate}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Content
            </Button>
          </div>
        </Card>
      )}

      {isGenerating && (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <div className="text-center">
              <p className="font-medium">Generating AI Content...</p>
              <p className="text-sm text-muted-foreground">
                Creating sentences and image for &quot;{word}&quot;
              </p>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            onClick={handleGenerate}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Try Again
          </Button>
        </Card>
      )}

      {generatedContent && (
        <div className="space-y-4">
          {/* Sentences Section */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Type className="h-4 w-4 text-blue-500" />
              <h4 className="font-medium">Cloze Test Sentences</h4>
              {generatedContent.cached.sentences && (
                <Badge variant="outline" className="text-xs">cached</Badge>
              )}
            </div>
            <div className="space-y-2">
              {generatedContent.sentences.map((sentenceObj, index) => (
                <div key={index} className="p-3 bg-muted rounded-md">
                  <p className="text-sm">{sentenceObj.sentence}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Blank at position {sentenceObj.blank_position} • Answer: {sentenceObj.correct_word}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Image Section */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="h-4 w-4 text-green-500" />
              <h4 className="font-medium">Memorable Image</h4>
              {generatedContent.cached.image && (
                <Badge variant="outline" className="text-xs">cached</Badge>
              )}
            </div>
            <div className="space-y-3">
              <div className="relative rounded-md overflow-hidden bg-muted flex items-center justify-center h-48">
                <NextImage
                  src={fallbackImageUrl ?? generatedContent.imageUrl}
                  alt={`Visual representation of ${word}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onError={() => {
                    if (!fallbackImageUrl) {
                      setFallbackImageUrl(`https://placehold.co/400x300/6366F1/FFFFFF?text=${encodeURIComponent(word)}`)
                    }
                  }}
                  unoptimized
                />
              </div>
              {generatedContent.imageDescription && (
                <p className="text-xs text-muted-foreground">
                  <strong>Description:</strong> {generatedContent.imageDescription}
                </p>
              )}
            </div>
          </Card>

          <div className="flex gap-2 pt-2">
            <Badge variant="outline" className="text-xs">
              ✨ AI Generated
            </Badge>
            <Badge variant="outline" className="text-xs">
              Ready for Study
            </Badge>
          </div>
        </div>
      )}
    </div>
  )
}
