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
import { QueuedWord, generateStudySession, getQueueManager, getRecommendedStudyMode } from '@/lib/queue-manager'
import { getActiveStudySession } from '@/lib/study-sessions'
import { StudySession } from '../flashcards/StudySession'
import { getReviewStats, getDueWords } from '@/lib/reviews'
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

  // Unified dashboard data loading function
  const loadDashboardData = async () => {
    setIsDashboardLoading(true)
    try {
      const queueManager = getQueueManager()
      const [stats, dueWordsData, queueData, recommendation] = await Promise.all([
        getReviewStats(),
        getDueWords(100),
        queueManager.generateQueue({ maxWords: 100 }),
        getRecommendedStudyMode()
      ])
      setDashboardStats(stats)
      setTodaysCards(dueWordsData.data || [])
      setQueueStats(queueData.stats)
      setRecommendedMode(recommendation)
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
    <div className={cn("max-w-6xl mx-auto space-y-6", className)}>
      {/* Header with quick actions */}
      <Card variant="premium" className="overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50/50 pointer-events-none" />
        <CardContent className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 heading-gradient">
                Study Session Center
              </h1>
              <p className="text-muted-foreground text-lg">
                Track your progress and start new study sessions
              </p>
              {hasActiveDbSession && (
                <Badge variant="destructive" className="mt-3 shadow-sm">
                  You have an incomplete session
                </Badge>
              )}
            </div>
            
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => window.location.href = '/dashboard/words'}
                className="gap-2 hover:scale-105 transition-all duration-200"
              >
                <BookOpen className="w-5 h-5" />
                Manage Words
              </Button>
              <Button 
                variant="premium"
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
                stats={dashboardStats}
                queueStats={queueStats}
                recommendedMode={recommendedMode}
                isLoading={isDashboardLoading}
                className="h-full"
                onDeskChange={async (deskId) => {
                  try {
                    const queueManager = getQueueManager()
                    const options = deskId && deskId !== 'all' ? { maxWords: 100, deskId } : { maxWords: 100 }
                    const { stats: qs } = await queueManager.generateQueue(options)
                    setQueueStats(qs)

                    // Derive recommendation from desk-specific stats
                    let rec: { mode: any; reasoning: string; priority: 'high' | 'medium' | 'low' }
                    if (qs.overdue > 10) {
                      rec = { mode: 'overdue_only', reasoning: `You have ${qs.overdue} overdue words. Focus on catching up!`, priority: 'high' }
                    } else if (qs.dueToday > 20) {
                      rec = { mode: 'review_only', reasoning: `${qs.dueToday} words are due today. Focus on reviews first.`, priority: 'medium' }
                    } else if (qs.newWords < 5) {
                      rec = { mode: 'mixed', reasoning: 'Good balance of new and review words. Keep up the momentum!', priority: 'low' }
                    } else {
                      rec = { mode: 'mixed', reasoning: 'Balanced study session recommended.', priority: 'low' }
                    }
                    setRecommendedMode(rec)
                  } catch (e) {
                    console.error('Failed to refresh queue for desk', e)
                  }
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
