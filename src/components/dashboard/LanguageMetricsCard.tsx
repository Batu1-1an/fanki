'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { PieChart, Target, Flame } from 'lucide-react'

interface LanguageMetricsCardProps {
  retentionRate: number
  dailyGoalCurrent: number
  dailyGoalTarget: number
  currentStreak: number
}

export function LanguageMetricsCard({
  retentionRate,
  dailyGoalCurrent,
  dailyGoalTarget,
  currentStreak
}: LanguageMetricsCardProps) {
  const dailyGoalPercentage = Math.min(100, Math.round((dailyGoalCurrent / dailyGoalTarget) * 100))
  const retentionQuality = retentionRate >= 85 ? 'Excellent' : retentionRate >= 70 ? 'Good' : 'Needs Work'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Language Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Retention Rate - Circular Progress */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative w-24 h-24">
              {/* Background circle */}
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  className="text-teal-500"
                  initial={{ strokeDasharray: '0 251.2' }}
                  animate={{ 
                    strokeDasharray: `${(retentionRate / 100) * 251.2} 251.2`
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{Math.round(retentionRate)}%</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">Retention</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <PieChart className="w-3 h-3" />
                Up from 3s
              </div>
              <div className="text-xs font-medium text-teal-600 mt-1">
                {retentionQuality}
              </div>
            </div>
          </div>

          {/* Daily Goal */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-24 h-24 flex flex-col items-center justify-center">
              <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <Target className="w-4 h-4" />
                Daily Goal
              </div>
              <div className="text-2xl font-bold">
                {dailyGoalCurrent}/{dailyGoalTarget}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Words</div>
              
              {/* Progress bars */}
              <div className="flex gap-1 mt-3">
                {Array.from({ length: dailyGoalTarget }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-2 h-8 rounded-full ${
                      i < dailyGoalCurrent
                        ? 'bg-teal-500'
                        : 'bg-gray-200'
                    }`}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                  />
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">
                {dailyGoalPercentage}% Complete
              </div>
            </div>
          </div>

          {/* Daily Streak */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-24 h-24 flex flex-col items-center justify-center">
              <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                Daily Streak
              </div>
              <div className="text-2xl font-bold">{currentStreak}</div>
              <div className="text-xs text-muted-foreground mt-1">Days</div>
              
              {/* Flame visualization */}
              <motion.div
                className="mt-3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Flame 
                  className={`w-8 h-8 ${
                    currentStreak >= 7 
                      ? 'text-orange-500 fill-orange-500' 
                      : currentStreak >= 3
                      ? 'text-orange-400 fill-orange-400'
                      : 'text-gray-300 fill-gray-300'
                  }`}
                />
              </motion.div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">
                {currentStreak >= 7 ? 'On fire!' : 'Keep it up!'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
