'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { QueuedWord, generateStudySession } from '@/lib/queue-manager'
import { loadDashboardData } from '@/lib/dashboard-data'
import { getActiveStudySession } from '@/lib/study-sessions'
import { getUserDesks } from '@/lib/desks'
import { StudySession } from '../flashcards/StudySession'
import { LearningPathCard } from './LearningPathCard'
import { NextStepCard } from './NextStepCard'
import { QueueBreakdownCard } from './QueueBreakdownCard'
import { LanguageMetricsCard } from './LanguageMetricsCard'
import { WeeklyActivityCard } from './WeeklyActivityCard'
import { AchievementsCard } from './AchievementsCard'
import { ProgressOverviewCard } from './ProgressOverviewCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toLocalDateKey } from '@/lib/date-utils'

interface ModernDashboardProps {
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

interface DashboardData {
  dashboardStats: {
    totalReviews: number
    todaysReviews: number
    wordsDueToday: number
    retentionRate: number
    averageEaseFactor: number
    currentStreak: number
  }
  queueStats: {
    total: number
    overdue: number
    dueToday: number
    newWords: number
    averageDifficulty: number
  }
  sessionStats: {
    totalSessions: number
    completedSessions: number
    totalTimeMinutes: number
    averageAccuracy: number
    totalWordsStudied: number
    currentStreak: number
    longestStreak: number
  }
  recommendedMode: {
    mode: any
    reasoning: string
    priority: 'high' | 'medium' | 'low'
  }
  recentSessions: any[]
  timestamp: number
}

export function ModernDashboard({
  className,
  activeSession,
  onActiveSessionChange,
  userId
}: ModernDashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasActiveDbSession, setHasActiveDbSession] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [selectedDeskId, setSelectedDeskId] = useState<string>('all')
  const [activeDeskCount, setActiveDeskCount] = useState(0)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (deskId: string = selectedDeskId) => {
    setIsLoading(true)
    setDashboardError(null)
    try {
      setSelectedDeskId(deskId)
      // Check for active session
      const [{ data: session }, { data: desks }, data] = await Promise.all([
        getActiveStudySession(),
        getUserDesks(),
        loadDashboardData(deskId)
      ])

      setHasActiveDbSession(!!session)
      setActiveDeskCount((desks || []).length)

      setDashboardData(data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setDashboardError('Unable to load dashboard data right now.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeskChange = async (deskId: string) => {
    await loadData(deskId)
  }

  const handleStartSession = async (mode: 'mixed' | 'new_only' | 'review_only' | 'overdue_only' | 'due_today_only' = 'mixed', maxWords: number = 20) => {
    try {
      const { words, sessionId } = await generateStudySession({
        maxWords,
        studyMode: mode,
        prioritizeWeakWords: true,
        deskId: selectedDeskId
      })
      
      if (words.length > 0) {
        onActiveSessionChange?.({ words, sessionId })
      }
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  const handleStartOverdue = () => handleStartSession('overdue_only', 20)
  const handleStartDueToday = () => handleStartSession('due_today_only', 20)
  const handleStartNewWords = () => handleStartSession('new_only', 20)
  const handleStartMixed = () => handleStartSession('mixed', 20)

  const handleResumeSession = async () => {
    try {
      const { data: session } = await getActiveStudySession()
      if (!session) {
        handleStartSession()
        return
      }

      const { words } = await generateStudySession({
        maxWords: 20,
        studyMode: 'mixed',
        prioritizeWeakWords: true,
        deskId: selectedDeskId
      })

      if (words.length > 0) {
        onActiveSessionChange?.({
          words,
          sessionId: session.id
        })
      }
    } catch (error) {
      console.error('Failed to resume session:', error)
    }
  }

  const handleSessionComplete = (sessionData: any) => {
    console.log('Session completed:', sessionData)
    onActiveSessionChange?.(null)
    setHasActiveDbSession(false)
    loadData(selectedDeskId)
  }

  const handleExitSession = () => {
    onActiveSessionChange?.(null)
    loadData(selectedDeskId)
  }

  // Get weekly activity data from recent sessions
  const getWeeklyActivityData = () => {
    if (!dashboardData?.recentSessions) return []
    
    const activityMap = new Map<string, number>()
    
    dashboardData.recentSessions.forEach(session => {
      if (session.created_at) {
        const date = new Date(session.created_at)
        const dateKey = toLocalDateKey(date)
        const currentCount = activityMap.get(dateKey) || 0
        activityMap.set(dateKey, currentCount + (session.total_reviews || 0))
      }
    })

    return Array.from(activityMap.entries()).map(([dateStr, reviewCount]) => ({
      date: new Date(`${dateStr}T00:00:00`),
      reviewCount
    }))
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
          userId={userId}
        />
      </div>
    )
  }

  // Get next step info
  const getNextStepInfo = () => {
    if (!dashboardData) {
      return {
        priority: 'medium' as const,
        title: 'Loading...',
        subtitle: 'Please wait'
      }
    }

    const { queueStats, recommendedMode } = dashboardData

    if (queueStats.overdue > 0) {
      return {
        priority: 'high' as const,
        title: `Solidify Knowledge! Review ${queueStats.overdue} Overdue ${queueStats.overdue === 1 ? 'Word' : 'Words'}`,
        subtitle: `${queueStats.overdue} cards need attention to maintain your progress`
      }
    }

    if (queueStats.dueToday > 0) {
      return {
        priority: 'medium' as const,
        title: `Stay on Track! ${queueStats.dueToday} ${queueStats.dueToday === 1 ? 'Word' : 'Words'} Due Today`,
        subtitle: `Keep your streak alive with today's reviews`
      }
    }

    return {
      priority: 'low' as const,
      title: 'Explore New Territory!',
      subtitle: `${queueStats.newWords} new words waiting to be learned`
    }
  }

  const nextStepInfo = getNextStepInfo()

  return (
    <div className={cn("max-w-7xl mx-auto space-y-6 p-4 sm:p-6", className)}>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          YOUR LEARNING HUB
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Track your progress, build streaks, and master new vocabulary
        </p>
      </motion.div>

      {isLoading ? (
        /* Loading Skeletons */
        <div className="space-y-6">
          <Card>
            <CardContent className="p-8">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : (
        <>
          {/* Learning Path Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <NextStepCard
              priority={nextStepInfo.priority}
              title={nextStepInfo.title}
              subtitle={nextStepInfo.subtitle}
              onStartSession={handleStartSession}
              isLoading={isLoading}
            />
          </motion.div>

          {dashboardError && (
            <Card>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-red-600">{dashboardError}</p>
                <Button variant="outline" size="sm" onClick={() => loadData(selectedDeskId)}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <LearningPathCard
              onStartSession={handleStartSession}
              onResumeSession={handleResumeSession}
              hasActiveSession={hasActiveDbSession}
              progressMessage={
                dashboardData?.sessionStats.currentStreak ?? 0 > 0
                  ? `You're on a ${dashboardData?.sessionStats.currentStreak}-day streak! Keep the momentum going.`
                  : "You're making great progress towards your learning goals."
              }
            />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Queue Breakdown - Where users can see and select what to study */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <QueueBreakdownCard
                  overdue={dashboardData?.queueStats.overdue ?? 0}
                  dueToday={dashboardData?.queueStats.dueToday ?? 0}
                  newWords={dashboardData?.queueStats.newWords ?? 0}
                  total={dashboardData?.queueStats.total ?? 0}
                  onStartOverdue={handleStartOverdue}
                  onStartDueToday={handleStartDueToday}
                  onStartNewWords={handleStartNewWords}
                  onStartMixed={handleStartMixed}
                  onDeskChange={handleDeskChange}
                  isLoading={isLoading}
                />
              </motion.div>

              {/* Weekly Activity */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <WeeklyActivityCard activityData={getWeeklyActivityData()} />
              </motion.div>

              {/* Progress Overview */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <ProgressOverviewCard
                  totalSessions={dashboardData?.sessionStats.totalSessions ?? 0}
                  averageAccuracy={dashboardData?.sessionStats.averageAccuracy ?? 0}
                  activeDesks={activeDeskCount}
                  totalTimeMinutes={dashboardData?.sessionStats.totalTimeMinutes ?? 0}
                />
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Language Metrics */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <LanguageMetricsCard
                  retentionRate={dashboardData?.dashboardStats.retentionRate ?? 0}
                  dailyGoalCurrent={dashboardData?.dashboardStats.todaysReviews ?? 0}
                  dailyGoalTarget={20}
                  currentStreak={dashboardData?.sessionStats.currentStreak ?? 0}
                />
              </motion.div>

              {/* Achievements */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <AchievementsCard
                  totalWords={dashboardData?.sessionStats.totalWordsStudied ?? 0}
                  currentStreak={dashboardData?.sessionStats.currentStreak ?? 0}
                  longestStreak={dashboardData?.sessionStats.longestStreak ?? 0}
                  completedSessions={dashboardData?.sessionStats.completedSessions ?? 0}
                />
              </motion.div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
