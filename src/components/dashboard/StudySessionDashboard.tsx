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
  Flame,
  Target,
  Clock,
  BookOpen,
  TrendingUp,
  Activity,
  ArrowUpRight,
  LineChart,
  PieChart,
  Sparkles
} from 'lucide-react'
import { TodaysCards } from './TodaysCards'
import { ReviewDashboard } from './ReviewDashboard'
import { StudyStreakTracker } from './StudyStreakTracker'
import { QueuedWord, generateStudySession } from '@/lib/queue-manager'
import { 
  getActiveStudySession, 
  getStudySessionHistory, 
  getStudySessionStats 
} from '@/lib/study-sessions'
import { StudySession } from '../flashcards/StudySession'
import { getDueWords } from '@/lib/reviews'
import { Word, Review } from '@/types'
import { cn } from '@/lib/utils'
import { ExtendedStudySession, SessionStatus } from '@/types/study-sessions'
import { Skeleton } from '@/components/ui/skeleton'
import { loadDashboardData, refreshQueueStats, refreshSessionHistory } from '@/lib/dashboard-data'
import { classifyDueDate } from '@/lib/date-utils'

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
  userId: string
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

interface SessionStats {
  totalSessions: number
  completedSessions: number
  totalTimeMinutes: number
  averageAccuracy: number
  totalWordsStudied: number
  currentStreak: number
  longestStreak: number
}

// Helper: group cards by priority using UTC date-only strings
function groupCardsByPriority(cards: Array<Word & { lastReview?: Review }>) {
  const overdue: Array<Word & { lastReview?: Review }> = []
  const dueToday: Array<Word & { lastReview?: Review }> = []
  const newWords: Array<Word & { lastReview?: Review }> = []

  cards.forEach(card => {
    if (!card.lastReview) {
      newWords.push(card)
    } else if (card.lastReview.due_date) {
      const dueClassification = classifyDueDate(card.lastReview.due_date)
      if (dueClassification === 'overdue') overdue.push(card)
      else if (dueClassification === 'due_today') dueToday.push(card)
    }
  })

  return { overdue, dueToday, newWords }
}

