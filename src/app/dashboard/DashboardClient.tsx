'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth'
import { useOnboarding } from '@/hooks/useOnboarding'
import { getWordStats } from '@/lib/words'
import WelcomeTour from '@/components/onboarding/WelcomeTour'
import OnboardingPreferences from '@/components/onboarding/OnboardingPreferences'
import FirstWordTutorial from '@/components/onboarding/FirstWordTutorial'
import AddWordModal from '@/components/words/AddWordModal'

interface DashboardClientProps {
  user: User
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const { 
    onboardingState, 
    loading, 
    completeTour, 
    savePreferences, 
    markFirstWordAdded 
  } = useOnboarding()

  const [showTour, setShowTour] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [showFirstWordTutorial, setShowFirstWordTutorial] = useState(false)
  const [showAddWordModal, setShowAddWordModal] = useState(false)
  const [wordStats, setWordStats] = useState({
    total: 0,
    byDifficulty: {} as Record<number, number>,
    byCategory: {} as Record<string, number>,
    recentCount: 0
  })

  // Load word statistics
  useEffect(() => {
    const loadWordStats = async () => {
      const stats = await getWordStats()
      setWordStats(stats)
    }
    
    if (!loading) {
      loadWordStats()
    }
  }, [loading])

  // Show appropriate onboarding step when ready
  useState(() => {
    if (!loading && onboardingState.currentStep !== 'complete') {
      setTimeout(() => {
        switch (onboardingState.currentStep) {
          case 'tour':
            setShowTour(true)
            break
          case 'preferences':
            setShowPreferences(true)
            break
          case 'first-word':
            setShowFirstWordTutorial(true)
            break
        }
      }, 500) // Small delay for better UX
    }
  })

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleTourComplete = () => {
    completeTour()
    setShowTour(false)
    if (!onboardingState.hasSetPreferences) {
      setTimeout(() => setShowPreferences(true), 300)
    }
  }

  const handlePreferencesComplete = async (preferences: any) => {
    const success = await savePreferences(preferences)
    if (success) {
      setShowPreferences(false)
      if (!onboardingState.hasAddedFirstWord) {
        setTimeout(() => setShowFirstWordTutorial(true), 300)
      }
    }
  }

  const handleFirstWordTutorialComplete = () => {
    setShowFirstWordTutorial(false)
    setShowAddWordModal(true)
  }

  const handleWordAdded = () => {
    // Reload word stats after adding a word
    const loadWordStats = async () => {
      const stats = await getWordStats()
      setWordStats(stats)
    }
    loadWordStats()
    markFirstWordAdded()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">
                  Welcome back, {user.user_metadata?.full_name || user.email}
                </p>
              </div>
              <div>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" data-tour="stats-cards">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
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
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Words Learned
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
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Due Today
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          0
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
                          Current Streak
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          0 days
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main content area */}
            <div className="mt-8">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Button 
                      className="h-20 flex-col" 
                      data-tour="add-word-button"
                      onClick={() => {
                        if (onboardingState.currentStep === 'first-word') {
                          setShowAddWordModal(true)
                        } else {
                          window.location.href = '/dashboard/words'
                        }
                      }}
                    >
                      <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New Word
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col" 
                      data-tour="study-button"
                      onClick={() => {
                        if (wordStats.total === 0) {
                          // If no words, prompt to add words first
                          alert('Add some words first to start studying!')
                        } else {
                          // Navigate to study session
                          window.location.href = '/study'
                        }
                      }}
                    >
                      <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Study Now
                    </Button>
                    <Button variant="outline" className="h-20 flex-col" data-tour="progress-button">
                      <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      View Progress
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic onboarding content */}
            {onboardingState.currentStep === 'complete' ? (
              /* Show normal welcome content after onboarding */
              <div className="mt-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-green-900 mb-2">You're all set! 🚀</h3>
                  <p className="text-green-800 mb-4">
                    Your learning journey begins now. Add your first word to start creating AI-powered flashcards.
                  </p>
                  <Button 
                    onClick={() => setShowTour(true)}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    Take tour again
                  </Button>
                </div>
              </div>
            ) : (
              /* Show onboarding progress */
              <div className="mt-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-blue-900 mb-4">Getting Started 🎯</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-xs font-bold ${
                        onboardingState.hasCompletedTour ? 'bg-green-500 text-white' : 'bg-blue-200 text-blue-800'
                      }`}>
                        {onboardingState.hasCompletedTour ? '✓' : '1'}
                      </div>
                      <span className={`text-sm ${onboardingState.hasCompletedTour ? 'text-green-800' : 'text-blue-800'}`}>
                        Take the welcome tour
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-xs font-bold ${
                        onboardingState.hasSetPreferences ? 'bg-green-500 text-white' : 'bg-blue-200 text-blue-800'
                      }`}>
                        {onboardingState.hasSetPreferences ? '✓' : '2'}
                      </div>
                      <span className={`text-sm ${onboardingState.hasSetPreferences ? 'text-green-800' : 'text-blue-800'}`}>
                        Set your learning preferences
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-xs font-bold ${
                        onboardingState.hasAddedFirstWord ? 'bg-green-500 text-white' : 'bg-blue-200 text-blue-800'
                      }`}>
                        {onboardingState.hasAddedFirstWord ? '✓' : '3'}
                      </div>
                      <span className={`text-sm ${onboardingState.hasAddedFirstWord ? 'text-green-800' : 'text-blue-800'}`}>
                        Add your first word
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Onboarding Components */}
      <WelcomeTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={handleTourComplete}
      />
      
      <OnboardingPreferences
        isOpen={showPreferences}
        onComplete={handlePreferencesComplete}
        onSkip={() => setShowPreferences(false)}
      />
      
      <FirstWordTutorial
        isOpen={showFirstWordTutorial}
        onClose={() => setShowFirstWordTutorial(false)}
        onComplete={handleFirstWordTutorialComplete}
      />
      
      <AddWordModal
        isOpen={showAddWordModal}
        onClose={() => setShowAddWordModal(false)}
        onWordAdded={handleWordAdded}
      />
    </>
  )
}
