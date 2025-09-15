'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface UserPreferences {
  full_name: string
  learning_level: 'beginner' | 'intermediate' | 'advanced'
  target_language: string
  daily_goal: number
  learning_goal: string
}

interface OnboardingState {
  hasCompletedTour: boolean
  hasSetPreferences: boolean
  hasAddedFirstWord: boolean
  currentStep: 'tour' | 'preferences' | 'first-word' | 'complete'
}

export function useOnboarding() {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasCompletedTour: false,
    hasSetPreferences: false,
    hasAddedFirstWord: false,
    currentStep: 'tour'
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Check onboarding status on mount
  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // Check if user has completed onboarding steps
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      const { data: wordsCount } = await supabase
        .from('words')
        .select('id', { count: 'exact' })
        .eq('user_id', session.user.id)

      const hasSetPreferences = !!profile?.learning_level && !!profile?.target_language
      const hasAddedFirstWord = (wordsCount?.length || 0) > 0
      
      // Get tour completion from localStorage
      const hasCompletedTour = localStorage.getItem('fanki-tour-completed') === 'true'

      let currentStep: OnboardingState['currentStep'] = 'complete'
      if (!hasCompletedTour) {
        currentStep = 'tour'
      } else if (!hasSetPreferences) {
        currentStep = 'preferences'
      } else if (!hasAddedFirstWord) {
        currentStep = 'first-word'
      }

      setOnboardingState({
        hasCompletedTour,
        hasSetPreferences,
        hasAddedFirstWord,
        currentStep
      })
    } catch (error) {
      console.error('Error checking onboarding status:', error)
    } finally {
      setLoading(false)
    }
  }

  const completeTour = async () => {
    localStorage.setItem('fanki-tour-completed', 'true')
    setOnboardingState(prev => ({
      ...prev,
      hasCompletedTour: true,
      currentStep: prev.hasSetPreferences ? (prev.hasAddedFirstWord ? 'complete' : 'first-word') : 'preferences'
    }))
  }

  const savePreferences = async (preferences: UserPreferences) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('No authenticated user')

      // Update or create user profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: preferences.full_name,
          learning_level: preferences.learning_level,
          target_language: preferences.target_language,
          daily_goal: preferences.daily_goal,
          preferences: {
            learning_goal: preferences.learning_goal,
            onboarding_completed_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setOnboardingState(prev => ({
        ...prev,
        hasSetPreferences: true,
        currentStep: prev.hasAddedFirstWord ? 'complete' : 'first-word'
      }))

      return true
    } catch (error) {
      console.error('Error saving preferences:', error)
      return false
    }
  }

  const markFirstWordAdded = () => {
    setOnboardingState(prev => ({
      ...prev,
      hasAddedFirstWord: true,
      currentStep: 'complete'
    }))
  }

  const resetOnboarding = () => {
    localStorage.removeItem('fanki-tour-completed')
    setOnboardingState({
      hasCompletedTour: false,
      hasSetPreferences: false,
      hasAddedFirstWord: false,
      currentStep: 'tour'
    })
  }

  const isOnboardingComplete = onboardingState.currentStep === 'complete'

  return {
    onboardingState,
    loading,
    completeTour,
    savePreferences,
    markFirstWordAdded,
    resetOnboarding,
    isOnboardingComplete,
    checkOnboardingStatus
  }
}
