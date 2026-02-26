'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface TourStep {
  id: string
  title: string
  content: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  action?: {
    text: string
    onClick: () => void
  }
}

interface WelcomeTourProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Fanki! 🎉',
    content: 'Your AI-powered language learning companion. Let\'s take a quick tour to get you started.',
  },
  {
    id: 'dashboard',
    title: 'Your Learning Dashboard',
    content: 'Here you\'ll see your progress - words learned, current streaks, and cards due for review.',
    target: 'stats-cards'
  },
  {
    id: 'add-word',
    title: 'Add Your First Word',
    content: 'Click here to add words. Our AI will generate flashcards with sentences, images, and audio.',
    target: 'add-word-button',
    position: 'top'
  },
  {
    id: 'study',
    title: 'Study & Review',
    content: 'Use spaced repetition to maximize retention. The algorithm adapts to your learning pace.',
    target: 'study-button',
    position: 'top'
  },
  {
    id: 'progress',
    title: 'Track Your Progress',
    content: 'Monitor your learning journey with detailed statistics and achievements.',
    target: 'progress-button',
    position: 'top'
  }
]

export default function WelcomeTour({ isOpen, onClose, onComplete }: WelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const availableSteps = useMemo(() => {
    if (!isOpen || typeof document === 'undefined') {
      return tourSteps
    }

    return tourSteps.filter(step => {
      if (!step.target) {
        return true
      }

      return Boolean(document.querySelector(`[data-tour="${step.target}"]`))
    })
  }, [isOpen])

  useEffect(() => {
    if (currentStep >= availableSteps.length) {
      setCurrentStep(Math.max(0, availableSteps.length - 1))
    }
  }, [availableSteps, currentStep])

  useEffect(() => {
    if (isOpen && availableSteps[currentStep]?.target) {
      const element = document.querySelector(`[data-tour="${availableSteps[currentStep].target}"]`)
      setHighlightedElement(element)
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } else {
      setHighlightedElement(null)
    }
  }, [currentStep, isOpen, availableSteps])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const modal = modalRef.current
    modal?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleSkip()
        return
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
  }, [isOpen])

  const nextStep = () => {
    if (currentStep < availableSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setHighlightedElement(null)
    onComplete()
    onClose()
  }

  const handleSkip = () => {
    setHighlightedElement(null)
    onComplete()
    onClose()
  }

  if (!isOpen) return null

  const step = availableSteps[currentStep]

  if (!step) {
    return null
  }

  return (
    <>
      {/* Overlay backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" />
      
      {/* Highlight spotlight */}
      {highlightedElement && (
        <div
          className="fixed z-45 border-4 border-blue-400 rounded-lg shadow-xl animate-pulse"
          style={{
            top: highlightedElement.getBoundingClientRect().top - 8,
            left: highlightedElement.getBoundingClientRect().left - 8,
            width: highlightedElement.getBoundingClientRect().width + 16,
            height: highlightedElement.getBoundingClientRect().height + 16,
          }}
        />
      )}

      {/* Tour modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          ref={modalRef}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Welcome tour"
          tabIndex={-1}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {currentStep + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <p className="text-gray-600 mb-6">{step.content}</p>

            {/* Action button if present */}
            {step.action && (
              <div className="mb-4">
                <Button
                  onClick={step.action.onClick}
                  className="w-full"
                  variant="outline"
                >
                  {step.action.text}
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                {availableSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <Button onClick={prevStep} variant="outline" size="sm">
                    Back
                  </Button>
                )}
                <Button onClick={nextStep} size="sm">
                  {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </div>
            </div>

            {/* Skip option */}
            <div className="mt-4 text-center">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip tour
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
