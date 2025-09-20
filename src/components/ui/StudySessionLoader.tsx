'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Lightbulb, 
  Target, 
  Zap,
  BookOpen,
  Timer,
  TrendingUp
} from 'lucide-react'

interface StudySessionLoaderProps {
  isVisible: boolean
  onComplete?: () => void
}

const loadingTips = [
  {
    icon: Brain,
    title: "Active Recall",
    text: "Try to answer before revealing the solution - it strengthens memory formation."
  },
  {
    icon: Lightbulb,
    title: "Spaced Learning",
    text: "Regular short sessions are more effective than cramming everything at once."
  },
  {
    icon: Target,
    title: "Focus Mode",
    text: "Concentrate fully on each card - quality over quantity for better retention."
  },
  {
    icon: Zap,
    title: "Quick Reviews",
    text: "Don't overthink - your first instinct is usually correct for familiar words."
  },
  {
    icon: BookOpen,
    title: "Context Clues",
    text: "Use the example sentences to understand how words are used naturally."
  },
  {
    icon: Timer,
    title: "Consistent Practice",
    text: "Daily practice, even for 5-10 minutes, builds lasting vocabulary knowledge."
  }
]

export function StudySessionLoader({ isVisible, onComplete }: StudySessionLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [stage, setStage] = useState('preparing') // 'preparing', 'fetching', 'ready'

  useEffect(() => {
    if (!isVisible) {
      setProgress(0)
      setStage('preparing')
      return
    }

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev < 20) {
          setStage('preparing')
          return prev + 4
        } else if (prev < 80) {
          setStage('fetching')
          return prev + 6
        } else if (prev < 100) {
          setStage('ready')
          return prev + 8
        }
        return 100
      })
    }, 120)

    // Rotate tips every 2 seconds
    const tipTimer = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % loadingTips.length)
    }, 2000)

    return () => {
      clearInterval(timer)
      clearInterval(tipTimer)
    }
  }, [isVisible])

  useEffect(() => {
    if (progress >= 100 && onComplete) {
      setTimeout(onComplete, 300)
    }
  }, [progress, onComplete])

  const currentTip = loadingTips[currentTipIndex]
  const Icon = currentTip.icon

  const stageMessages = {
    preparing: "Analyzing your study queue...",
    fetching: "Generating personalized content...",
    ready: "Your study session is ready!"
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-6">
            {/* Header with animated icon */}
            <div className="text-center space-y-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center"
              >
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </motion.div>
              
              <div>
                <h3 className="font-semibold text-lg">Preparing Your Study Session</h3>
                <p className="text-sm text-muted-foreground">
                  {stageMessages[stage as keyof typeof stageMessages]}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Preparing content...</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Study tip */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTipIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-muted/50 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">{currentTip.title}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentTip.text}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Stage indicators */}
            <div className="flex justify-center space-x-2">
              {['preparing', 'fetching', 'ready'].map((s, index) => (
                <motion.div
                  key={s}
                  className={`w-2 h-2 rounded-full ${
                    s === stage ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  animate={s === stage ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 1, repeat: s === stage ? Infinity : 0 }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
