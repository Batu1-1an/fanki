'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { StudyStreakTracker } from '@/components/dashboard/StudyStreakTracker'
import { ReviewDashboard } from '@/components/dashboard/ReviewDashboard'
import { getWordStats } from '@/lib/words'
import { getReviewStats } from '@/lib/reviews'
import { getQueueManager, getRecommendedStudyMode } from '@/lib/queue-manager'
import { ArrowLeft, TrendingUp, Calendar, Target } from 'lucide-react'

interface ProgressClientProps {
  user: User
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

export default function ProgressClient({ user }: ProgressClientProps) {
  const [wordStats, setWordStats] = useState({
    total: 0,
    byDifficulty: {} as Record<number, number>,
    byCategory: {} as Record<string, number>,
    recentCount: 0
  })
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
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
  const [recommendedMode, setRecommendedMode] = useState<RecommendedMode>({
    mode: 'mixed',
    reasoning: 'Balanced study session recommended.',
    priority: 'low'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWordStats = async () => {
      const queueManager = getQueueManager()
      const [wordStatsData, dashboardStatsData, queueData, recommendation] = await Promise.all([
        getWordStats(),
        getReviewStats(),
        queueManager.generateQueue({ maxWords: 100 }),
        getRecommendedStudyMode()
      ])
      setWordStats(wordStatsData)
      setDashboardStats(dashboardStatsData)
      setQueueStats(queueData.stats)
      setRecommendedMode(recommendation)
      setLoading(false)
    }
    
    loadWordStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Progress Dashboard</h1>
                <p className="text-gray-600">
                  Track your learning journey and achievements
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Words
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {wordStats.total}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Words Mastered
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Object.entries(wordStats.byDifficulty).reduce((acc, [level, count]) => 
                          parseInt(level) >= 4 ? acc + count : acc, 0
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Recent Activity
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {wordStats.recentCount} words
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Categories
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Object.keys(wordStats.byCategory).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Study Streak Tracker */}
          <div className="mb-8">
            <StudyStreakTracker />
          </div>

          {/* Review Dashboard */}
          <div className="mb-8">
            <ReviewDashboard 
              onStartSession={(words, sessionId) => {
                // Navigate to study session
                window.location.href = `/study?session=${sessionId}`
              }}
              stats={dashboardStats}
              queueStats={queueStats}
              recommendedMode={recommendedMode}
              isLoading={loading}
            />
          </div>

          {/* Word Distribution Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Word Distribution by Difficulty</h3>
            <div className="space-y-3">
              {Object.entries(wordStats.byDifficulty).map(([level, count]) => (
                <div key={level} className="flex items-center">
                  <div className="w-20 text-sm text-gray-500">
                    Level {level}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mx-3">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${wordStats.total > 0 ? (count / wordStats.total) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <div className="w-12 text-sm text-gray-900 text-right">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
