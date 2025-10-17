'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { useOnboarding } from '@/hooks/useOnboarding'
import { getWordStats } from '@/lib/words'
import WelcomeTour from '@/components/onboarding/WelcomeTour'
import OnboardingPreferences from '@/components/onboarding/OnboardingPreferences'
import FirstWordTutorial from '@/components/onboarding/FirstWordTutorial'
import AddWordModal from '@/components/words/AddWordModal'
import { StudySessionDashboard } from '@/components/dashboard/StudySessionDashboard'
import { ModernDashboard } from '@/components/dashboard/ModernDashboard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QueuedWord } from '@/lib/queue-manager'
import { Sparkles, LayoutDashboard } from 'lucide-react'

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
  const [firstWordTutorialDismissed, setFirstWordTutorialDismissed] = useState(false)
  const [showAddWordModal, setShowAddWordModal] = useState(false)
  const [activeStudySession, setActiveStudySession] = useState<{
    words: QueuedWord[]
    sessionId: string
  } | null>(null)
  const [wordStats, setWordStats] = useState({
    total: 0,
    byDifficulty: {} as Record<number, number>,
    byCategory: {} as Record<string, number>,
    recentCount: 0
  })
  const [useModernDashboard, setUseModernDashboard] = useState(true)

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

  // Load word statistics (now optimized with database function)
  useEffect(() => {
    const loadWordStats = async () => {
      try {
        const stats = await getWordStats()
        setWordStats(stats)
      } catch (error) {
        console.error('Failed to load word stats:', error)
      }
    }
    
    if (!loading) {
      loadWordStats()
    }
  }, [loading])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('fanki-first-word-tutorial-dismissed') === 'true') {
      setFirstWordTutorialDismissed(true)
    }
  }, [])

  // Show appropriate onboarding step when ready
  useEffect(() => {
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
            if (!firstWordTutorialDismissed) {
              setShowFirstWordTutorial(true)
            }
            break
        }
      }, 500) // Small delay for better UX
    }
  }, [loading, onboardingState.currentStep, firstWordTutorialDismissed])


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

  const handleFirstWordTutorialClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fanki-first-word-tutorial-dismissed', 'true')
    }
    setFirstWordTutorialDismissed(true)
    setShowFirstWordTutorial(false)
  }

  const handleWordAdded = () => {
    // Reload word stats after adding a word
    const loadWordStats = async () => {
      try {
        const stats = await getWordStats()
        setWordStats(stats)
      } catch (error) {
        console.error('Failed to reload word stats:', error)
      }
    }
    loadWordStats()
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
                <Button 
                  onClick={() => {
                    if (onboardingState.currentStep === 'first-word') {
                      setShowAddWordModal(true)
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
              <div className="absolute top-4 right-4 z-10">
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
        onSkip={() => setShowPreferences(false)}
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
