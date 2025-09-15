'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  Brain, 
  Zap,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { getReviewStats } from '@/lib/reviews'
import { getQueueManager, getRecommendedStudyMode, generateStudySession } from '@/lib/queue-manager'
import { formatInterval } from '@/utils/sm2'
import { cn } from '@/lib/utils'

interface ReviewDashboardProps {
  onStartSession: (words: any[], sessionId: string) => void
  className?: string
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

export function ReviewDashboard({ onStartSession, className }: ReviewDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalReviews: 0,
    todaysReviews: 0,
    wordsDueToday: 0,
    retentionRate: 0,
    averageEaseFactor: 2.5,
    currentStreak: 0
  })
  const [queueStats, setQueueStats] = useState<QueueStats>({
    total: 0,
    overdue: 0,
    dueToday: 0,
    newWords: 0,
    averageDifficulty: 2.5
  })
  const [recommendedMode, setRecommendedMode] = useState<{
    mode: any
    reasoning: string
    priority: 'high' | 'medium' | 'low'
  }>({
    mode: 'mixed',
    reasoning: 'Balanced study session recommended.',
    priority: 'low'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isStartingSession, setIsStartingSession] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load review statistics
      const reviewStats = await getReviewStats()
      setStats(reviewStats)

      // Load queue statistics
      const queueManager = getQueueManager()
      const { stats: queueData } = await queueManager.generateQueue({ maxWords: 100 })
      setQueueStats(queueData)

      // Load recommended study mode
      const recommendation = await getRecommendedStudyMode()
      setRecommendedMode(recommendation)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartSession = async (mode: any = recommendedMode.mode, maxWords: number = 20) => {
    setIsStartingSession(true)
    try {
      const { words, sessionId } = await generateStudySession({
        maxWords,
        studyMode: mode,
        prioritizeWeakWords: true
      })

      if (words.length > 0) {
        onStartSession(words, sessionId)
      } else {
        // Handle no words available
        console.log('No words available for study session')
      }
    } catch (error) {
      console.error('Failed to start session:', error)
    } finally {
      setIsStartingSession(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getDifficultyLabel = (easeFactor: number) => {
    if (easeFactor >= 2.5) return { label: 'Easy', color: 'text-green-600' }
    if (easeFactor >= 2.0) return { label: 'Medium', color: 'text-yellow-600' }
    if (easeFactor >= 1.5) return { label: 'Hard', color: 'text-orange-600' }
    return { label: 'Very Hard', color: 'text-red-600' }
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const difficultyInfo = getDifficultyLabel(stats.averageEaseFactor)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{stats.wordsDueToday}</div>
            <div className="text-sm text-muted-foreground">Due Today</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{stats.todaysReviews}</div>
            <div className="text-sm text-muted-foreground">Reviewed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{stats.retentionRate}%</div>
            <div className="text-sm text-muted-foreground">Retention</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Brain className={`w-6 h-6 mx-auto mb-2 ${difficultyInfo.color}`} />
            <div className="text-2xl font-bold">{stats.averageEaseFactor}</div>
            <div className="text-sm text-muted-foreground">{difficultyInfo.label}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <div className="text-sm text-muted-foreground">Total Reviews</div>
          </CardContent>
        </Card>
      </div>

      {/* Study Recommendation */}
      <Card className={cn("border-2", getPriorityColor(recommendedMode.priority))}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Study Recommendation
            </CardTitle>
            <Badge variant="outline" className={getPriorityColor(recommendedMode.priority)}>
              {recommendedMode.priority} priority
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{recommendedMode.reasoning}</p>
          <div className="flex gap-3">
            <Button
              onClick={() => handleStartSession(recommendedMode.mode)}
              disabled={isStartingSession}
              size="lg"
              className="flex-1"
            >
              {isStartingSession ? 'Starting...' : 'Start Recommended Session'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStartSession('mixed', 10)}
              disabled={isStartingSession}
            >
              Quick Review (10 cards)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="queue">Review Queue</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="settings">Study Options</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Queue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{queueStats.overdue}</div>
                  <div className="text-sm text-muted-foreground">Overdue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{queueStats.dueToday}</div>
                  <div className="text-sm text-muted-foreground">Due Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{queueStats.newWords}</div>
                  <div className="text-sm text-muted-foreground">New Words</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{queueStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Available</div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => handleStartSession('overdue_only')}
                  disabled={queueStats.overdue === 0 || isStartingSession}
                  variant={queueStats.overdue > 0 ? "destructive" : "outline"}
                  className="w-full justify-between"
                >
                  <span>Focus on Overdue Cards</span>
                  <Badge variant="secondary">{queueStats.overdue}</Badge>
                </Button>

                <Button
                  onClick={() => handleStartSession('review_only')}
                  disabled={queueStats.dueToday === 0 || isStartingSession}
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span>Review Due Cards</span>
                  <Badge variant="secondary">{queueStats.dueToday}</Badge>
                </Button>

                <Button
                  onClick={() => handleStartSession('new_only')}
                  disabled={queueStats.newWords === 0 || isStartingSession}
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span>Learn New Words</span>
                  <Badge variant="secondary">{queueStats.newWords}</Badge>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Retention Rate</span>
                  <span>{stats.retentionRate}%</span>
                </div>
                <Progress value={stats.retentionRate} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Average Ease Factor</span>
                  <span>{stats.averageEaseFactor}</span>
                </div>
                <Progress value={(stats.averageEaseFactor - 1.3) / (3.0 - 1.3) * 100} className="h-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-lg font-semibold">{stats.currentStreak}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-lg font-semibold">{stats.totalReviews}</div>
                  <div className="text-sm text-muted-foreground">Total Reviews</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Study Session Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => handleStartSession('mixed', 15)}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  disabled={isStartingSession}
                >
                  <span className="font-semibold">Balanced Session</span>
                  <span className="text-sm text-muted-foreground">15 mixed cards</span>
                </Button>

                <Button
                  onClick={() => handleStartSession('mixed', 30)}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  disabled={isStartingSession}
                >
                  <span className="font-semibold">Extended Session</span>
                  <span className="text-sm text-muted-foreground">30 mixed cards</span>
                </Button>

                <Button
                  onClick={() => handleStartSession('mixed', 5)}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  disabled={isStartingSession}
                >
                  <span className="font-semibold">Quick Session</span>
                  <span className="text-sm text-muted-foreground">5 cards only</span>
                </Button>

                <Button
                  onClick={loadDashboardData}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                >
                  <span className="font-semibold">Refresh Data</span>
                  <span className="text-sm text-muted-foreground">Update statistics</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ReviewDashboard
