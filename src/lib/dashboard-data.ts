import { createClientComponentClient } from './supabase'
import { getReviewStats, getDueWordCounts } from './reviews'
import { getStudySessionHistory } from './study-sessions'

const supabase = createClientComponentClient()

/**
 * Comprehensive dashboard data loader using optimized database functions
 * This replaces multiple individual API calls with a single optimized call
 */
export async function loadDashboardData(deskId: string = 'all') {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Use the comprehensive dashboard function for most data
    const { data: dashboardData, error: dashboardError } = await supabase
      .rpc('get_comprehensive_dashboard_data', {
        p_user_id: user.id,
        p_desk_id: deskId === 'all' ? null : deskId
      })

    if (dashboardError) {
      console.error('Error fetching comprehensive dashboard data:', dashboardError)
      throw dashboardError
    }

    // Get session history separately (lighter query)
    const { data: sessionHistory, error: sessionHistoryError } = await getStudySessionHistory(12)
    
    if (sessionHistoryError) {
      console.error('Error fetching session history:', sessionHistoryError)
    }

    const result = {
      dashboardStats: {
        totalReviews: dashboardData?.reviewStats?.total_reviews || 0,
        todaysReviews: dashboardData?.reviewStats?.todays_reviews || 0,
        wordsDueToday: dashboardData?.reviewStats?.words_due_today || 0,
        retentionRate: dashboardData?.reviewStats?.correct_reviews && dashboardData?.reviewStats?.total_reviews > 0
          ? Math.round((dashboardData.reviewStats.correct_reviews / dashboardData.reviewStats.total_reviews) * 100)
          : 0,
        averageEaseFactor: Math.round((dashboardData?.reviewStats?.avg_ease_factor || 2.5) * 100) / 100,
        currentStreak: dashboardData?.sessionStats?.currentStreak || 0
      },
      queueStats: {
        total: dashboardData?.queueStats?.total || 0,
        overdue: dashboardData?.queueStats?.overdue || 0,
        dueToday: dashboardData?.queueStats?.dueToday || 0,
        newWords: dashboardData?.queueStats?.newWords || 0,
        averageDifficulty: dashboardData?.queueStats?.averageDifficulty || 2.5
      },
      wordStats: {
        total: dashboardData?.wordStats?.total || 0,
        byDifficulty: dashboardData?.wordStats?.byDifficulty || {},
        byCategory: dashboardData?.wordStats?.byCategory || {},
        recentCount: dashboardData?.wordStats?.recentCount || 0
      },
      sessionStats: {
        totalSessions: dashboardData?.sessionStats?.totalSessions || 0,
        completedSessions: dashboardData?.sessionStats?.completedSessions || 0,
        totalTimeMinutes: dashboardData?.sessionStats?.totalTimeMinutes || 0,
        averageAccuracy: dashboardData?.sessionStats?.averageAccuracy || 0,
        totalWordsStudied: dashboardData?.sessionStats?.totalWordsStudied || 0,
        currentStreak: dashboardData?.sessionStats?.currentStreak || 0,
        longestStreak: dashboardData?.sessionStats?.longestStreak || 0
      },
      onboardingData: dashboardData?.onboardingData || {
        hasSetPreferences: false,
        hasAddedFirstWord: false,
        currentStep: 'tour',
        profile: {}
      },
      recentSessions: sessionHistory || [],
      timestamp: Date.now(),
      recommendedMode: { mode: 'mixed', reasoning: 'Balanced study session recommended.', priority: 'low' } as { mode: any; reasoning: string; priority: 'high' | 'medium' | 'low' }
    }

    // Derive recommendation from global stats
    let recommendedMode: { mode: any; reasoning: string; priority: 'high' | 'medium' | 'low' }
    const { overdue, dueToday, newWords } = result.queueStats
    
    if (overdue > 10) {
      recommendedMode = { 
        mode: 'overdue_only', 
        reasoning: `You have ${overdue} overdue words. Focus on catching up!`, 
        priority: 'high' 
      }
    } else if (dueToday > 20) {
      recommendedMode = { 
        mode: 'review_only', 
        reasoning: `${dueToday} words are due today. Focus on reviews first.`, 
        priority: 'medium' 
      }
    } else if (newWords < 5) {
      recommendedMode = { 
        mode: 'mixed', 
        reasoning: 'Good balance of new and review words. Keep up the momentum!', 
        priority: 'low' 
      }
    } else {
      recommendedMode = { 
        mode: 'mixed', 
        reasoning: 'Balanced study session recommended.', 
        priority: 'low' 
      }
    }

    // Update the recommendedMode in the result
    result.recommendedMode = recommendedMode

    console.log('Optimized dashboard data loaded:', {
      stats: result.dashboardStats,
      queueStats: result.queueStats,
      loadTime: Date.now() - result.timestamp
    })

    return result
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    throw error
  }
}

/**
 * Lightweight function to refresh only queue stats (for desk filtering)
 */
export async function refreshQueueStats(deskId: string = 'all') {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data: queueStats, error } = await supabase
      .rpc('get_user_queue_counts', {
        p_desk_id: deskId === 'all' ? null : deskId
      })

    if (error) {
      console.error('Error refreshing queue stats:', error)
      throw error
    }

    return {
      total: queueStats?.total || 0,
      overdue: queueStats?.overdue || 0,
      dueToday: queueStats?.dueToday || 0,
      newWords: queueStats?.newWords || 0,
      averageDifficulty: queueStats?.averageDifficulty || 2.5
    }
  } catch (error) {
    console.error('Failed to refresh queue stats:', error)
    throw error
  }
}

/**
 * Lightweight function to refresh only session history
 */
export async function refreshSessionHistory() {
  try {
    const { data: sessionHistory, error } = await getStudySessionHistory(12)
    
    if (error) {
      console.error('Error refreshing session history:', error)
      throw error
    }

    return sessionHistory || []
  } catch (error) {
    console.error('Failed to refresh session history:', error)
    throw error
  }
}
