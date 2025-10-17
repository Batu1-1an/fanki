'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Play, AlertCircle, TrendingUp } from 'lucide-react'

interface NextStepCardProps {
  priority: 'high' | 'medium' | 'low'
  title: string
  subtitle: string
  onStartSession: () => void
  isLoading?: boolean
}

export function NextStepCard({
  priority,
  title,
  subtitle,
  onStartSession,
  isLoading = false
}: NextStepCardProps) {
  const priorityConfig = {
    high: {
      bg: 'bg-gradient-to-br from-rose-500/10 to-rose-500/5',
      border: 'border-rose-200',
      badge: 'bg-rose-500 text-white',
      icon: AlertCircle
    },
    medium: {
      bg: 'bg-gradient-to-br from-amber-500/10 to-amber-500/5',
      border: 'border-amber-200',
      badge: 'bg-amber-500 text-white',
      icon: TrendingUp
    },
    low: {
      bg: 'bg-gradient-to-br from-blue-500/10 to-blue-500/5',
      border: 'border-blue-200',
      badge: 'bg-blue-500 text-white',
      icon: Play
    }
  }

  const config = priorityConfig[priority]
  const Icon = config.icon

  return (
    <Card className={`relative overflow-hidden ${config.bg} border-2 ${config.border}`}>
      {/* Decorative corner icon */}
      <div className="absolute top-4 right-4">
        <motion.div
          className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Icon className={`w-6 h-6 ${priority === 'high' ? 'text-rose-500' : priority === 'medium' ? 'text-amber-500' : 'text-blue-500'}`} />
        </motion.div>
      </div>

      <CardContent className="p-6">
        <div className="space-y-4 pr-16">
          <div>
            <Badge className={`${config.badge} mb-3 uppercase text-xs tracking-wide`}>
              Priority: {priority}
            </Badge>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">
              YOUR NEXT STEP
            </h3>
            <p className="text-lg font-semibold text-foreground/90 mb-1">
              {title}
            </p>
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>

          <Button
            size="lg"
            className="gap-2 w-full sm:w-auto bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
            onClick={onStartSession}
            disabled={isLoading}
          >
            <Play className="w-5 h-5" />
            Start Review Session
          </Button>
        </div>

        {/* Decorative line chart */}
        <svg 
          className="absolute bottom-0 right-0 w-32 h-16 opacity-20"
          viewBox="0 0 100 50"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0,40 L20,35 L40,30 L60,25 L80,20 L100,15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-teal-500"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>
      </CardContent>
    </Card>
  )
}
