import { createClientComponentClient } from './supabase'
import { StudySession, SessionType, TablesInsert, TablesUpdate } from '@/types'
import { ExtendedStudySession, ExtendedStudySessionInsert, ExtendedStudySessionUpdate, SessionStatus } from '@/types/study-sessions'

const supabase = createClientComponentClient()

/**
 * Create a new study session in the database
 */
export async function createStudySession({
  sessionType
}: {
  sessionType: SessionType
}): Promise<{ data: ExtendedStudySession | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const sessionData: ExtendedStudySessionInsert = {
      user_id: user.id,
      session_type: sessionType,
      created_at: new Date().toISOString(),
      status: 'active'
    }

    const { data, error } = await supabase
      .from('study_sessions')
      .insert(sessionData)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Update study session progress
 */
export async function updateStudySession(
  sessionId: string,
  updates: {
    wordsStudied?: number
    wordsCorrect?: number
    totalReviews?: number
    accuracyPercentage?: number
  }
): Promise<{ data: ExtendedStudySession | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const updateData: ExtendedStudySessionUpdate = {
      words_studied: updates.wordsStudied,
      words_correct: updates.wordsCorrect,
      total_reviews: updates.totalReviews
    }

    const { data, error } = await supabase
      .from('study_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Complete a study session
 */
export async function completeStudySession(
  sessionId: string,
  completion: {
    wordsStudied: number
    wordsCorrect: number
    totalReviews: number
    sessionDurationSeconds: number
    accuracyPercentage: number
    endedAt?: string
  }
): Promise<{ data: ExtendedStudySession | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const updateData: ExtendedStudySessionUpdate = {
      words_studied: completion.wordsStudied,
      words_correct: completion.wordsCorrect,
      total_reviews: completion.totalReviews,
      session_duration_seconds: completion.sessionDurationSeconds,
      status: 'completed',
      ended_at: completion.endedAt || new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('study_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Pause a study session
 */
export async function pauseStudySession(sessionId: string): Promise<{ error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('study_sessions')
      .update({
        status: 'paused',
        paused_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)

    return { error }
  } catch (error) {
    return { error }
  }
}

/**
 * Resume a paused study session
 */
export async function resumeStudySession(sessionId: string): Promise<{ error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('study_sessions')
      .update({
        status: 'active',
        resumed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)

    return { error }
  } catch (error) {
    return { error }
  }
}

/**
 * Abandon a study session
 */
export async function abandonStudySession(sessionId: string): Promise<{ error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'User not authenticated' }
    }

    // Mark session as abandoned
    const updateData: ExtendedStudySessionUpdate = {
      status: 'abandoned',
      ended_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('study_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', user.id)

    return { error }
  } catch (error) {
    return { error }
  }
}

/**
 * Get active study session for user
 */
export async function getActiveStudySession(): Promise<{
  data: ExtendedStudySession | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    // Get most recent session that is active or paused
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'paused'])
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get study session history
 */
export async function getStudySessionHistory(limit: number = 20): Promise<{
  data: ExtendedStudySession[] | null
  error: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit)

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * Get study session statistics (optimized with database function)
 */
export async function getStudySessionStats(): Promise<{
  totalSessions: number
  completedSessions: number
  totalTimeMinutes: number
  averageAccuracy: number
  totalWordsStudied: number
  currentStreak: number
  longestStreak: number
  error?: any
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        totalSessions: 0,
        completedSessions: 0,
        totalTimeMinutes: 0,
        averageAccuracy: 0,
        totalWordsStudied: 0,
        currentStreak: 0,
        longestStreak: 0,
        error: 'User not authenticated'
      }
    }

    // Use optimized database function
    const { data: stats, error } = await supabase
      .rpc('get_user_study_session_stats', { p_user_id: user.id })

    if (error) {
      console.error('Error fetching study session stats:', error)
      return {
        totalSessions: 0,
        completedSessions: 0,
        totalTimeMinutes: 0,
        averageAccuracy: 0,
        totalWordsStudied: 0,
        currentStreak: 0,
        longestStreak: 0,
        error
      }
    }

    return {
      totalSessions: stats?.totalSessions || 0,
      completedSessions: stats?.completedSessions || 0,
      totalTimeMinutes: stats?.totalTimeMinutes || 0,
      averageAccuracy: stats?.averageAccuracy || 0,
      totalWordsStudied: stats?.totalWordsStudied || 0,
      currentStreak: stats?.currentStreak || 0,
      longestStreak: stats?.longestStreak || 0
    }
  } catch (error) {
    console.error('Failed to get study session stats:', error)
    return {
      totalSessions: 0,
      completedSessions: 0,
      totalTimeMinutes: 0,
      averageAccuracy: 0,
      totalWordsStudied: 0,
      currentStreak: 0,
      longestStreak: 0,
      error
    }
  }
}
