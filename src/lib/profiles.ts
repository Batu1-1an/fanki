import { createClientComponentClient } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/auth'

export interface UserProfile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  learning_level: 'beginner' | 'intermediate' | 'advanced'
  target_language: string
  daily_goal: number
  timezone: string
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UpdateProfileData {
  username?: string
  full_name?: string
  avatar_url?: string
  learning_level?: 'beginner' | 'intermediate' | 'advanced'
  target_language?: string
  daily_goal?: number
  timezone?: string
  preferences?: Record<string, any>
}

/**
 * Get the current user's profile
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClientComponentClient()
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

/**
 * Create or update user profile
 */
export async function upsertUserProfile(profileData: Partial<UpdateProfileData>): Promise<UserProfile | null> {
  const supabase = createClientComponentClient()
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const updateData = {
    ...profileData,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      ...updateData
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting user profile:', error)
    throw error
  }

  return data
}

/**
 * Update user profile
 */
export async function updateUserProfile(profileData: UpdateProfileData): Promise<UserProfile | null> {
  const supabase = createClientComponentClient()
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const updateData = {
    ...profileData,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }

  return data
}

/**
 * Initialize profile for new user
 */
export async function initializeUserProfile(): Promise<UserProfile | null> {
  const supabase = createClientComponentClient()
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if profile already exists
  const existingProfile = await getUserProfile()
  if (existingProfile) {
    return existingProfile
  }

  // Create new profile with defaults
  const defaultProfile = {
    id: user.id,
    full_name: user.user_metadata?.full_name || '',
    learning_level: 'beginner' as const,
    target_language: 'en',
    daily_goal: 20,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    preferences: {}
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert(defaultProfile)
    .select()
    .single()

  if (error) {
    console.error('Error initializing user profile:', error)
    throw error
  }

  return data
}

/**
 * Get user statistics summary
 */
export async function getUserStatistics(): Promise<{
  totalWords: number
  totalReviews: number
  studyStreak: number
  averageAccuracy: number
}> {
  const supabase = createClientComponentClient()
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      totalWords: 0,
      totalReviews: 0,
      studyStreak: 0,
      averageAccuracy: 0
    }
  }

  // Get total words
  const { count: totalWords } = await supabase
    .from('words')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get total reviews
  const { count: totalReviews } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get recent completed study sessions for streak calculation
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('ended_at, status, words_correct, words_studied')
    .eq('user_id', user.id)
    .order('ended_at', { ascending: false })

  // Calculate study streak (consecutive days with completed study sessions)
  const studyStreak = await calculateStudyStreak(sessions || [])

  // Calculate average accuracy
  const totalCorrect = sessions?.reduce((sum, session) => sum + (session.words_correct || 0), 0) || 0
  const totalStudied = sessions?.reduce((sum, session) => sum + (session.words_studied || 0), 0) || 0
  const averageAccuracy = totalStudied > 0 ? Math.round((totalCorrect / totalStudied) * 100) : 0

  return {
    totalWords: totalWords || 0,
    totalReviews: totalReviews || 0,
    studyStreak,
    averageAccuracy
  }
}

/**
 * Calculate study streak based on study sessions (completed only)
 */
async function calculateStudyStreak(sessions: Array<{ ended_at?: string; status?: string }>): Promise<number> {
  if (!sessions || sessions.length === 0) return 0

  const supabase = createClientComponentClient()
  const user = await getCurrentUser()
  // Get timezone
  let timeZone = 'UTC'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .single()
    timeZone = profile?.timezone || 'UTC'
  }

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
  const addDaysISO = (isoDate: string, days: number): string => {
    const d = new Date(isoDate + 'T00:00:00.000Z')
    d.setUTCDate(d.getUTCDate() + days)
    return d.toISOString().split('T')[0]
  }

  // Index completed session days in user's timezone
  const completedDays = new Set(
    sessions
      .filter(s => s.status === 'completed' && s.ended_at)
      .map(s => formatDateInTimeZone(new Date(s.ended_at as string), timeZone))
  )

  // Walk back from today while dates exist
  let streak = 0
  let probe = formatDateInTimeZone(new Date(), timeZone)
  for (let i = 0; i < 365; i++) {
    if (completedDays.has(probe)) {
      streak++
      probe = addDaysISO(probe, -1)
    } else {
      break
    }
  }
  return streak
}

/**
 * Get available timezones for selection
 */
export function getAvailableTimezones(): Array<{ value: string; label: string }> {
  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Istanbul',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Australia/Sydney',
    'Australia/Melbourne'
  ]

  return timezones.map(tz => ({
    value: tz,
    label: tz.replace('_', ' ').replace('/', ' / ')
  }))
}

/**
 * Get available languages for selection
 */
export function getAvailableLanguages(): Array<{ value: string; label: string }> {
  return [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ru', label: 'Russian' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ar', label: 'Arabic' },
    { value: 'hi', label: 'Hindi' },
    { value: 'tr', label: 'Turkish' }
  ]
}
