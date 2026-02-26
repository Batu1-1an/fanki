'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
// Using inline SVG icons instead of lucide-react

interface FirstWordTutorialProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export default function FirstWordTutorial({ isOpen, onClose, onComplete }: FirstWordTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const steps = [
    {
      title: "Let's add your first word! 🌟",
      content: "This is where the magic happens. Our AI will create personalized flashcards with sentences, images, and audio.",
      highlightTarget: 'add-word-button',
      action: "I'll click Add New Word"
    },
    {
      title: "AI-Generated Content",
      content: "For each word, you'll get:\n• 3 practice sentences with blanks\n• A memorable image\n• Native pronunciation audio\n• Spaced repetition scheduling",
      action: "That sounds amazing!"
    },
    {
      title: "Smart Learning Algorithm",
      content: "Our SM-2 algorithm learns from your performance and schedules reviews at optimal intervals for maximum retention.",
      action: "Let's start learning!"
    }
  ]

  const currentStepData = steps[currentStep]

  useEffect(() => {
    if (!isOpen || currentStep !== 0) {
      setTargetRect(null)
      return
    }

    const updateTargetRect = () => {
      const target = document.querySelector('[data-tour="add-word-button"]') as HTMLElement | null
      if (!target) {
        setTargetRect(null)
        return
      }

      setTargetRect(target.getBoundingClientRect())
    }

    updateTargetRect()
    window.addEventListener('resize', updateTargetRect)
    window.addEventListener('scroll', updateTargetRect, true)

    return () => {
      window.removeEventListener('resize', updateTargetRect)
      window.removeEventListener('scroll', updateTargetRect, true)
    }
  }, [isOpen, currentStep])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const modal = modalRef.current
    modal?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
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
  }, [isOpen, onClose])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-30" />
      
      {/* Highlight spotlight for add word button */}
      {currentStep === 0 && targetRect && (
        <>
          <div className="fixed z-40 animate-bounce pointer-events-none" style={{
            top: `${Math.max(16, targetRect.top - 72)}px`,
            left: `${targetRect.left + targetRect.width / 2}px`,
            transform: 'translateX(-50%)'
          }}>
            <div className="bg-yellow-400 text-black px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              Click here to add your first word! ✨
            </div>
            <svg className="w-6 h-6 mx-auto mt-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          
          {/* Pulsing highlight around add word button */}
          <div className="fixed z-40 pointer-events-none" style={{
            top: `${Math.max(0, targetRect.top - 8)}px`,
            left: `${Math.max(0, targetRect.left - 8)}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`
          }}>
            <div className="w-full h-full border-4 border-yellow-400 rounded-xl shadow-2xl animate-pulse bg-yellow-400/20" />
          </div>
        </>
      )}

      {/* Tutorial modal */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-4">
        <div
          ref={modalRef}
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-auto"
          role="dialog"
          aria-modal="true"
          aria-label="First word tutorial"
          tabIndex={-1}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{currentStepData.title}</h3>
                  <div className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                {currentStepData.content}
              </p>
            </div>

            {/* Special content for step 1 */}
            {currentStep === 1 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">📝</span>
                    <span>Practice sentences</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🖼️</span>
                    <span>Visual memory aids</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🔊</span>
                    <span>Native pronunciation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🧠</span>
                    <span>Smart scheduling</span>
                  </div>
                </div>
              </div>
            )}

            {/* Progress dots */}
            <div className="flex justify-center space-x-2 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Action button */}
            <Button 
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {currentStepData.action}
            </Button>

            {/* Skip option */}
            <div className="mt-4 text-center">
              <button
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip tutorial
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
