'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { User } from '@supabase/supabase-js'
import { useOnboarding } from '@/hooks/useOnboarding'
import WelcomeTour from '@/components/onboarding/WelcomeTour'
import OnboardingPreferences from '@/components/onboarding/OnboardingPreferences'
import FirstWordTutorial from '@/components/onboarding/FirstWordTutorial'
import AddWordModal from '@/components/words/AddWordModal'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QueuedWord } from '@/lib/queue-manager'
import { Sparkles, LayoutDashboard } from 'lucide-react'

const ModernDashboard = dynamic(
  () => import('@/components/dashboard/ModernDashboard').then(mod => ({ default: mod.ModernDashboard })),
  { loading: () => <div className="h-96 animate-pulse rounded-lg bg-muted" /> }
)

const StudySessionDashboard = dynamic(
  () => import('@/components/dashboard/StudySessionDashboard').then(mod => ({ default: mod.StudySessionDashboard })),
  { loading: () => <div className="h-96 animate-pulse rounded-lg bg-muted" /> }
)

interface DashboardClientProps {
  user: User
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const { 
    onboardingState, 
    loading, 
    completeTour, 
    savePreferences, 
    skipPreferences,
    markFirstWordAdded 
  } = useOnboarding()

  const [showTour, setShowTour] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [showFirstWordTutorial, setShowFirstWordTutorial] = useState(false)
  const [firstWordTutorialDismissed, setFirstWordTutorialDismissed] = useState(false)
  const [showAddWordModal, setShowAddWordModal] = useState(false)
  const [activeStudySession, setActiveStudySession] = useState<{
    words: QueuedWord[]
    sessionId: string
  } | null>(null)
  const [useModernDashboard, setUseModernDashboard] = useState(true)
  const [preferencesError, setPreferencesError] = useState<string | null>(null)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)

  // Load user's dashboard preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem('fanki-dashboard-view')
      if (savedPreference === 'classic') {
        setUseModernDashboard(false)
      }
    }
  }, [])

  // Save user's dashboard preference to localStorage
  const toggleDashboard = () => {
    const newValue = !useModernDashboard
    setUseModernDashboard(newValue)
    if (typeof window !== 'undefined') {
      localStorage.setItem('fanki-dashboard-view', newValue ? 'modern' : 'classic')
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('fanki-first-word-tutorial-dismissed') === 'true') {
      setFirstWordTutorialDismissed(true)
    }
  }, [])

  // Show appropriate onboarding step when ready
  useEffect(() => {
    if (loading || onboardingState.currentStep === 'complete') {
      return
    }

    const timeoutId = setTimeout(() => {
      setShowTour(false)
      setShowPreferences(false)
      setShowFirstWordTutorial(false)

      switch (onboardingState.currentStep) {
        case 'tour':
          setShowTour(true)
          break
        case 'preferences':
          setShowPreferences(true)
          break
        case 'first-word':
          if (!firstWordTutorialDismissed) {
            setShowFirstWordTutorial(true)
          }
          break
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [loading, onboardingState.currentStep, firstWordTutorialDismissed])


  const handleTourComplete = () => {
    completeTour()
    setShowTour(false)
    if (!onboardingState.hasSetPreferences) {
      setTimeout(() => setShowPreferences(true), 300)
    }
  }

  const handlePreferencesComplete = async (preferences: any) => {
    setIsSavingPreferences(true)
    setPreferencesError(null)
    const success = await savePreferences(preferences)
    if (success) {
      setShowPreferences(false)
      if (!onboardingState.hasAddedFirstWord) {
        setTimeout(() => setShowFirstWordTutorial(true), 300)
      }
    } else {
      setPreferencesError('Could not save your preferences. Please check your connection and try again.')
    }
    setIsSavingPreferences(false)
  }

  const handleFirstWordTutorialComplete = () => {
    setShowFirstWordTutorial(false)
    setShowAddWordModal(true)
  }

  const handleFirstWordTutorialClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fanki-first-word-tutorial-dismissed', 'true')
    }
    setFirstWordTutorialDismissed(true)
    setShowFirstWordTutorial(false)
  }

  const handleWordAdded = () => {
    markFirstWordAdded()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <DashboardLayout 
        user={user}
        currentPath="/dashboard"
        title="Dashboard"
        description={`Welcome back, ${user.user_metadata?.full_name || user.email}`}
        focusMode={!!activeStudySession}
      >
        <div className="h-full">
          {/* Show onboarding flow for new users, comprehensive dashboard for existing users */}
          {onboardingState.currentStep !== 'complete' ? (
            /* Show simplified onboarding message */
            <div className="p-6 max-w-4xl mx-auto">
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Welcome to Fanki! 🎉</h2>
                <p className="text-muted-foreground mb-8">
                  Let&apos;s get you set up to start your learning journey
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6" data-tour="stats-cards">
                  <div className="rounded-lg border p-3 text-sm text-muted-foreground">Track due cards</div>
                  <div className="rounded-lg border p-3 text-sm text-muted-foreground" data-tour="study-button">Start daily study</div>
                  <div className="rounded-lg border p-3 text-sm text-muted-foreground" data-tour="progress-button">View progress</div>
                </div>
                <Button 
                  onClick={() => {
                    if (onboardingState.currentStep === 'first-word') {
                      setShowAddWordModal(true)
                    } else if (onboardingState.currentStep === 'preferences') {
                      setShowPreferences(true)
                    } else {
                      setShowTour(true)
                    }
                  }}
                  className="gap-2"
                  data-tour="add-word-button"
                >
                  {onboardingState.currentStep === 'first-word' ? 'Add Your First Word' : 'Get Started'}
                </Button>
              </div>
            </div>
          ) : (
            /* Show comprehensive dashboard for users who completed onboarding */
            <div className="relative">
              {/* Dashboard Toggle Button */}
              <div className="flex justify-end mb-3 sm:mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleDashboard}
                  className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
                >
                  {useModernDashboard ? (
                    <>
                      <LayoutDashboard className="w-4 h-4" />
                      Classic View
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Modern View
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1">New</Badge>
                    </>
                  )}
                </Button>
              </div>

              {useModernDashboard ? (
                <ModernDashboard
                  activeSession={activeStudySession}
                  onActiveSessionChange={setActiveStudySession}
                  userId={user.id}
                />
              ) : (
                <StudySessionDashboard 
                  activeSession={activeStudySession}
                  onActiveSessionChange={setActiveStudySession}
                  userId={user.id}
                />
              )}
            </div>
          )}
        </div>
      </DashboardLayout>

      {/* Onboarding Components */}
      <WelcomeTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onComplete={handleTourComplete}
      />
      
      <OnboardingPreferences
        isOpen={showPreferences}
        onComplete={handlePreferencesComplete}
        isSaving={isSavingPreferences}
        errorMessage={preferencesError}
        onSkip={async () => {
          setShowPreferences(false)
          await skipPreferences()
        }}
      />
      
      <FirstWordTutorial
        isOpen={showFirstWordTutorial}
        onClose={handleFirstWordTutorialClose}
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
