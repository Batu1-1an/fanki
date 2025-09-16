'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getUserWords, deleteWord, getWordStats, DIFFICULTY_LEVELS, WORD_CATEGORIES } from '@/lib/words'
import { getUserDesks, getDeskWords, addWordToDesk, removeWordFromDesk, Desk } from '@/lib/desks'
import { Word } from '@/types'
import AddWordForm from './AddWordForm'
import WordEditModal from '@/components/words/WordEditModal'
import { WordWithFlashcard } from './WordWithFlashcard'
import { DeskManager } from '@/components/dashboard/DeskManager'

export default function WordManagementDashboard() {
  const [words, setWords] = useState<Word[]>([])
  const [filteredWords, setFilteredWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    byDifficulty: {} as Record<number, number>,
    byCategory: {} as Record<string, number>,
    recentCount: 0
  })

  // Desk management
  const [desks, setDesks] = useState<Desk[]>([])
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null)
  const [showDeskManager, setShowDeskManager] = useState(false)

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical' | 'difficulty'>('newest')

  // UI state
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [deletingWordId, setDeletingWordId] = useState<string | null>(null)
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set())
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false)

  useEffect(() => {
    loadDesks()
    loadWords()
    loadStats()
  }, [])

  useEffect(() => {
    if (selectedDesk) {
      loadDeskWords()
    } else {
      loadWords()
    }
  }, [selectedDesk])

  useEffect(() => {
    applyFiltersAndSort()
  }, [words, searchTerm, selectedCategory, selectedDifficulty, sortBy])

  const loadDesks = async () => {
    const { data, error } = await getUserDesks()
    if (data && !error) {
      setDesks(data)
    }
  }

  const loadWords = async () => {
    setLoading(true)
    const { data, error } = await getUserWords({ limit: 1000 })
    
    if (data && !error) {
      setWords(data)
    }
    setLoading(false)
  }

  const loadDeskWords = async () => {
    if (!selectedDesk) return
    
    setLoading(true)
    const { data, error } = await getDeskWords(selectedDesk.id, 1000)
    
    if (data && !error) {
      setWords(data)
    }
    setLoading(false)
  }

  const loadStats = async () => {
    const statsData = await getWordStats()
    setStats(statsData)
  }

  const applyFiltersAndSort = () => {
    let filtered = [...words]

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(word => 
        word.word.toLowerCase().includes(search) || 
        word.definition?.toLowerCase().includes(search)
      )
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(word => word.category === selectedCategory)
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(word => word.difficulty === parseInt(selectedDifficulty))
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'alphabetical':
          return a.word.localeCompare(b.word)
        case 'difficulty':
          return b.difficulty - a.difficulty
        default:
          return 0
      }
    })

    setFilteredWords(filtered)
  }

  const handleWordAdded = (newWord: Word) => {
    setWords(prev => [newWord, ...prev])
    setShowAddForm(false)
    loadStats()
    loadDesks() // Refresh desks to update word counts
  }

  const handleDeskSelect = (desk: Desk | null) => {
    setSelectedDesk(desk)
    setShowDeskManager(false)
  }

  const handleDeskCreated = () => {
    loadDesks()
  }

  const handleWordUpdated = (updatedWord: Word) => {
    setWords(prev => prev.map(word => word.id === updatedWord.id ? updatedWord : word))
    setEditingWord(null)
    loadStats()
  }

  const handleDeleteWord = async (wordId: string) => {
    setDeletingWordId(wordId)
    const { error } = await deleteWord(wordId)
    
    if (!error) {
      setWords(prev => prev.filter(word => word.id !== wordId))
      loadStats()
      loadDesks() // Update desk word counts
    }
    setDeletingWordId(null)
  }

  const handleSelectAll = () => {
    if (selectedWordIds.size === filteredWords.length) {
      setSelectedWordIds(new Set())
    } else {
      setSelectedWordIds(new Set(filteredWords.map(word => word.id)))
    }
  }

  const handleWordSelection = (wordId: string, selected: boolean) => {
    const newSelection = new Set(selectedWordIds)
    if (selected) {
      newSelection.add(wordId)
    } else {
      newSelection.delete(wordId)
    }
    setSelectedWordIds(newSelection)
  }

  const handleBulkMoveToDesk = async (targetDeskId: string) => {
    if (selectedWordIds.size === 0 || !selectedDesk) return
    
    setBulkOperationLoading(true)
    try {
      const wordIdsArray = Array.from(selectedWordIds)
      
      // Move words from current desk to target desk
      for (const wordId of wordIdsArray) {
        await removeWordFromDesk(wordId, selectedDesk.id)
        await addWordToDesk(wordId, targetDeskId)
      }
      
      const targetDesk = desks.find(d => d.id === targetDeskId)
      alert(`Moved ${wordIdsArray.length} flashcards to "${targetDesk?.name || 'selected deck'}"`)
      
      // Refresh the current view
      loadDeskWords()
      loadDesks()
      setSelectedWordIds(new Set())
    } catch (error) {
      alert('Failed to move flashcards')
    } finally {
      setBulkOperationLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedWordIds.size === 0) return
    
    const confirmed = confirm(`Delete ${selectedWordIds.size} selected flashcards? This cannot be undone.`)
    if (!confirmed) return
    
    setBulkOperationLoading(true)
    try {
      const wordIdsArray = Array.from(selectedWordIds)
      
      for (const wordId of wordIdsArray) {
        await deleteWord(wordId)
      }
      
      setWords(prev => prev.filter(word => !selectedWordIds.has(word.id)))
      loadStats()
      loadDesks()
      setSelectedWordIds(new Set())
      
      alert(`Deleted ${wordIdsArray.length} flashcards`)
    } catch (error) {
      alert('Failed to delete flashcards')
    } finally {
      setBulkOperationLoading(false)
    }
  }

  const getDifficultyBadge = (difficulty: number) => {
    const config = DIFFICULTY_LEVELS[difficulty as keyof typeof DIFFICULTY_LEVELS]
    return (
      <Badge variant="secondary" className={config.color}>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with desk selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">My Flashcard Decks</h2>
              {selectedDesk && (
                <Badge variant="outline" className="text-sm">
                  {selectedDesk.name}
                </Badge>
              )}
            </div>
            <p className="text-gray-600">
              {selectedDesk 
                ? `Managing cards in "${selectedDesk.name}" (${words.length} cards)`
                : `All your flashcards (${stats.total} total cards)`
              }
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowDeskManager(!showDeskManager)}
            >
              {showDeskManager ? 'Hide Decks' : 'Manage Decks'}
            </Button>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? 'Cancel' : 'Add Flashcard'}
            </Button>
          </div>
        </div>

        {/* Desk Selection */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant={selectedDesk === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDesk(null)}
          >
            All Cards ({stats.total})
          </Button>
          {desks.map((desk) => {
            const IconComponent = desk.icon === 'book-open' ? () => (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            ) : () => (
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: desk.color }} />
            )
            
            return (
              <Button
                key={desk.id}
                variant={selectedDesk?.id === desk.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDesk(desk)}
                className="flex items-center gap-2"
              >
                <IconComponent />
                {desk.name} ({desk.word_count || 0})
              </Button>
            )
          })}
        </div>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-600">
              {selectedDesk ? 'Cards in Deck' : 'Total Cards'}
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {selectedDesk ? words.length : stats.total}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-600">Active Decks</div>
            <div className="text-2xl font-bold text-green-900">{desks.length}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-600">Categories</div>
            <div className="text-2xl font-bold text-purple-900">{Object.keys(stats.byCategory).length}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-orange-600">Added This Week</div>
            <div className="text-2xl font-bold text-orange-900">{stats.recentCount}</div>
          </div>
        </div>
      </div>

      {/* Deck Manager */}
      {showDeskManager && (
        <div className="bg-white shadow rounded-lg p-6">
          <DeskManager 
            onDeskSelect={handleDeskSelect}
            selectedDeskId={selectedDesk?.id}
          />
        </div>
      )}

      {/* Add word form */}
      {showAddForm && (
        <AddWordForm
          onWordAdded={handleWordAdded}
          onCancel={() => setShowAddForm(false)}
          selectedDesk={selectedDesk}
        />
      )}

      {/* Filters and search */}
      <div className="bg-white shadow rounded-lg p-6">
        {/* Bulk Operations Bar */}
        {selectedWordIds.size > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedWordIds.size} flashcard{selectedWordIds.size !== 1 ? 's' : ''} selected
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedWordIds(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {selectedDesk && desks.filter(d => d.id !== selectedDesk?.id).length > 0 && (
                  <Select onValueChange={handleBulkMoveToDesk} disabled={bulkOperationLoading}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Move to deck..." />
                    </SelectTrigger>
                    <SelectContent>
                      {desks.filter(d => d.id !== selectedDesk?.id).map(desk => (
                        <SelectItem key={desk.id} value={desk.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: desk.color }} />
                            {desk.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  disabled={bulkOperationLoading}
                >
                  {bulkOperationLoading ? 'Deleting...' : 'Delete Selected'}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search words or definitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {WORD_CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Difficulties</SelectItem>
              {Object.entries(DIFFICULTY_LEVELS).map(([level, { label }]) => (
                <SelectItem key={level} value={level}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
              <SelectItem value="difficulty">Difficulty</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div>
            {filteredWords.length !== words.length && (
              <p className="text-sm text-gray-600">
                Showing {filteredWords.length} of {words.length} words
              </p>
            )}
          </div>
          {filteredWords.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSelectAll}
              className="text-xs"
            >
              {selectedWordIds.size === filteredWords.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>
      </div>

      {/* Flashcards Grid */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedDesk ? `${selectedDesk.name} Flashcards` : 'All Flashcards'}
          </h3>
          {selectedDesk && (
            <p className="text-sm text-gray-600 mt-1">
              {selectedDesk.description || 'Flashcards in this deck'}
            </p>
          )}
        </div>
        
        {filteredWords.length === 0 ? (
          <div className="text-center py-12">
            {words.length === 0 ? (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {selectedDesk ? `No flashcards in ${selectedDesk.name}` : 'No flashcards yet'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedDesk 
                    ? `Start adding flashcards to your ${selectedDesk.name} deck.`
                    : 'Get started by creating your first flashcard.'}
                </p>
                <Button className="mt-4" onClick={() => setShowAddForm(true)}>
                  {selectedDesk ? 'Add Flashcard to Deck' : 'Create First Flashcard'}
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-gray-500">No flashcards match your current filters.</p>
                <Button 
                  variant="outline" 
                  className="mt-2" 
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('All')
                    setSelectedDifficulty('All')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredWords.map((word) => (
              <WordWithFlashcard
                key={word.id}
                word={word}
                onEdit={setEditingWord}
                onDelete={handleDeleteWord}
                isDeleting={deletingWordId === word.id}
                selectedDesk={selectedDesk}
                isSelected={selectedWordIds.has(word.id)}
                onSelectionChange={handleWordSelection}
                showSelection={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit word modal */}
      {editingWord && (
        <WordEditModal
          word={editingWord}
          onWordUpdated={handleWordUpdated}
          onClose={() => setEditingWord(null)}
        />
      )}
    </div>
  )
}
