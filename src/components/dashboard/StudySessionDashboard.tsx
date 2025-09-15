'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Calendar, 
  BarChart3, 
  Settings,
  Flame,
  Target,
  Clock,
  BookOpen,
  TrendingUp
} from 'lucide-react'
import { TodaysCards } from './TodaysCards'
import { ReviewDashboard } from './ReviewDashboard'
import { StudyStreakTracker } from './StudyStreakTracker'
import { QueuedWord, generateStudySession } from '@/lib/queue-manager'
import { getActiveStudySession } from '@/lib/study-sessions'
import { StudySession } from '../flashcards/StudySession'
import { cn } from '@/lib/utils'

interface StudySessionDashboardProps {
  className?: string
}

export function StudySessionDashboard({ className }: StudySessionDashboardProps) {
  const [activeSession, setActiveSession] = useState<{
    words: QueuedWord[]
    sessionId: string
  } | null>(null)
  const [hasActiveDbSession, setHasActiveDbSession] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkForActiveSession()
  }, [])

  const checkForActiveSession = async () => {
    setIsLoading(true)
    try {
      const { data: session } = await getActiveStudySession()
      setHasActiveDbSession(!!session)
    } catch (error) {
      console.error('Failed to check active session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartSession = (words: QueuedWord[], sessionId: string) => {
    setActiveSession({ words, sessionId })
  }

  const handleSessionComplete = (sessionData: any) => {
    console.log('Session completed:', sessionData)
    setActiveSession(null)
    setHasActiveDbSession(false)
    // Refresh dashboard data by re-checking for active session
    checkForActiveSession()
  }

  const handleExitSession = () => {
    setActiveSession(null)
    checkForActiveSession()
  }

  // Quick start session function
  const handleQuickStart = async () => {
    try {
      const { words, sessionId } = await generateStudySession({
        maxWords: 20,
        studyMode: 'mixed',
        prioritizeWeakWords: true
      })
      
      if (words.length > 0) {
        handleStartSession(words, sessionId)
      }
    } catch (error) {
      console.error('Failed to start quick session:', error)
    }
  }

  // If there's an active study session, show it
  if (activeSession) {
    // Filter words that have flashcards - QueuedWord.flashcard is already FlashcardWithWord
    const flashcardsWithWords = activeSession.words
      .filter(w => w.flashcard)
      .map(w => w.flashcard!)
    
    return (
      <div className={cn("max-w-6xl mx-auto", className)}>
        <StudySession
          flashcards={flashcardsWithWords}
          sessionType="review"
          sessionId={activeSession.sessionId}
          onSessionComplete={handleSessionComplete}
          onExit={handleExitSession}
        />
      </div>
    )
  }

  return (
    <div className={cn("max-w-6xl mx-auto space-y-6", className)}>
      {/* Header with quick actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Study Session Center</h1>
              <p className="text-muted-foreground">
                Track your progress and start new study sessions
              </p>
              {hasActiveDbSession && (
                <Badge variant="destructive" className="mt-2">
                  You have an incomplete session
                </Badge>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button 
                size="lg" 
                onClick={handleQuickStart}
                className="gap-2"
                disabled={isLoading}
              >
                <Play className="w-5 h-5" />
                Quick Start
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main dashboard tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="streak">Streak</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Study streak tracker */}
            <StudyStreakTracker />
            
            {/* Quick stats and actions */}
            <div className="lg:col-span-2 space-y-6">
              <ReviewDashboard 
                onStartSession={handleStartSession}
                className="h-full"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="today" className="space-y-6">
          <TodaysCards onStartSession={handleStartSession} />
        </TabsContent>

        <TabsContent value="streak" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StudyStreakTracker className="lg:col-span-2" />
            
            {/* Additional streak insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Streak Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Target className="w-4 h-4 mt-0.5 text-blue-500" />
                    <div className="text-sm">
                      <div className="font-medium">Set a daily goal</div>
                      <div className="text-muted-foreground">
                        Even 5-10 cards per day can build a strong habit
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 mt-0.5 text-green-500" />
                    <div className="text-sm">
                      <div className="font-medium">Study at the same time</div>
                      <div className="text-muted-foreground">
                        Consistency helps form lasting habits
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-4 h-4 mt-0.5 text-purple-500" />
                    <div className="text-sm">
                      <div className="font-medium">Quality over quantity</div>
                      <div className="text-muted-foreground">
                        Focus on understanding rather than speed
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Streak Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>3 Days</span>
                    <Badge variant="secondary">Consistency Badge</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>7 Days</span>
                    <Badge variant="secondary">Weekly Champion</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>30 Days</span>
                    <Badge variant="secondary">Monthly Master</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>100 Days</span>
                    <Badge variant="secondary">Centurion Crown</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <ReviewDashboard 
            onStartSession={handleStartSession}
            className="w-full"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
