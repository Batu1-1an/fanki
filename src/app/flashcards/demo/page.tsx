'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FlashcardComponent, StudySession } from '@/components/flashcards'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FlashcardWithWord, 
  Word, 
  Flashcard, 
  FlashcardSentence,
  ReviewResult,
  StudySession as StudySessionType
} from '@/types'
import { QueuedWord } from '@/lib/queue-manager'
import { 
  Play, 
  BookOpen, 
  Target, 
  Zap,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

// Mock data for demo
const mockWords: QueuedWord[] = [
  {
    id: '1',
    user_id: 'demo-user',
    word: 'serendipity',
    definition: 'The occurrence and development of events by chance in a happy or beneficial way',
    language: 'en',
    difficulty: 4,
    category: 'Academic',
    pronunciation: 'ser-ən-ˈdi-pə-tē',
    memory_hook: 'Remember: "Serene dip" - finding something good unexpectedly',
    status: 'new',
    priority: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'demo-user',
    word: 'ephemeral',
    definition: 'Lasting for a very short time',
    language: 'en',
    difficulty: 3,
    category: 'Academic',
    pronunciation: 'ə-ˈfem-ər-əl',
    memory_hook: 'Think of "fem" (feminine) + "era" - beauty that fades with time',
    status: 'learning',
    priority: 'learning',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    user_id: 'demo-user',
    word: 'ubiquitous',
    definition: 'Present, appearing, or found everywhere',
    language: 'en',
    difficulty: 4,
    category: 'Academic',
    pronunciation: 'yo͞o-ˈbi-kwə-təs',
    memory_hook: 'You-bi-quit-us: "You be everywhere, quit following us!"',
    status: 'review',
    priority: 'due_today',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const mockFlashcards: FlashcardWithWord[] = mockWords.map((word, index) => ({
  word,
  flashcard: {
    id: `flashcard-${word.id}`,
    word_id: word.id,
    sentences: [
      {
        sentence: index === 0 
          ? "The discovery of the hidden treasure was pure _____, as they were only looking for their lost keys."
          : index === 1
          ? "The beauty of cherry blossoms is _____, lasting only a few weeks each spring."
          : "Smartphones have become _____ in modern society, found in nearly everyone's pocket.",
        blank_position: index === 0 ? 45 : index === 1 ? 28 : 22,
        correct_word: word.word
      },
      {
        sentence: index === 0
          ? "Meeting her future business partner at that coffee shop was a moment of _____ that changed her life."
          : index === 1
          ? "Social media trends are often _____, popular one day and forgotten the next."
          : "Internet access has become _____ in developed countries, available almost everywhere.",
        blank_position: index === 0 ? 71 : index === 1 ? 31 : 25,
        correct_word: word.word
      }
    ],
    image_url: null,
    audio_url: null,
    generated_at: new Date().toISOString(),
    generation_version: 1,
    is_active: true
  }
}))

export default function FlashcardDemo() {
  const [demoMode, setDemoMode] = useState<'showcase' | 'single' | 'session'>('showcase')
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [completedSession, setCompletedSession] = useState(false)

  const currentCard = mockFlashcards[currentCardIndex]

  const handleReview = (result: ReviewResult) => {
    console.log('Review submitted:', result)
    // In a real app, this would update the spaced repetition algorithm
  }

  const handleNext = () => {
    if (currentCardIndex < mockFlashcards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1)
    }
  }

  const handleSessionComplete = (session: Partial<StudySessionType>) => {
    console.log('Session completed:', session)
    setCompletedSession(true)
  }

  const resetDemo = () => {
    setCurrentCardIndex(0)
    setCompletedSession(false)
    setDemoMode('showcase')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Flashcard System Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience our AI-powered flashcard system with interactive cloze tests, 
            smooth animations, and spaced repetition learning.
          </p>
        </motion.div>

        {/* Mode Selection */}
        {demoMode === 'showcase' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Single Flashcard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Test individual flashcard with flip animations and cloze test interface.
                </p>
                <Button 
                  onClick={() => setDemoMode('single')}
                  className="w-full gap-2"
                >
                  Try Single Card
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Study Session</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Experience a complete study session with progress tracking and statistics.
                </p>
                <Button 
                  onClick={() => setDemoMode('session')}
                  className="w-full gap-2"
                >
                  Start Session
                  <Play className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-2 border-yellow-200 bg-yellow-50">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">3D Flip Animations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Interactive Cloze Tests</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Keyboard Navigation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Progress Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Responsive Design</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Single Flashcard Demo */}
        {demoMode === 'single' && currentCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setDemoMode('showcase')}>
                ← Back to Demo Menu
              </Button>
              <Badge variant="secondary">
                Card {currentCardIndex + 1} of {mockFlashcards.length}
              </Badge>
            </div>

            <FlashcardComponent
              word={currentCard.word}
              sentences={currentCard.flashcard.sentences}
              imageUrl={currentCard.flashcard.image_url}
              isGeneratingContent={false}
              onReview={handleReview}
              onNext={currentCardIndex < mockFlashcards.length - 1 ? handleNext : undefined}
              onPrevious={currentCardIndex > 0 ? handlePrevious : undefined}
              showNavigation={true}
              autoFlip={false}
            />

            <div className="text-center">
              <p className="text-muted-foreground">
                Use <kbd className="px-2 py-1 bg-muted rounded">Enter</kbd> to submit • 
                <kbd className="px-2 py-1 bg-muted rounded ml-2">Space</kbd> to show answer • 
                <kbd className="px-2 py-1 bg-muted rounded ml-2">1-4</kbd> to rate
              </p>
            </div>
          </motion.div>
        )}

        {/* Study Session Demo */}
        {demoMode === 'session' && !completedSession && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="mb-6 flex justify-between items-center">
              <Button variant="outline" onClick={() => setDemoMode('showcase')}>
                ← Back to Demo Menu
              </Button>
            </div>

            <StudySession
              words={mockWords}
              sessionType="review"
              onSessionComplete={handleSessionComplete}
              onExit={() => setDemoMode('showcase')}
            />
          </motion.div>
        )}

        {/* Session Complete */}
        {completedSession && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Demo Complete!</h2>
            <p className="text-lg text-gray-600">
              You&apos;ve successfully tested the flashcard system. Great job!
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={resetDemo} className="gap-2">
                Try Again
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                Return to App
              </Button>
            </div>
          </motion.div>
        )}

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Implementation Highlights</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <strong>Frontend:</strong> React + TypeScript + Framer Motion
                </div>
                <div>
                  <strong>Styling:</strong> Tailwind CSS + Custom 3D Transforms
                </div>
                <div>
                  <strong>Components:</strong> Modular flashcard system
                </div>
                <div>
                  <strong>Features:</strong> Cloze tests, animations, accessibility
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
