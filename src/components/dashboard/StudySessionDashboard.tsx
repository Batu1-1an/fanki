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
import { getReviewStats, getDueWordCounts, getDueWords } from '@/lib/reviews'
import { getDeskWords } from '@/lib/desks'
import { Word, Review } from '@/types'
import { cn } from '@/lib/utils'

interface StudySessionDashboardProps {
  className?: string
  activeSession?: {
    words: QueuedWord[]
    sessionId: string
  } | null
  onActiveSessionChange?: (session: {
    words: QueuedWord[]
    sessionId: string
  } | null) => void
}

interface DashboardStats {
  totalReviews: number
  todaysReviews: number
  wordsDueToday: number
  retentionRate: number
  averageEaseFactor: number
  currentStreak: number
}

interface QueueStats {
  total: number
  overdue: number
  dueToday: number
  newWords: number
  averageDifficulty: number
}

interface RecommendedMode {
  mode: any
  reasoning: string
  priority: 'high' | 'medium' | 'low'
}

// Helper: group cards by priority using UTC date-only strings
function groupCardsByPriority(cards: Array<Word & { lastReview?: Review }>) {
  const todayStr = new Date().toISOString().split('T')[0]
  const overdue: Array<Word & { lastReview?: Review }> = []
  const dueToday: Array<Word & { lastReview?: Review }> = []
  const newWords: Array<Word & { lastReview?: Review }> = []

  cards.forEach(card => {
    if (!card.lastReview) {
      newWords.push(card)
    } else {
      const dueDateStr = new Date(card.lastReview.due_date).toISOString().split('T')[0]
      if (dueDateStr < todayStr) overdue.push(card)
      else if (dueDateStr === todayStr) dueToday.push(card)
    }
  })

  return { overdue, dueToday, newWords }
}

