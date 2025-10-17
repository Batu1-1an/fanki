'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'

interface WeeklyActivityCardProps {
  activityData: Array<{
    date: Date
    reviewCount: number
  }>
}

export function WeeklyActivityCard({ activityData }: WeeklyActivityCardProps) {
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  
  // Get last 7 days of activity
  const getLast7Days = () => {
    const days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Find activity for this date
      const activity = activityData.find(a => {
        const activityDate = new Date(a.date)
        return activityDate.toDateString() === date.toDateString()
      })
      
      days.push({
        date,
        dayOfWeek: daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1],
        reviewCount: activity?.reviewCount || 0
      })
    }
    
    return days
  }

  const last7Days = getLast7Days()

  // Determine dot intensity based on review count
  const getDotIntensity = (count: number) => {
    if (count === 0) return 'bg-gray-200'
    if (count < 5) return 'bg-teal-300'
    if (count < 10) return 'bg-teal-400'
    if (count < 20) return 'bg-teal-500'
    return 'bg-teal-600'
  }

  const getDotSize = (count: number) => {
    if (count === 0) return 'w-2 h-2'
    if (count < 10) return 'w-2.5 h-2.5'
    if (count < 20) return 'w-3 h-3'
    return 'w-3.5 h-3.5'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Weekly Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Day labels */}
          <div className="flex justify-around text-xs text-muted-foreground font-medium">
            {last7Days.map((day, i) => (
              <div key={i} className="w-12 text-center">
                {day.dayOfWeek}
              </div>
            ))}
          </div>

          {/* Activity dots - 3 rows to show morning/afternoon/evening activity */}
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex justify-around">
              {last7Days.map((day, i) => {
                const hasActivity = day.reviewCount > row * 7
                const intensity = hasActivity ? getDotIntensity(day.reviewCount) : 'bg-gray-200'
                const size = hasActivity ? getDotSize(day.reviewCount) : 'w-2 h-2'
                
                return (
                  <div key={`${i}-${row}`} className="w-12 flex justify-center">
                    <motion.div
                      className={`rounded-full ${intensity} ${size} transition-all cursor-pointer hover:scale-125`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1 + row * 0.05, duration: 0.3 }}
                      title={`${day.reviewCount} reviews on ${day.date.toLocaleDateString()}`}
                    />
                  </div>
                )
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-200" />
              <span>Less</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-teal-300" />
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <div className="w-2 h-2 rounded-full bg-teal-600" />
            </div>
            <div className="flex items-center gap-2">
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
