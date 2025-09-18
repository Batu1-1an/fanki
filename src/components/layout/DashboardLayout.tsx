'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth'
import { getWordStats } from '@/lib/words'
import { DashboardSidebar } from './DashboardSidebar'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Bell, User as UserIcon } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface DashboardLayoutProps {
  user: User
  children: React.ReactNode
  currentPath?: string
  title?: string
  description?: string
  focusMode?: boolean
}

interface WordStats {
  total: number
  byDifficulty: Record<number, number>
  byCategory: Record<string, number>
  recentCount: number
}

export function DashboardLayout({ 
  user, 
  children, 
  currentPath, 
  title,
  description,
  focusMode = false
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(focusMode)
  const [stats, setStats] = useState<WordStats>({
    total: 0,
    byDifficulty: {},
    byCategory: {},
    recentCount: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const wordStats = await getWordStats()
      setStats(wordStats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getUserInitials = () => {
    const name = user.user_metadata?.full_name || user.email
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Auto-collapse sidebar in focus mode
  useEffect(() => {
    if (focusMode) {
      setSidebarCollapsed(true)
    }
  }, [focusMode])

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar - Hidden in focus mode */}
      {!focusMode && (
        <DashboardSidebar
          currentPath={currentPath}
          wordCount={stats.total}
          dueCount={0} // TODO: Get actual due count
          streakCount={5} // TODO: Get actual streak count
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar - Minimal in focus mode */}
        {focusMode ? (
          <motion.header 
            className="h-12 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between h-full px-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-primary to-blue-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xs">F</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">Focus Mode</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.history.back()}
                className="text-xs h-8 px-3"
              >
                Exit Focus
              </Button>
            </div>
          </motion.header>
        ) : (
          <motion.header 
            className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-4">
                {title && (
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                    {description && (
                      <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt="User" />
                        <AvatarFallback className="text-xs">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">
                          {user.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <span className="mr-2">→</span>
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.header>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="h-full"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPath}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
