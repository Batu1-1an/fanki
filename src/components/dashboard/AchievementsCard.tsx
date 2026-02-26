'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Trophy, Star, Flame, BookOpen, Target, Award } from 'lucide-react'

interface Achievement {
  id: string
  icon: React.ElementType
  title: string
  description: string
  isUnlocked: boolean
  progress?: number
  target?: number
}

interface AchievementsCardProps {
  totalWords: number
  currentStreak: number
  longestStreak: number
  completedSessions: number
}

export function AchievementsCard({
  totalWords,
  currentStreak,
  longestStreak,
  completedSessions
}: AchievementsCardProps) {
  const achievements: Achievement[] = [
    {
      id: 'consistency',
      icon: Flame,
      title: 'Consistency Master',
      description: `${currentStreak}-Day Streak`,
      isUnlocked: currentStreak >= 7,
      progress: currentStreak,
      target: 7
    },
    {
      id: 'vocabulary',
      icon: BookOpen,
      title: 'Vocabulary Builder',
      description: `${totalWords} Words Studied`,
      isUnlocked: totalWords >= 500,
      progress: totalWords,
      target: 500
    },
    {
      id: 'sessions',
      icon: Trophy,
      title: 'Session Champion',
      description: `${completedSessions} Sessions`,
      isUnlocked: completedSessions >= 50,
      progress: completedSessions,
      target: 50
    },
    {
      id: 'marathon',
      icon: Target,
      title: 'Marathon Runner',
      description: `${longestStreak} Day Record`,
      isUnlocked: longestStreak >= 30,
      progress: longestStreak,
      target: 30
    }
  ]

  const unlockedCount = achievements.filter(a => a.isUnlocked).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Award className="w-5 h-5" />
            Your Achievements
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {unlockedCount}/{achievements.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon
            const progressPercentage = achievement.target 
              ? Math.min(100, Math.round((achievement.progress! / achievement.target) * 100))
              : 100

            return (
              <motion.div
                key={achievement.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="flex flex-col items-center space-y-2"
              >
                {/* Achievement Icon */}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    achievement.isUnlocked
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/30'
                      : 'bg-gray-200'
                  }`}
                >
                  <Icon
                    className={`w-8 h-8 ${
                      achievement.isUnlocked ? 'text-white' : 'text-gray-400'
                    }`}
                  />
                </div>

                {/* Achievement Info */}
                <div className="text-center space-y-1">
                  <div className={`text-xs font-medium ${
                    achievement.isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {achievement.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {achievement.description}
                  </div>

                  {/* Progress indicator for locked achievements */}
                  {!achievement.isUnlocked && achievement.target && (
                    <div className="w-full">
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-teal-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {achievement.progress}/{achievement.target}
                      </div>
                    </div>
                  )}

                  {/* Unlocked badge */}
                  {achievement.isUnlocked && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      <Star className="w-3 h-3 mr-0.5 fill-yellow-400 text-yellow-400" />
                      Earned
                    </Badge>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Motivational message */}
        {unlockedCount < achievements.length && (
          <div className="mt-6 p-3 rounded-lg bg-teal-50 border border-teal-200 text-center">
            <p className="text-xs text-teal-800">
              {unlockedCount === 0
                ? 'Start your journey to unlock achievements!'
                : `${achievements.length - unlockedCount} more to unlock! Keep going! 🎯`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
