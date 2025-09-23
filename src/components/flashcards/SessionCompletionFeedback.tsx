'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Award, 
  Target, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  Star,
  Trophy,
  Flame,
  Brain,
  Zap,
  RotateCcw,
  ArrowRight,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getStudySessionStats } from '@/lib/study-sessions'

interface SessionStats {
  cardsStudied: number
  cardsCorrect: number
  totalReviews: number
  accuracy: number
  duration: number
  averageResponseTime: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  progress?: number
  maxProgress?: number
}

interface SessionCompletionFeedbackProps {
  sessionStats: SessionStats
  sessionType: string
  onRestart: () => void
  onExit: () => void
  className?: string
}

export function SessionCompletionFeedback({
  sessionStats,
  sessionType,
  onRestart,
  onExit,
  className
}: SessionCompletionFeedbackProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [overallStats, setOverallStats] = useState({
    totalSessions: 0,
    currentStreak: 0,
    totalWordsStudied: 0,
    averageAccuracy: 0
  })
  const [showAchievements, setShowAchievements] = useState(false)

  const calculateAchievements = useCallback((session: SessionStats, overall: any): Achievement[] => {
    const achievements: Achievement[] = []

    // Perfect Session
    if (session.accuracy === 100 && session.cardsStudied >= 5) {
      achievements.push({
        id: 'perfect_session',
        title: 'Perfect Session!',
        description: `Got 100% accuracy with ${session.cardsStudied} cards`,
        icon: <Trophy className="w-6 h-6 text-yellow-500" />,
        unlocked: true
      })
    }

    // Speed Demon
    const avgTimePerCard = session.duration / session.cardsStudied
    if (avgTimePerCard <= 30 && session.accuracy >= 80) {
      achievements.push({
        id: 'speed_demon',
        title: 'Speed Demon',
        description: 'Completed cards in under 30 seconds each with 80%+ accuracy',
        icon: <Zap className="w-6 h-6 text-blue-500" />,
        unlocked: true
      })
    }

    // Streak Master
    if (overall.currentStreak >= 7) {
      achievements.push({
        id: 'streak_master',
        title: 'Streak Master',
        description: `${overall.currentStreak} day study streak!`,
        icon: <Flame className="w-6 h-6 text-orange-500" />,
        unlocked: true
      })
    }

    // Marathon Session
    if (session.cardsStudied >= 50) {
      achievements.push({
        id: 'marathon',
        title: 'Marathon Session',
        description: `Studied ${session.cardsStudied} cards in one session`,
        icon: <Target className="w-6 h-6 text-green-500" />,
        unlocked: true
      })
    }

    // Scholar
    if (overall.totalWordsStudied >= 1000) {
      achievements.push({
        id: 'scholar',
        title: 'Scholar',
        description: `Studied ${overall.totalWordsStudied} total words`,
        icon: <Brain className="w-6 h-6 text-purple-500" />,
        unlocked: true
      })
    }

    // Progress achievements (not unlocked, showing progress)
    achievements.push({
      id: 'daily_goal',
      title: 'Daily Goal',
      description: 'Complete 20 cards today',
      icon: <Calendar className="w-6 h-6 text-blue-400" />,
      unlocked: false,
      progress: Math.min(session.cardsStudied, 20),
      maxProgress: 20
    })

    return achievements
  }, [])

  const loadAchievementsAndStats = useCallback(async () => {
    const stats = await getStudySessionStats()
    setOverallStats(stats)
    
    const newAchievements = calculateAchievements(sessionStats, stats)
    setAchievements(newAchievements)
    
    // Show achievements if any were unlocked
    const hasNewAchievements = newAchievements.some(a => a.unlocked)
    if (hasNewAchievements) {
      setTimeout(() => setShowAchievements(true), 1000)
    }
  }, [calculateAchievements, sessionStats])

  useEffect(() => {
    loadAchievementsAndStats()
  }, [loadAchievementsAndStats])

  const getPerformanceLevel = (accuracy: number): { level: string; color: string; message: string } => {
    if (accuracy >= 95) return {
      level: 'Exceptional',
      color: 'text-yellow-600 bg-yellow-50',
      message: 'Outstanding performance! You\'ve mastered these words.'
    }
    if (accuracy >= 85) return {
      level: 'Excellent',
      color: 'text-green-600 bg-green-50',
      message: 'Great job! Your retention is very strong.'
    }
    if (accuracy >= 75) return {
      level: 'Good',
      color: 'text-blue-600 bg-blue-50',
      message: 'Solid progress! Keep up the good work.'
    }
    if (accuracy >= 65) return {
      level: 'Fair',
      color: 'text-orange-600 bg-orange-50',
      message: 'You\'re improving! Consider reviewing these words more.'
    }
    return {
      level: 'Needs Work',
      color: 'text-red-600 bg-red-50',
      message: 'These words need more practice. Don\'t give up!'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const performance = getPerformanceLevel(sessionStats.accuracy)
  const unlockedAchievements = achievements.filter(a => a.unlocked)

  return (
    <motion.div
      className={cn("max-w-4xl mx-auto space-y-6", className)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main completion card */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
          >
            <Award className="w-10 h-10 text-green-600" />
          </motion.div>
          
          <CardTitle className="text-3xl text-green-800 mb-2">
            Session Complete!
          </CardTitle>
          
          <div className={cn("inline-flex items-center px-4 py-2 rounded-full text-sm font-medium", performance.color)}>
            <Star className="w-4 h-4 mr-2" />
            {performance.level} Performance
          </div>
          
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {performance.message}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-green-600">
                {sessionStats.cardsStudied}
              </div>
              <div className="text-sm text-muted-foreground">Cards Studied</div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-blue-600">
                {sessionStats.accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-purple-600">
                {formatTime(sessionStats.duration)}
              </div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-orange-600">
                {overallStats.currentStreak}
              </div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </motion.div>
          </div>

          {/* Progress visualization */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Session Accuracy</span>
                <span>{sessionStats.cardsCorrect}/{sessionStats.cardsStudied}</span>
              </div>
              <Progress value={sessionStats.accuracy} className="h-3" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average per card:</span>
                <span className="font-medium">
                  {Math.round(sessionStats.duration / sessionStats.cardsStudied)}s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session type:</span>
                <span className="font-medium capitalize">{sessionType}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <AnimatePresence>
        {unlockedAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <Trophy className="w-5 h-5" />
                  Achievements Unlocked!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unlockedAchievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.8 + index * 0.1, type: 'spring' }}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-yellow-200"
                    >
                      <div className="flex-shrink-0">
                        {achievement.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{achievement.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {achievement.description}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress achievements */}
      {achievements.some(a => !a.unlocked && a.progress !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Goals & Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {achievements
                .filter(a => !a.unlocked && a.progress !== undefined)
                .map((achievement) => (
                  <div key={achievement.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {achievement.icon}
                        <div>
                          <div className="font-medium text-sm">{achievement.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {achievement.description}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {achievement.progress}/{achievement.maxProgress}
                      </Badge>
                    </div>
                    <Progress 
                      value={(achievement.progress! / achievement.maxProgress!) * 100} 
                      className="h-2" 
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="flex gap-3 justify-center"
      >
        <Button
          variant="outline"
          onClick={onRestart}
          className="gap-2"
          size="lg"
        >
          <RotateCcw className="w-4 h-4" />
          Study Again
        </Button>
        
        <Button
          onClick={onExit}
          className="gap-2"
          size="lg"
        >
          <ArrowRight className="w-4 h-4" />
          Continue Learning
        </Button>
      </motion.div>
    </motion.div>
  )
}
