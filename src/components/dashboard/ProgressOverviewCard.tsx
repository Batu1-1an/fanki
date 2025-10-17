'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Clock } from 'lucide-react'

interface ProgressOverviewCardProps {
  totalSessions: number
  averageAccuracy: number
  activeDesks: number
  totalTimeMinutes: number
}

export function ProgressOverviewCard({
  totalSessions,
  averageAccuracy,
  activeDesks,
  totalTimeMinutes
}: ProgressOverviewCardProps) {
  const stats = [
    {
      label: 'Total Sessions',
      value: totalSessions.toString(),
      icon: BarChart3,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100'
    },
    {
      label: 'Avg. Accuracy',
      value: `${Math.round(averageAccuracy)}%`,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100'
    },
    {
      label: 'Active Decks',
      value: activeDesks.toString(),
      icon: BarChart3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    }
  ]

  const totalTimeDisplay = totalTimeMinutes >= 60
    ? `${(totalTimeMinutes / 60).toFixed(1)} hrs`
    : `${Math.round(totalTimeMinutes)} min`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Progress Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main stats grid */}
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="flex flex-col items-center text-center space-y-2"
                >
                  <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Time invested highlight */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Time Invested</div>
                  <div className="text-xl font-bold text-teal-700">{totalTimeDisplay}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Keep it up!</div>
                <div className="text-sm font-medium text-teal-600">🎯</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
