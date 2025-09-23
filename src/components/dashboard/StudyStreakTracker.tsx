'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Flame, 
  Calendar, 
  Target, 
  Trophy,
  Star,
  CheckCircle2,
  Circle,
  TrendingUp,
  Award,
  Zap,
  Crown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getStudySessionStats, getStudySessionHistory } from '@/lib/study-sessions'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@/lib/supabase'

interface StreakMilestone {
  days: number
  title: string
  description: string
  icon: React.ReactNode
  color: string
  reward?: string
}

interface DayStatus {
  date: string
  hasSession: boolean
  sessionCount: number
  accuracy?: number
}

interface StudyStreakTrackerProps {
  className?: string
  onStreakMilestone?: (milestone: StreakMilestone) => void
}

const STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 3,
    title: 'Getting Started',
    description: 'Complete 3 consecutive days',
    icon: <Star className="w-5 h-5" />,
    color: 'text-blue-600 bg-blue-50',
    reward: 'Consistency Badge'
  },
  {
    days: 7,
    title: 'Week Warrior',
    description: 'Complete a full week',
    icon: <Target className="w-5 h-5" />,
    color: 'text-green-600 bg-green-50',
    reward: 'Weekly Champion Badge'
  },
  {
    days: 14,
    title: 'Habit Former',
    description: 'Study for 2 weeks straight',
    icon: <Zap className="w-5 h-5" />,
    color: 'text-orange-600 bg-orange-50',
    reward: 'Habit Master Badge'
  },
  {
    days: 30,
    title: 'Monthly Master',
    description: 'Complete 30 consecutive days',
    icon: <Trophy className="w-5 h-5" />,
    color: 'text-purple-600 bg-purple-50',
    reward: 'Monthly Master Badge'
  },
  {
    days: 50,
    title: 'Dedication Demon',
    description: 'Study for 50 days straight',
    icon: <Flame className="w-5 h-5" />,
    color: 'text-red-600 bg-red-50',
    reward: 'Dedication Master Badge'
  },
  {
    days: 100,
    title: 'Centurion',
    description: 'Reach the legendary 100-day streak',
    icon: <Crown className="w-5 h-5" />,
    color: 'text-yellow-600 bg-yellow-50',
    reward: 'Centurion Crown'
  }
]

