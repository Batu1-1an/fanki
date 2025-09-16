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
      started_at: new Date().toISOString(),
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
 * Get study session statistics
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

    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    if (error) {
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

    const totalSessions = sessions?.length || 0
    const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0
    
    const totalTimeMinutes = sessions?.reduce((total, session) => {
      return total + (session.session_duration_seconds || 0) / 60
    }, 0) || 0

    const completedWithAccuracy = sessions?.filter(s => 
      s.status === 'completed' && s.accuracy_percentage !== null
    ) || []
    
    const averageAccuracy = completedWithAccuracy.length > 0
      ? completedWithAccuracy.reduce((sum, s) => sum + (s.accuracy_percentage || 0), 0) / completedWithAccuracy.length
      : 0

    const totalWordsStudied = sessions?.reduce((total, session) => {
      return total + (session.words_studied || 0)
    }, 0) || 0

    // Calculate streaks (consecutive days with completed sessions)
    const completedByDate = new Map<string, boolean>()
    sessions?.forEach(session => {
      if (session.status === 'completed' && session.ended_at) {
        const date = session.ended_at.split('T')[0]
        completedByDate.set(date, true)
      }
    })

    const sortedDates = Array.from(completedByDate.keys()).sort().reverse()
    
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    const today = new Date().toISOString().split('T')[0]
    let checkDate = new Date()
    
    // Calculate current streak
    for (let i = 0; i < 365; i++) { // Check up to a year back
      const dateStr = checkDate.toISOString().split('T')[0]
      if (completedByDate.has(dateStr)) {
        if (dateStr <= today) {
          currentStreak++
        }
      } else {
        break
      }
      checkDate.setDate(checkDate.getDate() - 1)
    }

    // Calculate longest streak
    for (const date of sortedDates) {
      if (completedByDate.has(date)) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    return {
      totalSessions,
      completedSessions,
      totalTimeMinutes: Math.round(totalTimeMinutes),
      averageAccuracy: Math.round(averageAccuracy),
      totalWordsStudied,
      currentStreak,
      longestStreak
    }
  } catch (error) {
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
