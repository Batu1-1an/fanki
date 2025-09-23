'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  getUserProfile, 
  updateUserProfile, 
  getUserStatistics,
  getAvailableTimezones,
  getAvailableLanguages,
  type UserProfile,
  type UpdateProfileData 
} from '@/lib/profiles'
import { useToast } from '@/components/ui/toast'

interface ProfileClientProps {
  user: User
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [statistics, setStatistics] = useState({
    totalWords: 0,
    totalReviews: 0,
    studyStreak: 0,
    averageAccuracy: 0
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<UpdateProfileData>({})

  const timezones = getAvailableTimezones()
  const languages = getAvailableLanguages()
  const { toast } = useToast()

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true)
      const [profileData, stats] = await Promise.all([
        getUserProfile(),
        getUserStatistics()
      ])
      
      setProfile(profileData)
      setStatistics(stats)
      
      if (profileData) {
        setEditForm({
          username: profileData.username || '',
          full_name: profileData.full_name || '',
          learning_level: profileData.learning_level,
          target_language: profileData.target_language,
          daily_goal: profileData.daily_goal,
          timezone: profileData.timezone
        })
      }
    } catch (error) {
      console.error('Error loading profile data:', error)
      toast({
        title: "Error",
        description: "Failed to load profile data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadProfileData()
  }, [loadProfileData])

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const updatedProfile = await updateUserProfile(editForm)
      setProfile(updatedProfile)
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Profile updated successfully!"
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        learning_level: profile.learning_level,
        target_language: profile.target_language,
        daily_goal: profile.daily_goal,
        timezone: profile.timezone
      })
    }
    setIsEditing(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Profile Settings
              </h1>
              <p className="text-gray-600">
                Manage your account and learning preferences
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="border-gray-300 hover:bg-gray-50"
            >
              ← Back
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Profile Overview Card */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold">
                    {getInitials(profile?.full_name || user.email || 'U')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl">
                {profile?.full_name || 'Welcome to Fanki'}
              </CardTitle>
              <CardDescription className="text-base">
                {user.email}
              </CardDescription>
              <div className="flex justify-center gap-2 mt-4">
                <Badge 
                  variant="secondary" 
                  className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-0"
                >
                  {profile?.learning_level || 'beginner'}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="border-gray-300"
                >
                  {languages.find(l => l.value === profile?.target_language)?.label || 'English'}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
                  {statistics.totalWords}
                </div>
                <div className="text-sm text-gray-600">Words Added</div>
              </CardContent>
            </Card>
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
                  {statistics.totalReviews}
                </div>
                <div className="text-sm text-gray-600">Total Reviews</div>
              </CardContent>
            </Card>
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-2">
                  {statistics.studyStreak}
                </div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </CardContent>
            </Card>
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
                  {statistics.averageAccuracy}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details Card */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  {isEditing ? 'Edit your profile details' : 'Your account information and preferences'}
                </CardDescription>
              </div>
              {!isEditing ? (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {!isEditing ? (
                // View Mode
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                    <p className="text-gray-900 mt-1">{profile?.full_name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Username</Label>
                    <p className="text-gray-900 mt-1">{profile?.username || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Learning Level</Label>
                    <p className="text-gray-900 mt-1 capitalize">{profile?.learning_level}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Target Language</Label>
                    <p className="text-gray-900 mt-1">
                      {languages.find(l => l.value === profile?.target_language)?.label}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Daily Goal</Label>
                    <p className="text-gray-900 mt-1">{profile?.daily_goal} words per day</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Timezone</Label>
                    <p className="text-gray-900 mt-1">{profile?.timezone?.replace('_', ' ').replace('/', ' / ')}</p>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={editForm.full_name || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={editForm.username || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Choose a username"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="learning_level">Learning Level</Label>
                    <Select 
                      value={editForm.learning_level} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, learning_level: value as any }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="target_language">Target Language</Label>
                    <Select 
                      value={editForm.target_language} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, target_language: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="daily_goal">Daily Goal (words)</Label>
                    <Input
                      id="daily_goal"
                      type="number"
                      min="1"
                      max="100"
                      value={editForm.daily_goal || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, daily_goal: parseInt(e.target.value) || 20 }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={editForm.timezone} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map(tz => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Account details and registration information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                  <p className="text-gray-900 mt-1">{user.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Account Created</Label>
                  <p className="text-gray-900 mt-1">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Last Updated</Label>
                  <p className="text-gray-900 mt-1">
                    {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Account Status</Label>
                  <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
