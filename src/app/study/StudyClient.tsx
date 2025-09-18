'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StudySession } from '@/components/flashcards'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { 
  Word, 
  StudySession as StudySessionType,
  SessionType 
} from '@/types'
import { getDueWords } from '@/lib/reviews'
import { getUserWords } from '@/lib/words'
import { 
  ArrowLeft, 
  BookOpen, 
  Target, 
  Clock,
  AlertCircle 
} from 'lucide-react'

export default function StudyClient() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [words, setWords] = useState<Word[]>([])
  const [sessionType, setSessionType] = useState<SessionType>('review')
  const [showSessionSelection, setShowSessionSelection] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      loadWords()
    }
  }, [authLoading, user])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  const loadWords = async () => {
    try {
      setLoading(true)
      setError(null)

      // First try to get due words for review
      const { data: dueWords, error: dueError } = await getDueWords(20)
      
      if (dueError) {
        console.error('Error loading due words:', dueError)
      }

      if (dueWords && dueWords.length > 0) {
        setWords(dueWords)
        setSessionType('review')
      } else {
        // If no due words, get all user words for learning session
        const { data: allWords, error: allError } = await getUserWords({ limit: 10 })
        
        if (allError) {
          console.error('Error loading words:', allError)
          setError('Failed to load words')
          return
        }

        if (allWords && allWords.length > 0) {
          setWords(allWords)
          setSessionType('learn')
        } else {
          // No words exist at all
          setError('No words available. Add some words first to start studying!')
        }
      }
    } catch (error) {
      console.error('Error in loadWords:', error)
      setError('Failed to load study session')
    } finally {
      setLoading(false)
    }
  }


  const handleSessionComplete = (session: Partial<StudySessionType>) => {
    console.log('Study session completed:', session)
    // In a real implementation, this would save to the database
    router.push('/dashboard')
  }

  const handleExit = () => {
    router.push('/dashboard')
  }

  const startSession = (type: SessionType) => {
    setSessionType(type)
    setShowSessionSelection(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your study session...</p>
        </div>
      </div>
    )
  }

  if (error) {
    const needsWords = error.includes('No words available')
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Study Session Unavailable
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              {needsWords ? (
                <Button onClick={() => router.push('/dashboard/words')} className="w-full">
                  Add Words First
                </Button>
              ) : (
                <Button onClick={loadWords} className="w-full">
                  Try Again
                </Button>
              )}
              <Button variant="outline" onClick={handleExit} className="w-full">
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showSessionSelection) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExit}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Study Mode
            </h1>
            <p className="text-lg text-gray-600">
              Select how you'd like to study your {words.length} available word{words.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Session type selection */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200"
              onClick={() => startSession('review')}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Review Session</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Review flashcards using spaced repetition. Focus on words you need to practice.
                </p>
                <Badge variant="secondary" className="mb-2">
                  Recommended
                </Badge>
                <div className="text-sm text-gray-500">
                  ~ {Math.ceil(words.length * 2)} minutes
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200"
              onClick={() => startSession('learn')}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Learning Session</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Learn new words or practice all flashcards without time pressure.
                </p>
                <Badge variant="outline" className="mb-2">
                  Relaxed Mode
                </Badge>
                <div className="text-sm text-gray-500">
                  ~ {Math.ceil(words.length * 3)} minutes
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick stats */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-6 bg-white rounded-lg px-6 py-3 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{words.length}</div>
                <div className="text-sm text-gray-500">Words Ready</div>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sessionType === 'review' ? words.length : 0}
                </div>
                <div className="text-sm text-gray-500">Due Today</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show study session with focus mode
  return (
    <DashboardLayout
      user={user}
      currentPath="/study"
      title="Study Session"
      description={`${sessionType === 'review' ? 'Review' : 'Learn'} • ${words.length} words`}
      focusMode={true}
    >
      <div className="h-full p-6">
        <StudySession
          words={words}
          sessionType={sessionType}
          onSessionComplete={handleSessionComplete}
          onExit={handleExit}
        />
      </div>
    </DashboardLayout>
  )
}
