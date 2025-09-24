'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Home, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Plus,
  Play,
  Target,
  Calendar,
  Flame,
  ChevronLeft,
  ChevronRight,
  User,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string | number
  description?: string
}

interface DashboardSidebarProps {
  currentPath?: string
  wordCount?: number
  dueCount?: number
  streakCount?: number
  isCollapsed?: boolean
  onToggle?: () => void
  isMobile?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Study Center',
    icon: Home,
    href: '/dashboard',
    description: 'Your learning hub'
  },
  {
    id: 'study',
    label: 'Study Now',
    icon: Play,
    href: '/study',
    description: 'Start a study session'
  },
  {
    id: 'words',
    label: 'My Words',
    icon: BookOpen,
    href: '/dashboard/words',
    description: 'Manage flashcards'
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: BarChart3,
    href: '/dashboard/progress',
    description: 'Track your learning'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    href: '/profile',
    description: 'Account settings'
  }
]

export function DashboardSidebar({
  currentPath = '/dashboard',
  wordCount = 0,
  dueCount = 0,
  streakCount = 0,
  isCollapsed = false,
  onToggle,
  isMobile = false
}: DashboardSidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const getItemBadge = (itemId: string) => {
    switch (itemId) {
      case 'words':
        return wordCount > 0 ? wordCount.toString() : undefined
      case 'study':
        return dueCount > 0 ? dueCount.toString() : undefined
      default:
        return undefined
    }
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return currentPath === '/dashboard'
    }
    return currentPath?.startsWith(href)
  }

  return (
    <motion.aside
      initial={{ width: isMobile ? 280 : (isCollapsed ? 80 : 280) }}
      animate={{ width: isMobile ? 280 : (isCollapsed ? 80 : 280) }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "h-screen border-r border-border bg-card/50 backdrop-blur-sm relative",
        isMobile && "shadow-2xl"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <AnimatePresence>
              {(!isCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">F</span>
                  </div>
                  <div>
                    <h1 className="font-bold text-lg heading-gradient">Fanki</h1>
                    <p className="text-xs text-muted-foreground">AI Learning</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {onToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0 hover:bg-accent"
              >
                {isMobile ? (
                  <X className="w-4 h-4" />
                ) : isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <AnimatePresence>
          {(!isCollapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <Card variant="elevated" className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Words</div>
                      <div className="font-semibold">{wordCount}</div>
                    </div>
                  </div>
                </Card>
                
                <Card variant="elevated" className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Due</div>
                      <div className="font-semibold">{dueCount}</div>
                    </div>
                  </div>
                </Card>
              </div>
              
              {streakCount > 0 && (
                <Card variant="premium" className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Current Streak</div>
                      <div className="font-bold text-lg">{streakCount} days</div>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-2">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              const badge = getItemBadge(item.id)
              const active = isActive(item.href)
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Button
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    onClick={() => window.location.href = item.href}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      "w-full justify-start gap-3 h-11 relative",
                      isCollapsed && "justify-center px-0",
                      active && "shadow-sm ring-1 ring-primary/20"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", active && "text-primary-foreground")} />
                    
                    <AnimatePresence>
                      {(!isCollapsed || isMobile) && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-between flex-1"
                        >
                          <span className="truncate">{item.label}</span>
                          {badge && (
                            <Badge 
                              variant={active ? "secondary" : "outline"}
                              className="ml-auto text-xs"
                            >
                              {badge}
                            </Badge>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && hoveredItem === item.id && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="absolute left-full ml-2 px-3 py-2 bg-popover border border-border rounded-md shadow-md z-50 whitespace-nowrap"
                      >
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        )}
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              )
            })}
          </div>
        </nav>

        {/* Quick Action */}
        <div className="p-4 border-t border-border">
          <AnimatePresence>
            {(!isCollapsed || isMobile) ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="premium"
                  size="sm"
                  onClick={() => window.location.href = '/study'}
                  className="w-full gap-2"
                >
                  <Play className="w-4 h-4" />
                  Quick Study
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="premium"
                  size="sm"
                  onClick={() => window.location.href = '/study'}
                  className="w-full px-0"
                >
                  <Play className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}
