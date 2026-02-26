'use client'

import React from 'react'
import { QueuedCard, ReviewResult, Word } from '@/types'
import { FlashcardComponent } from '@/components/flashcards/FlashcardComponent'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface CardRendererProps {
  card: QueuedCard
  onReview: (result: ReviewResult) => void
  onNext?: () => void
  onPrevious?: () => void
  showNavigation?: boolean
  isGeneratingContent?: boolean
  contentGenerationError?: string | null
  onRegenerateContent?: () => void
  onWordUpdated?: (updatedWord: Word) => void
  isInteractionDisabled?: boolean
  className?: string
}

/**
 * CardRenderer - Dispatches card rendering based on template type
 * 
 * This component analyzes the card's templateSlug and noteTypeSlug
 * to determine the appropriate rendering strategy.
 */
export function CardRenderer({
  card,
  onReview,
  onNext,
  onPrevious,
  showNavigation = false,
  isGeneratingContent = false,
  contentGenerationError = null,
  onRegenerateContent,
  onWordUpdated,
  isInteractionDisabled = false,
  className
}: CardRendererProps) {
  
  // Extract card data for rendering
  const { templateSlug, noteTypeSlug, renderPayload, fields, word } = card

  // Determine rendering strategy based on template
  switch (templateSlug) {
    case 'forward':
      // Basic forward card (word → definition)
      return renderBasicCard(card, {
        onReview,
        onNext,
        onPrevious,
        showNavigation,
        isGeneratingContent,
        contentGenerationError,
        onRegenerateContent,
        onWordUpdated,
        isInteractionDisabled,
        className
      })

    case 'reverse':
      // Reverse card (definition → word)
      return renderReverseCard(card, {
        onReview,
        onNext,
        onPrevious,
        showNavigation,
        isGeneratingContent,
        contentGenerationError,
        onRegenerateContent,
        onWordUpdated,
        isInteractionDisabled,
        className
      })

    case 'cloze':
      // Cloze deletion card
      return renderClozeCard(card, {
        onReview,
        onNext,
        onPrevious,
        showNavigation,
        isGeneratingContent,
        contentGenerationError,
        onRegenerateContent,
        onWordUpdated,
        isInteractionDisabled,
        className
      })

    case 'typing':
      // Typing answer card
      return renderTypingCard(card, {
        onReview,
        onNext,
        onPrevious,
        showNavigation,
        isGeneratingContent,
        contentGenerationError,
        onRegenerateContent,
        onWordUpdated,
        isInteractionDisabled,
        className
      })

    case 'mask':
      // Image occlusion card
      return renderImageOcclusionCard(card, {
        onReview,
        onNext,
        onPrevious,
        showNavigation,
        isGeneratingContent,
        contentGenerationError,
        onRegenerateContent,
        onWordUpdated,
        isInteractionDisabled,
        className
      })

    default:
      // Fallback for unknown card types
      return (
        <Alert variant="destructive" className={className}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unknown card template: {templateSlug}
            <br />
            <small>Note Type: {noteTypeSlug}</small>
          </AlertDescription>
        </Alert>
      )
  }
}

/**
 * Render basic forward card (front → back)
 */
function renderBasicCard(card: QueuedCard, props: Omit<CardRendererProps, 'card'>) {
  const { renderPayload, fields, word } = card
  
  // Extract display data from renderPayload or fields
  const wordText = (renderPayload as any)?.word || (fields as any)?.front || word?.word || 'Unknown'
  const definition = (renderPayload as any)?.definition || (fields as any)?.back || word?.definition || ''
  const pronunciation = (renderPayload as any)?.pronunciation || (fields as any)?.extra || word?.pronunciation || ''
  const imageUrl = (renderPayload as any)?.image_url || card.imageUrl || null
  const imageDescription = (renderPayload as any)?.image_description || card.imageDescription || null
  const sentences = (renderPayload as any)?.sentences || card.sentences || null

  // Create Word object for FlashcardComponent
  const wordObj: Word = word ? {
    id: word.id || card.cardId,
    user_id: '', // Will be populated by component
    word: word.word || wordText,
    definition: word.definition || definition,
    language: 'en',
    difficulty: word.difficulty || 3,
    category: null,
    pronunciation: word.pronunciation || pronunciation,
    status: 'review',
    created_at: word.createdAt || new Date().toISOString(),
    updated_at: word.updatedAt || new Date().toISOString(),
    memory_hook: null
  } : {
    id: card.cardId,
    user_id: '',
    word: wordText,
    definition,
    language: 'en',
    difficulty: 3,
    category: null,
    pronunciation,
    status: 'review',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    memory_hook: null
  }

  return (
    <FlashcardComponent
      word={wordObj}
      sentences={sentences}
      imageUrl={imageUrl}
      imageDescription={imageDescription}
      isGeneratingContent={props.isGeneratingContent || false}
      contentGenerationError={props.contentGenerationError}
      onRegenerateContent={props.onRegenerateContent}
      onReview={props.onReview}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
      showNavigation={props.showNavigation}
      onWordUpdated={props.onWordUpdated}
      isInteractionDisabled={props.isInteractionDisabled}
      className={props.className}
    />
  )
}