export function StudySessionDashboard({ 
  className,
  activeSession,
  onActiveSessionChange
}: StudySessionDashboardProps) {
  const [hasActiveDbSession, setHasActiveDbSession] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Centralized dashboard state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalReviews: 0,
    todaysReviews: 0,
    wordsDueToday: 0,
    retentionRate: 0,
    averageEaseFactor: 2.5,
    currentStreak: 0
  })
  const [todaysCards, setTodaysCards] = useState<Array<Word & { lastReview?: Review }>>([])
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  
  // Centralized queue state
  const [queueStats, setQueueStats] = useState<QueueStats>({
    total: 0,
    overdue: 0,
    dueToday: 0,
    newWords: 0,
    averageDifficulty: 2.5
  })
  const [recommendedMode, setRecommendedMode] = useState<RecommendedMode>({
    mode: 'mixed',
    reasoning: 'Balanced study session recommended.',
    priority: 'low'
  })

  useEffect(() => {
    checkForActiveSession()
    loadDashboardData()
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

  // Unified dashboard data loading function (optimized with database aggregation)
  const loadDashboardData = async (deskId: string = 'all') => {
    setIsDashboardLoading(true)
    try {
      // Use optimized database functions for accurate counts without heavy payload
      const [stats, dueWordCounts] = await Promise.all([
        getReviewStats(),
        getDueWordCounts(deskId === 'all' ? undefined : deskId)
      ])

      const globalQueueStats = {
        total: dueWordCounts.totalDue,
        overdue: dueWordCounts.overdue,
        dueToday: dueWordCounts.dueToday,
        newWords: dueWordCounts.newWords,
        averageDifficulty: 2.5 // Default, could be enhanced with separate query if needed
      }

      // Also load a sample of cards for the TodaysCards component
      const { data: sampleCards } = await getDueWords(50, 'recommended')

      setDashboardStats(stats)
      setTodaysCards(sampleCards || [])
      setQueueStats(globalQueueStats)

      console.log('Dashboard data loaded:', { stats, dueWordCounts, globalQueueStats, sampleCardsCount: sampleCards?.length || 0 })

      // Derive recommendation from global stats (no longer biased by sampling)
      let rec: { mode: any; reasoning: string; priority: 'high' | 'medium' | 'low' }
      if (globalQueueStats.overdue > 10) {
        rec = { mode: 'overdue_only', reasoning: `You have ${globalQueueStats.overdue} overdue words. Focus on catching up!`, priority: 'high' }
      } else if (globalQueueStats.dueToday > 20) {
        rec = { mode: 'review_only', reasoning: `${globalQueueStats.dueToday} words are due today. Focus on reviews first.`, priority: 'medium' }
      } else if (globalQueueStats.newWords < 5) {
        rec = { mode: 'mixed', reasoning: 'Good balance of new and review words. Keep up the momentum!', priority: 'low' }
      } else {
        rec = { mode: 'mixed', reasoning: 'Balanced study session recommended.', priority: 'low' }
      }
      setRecommendedMode(rec)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsDashboardLoading(false)
    }
  }

  const handleStartSession = (words: QueuedWord[], sessionId: string) => {
    onActiveSessionChange?.({ words, sessionId })
  }

  const handleSessionComplete = (sessionData: any) => {
    console.log('Session completed:', sessionData)
    onActiveSessionChange?.(null)
    setHasActiveDbSession(false)
    // Refresh dashboard data by re-checking for active session and reloading dashboard data
    checkForActiveSession()
    loadDashboardData()
  }

  const handleExitSession = () => {
    onActiveSessionChange?.(null)
    checkForActiveSession()
    loadDashboardData()
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
    return (
      <div className={cn("max-w-6xl mx-auto", className)}>
        <StudySession
          words={activeSession.words}
          sessionType="review"
          sessionId={activeSession.sessionId}
          onSessionComplete={handleSessionComplete}
          onExit={handleExitSession}
        />
      </div>
    )
  }

  return (
    <div className={cn("max-w-6xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-6", className)}>
      {/* Header with quick actions */}
      <Card variant="premium" className="overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50/50 pointer-events-none" />
        <CardContent className="relative p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 heading-gradient">
                Study Session Center
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                Track your progress and start new study sessions
              </p>
              {hasActiveDbSession && (
                <Badge variant="destructive" className="mt-3 shadow-sm">
                  You have an incomplete session
                </Badge>
              )}
            </div>
            
            <div className="flex flex-col xs:flex-row gap-3 shrink-0">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => window.location.href = '/dashboard/words'}
                className="gap-2 hover:scale-105 transition-all duration-200 w-full xs:w-auto"
              >
                <BookOpen className="w-5 h-5" />
                <span className="xs:inline">Manage Words</span>
              </Button>
              <Button 
                variant="premium"
                size="lg" 
                onClick={handleQuickStart}
                className="gap-2 w-full xs:w-auto"
                disabled={isLoading}
              >
                <Play className="w-5 h-5" />
                <span className="xs:inline">Quick Start</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main dashboard tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 xs:grid-cols-4 w-full max-w-md mx-auto">
          <TabsTrigger value="overview" className="text-xs xs:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="today" className="text-xs xs:text-sm">Today</TabsTrigger>
          <TabsTrigger value="streak" className="text-xs xs:text-sm">Streak</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs xs:text-sm">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Study streak tracker */}
            <div className="order-2 xl:order-1">
              <StudyStreakTracker />
            </div>
            
            {/* Quick stats and actions */}
            <div className="xl:col-span-2 order-1 xl:order-2 space-y-6">
              <ReviewDashboard 
                onStartSession={handleStartSession}
                stats={dashboardStats}
                queueStats={queueStats}
                recommendedMode={recommendedMode}
                isLoading={isDashboardLoading}
                className="h-full"
                onDeskChange={async (deskId) => {
                  await loadDashboardData(deskId)
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="today" className="space-y-6">
          <TodaysCards 
            onStartSession={handleStartSession} 
            cards={todaysCards}
            isLoading={isDashboardLoading}
          />
        </TabsContent>

        <TabsContent value="streak" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StudyStreakTracker className="col-span-1 lg:col-span-2" />
            
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
            stats={dashboardStats}
            queueStats={queueStats}
            recommendedMode={recommendedMode}
            isLoading={isDashboardLoading}
            className="w-full"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
