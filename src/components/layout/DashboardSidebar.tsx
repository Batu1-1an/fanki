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
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    description: 'Overview'
  },
  {
    id: 'study',
    label: 'Study Center',
    icon: Play,
    href: '/dashboard',
    description: 'Your learning hub'
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
    description: 'Personal details'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    description: 'App preferences'
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
      initial={{ width: isMobile ? 280 : (isCollapsed ? 80 : 240) }}
      animate={{ width: isMobile ? 280 : (isCollapsed ? 80 : 240) }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "h-screen border-r border-slate-700/50 bg-slate-800 relative",
        isMobile && "shadow-2xl"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <AnimatePresence>
              {(!isCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">F</span>
                  </div>
                  <div>
                    <h1 className="font-bold text-lg text-white">Fanki</h1>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {onToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0 hover:bg-slate-700 text-slate-300"
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

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">
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
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = item.href}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      "w-full justify-start gap-3 h-10 relative text-slate-300 hover:text-white hover:bg-slate-700/50",
                      isCollapsed && "justify-center px-0",
                      active && "bg-teal-500 text-white hover:bg-teal-600 hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    
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
        <div className="p-4 border-t border-slate-700/50">
          <AnimatePresence>
            {(!isCollapsed || isMobile) ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  size="sm"
                  onClick={() => window.location.href = '/study'}
                  className="w-full gap-2 bg-teal-500 hover:bg-teal-600 text-white"
                >
                  <Play className="w-4 h-4" />
                  Start Quick Session
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
                  size="sm"
                  onClick={() => window.location.href = '/study'}
                  className="w-full px-0 bg-teal-500 hover:bg-teal-600 text-white"
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
