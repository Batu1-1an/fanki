'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth'
import { getWordStats } from '@/lib/words'
import { getStudySessionStats } from '@/lib/study-sessions'
import { getReviewStats } from '@/lib/reviews'
import { DashboardSidebar } from './DashboardSidebar'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Bell, User as UserIcon, Menu, X } from 'lucide-react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState<WordStats>({
    total: 0,
    byDifficulty: {},
    byCategory: {},
    recentCount: 0
  })
  const [streakCount, setStreakCount] = useState(0)
  const [dueCount, setDueCount] = useState(0)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [wordStats, sessionStats, reviewStats] = await Promise.all([
        getWordStats(),
        getStudySessionStats(),
        getReviewStats()
      ])
      setStats(wordStats)
      setStreakCount(sessionStats.currentStreak || 0)
      setDueCount(reviewStats.wordsDueToday || 0)
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
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && !focusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop always visible, Mobile overlay when open */}
      {!focusMode && (
        <>
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <DashboardSidebar
              currentPath={currentPath}
              wordCount={stats.total}
              dueCount={dueCount}
              streakCount={streakCount}
              isCollapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
          
          {/* Mobile Sidebar */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="fixed left-0 top-0 bottom-0 z-50 md:hidden"
              >
                <DashboardSidebar
                  currentPath={currentPath}
                  wordCount={stats.total}
                  dueCount={dueCount}
                  streakCount={streakCount}
                  isCollapsed={false}
                  onToggle={() => setMobileMenuOpen(false)}
                  isMobile={true}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
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
            className="h-16 border-b border-slate-700/50 bg-slate-800 sticky top-0 z-10"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between h-full px-4 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden h-8 w-8 p-0 text-slate-300 hover:text-white hover:bg-slate-700"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Menu className="w-4 h-4" />
                  )}
                </Button>
                
                {title && (
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-semibold text-white truncate">{title}</h1>
                    {description && (
                      <p className="text-xs sm:text-sm text-slate-400 truncate">{description}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                {/* Greeting - Hidden on small screens */}
                <div className="hidden md:block text-sm text-white font-medium">
                  Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user.user_metadata?.full_name?.split(' ')[0] || 'there'}!
                </div>

                {/* Notifications - Hidden on very small screens */}
                <Button variant="ghost" size="sm" className="relative hidden xs:flex text-slate-300 hover:text-white hover:bg-slate-700">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-teal-500 rounded-full"></span>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-slate-700">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt="User" />
                        <AvatarFallback className="text-xs bg-teal-500 text-white">
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
