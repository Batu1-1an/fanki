'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Loader2, RefreshCw } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/toast'
import { getUserProfile, updateUserProfile, type UserProfile } from '@/lib/profiles'

interface SettingsClientProps {
  user: User
}

type SessionLengthOption = 'short' | 'standard' | 'long'
type ThemeOption = 'system' | 'light' | 'dark'

type SettingsPreferences = {
  notifications: {
    studyReminders: boolean
    streakAlerts: boolean
    productUpdates: boolean
  }
  study: {
    dailyGoal: number
    autoplayAudio: boolean
    quickStart: boolean
    sessionLength: SessionLengthOption
  }
  appearance: {
    theme: ThemeOption
    reduceMotion: boolean
  }
}

const DEFAULT_PREFERENCES: SettingsPreferences = {
  notifications: {
    studyReminders: true,
    streakAlerts: true,
    productUpdates: false
  },
  study: {
    dailyGoal: 20,
    autoplayAudio: true,
    quickStart: true,
    sessionLength: 'standard'
  },
  appearance: {
    theme: 'system',
    reduceMotion: false
  }
}

function mergePreferences(preferences?: Record<string, any>): SettingsPreferences {
  return {
    notifications: {
      studyReminders: preferences?.notifications?.studyReminders ?? DEFAULT_PREFERENCES.notifications.studyReminders,
      streakAlerts: preferences?.notifications?.streakAlerts ?? DEFAULT_PREFERENCES.notifications.streakAlerts,
      productUpdates: preferences?.notifications?.productUpdates ?? DEFAULT_PREFERENCES.notifications.productUpdates
    },
    study: {
      dailyGoal: Number(preferences?.study?.dailyGoal ?? DEFAULT_PREFERENCES.study.dailyGoal) || DEFAULT_PREFERENCES.study.dailyGoal,
      autoplayAudio: preferences?.study?.autoplayAudio ?? DEFAULT_PREFERENCES.study.autoplayAudio,
      quickStart: preferences?.study?.quickStart ?? DEFAULT_PREFERENCES.study.quickStart,
      sessionLength: (preferences?.study?.sessionLength as SessionLengthOption) ?? DEFAULT_PREFERENCES.study.sessionLength
    },
    appearance: {
      theme: (preferences?.appearance?.theme as ThemeOption) ?? DEFAULT_PREFERENCES.appearance.theme,
      reduceMotion: preferences?.appearance?.reduceMotion ?? DEFAULT_PREFERENCES.appearance.reduceMotion
    }
  }
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [preferences, setPreferences] = useState<SettingsPreferences>(DEFAULT_PREFERENCES)
  const [initialPreferences, setInitialPreferences] = useState<SettingsPreferences>(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const hasChanges = useMemo(() => {
    return JSON.stringify(preferences) !== JSON.stringify(initialPreferences)
  }, [preferences, initialPreferences])

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      const profileData = await getUserProfile()
      if (!profileData) {
        return
      }
      const merged = mergePreferences(profileData.preferences)
      setProfile(profileData)
      setPreferences(merged)
      setInitialPreferences(merged)
    } catch (error) {
      console.error('Failed to load settings preferences:', error)
      toast({
        title: 'Unable to load settings',
        description: 'Please refresh the page or try again later.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleCheckboxChange = <Section extends keyof SettingsPreferences, Key extends keyof SettingsPreferences[Section]>(
    section: Section,
    key: Key
  ) => (checked: boolean | 'indeterminate') => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: checked === 'indeterminate' ? prev[section][key] : Boolean(checked)
      }
    }))
  }

  const handleSessionLengthChange = (value: SessionLengthOption) => {
    setPreferences(prev => ({
      ...prev,
      study: {
        ...prev.study,
        sessionLength: value
      }
    }))
  }

  const handleThemeChange = (value: ThemeOption) => {
    setPreferences(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        theme: value
      }
    }))
  }

  const handleDailyGoalChange = (value: string) => {
    const parsed = Number(value)
    setPreferences(prev => ({
      ...prev,
      study: {
        ...prev.study,
        dailyGoal: Number.isNaN(parsed) ? prev.study.dailyGoal : Math.max(5, Math.min(parsed, 200))
      }
    }))
  }

  const handleSavePreferences = async () => {
    try {
      setSaving(true)
      await updateUserProfile({
        preferences
      })
      setInitialPreferences(preferences)
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated successfully.'
      })
    } catch (error) {
      console.error('Failed to save settings preferences:', error)
      toast({
        title: 'Unable to save settings',
        description: 'Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES)
  }

  const handleRevertChanges = () => {
    setPreferences(initialPreferences)
  }

  return (
    <DashboardLayout
      user={user}
      currentPath="/settings"
      title="Settings"
      description="Tune your study experience and app preferences"
    >
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="min-h-full bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/60 py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Personalize your learning
                </h2>
                <p className="text-sm text-muted-foreground">
                  Adjust notifications, study flow, and appearance without leaving your dashboard.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={loadProfile} disabled={saving}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Choose the reminders that keep you motivated without adding noise.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">Study reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Receive a gentle nudge when it&apos;s time for your daily review session.
                    </p>
                  </div>
                  <Checkbox
                    checked={preferences.notifications.studyReminders}
                    onCheckedChange={handleCheckboxChange('notifications', 'studyReminders')}
                    className="mt-1"
                  />
                </div>
                <Separator />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">Streak alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Keep your streak alive with end-of-day reminders when you&apos;re cutting it close.
                    </p>
                  </div>
                  <Checkbox
                    checked={preferences.notifications.streakAlerts}
                    onCheckedChange={handleCheckboxChange('notifications', 'streakAlerts')}
                    className="mt-1"
                  />
                </div>
                <Separator />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">Product updates</p>
                    <p className="text-sm text-muted-foreground">
                      Stay informed about new features and AI improvements via occasional emails.
                    </p>
                  </div>
                  <Checkbox
                    checked={preferences.notifications.productUpdates}
                    onCheckedChange={handleCheckboxChange('notifications', 'productUpdates')}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Study preferences</CardTitle>
                <CardDescription>
                  Tailor how Fanki prepares and delivers each review session.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">Daily study goal</p>
                    <p className="text-sm text-muted-foreground">
                      Set how many cards you aim to review each day. We&apos;ll guide pacing around this target.
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={5}
                    max={200}
                    value={preferences.study.dailyGoal}
                    onChange={event => handleDailyGoalChange(event.target.value)}
                    className="w-24"
                  />
                </div>
                <Separator />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">Autoplay audio</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically play pronunciation audio when a card appears in a session.
                    </p>
                  </div>
                  <Checkbox
                    checked={preferences.study.autoplayAudio}
                    onCheckedChange={handleCheckboxChange('study', 'autoplayAudio')}
                    className="mt-1"
                  />
                </div>
                <Separator />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">Quick start mode</p>
                    <p className="text-sm text-muted-foreground">
                      Skip confirmation dialogs and jump straight into the next prepared session.
                    </p>
                  </div>
                  <Checkbox
                    checked={preferences.study.quickStart}
                    onCheckedChange={handleCheckboxChange('study', 'quickStart')}
                    className="mt-1"
                  />
                </div>
                <Separator />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">Session length</p>
                    <p className="text-sm text-muted-foreground">
                      Decide how many cards Fanki queues before prompting for a break.
                    </p>
                  </div>
                  <Select value={preferences.study.sessionLength} onValueChange={handleSessionLengthChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select session length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (5 cards)</SelectItem>
                      <SelectItem value="standard">Standard (10 cards)</SelectItem>
                      <SelectItem value="long">Long (20 cards)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Appearance & accessibility</CardTitle>
                <CardDescription>
                  Control how Fanki looks and feels across devices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">
                      Match your system setting or lock Fanki to light or dark mode.
                    </p>
                  </div>
                  <Select value={preferences.appearance.theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System default</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">Reduce motion</p>
                    <p className="text-sm text-muted-foreground">
                      Simplify animations and transitions for a calmer interface.
                    </p>
                  </div>
                  <Checkbox
                    checked={preferences.appearance.reduceMotion}
                    onCheckedChange={handleCheckboxChange('appearance', 'reduceMotion')}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-dashed border-slate-200/80 bg-white/80 backdrop-blur-sm">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {profile?.updated_at ? `Last updated ${new Date(profile.updated_at).toLocaleString()}` : 'Preferences sync to all your devices.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={handleResetToDefaults} disabled={saving}>
                    Reset to defaults
                  </Button>
                  <Button variant="outline" onClick={handleRevertChanges} disabled={!hasChanges || saving}>
                    Discard changes
                  </Button>
                  <Button onClick={handleSavePreferences} disabled={!hasChanges || saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      'Save settings'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
