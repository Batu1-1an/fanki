'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  BookOpen, 
  Plus, 
  FolderOpen,
  Play,
  Users,
  Star,
  Filter
} from 'lucide-react'
import { ReviewDashboard } from './ReviewDashboard'
import { getUserDesks, createDesk, Desk } from '@/lib/desks'
import { generateStudySession } from '@/lib/queue-manager'
import { useToast } from '@/hooks/use-toast'

interface StudyDashboardProps {
  onStartSession: (words: any[], sessionId: string) => void
  className?: string
}

export function StudyDashboard({ onStartSession, className }: StudyDashboardProps) {
  const [desks, setDesks] = useState<Desk[]>([])
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingDesk, setIsCreatingDesk] = useState(false)
  const [newDeskName, setNewDeskName] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadDesks()
  }, [])

  const loadDesks = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getUserDesks()
      if (error) {
        console.error('Failed to load desks:', error)
      } else {
        setDesks(data || [])
      }
    } catch (error) {
      console.error('Failed to load desks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDesk = async () => {
    if (!newDeskName.trim()) return

    try {
      const { data, error } = await createDesk({
        name: newDeskName.trim(),
        description: `Study collection: ${newDeskName.trim()}`
      })
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create desk',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Success',
          description: 'Desk created successfully'
        })
        setNewDeskName('')
        setIsCreatingDesk(false)
        loadDesks()
      }
    } catch (error) {
      console.error('Failed to create desk:', error)
    }
  }

  const handleStartDeskSession = async (deskId: string) => {
    try {
      const { words, sessionId } = await generateStudySession({
        maxWords: 20,
        studyMode: 'mixed',
        deskId
      })

      if (words.length > 0) {
        onStartSession(words, sessionId)
      } else {
        toast({
          title: 'No words available',
          description: 'This desk has no words ready for study',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to start desk session:', error)
      toast({
        title: 'Error',
        description: 'Failed to start study session',
        variant: 'destructive'
      })
    }
  }

  const selectedDesk = desks.find(d => d.id === selectedDeskId)

  return (
    <div className={className}>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="desks">My Desks</TabsTrigger>
          <TabsTrigger value="filtered" disabled={!selectedDesk}>
            {selectedDesk ? selectedDesk.name : 'Filtered Study'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ReviewDashboard onStartSession={onStartSession} />
        </TabsContent>

        <TabsContent value="desks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Study Collections</h3>
            {!isCreatingDesk ? (
              <Button onClick={() => setIsCreatingDesk(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Collection
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Collection name"
                  value={newDeskName}
                  onChange={(e) => setNewDeskName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateDesk()}
                  className="w-40"
                />
                <Button onClick={handleCreateDesk} size="sm">
                  Create
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreatingDesk(false)
                    setNewDeskName('')
                  }} 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {desks.map(desk => (
                <Card 
                  key={desk.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDeskId === desk.id ? 'ring-2 ring-blue-500 shadow-md' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div 
                          className="p-2 rounded-lg bg-blue-50 text-blue-600"
                        >
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{desk.name}</h4>
                            {desk.is_default && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          {desk.description && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {desk.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{desk.word_count || 0} words</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        onClick={() => handleStartDeskSession(desk.id)}
                        disabled={!desk.word_count || desk.word_count === 0}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Study
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedDeskId(selectedDeskId === desk.id ? null : desk.id)
                        }}
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        {selectedDeskId === desk.id ? 'Unfilter' : 'Filter'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {desks.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h4 className="font-medium mb-2">No collections yet</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first study collection to organize your words
                    </p>
                    <Button onClick={() => setIsCreatingDesk(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Collection
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="filtered" className="space-y-6">
          {selectedDesk && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedDesk.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedDesk.word_count || 0} words • Filtered study session
                  </p>
                </div>
              </div>
              <ReviewDashboard 
                onStartSession={(words, sessionId) => {
                  // Pass desk filter to the session
                  onStartSession(words, sessionId)
                }}
                className="opacity-75 pointer-events-none"
              />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Use the "Study {selectedDesk.name}" button in the Desks tab to start a filtered session
                </p>
                <Button 
                  onClick={() => handleStartDeskSession(selectedDesk.id)}
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Study {selectedDesk.name}
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default StudyDashboard
