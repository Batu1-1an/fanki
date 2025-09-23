'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FolderPlus, Check, X } from 'lucide-react'
import { getUserDesks, getWordDesks, addWordToDesk, removeWordFromDesk, Desk } from '@/lib/desks'
import { useToast } from '@/components/ui/toast'

interface WordDeskAssignmentProps {
  wordId: string
  wordText: string
  trigger?: React.ReactNode
}

export function WordDeskAssignment({ wordId, wordText, trigger }: WordDeskAssignmentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [allDesks, setAllDesks] = useState<Desk[]>([])
  const [wordDesks, setWordDesks] = useState<Desk[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { success, error } = useToast()

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [desksResult, wordDesksResult] = await Promise.all([
        getUserDesks(),
        getWordDesks(wordId)
      ])

      if (desksResult.error) {
        error({
          title: 'Error',
          description: 'Failed to load desks'
        })
      } else {
        setAllDesks(desksResult.data || [])
      }

      if (wordDesksResult.error) {
        error({
          title: 'Error',
          description: 'Failed to load word desks'
        })
      } else {
        setWordDesks(wordDesksResult.data || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [wordId, error])

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, loadData])

  const handleDeskToggle = async (desk: Desk, isCurrentlyAssigned: boolean) => {
    setIsUpdating(true)
    try {
      let apiError
      if (isCurrentlyAssigned) {
        const result = await removeWordFromDesk(wordId, desk.id)
        apiError = result.error
      } else {
        const result = await addWordToDesk(wordId, desk.id)
        apiError = result.error
      }

      if (apiError) {
        error({
          title: 'Error',
          description: apiError.message || 'Failed to update desk assignment'
        })
      } else {
        // Update local state
        if (isCurrentlyAssigned) {
          setWordDesks(prev => prev.filter(d => d.id !== desk.id))
        } else {
          setWordDesks(prev => [...prev, desk])
        }
        
        success({
          title: 'Success',
          description: `Word ${isCurrentlyAssigned ? 'removed from' : 'added to'} ${desk.name}`
        })
      }
    } catch (error) {
      console.error('Failed to toggle desk assignment:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getIconComponent = (iconName: string) => {
    // Simple mapping for common icons - you can expand this
    const iconMap: Record<string, React.ReactNode> = {
      'book-open': '📖',
      'folder': '📁',
      'star': '⭐',
      'users': '👥',
      'globe': '🌍',
      'heart': '❤️',
      'zap': '⚡',
      'target': '🎯',
      'brain': '🧠'
    }
    return iconMap[iconName] || '📖'
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FolderPlus className="w-4 h-4 mr-2" />
            Manage Desks
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Desks for &quot;{wordText}&quot;</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {allDesks.map(desk => {
                const isAssigned = wordDesks.some(wd => wd.id === desk.id)
                
                return (
                  <div
                    key={desk.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`desk-${desk.id}`}
                      checked={isAssigned}
                      onCheckedChange={() => handleDeskToggle(desk, isAssigned)}
                      disabled={isUpdating}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">{getIconComponent(desk.icon)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <label 
                            htmlFor={`desk-${desk.id}`}
                            className="font-medium cursor-pointer truncate"
                          >
                            {desk.name}
                          </label>
                          {desk.is_default && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        {desk.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {desk.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {desk.word_count || 0} words
                        </p>
                      </div>
                    </div>
                    {isAssigned && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                )
              })}
              
              {allDesks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No desks available</p>
                  <p className="text-sm">Create a desk first to organize your words</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
        
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {wordDesks.length} desk{wordDesks.length !== 1 ? 's' : ''} selected
          </div>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default WordDeskAssignment
