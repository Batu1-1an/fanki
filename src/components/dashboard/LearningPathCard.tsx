'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Play, RotateCcw } from 'lucide-react'

interface LearningPathCardProps {
  onStartSession: () => void
  onResumeSession: () => void
  hasActiveSession: boolean
  progressMessage?: string
}

export function LearningPathCard({
  onStartSession,
  onResumeSession,
  hasActiveSession,
  progressMessage = "You're making great progress towards your learning goals."
}: LearningPathCardProps) {
  return (
    <Card className="relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-blue-50/30 pointer-events-none" />
      
      {/* Decorative line chart illustration */}
      <svg 
        className="absolute right-0 top-0 w-1/2 h-full opacity-20 pointer-events-none"
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,80 Q25,60 50,65 T100,45 T150,55 T200,40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-teal-500"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {/* Decorative circles */}
        {[
          { cx: 50, cy: 65, r: 4 },
          { cx: 100, cy: 45, r: 4 },
          { cx: 150, cy: 55, r: 4 },
          { cx: 200, cy: 40, r: 4 }
        ].map((circle, i) => (
          <motion.circle
            key={i}
            {...circle}
            fill="currentColor"
            className="text-teal-400"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ delay: 0.5 + i * 0.2, duration: 0.5 }}
          />
        ))}
      </svg>

      <CardContent className="relative p-6 sm:p-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              YOUR LEARNING PATH
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              {progressMessage}
            </p>
          </div>

          <div className="flex flex-col xs:flex-row gap-3">
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-lg shadow-teal-500/30"
              onClick={onStartSession}
            >
              <Play className="w-5 h-5" />
              Continue Daily Lesson
            </Button>
            
            {hasActiveSession && (
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-2"
                onClick={onResumeSession}
              >
                <RotateCcw className="w-5 h-5" />
                Resume Last Session
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
