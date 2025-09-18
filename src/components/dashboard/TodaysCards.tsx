'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  Filter,
  Search,
  AlertTriangle,
  CheckCircle2,
  Plus,
  BookOpen,
  Flame
} from 'lucide-react'
import { getDueWords } from '@/lib/reviews'
import { QueuedWord, getQueueManager } from '@/lib/queue-manager'
import { Word, Review } from '@/types'
import { cn } from '@/lib/utils'
import { formatInterval } from '@/utils/sm2'

interface TodaysCardsProps {
  onStartSession: (words: QueuedWord[], sessionId: string) => void
  cards: Array<Word & { lastReview?: Review }>
  isLoading: boolean
  className?: string
}

interface GroupedCards {
  overdue: Array<Word & { lastReview?: Review }>
  dueToday: Array<Word & { lastReview?: Review }>
  newWords: Array<Word & { lastReview?: Review }>
}

export function TodaysCards({ onStartSession, cards, isLoading, className }: TodaysCardsProps) {
  const [groupedCards, setGroupedCards] = useState<GroupedCards>({
    overdue: [],
    dueToday: [],
    newWords: []
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())

  // Update grouped cards when cards prop changes
  useEffect(() => {
    if (cards) {
      const grouped = groupCardsByPriority(cards)
      setGroupedCards(grouped)
    }
  }, [cards])

  // Removed loadTodaysCards - now handled by parent component

  const groupCardsByPriority = (cards: Array<Word & { lastReview?: Review }>): GroupedCards => {
    // Use UTC date-only strings to avoid timezone skew and match server logic
    const todayStr = new Date().toISOString().split('T')[0]

    const overdue: Array<Word & { lastReview?: Review }> = []
    const dueToday: Array<Word & { lastReview?: Review }> = []
    const newWords: Array<Word & { lastReview?: Review }> = []

    cards.forEach(card => {
      if (!card.lastReview) {
        newWords.push(card)
      } else {
        const dueDateStr = new Date(card.lastReview.due_date).toISOString().split('T')[0]
        if (dueDateStr < todayStr) overdue.push(card)
        else if (dueDateStr === todayStr) dueToday.push(card)
      }
    })

    return { overdue, dueToday, newWords }
  }

  const filteredCards = cards.filter(card => {
    // Search filter
    if (searchTerm && !card.word.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Difficulty filter
    if (difficultyFilter !== 'all' && card.lastReview) {
      const easeFactor = card.lastReview.ease_factor
      switch (difficultyFilter) {
        case 'easy':
          return easeFactor >= 2.5
        case 'medium':
          return easeFactor >= 2.0 && easeFactor < 2.5
        case 'hard':
          return easeFactor < 2.0
        default:
          return true
      }
    }

    return true
  })

  const handleCardSelect = (cardId: string, selected: boolean) => {
    setSelectedCards(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(cardId)
      } else {
        newSet.delete(cardId)
      }
      return newSet
    })
  }

  const handleSelectGroup = (groupCards: Array<Word & { lastReview?: Review }>, selectAll: boolean) => {
    setSelectedCards(prev => {
      const newSet = new Set(prev)
      groupCards.forEach(card => {
        if (selectAll) {
          newSet.add(card.id)
        } else {
          newSet.delete(card.id)
        }
      })
      return newSet
    })
  }

  const handleStartSelectedSession = async () => {
    if (selectedCards.size === 0) return

    const queueManager = getQueueManager()
    const { queue } = await queueManager.generateQueue({
      maxWords: selectedCards.size
    })

    const selectedQueue = queue.filter(item => selectedCards.has(item.id))
    
    // Let the session creation function generate the proper UUID
    onStartSession(selectedQueue, '')
  }

  const getDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate)
    const today = new Date()
    return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getDifficultyBadge = (easeFactor?: number) => {
    if (!easeFactor) return { label: 'New', variant: 'secondary' as const, color: 'text-blue-600' }
    
    if (easeFactor >= 2.5) return { label: 'Easy', variant: 'secondary' as const, color: 'text-green-600' }
    if (easeFactor >= 2.0) return { label: 'Medium', variant: 'secondary' as const, color: 'text-yellow-600' }
    if (easeFactor >= 1.5) return { label: 'Hard', variant: 'destructive' as const, color: 'text-orange-600' }
    return { label: 'Very Hard', variant: 'destructive' as const, color: 'text-red-600' }
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-6 bg-muted rounded w-1/3 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-4 bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Cards
            </CardTitle>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {cards.length} cards available
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy (≥2.5)</SelectItem>
                <SelectItem value="medium">Medium (2.0-2.5)</SelectItem>
                <SelectItem value="hard">Hard (&lt;2.0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick actions */}
          {selectedCards.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium">{selectedCards.size} cards selected</span>
              <Button 
                size="sm" 
                onClick={handleStartSelectedSession}
                className="ml-auto"
              >
                Start Custom Session
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setSelectedCards(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grouped cards display */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="overdue" className="relative">
            Overdue
            {groupedCards.overdue.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {groupedCards.overdue.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="due">Due Today</TabsTrigger>
          <TabsTrigger value="new">New Words</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overdue cards summary */}
            <Card className={cn("cursor-pointer transition-colors hover:bg-red-50", 
              groupedCards.overdue.length > 0 ? "border-red-200" : "")}>
              <CardContent className="p-4 text-center">
                <AlertTriangle className={cn("w-8 h-8 mx-auto mb-2", 
                  groupedCards.overdue.length > 0 ? "text-red-600" : "text-muted-foreground")} />
                <div className="text-2xl font-bold text-red-600">
                  {groupedCards.overdue.length}
                </div>
                <div className="text-sm text-muted-foreground">Overdue Cards</div>
                {groupedCards.overdue.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="mt-2 w-full"
                    onClick={() => handleSelectGroup(groupedCards.overdue, true)}
                  >
                    <Flame className="w-4 h-4 mr-1" />
                    Select All
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Due today summary */}
            <Card className="cursor-pointer transition-colors hover:bg-orange-50">
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-bold text-orange-600">
                  {groupedCards.dueToday.length}
                </div>
                <div className="text-sm text-muted-foreground">Due Today</div>
                {groupedCards.dueToday.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 w-full"
                    onClick={() => handleSelectGroup(groupedCards.dueToday, true)}
                  >
                    Select All
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* New words summary */}
            <Card className="cursor-pointer transition-colors hover:bg-green-50">
              <CardContent className="p-4 text-center">
                <Plus className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-600">
                  {groupedCards.newWords.length}
                </div>
                <div className="text-sm text-muted-foreground">New Words</div>
                {groupedCards.newWords.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 w-full"
                    onClick={() => handleSelectGroup(groupedCards.newWords, true)}
                  >
                    Select All
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Individual card lists */}
        {(['overdue', 'due', 'new'] as const).map(tabKey => {
          const cards = tabKey === 'overdue' ? groupedCards.overdue :
                       tabKey === 'due' ? groupedCards.dueToday :
                       groupedCards.newWords
          
          return (
            <TabsContent key={tabKey} value={tabKey} className="space-y-3">
              {cards.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">
                      No {tabKey === 'overdue' ? 'overdue' : tabKey === 'due' ? 'cards due today' : 'new words'} to study.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {cards.map(card => {
                    const difficulty = getDifficultyBadge(card.lastReview?.ease_factor)
                    const isSelected = selectedCards.has(card.id)
                    
                    return (
                      <Card 
                        key={card.id} 
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          isSelected && "ring-2 ring-blue-500 bg-blue-50"
                        )}
                        onClick={() => handleCardSelect(card.id, !isSelected)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="font-semibold text-lg">{card.word}</div>
                              <Badge variant={difficulty.variant} className="text-xs">
                                {difficulty.label}
                              </Badge>
                              {card.difficulty && (
                                <Badge variant="outline" className="text-xs">
                                  {card.difficulty}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {card.lastReview && tabKey === 'overdue' && (
                                <Badge variant="destructive" className="text-xs">
                                  {getDaysOverdue(card.lastReview.due_date)} days overdue
                                </Badge>
                              )}
                              {card.lastReview && (
                                <span>EF: {card.lastReview.ease_factor.toFixed(1)}</span>
                              )}
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
