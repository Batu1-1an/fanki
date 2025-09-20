'use client'

import { useState, useEffect } from 'react'
import { generateStudySession, getRecommendedStudyMode } from '@/lib/queue-manager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { StudySessionLoader } from '@/components/ui/StudySessionLoader'
import { 
  Calendar, 
  Clock, 
  Target, 
  Brain, 
  Zap,
  BookOpen,
  Award,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUserDesks, Desk } from '@/lib/desks'

interface ReviewDashboardProps {
  onStartSession: (words: any[], sessionId: string) => void
  stats: DashboardStats
  queueStats: QueueStats
  recommendedMode: RecommendedMode
  isLoading: boolean
  className?: string
  onDeskChange?: (deskId: string) => void
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

export function ReviewDashboard({ 
  onStartSession, 
  stats,
  queueStats,
  recommendedMode,
  isLoading, 
  className,
  onDeskChange
}: ReviewDashboardProps) {
  const [desks, setDesks] = useState<Desk[]>([])
  const [selectedDeskId, setSelectedDeskId] = useState<string>('all')
  const [isStartingSession, setIsStartingSession] = useState(false)
  const [sortOrder, setSortOrder] = useState<'recommended' | 'oldest' | 'easiest' | 'hardest'>('recommended')

  useEffect(() => {
    loadDesks()
  }, [])

  useEffect(() => {
    // This component no longer fetches queue stats, but we might 
    // want to perform actions when the selected desk changes in the future.
  }, [selectedDeskId])

  const loadDesks = async () => {
    try {
      const { data: userDesks } = await getUserDesks()
      if (userDesks) {
        setDesks(userDesks)
      }
    } catch (error) {
      console.error('Failed to load desks:', error)
    }
  }

  const handleStartSession = async (mode: any = recommendedMode.mode, maxWords: number = 20) => {
    setIsStartingSession(true)
    try {
      const options: any = {
        maxWords,
        studyMode: mode,
        prioritizeWeakWords: true,
        sortOrder: sortOrder // RFC-006: Pass selected sort order
      }

      // Add desk filter if specific desk is selected
      if (selectedDeskId && selectedDeskId !== 'all') {
        options.deskId = selectedDeskId
      }

      const { words, sessionId } = await generateStudySession(options)

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

  const getSelectedDeskInfo = () => {
    if (!selectedDeskId || selectedDeskId === 'all') return null
    return desks.find(desk => desk.id === selectedDeskId)
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
            <div className="text-sm text-muted-foreground">Study Streak</div>
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

      {/* Deck Selection (shown only when a deck change handler is provided) */}
      {onDeskChange && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Study Deck Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Choose a deck to study:</label>
                <Select value={selectedDeskId} onValueChange={(v) => { setSelectedDeskId(v); onDeskChange?.(v) }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All decks (default)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        All Desks
                      </div>
                    </SelectItem>
                    {desks.map(desk => (
                      <SelectItem key={desk.id} value={desk.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: desk.color }} />
                          {desk.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {getSelectedDeskInfo() && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getSelectedDeskInfo()!.color || '#808080' }} 
                    />
                    <span className="font-medium">{getSelectedDeskInfo()!.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Studying from: {getSelectedDeskInfo()!.description || 'Selected deck'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
          <p className="text-muted-foreground mb-4">
            {recommendedMode.reasoning}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => handleStartSession(recommendedMode.mode)}
              disabled={isStartingSession || queueStats.total === 0}
              size="lg"
              className="flex-1"
            >
              {isStartingSession ? 'Preparing Your Session...' : 'Start Recommended Session'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStartSession('mixed', 10)}
              disabled={isStartingSession || queueStats.total === 0}
            >
              Quick Review (10 cards)
            </Button>
          </div>
          {queueStats.total === 0 && (
            <p className="text-sm text-orange-600 mt-2">
              {selectedDeskId ? 'No cards available in selected deck.' : 'No cards available to study.'}
            </p>
          )}
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
                  onClick={() => handleStartSession('due_today_only')}
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
                  <div className="text-sm text-muted-foreground">Study Streak</div>
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
              <CardTitle>Advanced Study Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* RFC-006: Overdue Card Order Selection */}
              <div className="space-y-3">
                <Label htmlFor="sort-order" className="text-sm font-medium">
                  Overdue Card Order
                </Label>
                <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                  <SelectTrigger id="sort-order">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">
                      <div className="flex flex-col">
                        <span className="font-medium">🎯 Recommended (Shuffled)</span>
                        <span className="text-xs text-muted-foreground">Random variety to break the overdue pile-up</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="oldest">
                      <div className="flex flex-col">
                        <span className="font-medium">⏰ Oldest First</span>
                        <span className="text-xs text-muted-foreground">Review cards by how long they've been overdue</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="easiest">
                      <div className="flex flex-col">
                        <span className="font-medium">😊 Easiest First</span>
                        <span className="text-xs text-muted-foreground">Build confidence with easier cards first</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="hardest">
                      <div className="flex flex-col">
                        <span className="font-medium">💪 Hardest First</span>
                        <span className="text-xs text-muted-foreground">Tackle difficult cards head-on (classic mode)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {sortOrder === 'recommended' && "✨ Shuffled sampling ensures you see different overdue cards each session"}
                  {sortOrder === 'oldest' && "📅 Cards are shown in order of due date (oldest overdue cards first)"}
                  {sortOrder === 'easiest' && "📈 Cards are shown in order of ease factor (highest ease factor first)"}
                  {sortOrder === 'hardest' && "⚡ Cards are shown in order of difficulty (lowest ease factor first)"}
                </p>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-3 block">Quick Session Options</Label>
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
                    onClick={() => window.location.href = '/dashboard/words'}
                    variant="outline"
                    className="h-20 flex-col gap-2"
                  >
                    <span className="font-semibold">Manage Decks</span>
                    <span className="text-sm text-muted-foreground">Edit flashcards</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Engaging loading overlay */}
      <StudySessionLoader 
        isVisible={isStartingSession}
      />
    </div>
  )
}

export default ReviewDashboard