/**
 * Render reverse card (back → front)
 * TODO: Implement dedicated reverse card component
 */
function renderReverseCard(card: QueuedCard, props: Omit<CardRendererProps, 'card'>) {
  // For now, use basic card but swap front/back
  // TODO: Create ReverseCardView component with proper UX
  
  const { renderPayload, fields, word } = card
  
  // Swap front and back for reverse cards
  const wordText = (renderPayload as any)?.definition || (fields as any)?.back || word?.definition || 'Unknown'
  const definition = (renderPayload as any)?.word || (fields as any)?.front || word?.word || ''
  
  const wordObj: Word = word ? {
    id: word.id || card.cardId,
    user_id: '',
    word: wordText, // Showing definition as question
    definition, // Showing word as answer
    language: 'en',
    difficulty: word.difficulty || 3,
    category: null,
    pronunciation: '',
    status: 'review',
    created_at: word.createdAt || new Date().toISOString(),
    updated_at: word.updatedAt || new Date().toISOString(),
    memory_hook: null
  } : {
    id: card.cardId,
    user_id: '',
    word: wordText,
    definition,
    language: 'en',
    difficulty: 3,
    category: null,
    pronunciation: '',
    status: 'review',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    memory_hook: null
  }

  return (
    <div className={props.className}>
      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">Reverse</span>
        Definition → Word
      </div>
      <FlashcardComponent
        word={wordObj}
        sentences={null}
        imageUrl={null}
        imageDescription={null}
        isGeneratingContent={false}
        onReview={props.onReview}
        onNext={props.onNext}
        onPrevious={props.onPrevious}
        showNavigation={props.showNavigation}
        onWordUpdated={props.onWordUpdated}
        isInteractionDisabled={props.isInteractionDisabled}
      />
    </div>
  )
}

/**
 * Render cloze deletion card
 * TODO: Implement dedicated cloze card component
 */
function renderClozeCard(card: QueuedCard, props: Omit<CardRendererProps, 'card'>) {
  // For now, use basic card with cloze data
  // TODO: Create ClozeCardView component with proper cloze UI
  
  const { renderPayload, fields, word } = card
  const sentences = (renderPayload as any)?.sentences || (fields as any)?.text || []
  
  const wordText = word?.word || 'Cloze Card'
  const definition = word?.definition || (fields as any)?.extra || ''

  const wordObj: Word = word ? {
    id: word.id || card.cardId,
    user_id: '',
    word: wordText,
    definition,
    language: 'en',
    difficulty: word.difficulty || 3,
    category: null,
    pronunciation: '',
    status: 'review',
    created_at: word.createdAt || new Date().toISOString(),
    updated_at: word.updatedAt || new Date().toISOString(),
    memory_hook: null
  } : {
    id: card.cardId,
    user_id: '',
    word: wordText,
    definition,
    language: 'en',
    difficulty: 3,
    category: null,
    pronunciation: '',
    status: 'review',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    memory_hook: null
  }

  return (
    <div className={props.className}>
      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Cloze</span>
        Fill in the blank
      </div>
      <FlashcardComponent
        word={wordObj}
        sentences={sentences}
        imageUrl={null}
        imageDescription={null}
        isGeneratingContent={false}
        onReview={props.onReview}
        onNext={props.onNext}
        onPrevious={props.onPrevious}
        showNavigation={props.showNavigation}
        onWordUpdated={props.onWordUpdated}
        isInteractionDisabled={props.isInteractionDisabled}
      />
    </div>
  )
}

/**
 * Render typing answer card
 * TODO: Implement dedicated typing card component
 */
function renderTypingCard(card: QueuedCard, props: Omit<CardRendererProps, 'card'>) {
  // TODO: Create TypingCardView component with input validation
  return (
    <Alert className={props.className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Typing card rendering not yet implemented.
        <br />
        <small>Card ID: {card.cardId}</small>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Render image occlusion card
 * TODO: Implement dedicated image occlusion component
 */
function renderImageOcclusionCard(card: QueuedCard, props: Omit<CardRendererProps, 'card'>) {
  // TODO: Create ImageOcclusionCardView component
  return (
    <Alert className={props.className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Image occlusion card rendering not yet implemented.
        <br />
        <small>Card ID: {card.cardId}</small>
      </AlertDescription>
    </Alert>
  )
}
