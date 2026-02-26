'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface OnboardingPreferencesProps {
  isOpen: boolean
  onComplete: (preferences: UserPreferences) => void
  onSkip: () => void
  isSaving?: boolean
  errorMessage?: string | null
}

interface UserPreferences {
  full_name: string
  learning_level: 'beginner' | 'intermediate' | 'advanced'
  target_language: string
  daily_goal: number
  learning_goal: string
}

const LANGUAGE_OPTIONS = [
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'italian', label: 'Italian' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'korean', label: 'Korean' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'russian', label: 'Russian' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'dutch', label: 'Dutch' },
  { value: 'swedish', label: 'Swedish' },
  { value: 'other', label: 'Other' }
]

const LEARNING_GOALS = [
  { value: 'travel', label: '🌍 Travel & Tourism' },
  { value: 'business', label: '💼 Business & Professional' },
  { value: 'academic', label: '🎓 Academic Study' },
  { value: 'family', label: '👨‍👩‍👧‍👦 Family & Heritage' },
  { value: 'hobby', label: '🎨 Personal Interest' },
  { value: 'career', label: '🚀 Career Development' }
]

export default function OnboardingPreferences({
  isOpen,
  onComplete,
  onSkip,
  isSaving = false,
  errorMessage = null
}: OnboardingPreferencesProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [preferences, setPreferences] = useState<UserPreferences>({
    full_name: '',
    learning_level: 'beginner',
    target_language: '',
    daily_goal: 10,
    learning_goal: ''
  })
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const modal = modalRef.current
    modal?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onSkip()
      }

      if (event.key !== 'Tab' || !modal) {
        return
      }

      const focusableElements = Array.from(
        modal.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter(element => !element.hasAttribute('disabled'))

      if (focusableElements.length === 0) {
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onSkip])

  if (!isOpen) return null

  const handleNext = () => {
    if (isSaving) {
      return
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete(preferences)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return preferences.full_name.trim() !== ''
      case 2:
        return preferences.target_language !== ''
      case 3:
        return preferences.daily_goal > 0 && preferences.learning_goal !== ''
      default:
        return false
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Onboarding preferences"
        tabIndex={-1}
      >
        <div className="p-8">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Step {currentStep} of 3</span>
              <button
                onClick={onSkip}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip setup
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome! Let&apos;s personalize your experience 👋</h2>
                <p className="text-gray-600">Help us customize Fanki for your learning journey</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    What should we call you?
                  </label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Enter your name"
                    value={preferences.full_name}
                    onChange={(e) => setPreferences(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Language & Level */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose your learning path 🎯</h2>
                <p className="text-gray-600">Tell us about your language learning goals</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Which language are you learning?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => setPreferences(prev => ({ ...prev, target_language: lang.value }))}
                        className={`p-3 text-sm rounded-lg border transition-all ${
                          preferences.target_language === lang.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What&apos;s your current level?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'beginner' as const, label: '🌱 Beginner', desc: 'Just starting out' },
                      { value: 'intermediate' as const, label: '🌿 Intermediate', desc: 'Some experience' },
                      { value: 'advanced' as const, label: '🌳 Advanced', desc: 'Quite fluent' }
                    ].map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setPreferences(prev => ({ ...prev, learning_level: level.value }))}
                        className={`p-4 text-center rounded-lg border transition-all ${
                          preferences.learning_level === level.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{level.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{level.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Goals & Daily Target */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Set your goals 🚀</h2>
                <p className="text-gray-600">Let&apos;s create a personalized study plan</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Why are you learning this language?
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {LEARNING_GOALS.map((goal) => (
                      <button
                        key={goal.value}
                        onClick={() => setPreferences(prev => ({ ...prev, learning_goal: goal.value }))}
                        className={`p-3 text-left rounded-lg border transition-all ${
                          preferences.learning_goal === goal.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {goal.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="daily_goal" className="block text-sm font-medium text-gray-700 mb-3">
                    How many new words per day? (Recommended: 5-15)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      id="daily_goal"
                      type="range"
                      min="1"
                      max="30"
                      value={preferences.daily_goal}
                      onChange={(e) => setPreferences(prev => ({ ...prev, daily_goal: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-medium min-w-[3rem] text-center">
                      {preferences.daily_goal}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {preferences.daily_goal <= 5 ? 'Light pace - perfect for busy schedules' :
                     preferences.daily_goal <= 15 ? 'Good balance - steady progress' :
                     'Intensive - rapid learning'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <Button onClick={handlePrev} variant="outline">
                Back
              </Button>
            ) : (
              <div />
            )}
            
            <Button 
              onClick={handleNext}
              disabled={!canProceed() || isSaving}
              className="px-8"
            >
              {isSaving ? 'Saving...' : currentStep === 3 ? 'Complete Setup' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
