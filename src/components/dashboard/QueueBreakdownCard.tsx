'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'
import { AlertCircle, Calendar, Sparkles, Play, BookOpen } from 'lucide-react'
import { getUserDesks, Desk } from '@/lib/desks'

interface QueueBreakdownCardProps {
  overdue: number
  dueToday: number
  newWords: number
  total: number
  onStartOverdue: () => void
  onStartDueToday: () => void
  onStartNewWords: () => void
  onStartMixed: () => void
  onDeskChange?: (deskId: string) => void
  isLoading?: boolean
}

export function QueueBreakdownCard({
  overdue,
  dueToday,
  newWords,
  total,
  onStartOverdue,
  onStartDueToday,
  onStartNewWords,
  onStartMixed,
  onDeskChange,
  isLoading = false
}: QueueBreakdownCardProps) {
  const [desks, setDesks] = useState<Desk[]>([])
  const [selectedDeskId, setSelectedDeskId] = useState<string>('all')

  useEffect(() => {
    loadDesks()
  }, [])

  const loadDesks = async () => {
    try {
      const { data: userDesks } = await getUserDesks()
      if (userDesks) {
        setDesks(userDesks)
      }
    } catch (error) {
      console.error('Failed to load desks:', error)
    }
  }

  const handleDeskChange = (deskId: string) => {
    setSelectedDeskId(deskId)
    onDeskChange?.(deskId)
  }

  const getSelectedDeskInfo = () => {
    if (!selectedDeskId || selectedDeskId === 'all') return null
    return desks.find(desk => desk.id === selectedDeskId)
  }

  const queueSegments = [
    {
      label: 'Overdue',
      value: overdue,
      color: 'bg-rose-500',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      icon: AlertCircle,
      action: onStartOverdue,
      description: 'Cards that need immediate attention'
    },
    {
      label: 'Due Today',
      value: dueToday,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: Calendar,
      action: onStartDueToday,
      description: 'Cards scheduled for today'
    },
    {
      label: 'New Words',
      value: newWords,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: Sparkles,
      action: onStartNewWords,
      description: 'Fresh words to learn'
    }
  ]

  const queueTotal = Math.max(total, overdue + dueToday + newWords, 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Your Study Queue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Desk Selector */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            Select a desk to filter:
          </div>
          <Select value={selectedDeskId} onValueChange={handleDeskChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All desks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-500" />
                  <span>All Desks</span>
                </div>
              </SelectItem>
              {desks.map(desk => (
                <SelectItem key={desk.id} value={desk.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: desk.color || '#808080' }} 
                    />
                    <span>{desk.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Selected Desk Info */}
          {getSelectedDeskInfo() && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200"
            >
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getSelectedDeskInfo()!.color || '#808080' }} 
                />
                <span className="font-medium text-sm">{getSelectedDeskInfo()!.name}</span>
              </div>
              {getSelectedDeskInfo()!.description && (
                <p className="text-xs text-muted-foreground">
                  {getSelectedDeskInfo()!.description}
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Visual Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Queue Distribution</span>
            <span>{total} cards available</span>
          </div>
          <div className="h-4 rounded-full bg-muted flex overflow-hidden">
            {queueSegments.map((segment, index) => {
              const percentage = (segment.value / queueTotal) * 100
              return percentage > 0 ? (
                <motion.div
                  key={segment.label}
                  className={`${segment.color} transition-all duration-500`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  title={`${segment.label}: ${segment.value} cards`}
                />
              ) : null
            })}
          </div>
        </div>

        {/* Queue Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {queueSegments.map((segment, index) => {
            const Icon = segment.icon
            return (
              <motion.div
                key={segment.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className={`text-center p-3 rounded-lg ${segment.bgColor} border ${segment.borderColor}`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${segment.textColor}`} />
                <div className={`text-2xl font-bold ${segment.textColor}`}>
                  {segment.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {segment.label}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Choose what to study:
          </div>
          
          {queueSegments.map((segment, index) => (
            <motion.div
              key={segment.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
            >
              <Button
                onClick={segment.action}
                disabled={segment.value === 0 || isLoading}
                variant={segment.value > 0 && index === 0 ? "default" : "outline"}
                className={`w-full justify-between ${
                  segment.value > 0 && index === 0 
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white' 
                    : ''
                }`}
              >
                <span className="flex items-center gap-2">
                  <segment.icon className="w-4 h-4" />
                  {segment.label}
                </span>
                <Badge 
                  variant={segment.value > 0 ? "secondary" : "outline"}
                  className="ml-2"
                >
                  {segment.value}
                </Badge>
              </Button>
            </motion.div>
          ))}

          {/* Mixed study option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <Button
              onClick={onStartMixed}
              disabled={total === 0 || isLoading}
              variant="outline"
              className="w-full justify-between border-2 border-teal-200 hover:bg-teal-50"
            >
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Mixed Study (Recommended)
              </span>
              <Badge variant="secondary" className="ml-2 bg-teal-100 text-teal-700">
                {total}
              </Badge>
            </Button>
          </motion.div>
        </div>

        {total === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            🎉 No cards due! You&apos;re all caught up.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