export function StudySessionDashboard({ 
  className,
  activeSession,
  onActiveSessionChange,
  userId
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
  const [selectedDeskId, setSelectedDeskId] = useState<string>('all')
  
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
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalSessions: 0,
    completedSessions: 0,
    totalTimeMinutes: 0,
    averageAccuracy: 0,
    totalWordsStudied: 0,
    currentStreak: 0,
    longestStreak: 0
  })
  const [recentSessions, setRecentSessions] = useState<ExtendedStudySession[]>([])
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  useEffect(() => {
    checkForActiveSession()
    loadDashboardDataOptimized()
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

  // Optimized dashboard data loading function
  const loadDashboardDataOptimized = async (deskId: string = selectedDeskId) => {
    setIsDashboardLoading(true)
    setDashboardError(null)
    try {
      setSelectedDeskId(deskId)
      // Use the new optimized data loader
      const dashboardData = await loadDashboardData(deskId)

      // Update all state from the optimized result
      setDashboardStats(dashboardData.dashboardStats)
      setQueueStats(dashboardData.queueStats)
      setSessionStats(dashboardData.sessionStats)
      setRecommendedMode(dashboardData.recommendedMode)
      setRecentSessions(dashboardData.recentSessions)

      // Load a sample of cards for the TodaysCards component
      const deskFilter = deskId && deskId !== 'all' ? deskId : undefined
      const { data: sampleCards } = await getDueWords(50, 'recommended', deskFilter)
      setTodaysCards(sampleCards || [])

      console.log('Optimized dashboard data loaded:', {
        loadTime: Date.now() - dashboardData.timestamp,
        stats: dashboardData.dashboardStats,
        queueStats: dashboardData.queueStats
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setDashboardError('We could not refresh your dashboard data. Please try again.')
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
    loadDashboardDataOptimized(selectedDeskId)
  }

  const handleExitSession = () => {
    onActiveSessionChange?.(null)
    checkForActiveSession()
    loadDashboardDataOptimized(selectedDeskId)
  }

  // Quick start session function
  const handleQuickStart = async () => {
    try {
      const { words, sessionId } = await generateStudySession({
        maxWords: 20,
        studyMode: 'mixed',
        prioritizeWeakWords: true,
        deskId: selectedDeskId
      })
      
      if (words.length > 0) {
        handleStartSession(words, sessionId)
      }
    } catch (error) {
      console.error('Failed to start quick session:', error)
    }
  }

  const formatNumber = (value: number) => value.toLocaleString()

  const formatDuration = (seconds?: number | null) => {
    if (!seconds || seconds <= 0) return '<1 min'
    const minutes = seconds / 60
    if (minutes >= 60) {
      const hours = minutes / 60
      return `${hours >= 10 ? Math.round(hours) : hours.toFixed(1)} hrs`
    }
    return `${Math.max(1, Math.round(minutes))} min`
  }

  const formatSessionDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Unknown date'
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(new Date(dateStr))
    } catch (error) {
      console.error('Failed to format session date:', error)
      return 'Unknown date'
    }
  }

  const formatSessionTime = (dateStr?: string | null) => {
    if (!dateStr) return ''
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      }).format(new Date(dateStr))
    } catch (error) {
      return ''
    }
  }

  const getStatusBadgeClasses = (status: SessionStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'active':
        return 'bg-sky-100 text-sky-700 border-sky-200'
      case 'paused':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'abandoned':
        return 'bg-rose-100 text-rose-700 border-rose-200'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const averageSessionLength = sessionStats.completedSessions > 0
    ? Math.round(sessionStats.totalWordsStudied / sessionStats.completedSessions)
    : 0

  const totalTimeDisplay = sessionStats.totalTimeMinutes >= 60
    ? `${(sessionStats.totalTimeMinutes / 60).toFixed(1)} hrs`
    : `${Math.round(sessionStats.totalTimeMinutes)} min`

  const queueTotal = Math.max(queueStats.total, queueStats.overdue + queueStats.dueToday + queueStats.newWords, 1)
  const queueSegments = [
    {
      key: 'overdue',
      label: 'Overdue',
      value: queueStats.overdue,
      color: 'bg-rose-500'
    },
    {
      key: 'dueToday',
      label: 'Due Today',
      value: queueStats.dueToday,
      color: 'bg-amber-400'
    },
    {
      key: 'newWords',
      label: 'New Words',
      value: queueStats.newWords,
      color: 'bg-blue-500'
    }
  ]

  const completedSessionsSparkline = recentSessions
    .filter(session => session.status === 'completed' && typeof session.accuracy_percentage === 'number')
    .slice(0, 10)
    .reverse()

  const retentionRate = Math.min(100, Math.max(0, dashboardStats.retentionRate))
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)
  const sessionsThisWeek = recentSessions.filter(session => {
    if (!session.created_at) {
      return false
    }

    const createdAt = new Date(session.created_at)
    return createdAt >= weekStart
  }).length

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
          userId={userId}
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
        {dashboardError && (
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-red-600">{dashboardError}</p>
              <Button variant="outline" size="sm" onClick={() => loadDashboardDataOptimized(selectedDeskId)}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

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
                  await loadDashboardDataOptimized(deskId)
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
          {isDashboardLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(item => (
                <Card key={`analytics-skeleton-${item}`} className="border-dashed">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-4 w-1/3" shimmer />
                    <Skeleton className="h-10 w-2/3" shimmer />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    Analytics Control Center
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    A detailed view of your learning efficiency, retention, and study momentum
                  </p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1 text-xs uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Longest streak: {sessionStats.longestStreak} days
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card variant="glass" className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-indigo-500/0" />
                  <CardContent className="relative p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Retention</span>
                      <div className="rounded-full bg-indigo-100 text-indigo-600 p-2">
                        <PieChart className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-semibold">{retentionRate}%</span>
                      <span className="text-xs text-muted-foreground mb-1">memory strength</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-indigo-100 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${retentionRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Consistency keeps your cards fresh. Aim to stay above 80%.
                    </p>
                  </CardContent>
                </Card>

                <Card variant="glass" className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-500/0" />
                  <CardContent className="relative p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Accuracy</span>
                      <div className="rounded-full bg-emerald-100 text-emerald-600 p-2">
                        <Activity className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-semibold">{Math.round(sessionStats.averageAccuracy)}%</span>
                      <span className="text-xs text-muted-foreground mb-1">average per session</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Keep accuracy above 70% to unlock longer review intervals.
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                      <ArrowUpRight className="w-4 h-4" />
                      {dashboardStats.todaysReviews} reviews logged today
                    </div>
                  </CardContent>
                </Card>

                <Card variant="glass" className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-sky-500/0" />
                  <CardContent className="relative p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Words Studied</span>
                      <div className="rounded-full bg-sky-100 text-sky-600 p-2">
                        <BookOpen className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-semibold">{formatNumber(sessionStats.totalWordsStudied)}</span>
                      <span className="text-xs text-muted-foreground mb-1">lifetime</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average session covers {averageSessionLength || 0} cards.
                    </p>
                    <Badge variant="outline" className="w-fit text-xs uppercase tracking-wide">
                      {sessionStats.completedSessions} completed sessions
                    </Badge>
                  </CardContent>
                </Card>

                <Card variant="glass" className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-500/0" />
                  <CardContent className="relative p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Time Invested</span>
                      <div className="rounded-full bg-amber-100 text-amber-600 p-2">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-semibold">{totalTimeDisplay}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sessions completed in the past 30 days drive your current streak of {sessionStats.currentStreak} days.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                      <Flame className="w-4 h-4" />
                      Longest focus run: {sessionStats.longestStreak} days
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 h-full">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <LineChart className="w-5 h-5 text-indigo-500" />
                      Performance Trends
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Accuracy per session highlights how well you retain new information.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-muted/40 rounded-xl p-4">
                      <div className="flex items-end gap-2 h-36">
                        {completedSessionsSparkline.length > 0 ? (
                          completedSessionsSparkline.map((session, index) => {
                            const accuracy = Math.max(0, Math.min(100, session.accuracy_percentage || 0))
                            return (
                              <div
                                key={`${session.id}-spark-${index}`}
                                className="flex-1 rounded-t-lg bg-gradient-to-t from-indigo-200 via-indigo-300 to-indigo-500 transition-all"
                                style={{ height: `${Math.max(8, accuracy)}%` }}
                                title={`Accuracy ${accuracy}% on ${formatSessionDate(session.created_at)} at ${formatSessionTime(session.created_at)}`}
                              />
                            )
                          })
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                            Complete a session to unlock trend insights.
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Oldest</span>
                        <span>Newest</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border bg-card/50 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Target className="w-4 h-4 text-purple-500" />
                          Today&apos;s Reviews
                        </div>
                        <div className="text-2xl font-semibold">{dashboardStats.todaysReviews}</div>
                        <p className="text-xs text-muted-foreground">
                          Combine consistent reviews with new words for steady growth.
                        </p>
                      </div>
                      <div className="p-4 rounded-lg border bg-card/50 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="w-4 h-4 text-sky-500" />
                          Sessions this week
                        </div>
                        <div className="text-2xl font-semibold">{sessionsThisWeek}</div>
                        <p className="text-xs text-muted-foreground">
                          Aim for at least 5 focused sessions each week to maintain momentum.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="h-full">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <PieChart className="w-5 h-5 text-indigo-500" />
                      Retention Snapshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-6">
                    <div className="relative h-32 w-32">
                      <div className="absolute inset-0 rounded-full bg-muted" />
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(#6366f1 ${retentionRate * 3.6}deg, #E5E7EB 0deg)`
                        }}
                      />
                      <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center">
                        <span className="text-2xl font-semibold">{retentionRate}%</span>
                        <span className="text-xs text-muted-foreground">Retention</span>
                      </div>
                    </div>
                    <div className="space-y-3 w-full text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-muted-foreground">Strong grasp of reviewed cards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-400" />
                        <span className="text-muted-foreground">Revisit difficult words tagged as hard</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-muted-foreground">Keep daily reviews above 20 to stabilize streaks</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="xl:col-span-1">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <BarChart3 className="w-5 h-5 text-amber-500" />
                      Queue Focus Forecast
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Prioritize the right mix of overdue, due, and new cards.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="h-3 rounded-full bg-muted flex overflow-hidden">
                      {queueSegments.map(segment => (
                        <div
                          key={segment.key}
                          className={`${segment.color} transition-all duration-500`}
                          style={{ width: `${(segment.value / queueTotal) * 100}%` }}
                          title={`${segment.label}: ${segment.value}`}
                        />
                      ))}
                    </div>
                    <div className="space-y-3">
                      {queueSegments.map(segment => (
                        <div key={segment.key} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${segment.color}`} />
                            <span>{segment.label}</span>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span>{segment.value}</span>
                            <span className="text-xs">
                              {Math.round((segment.value / queueTotal) * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                      <span>Total available cards</span>
                      <span>{queueStats.total}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="xl:col-span-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <LineChart className="w-5 h-5 text-sky-500" />
                      Recent Sessions Timeline
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Track how each session contributed to your streak and mastery.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {recentSessions.length === 0 ? (
                      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                        Launch a study session to populate your timeline.
                      </div>
                    ) : (
                      <div className="relative pl-5">
                        <div className="absolute left-1 top-0 bottom-0 w-px bg-muted" />
                        <div className="space-y-6">
                          {recentSessions.slice(0, 6).map((session, index) => (
                            <div key={`${session.id}-${index}`} className="relative pl-5">
                              <div className="absolute left-0 top-2 w-3 h-3 rounded-full border-2 border-white bg-indigo-500 shadow" />
                              <div className="flex flex-col gap-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="text-sm font-medium">
                                    {formatSessionDate(session.created_at)} <span className="text-muted-foreground">{formatSessionTime(session.created_at)}</span>
                                  </div>
                                  <Badge variant="outline" className={cn('text-xs capitalize', getStatusBadgeClasses((session.status || 'active') as SessionStatus))}>
                                    {session.status || 'active'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
                                  <div>
                                    <div className="font-medium text-foreground">{session.words_studied || 0}</div>
                                    <div>Words studied</div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-foreground">{session.total_reviews || 0}</div>
                                    <div>Total reviews</div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-foreground">{session.accuracy_percentage ? `${Math.round(session.accuracy_percentage)}%` : '—'}</div>
                                    <div>Accuracy</div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-foreground">{formatDuration(session.session_duration_seconds)}</div>
                                    <div>Duration</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