export function StudyStreakTracker({ className, onStreakMilestone }: StudyStreakTrackerProps) {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalSessions: 0,
    averageAccuracy: 0
  })
  const [weeklyProgress, setWeeklyProgress] = useState<DayStatus[]>([])
  const [milestones, setMilestones] = useState<StreakMilestone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userTimeZone, setUserTimeZone] = useState<string>('UTC')

  const generateWeeklyProgress = useCallback((sessions: any[], timeZone: string): DayStatus[] => {
    const days: DayStatus[] = []
    const today = new Date()

    const formatDateInTimeZone = (date: Date, tz: string): string => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(date)
      const y = parts.find(p => p.type === 'year')?.value || '1970'
      const m = parts.find(p => p.type === 'month')?.value || '01'
      const d = parts.find(p => p.type === 'day')?.value || '01'
      return `${y}-${m}-${d}`
    }

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = formatDateInTimeZone(date, timeZone)

      const daySessions = sessions.filter(s => {
        if (!s?.ended_at || s?.status !== 'completed') return false
        const sDate = formatDateInTimeZone(new Date(s.ended_at), timeZone)
        return sDate === dateStr
      })

      const avgAccuracy = daySessions.length > 0
        ? daySessions.reduce((sum, s) => sum + (s.accuracy_percentage || 0), 0) / daySessions.length
        : undefined

      days.push({
        date: dateStr,
        hasSession: daySessions.length > 0,
        sessionCount: daySessions.length,
        accuracy: avgAccuracy
      })
    }

    return days
  }, [])

  const loadStreakData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Get overall stats
      const stats = await getStudySessionStats()
      setStreakData(stats)

      // Determine user's timezone (profile -> system -> UTC)
      const supabase = createClientComponentClient()
      let tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('timezone')
            .eq('id', user.id)
            .single()
          if (profile?.timezone) tz = profile.timezone
        }
      } catch (_) {
        // silent fallback to resolved/system timezone
      }
      setUserTimeZone(tz)

      // Get recent session history for weekly view
      const { data: sessions } = await getStudySessionHistory(30)
      const weeklyData = generateWeeklyProgress(sessions || [], tz)
      setWeeklyProgress(weeklyData)

      // Calculate achieved milestones
      const achievedMilestones = STREAK_MILESTONES.filter(m => 
        stats.currentStreak >= m.days || stats.longestStreak >= m.days
      )
      setMilestones(achievedMilestones)

    } catch (error) {
      console.error('Failed to load streak data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [generateWeeklyProgress])

  useEffect(() => {
    loadStreakData()
  }, [loadStreakData])

  const getNextMilestone = () => {
    return STREAK_MILESTONES.find(m => m.days > streakData.currentStreak)
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 100) return '👑'
    if (streak >= 50) return '🔥'
    if (streak >= 30) return '🏆'
    if (streak >= 14) return '⭐'
    if (streak >= 7) return '🎯'
    if (streak >= 3) return '💪'
    return '🌱'
  }

  const getDayName = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    // Construct a UTC date at midnight for the given Y-M-D.
    // Day-of-week for a calendar date is timezone-independent.
    const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1))
    return new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(date)
  }

  const getDayNumber = (dateStr: string) => {
    // Day number is simply the D part of YYYY-MM-DD
    return parseInt(dateStr.split('-')[2] || '1', 10)
  }

  const nextMilestone = getNextMilestone()
  const progressToNext = nextMilestone 
    ? (streakData.currentStreak / nextMilestone.days) * 100 
    : 100

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
            <div className="grid grid-cols-7 gap-2">
              {[1,2,3,4,5,6,7].map(i => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Study Streak
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current streak display */}
        <div className="text-center space-y-2">
          <motion.div
            key={streakData.currentStreak}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="text-6xl"
          >
            {getStreakEmoji(streakData.currentStreak)}
          </motion.div>
          
          <div className="space-y-1">
            <div className="text-3xl font-bold text-orange-600">
              {streakData.currentStreak} Days
            </div>
            <div className="text-sm text-muted-foreground">
              Current Streak • Best: {streakData.longestStreak} days
            </div>
          </div>

          {nextMilestone && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {nextMilestone.days - streakData.currentStreak} days until 
                <span className="font-medium text-foreground"> {nextMilestone.title}</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>
          )}
        </div>

        {/* Weekly progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">This Week</h4>
            <Badge variant="outline">
              {weeklyProgress.filter(d => d.hasSession).length}/7 days
            </Badge>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {weeklyProgress.map((day, index) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {getDayName(day.date)}
                </div>
                <div
                  className={cn(
                    "w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium transition-all",
                    day.hasSession
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {day.hasSession ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>
                <div className="text-xs mt-1">
                  {getDayNumber(day.date)}
                </div>
                {day.hasSession && day.sessionCount > 1 && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {day.sessionCount}
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Milestone achievements */}
        {milestones.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Award className="w-4 h-4" />
              Achievements
            </h4>
            
            <div className="grid grid-cols-1 gap-2">
              {milestones.slice(-3).map((milestone, index) => (
                <motion.div
                  key={milestone.days}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    milestone.color
                  )}
                >
                  <div className="flex-shrink-0">
                    {milestone.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{milestone.title}</div>
                    <div className="text-xs opacity-75">{milestone.description}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {milestone.days} days
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Next milestone preview */}
        {nextMilestone && (
          <div className="space-y-3">
            <h4 className="font-medium">Next Goal</h4>
            
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-lg border border-dashed",
              nextMilestone.color
            )}>
              <div className="flex-shrink-0">
                {nextMilestone.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{nextMilestone.title}</div>
                <div className="text-xs opacity-75">{nextMilestone.description}</div>
                {nextMilestone.reward && (
                  <div className="text-xs mt-1 font-medium">
                    Reward: {nextMilestone.reward}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{nextMilestone.days}</div>
                <div className="text-xs opacity-75">days</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {streakData.totalSessions}
            </div>
            <div className="text-xs text-muted-foreground">Total Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {streakData.averageAccuracy}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Accuracy</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
