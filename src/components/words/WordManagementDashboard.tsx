'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getUserWords, deleteWord, getWordStats, DIFFICULTY_LEVELS, WORD_CATEGORIES } from '@/lib/words'
import { Word } from '@/types'
import AddWordForm from './AddWordForm'
import WordEditModal from '@/components/words/WordEditModal'
import { WordWithFlashcard } from './WordWithFlashcard'

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

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical' | 'difficulty'>('newest')

  // UI state
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [deletingWordId, setDeletingWordId] = useState<string | null>(null)

  useEffect(() => {
    loadWords()
    loadStats()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [words, searchTerm, selectedCategory, selectedDifficulty, sortBy])

  const loadWords = async () => {
    setLoading(true)
    const { data, error } = await getUserWords({ limit: 1000 })
    
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
    }
    setDeletingWordId(null)
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
      {/* Header with stats */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Word Management</h2>
            <p className="text-gray-600 mt-1">
              Manage your vocabulary collection ({stats.total} words total)
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : 'Add New Word'}
          </Button>
        </div>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-600">Total Words</div>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-600">Added This Week</div>
            <div className="text-2xl font-bold text-green-900">{stats.recentCount}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-600">Categories</div>
            <div className="text-2xl font-bold text-purple-900">{Object.keys(stats.byCategory).length}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-orange-600">Avg Difficulty</div>
            <div className="text-2xl font-bold text-orange-900">
              {stats.total > 0 ? (
                Object.entries(stats.byDifficulty).reduce((sum, [level, count]) => 
                  sum + (parseInt(level) * count), 0) / stats.total
              ).toFixed(1) : '0'}
            </div>
          </div>
        </div>
      </div>

      {/* Add word form */}
      {showAddForm && (
        <AddWordForm
          onWordAdded={handleWordAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Filters and search */}
      <div className="bg-white shadow rounded-lg p-6">
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
        
        {filteredWords.length !== words.length && (
          <p className="mt-2 text-sm text-gray-600">
            Showing {filteredWords.length} of {words.length} words
          </p>
        )}
      </div>

      {/* Words list */}
      <div className="bg-white shadow rounded-lg">
        {filteredWords.length === 0 ? (
          <div className="text-center py-12">
            {words.length === 0 ? (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No words yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding your first word.</p>
                <Button className="mt-4" onClick={() => setShowAddForm(true)}>
                  Add Your First Word
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-gray-500">No words match your current filters.</p>
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
          <div className="space-y-4 p-4">
            {filteredWords.map((word) => (
              <WordWithFlashcard
                key={word.id}
                word={word}
                onEdit={setEditingWord}
                onDelete={handleDeleteWord}
                isDeleting={deletingWordId === word.id}
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
