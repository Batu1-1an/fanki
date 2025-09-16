import { Database } from './database'

// Convenience type exports
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Profile = Tables<'profiles'>
export type Word = Tables<'words'>
export type Flashcard = Tables<'flashcards'>
export type Review = Tables<'reviews'>
export type StudySession = Tables<'study_sessions'>

// Flashcard-related types
export interface FlashcardSentence {
  sentence: string
  blank_position: number
  correct_word: string
}

export interface FlashcardContent {
  sentences: FlashcardSentence[]
  image_url?: string
  audio_url?: string
}

// SM-2 Algorithm types
export interface SM2Result {
  ease_factor: number
  interval_days: number
  repetitions: number
  due_date: Date
}

export interface ReviewResult {
  quality: number // 0-5 rating
  response_time_ms?: number
}

// User preferences
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  audio_autoplay?: boolean
  daily_reminder_time?: string
  study_goal_per_day?: number
  preferred_voice?: string
  show_pronunciation?: boolean
  difficulty_preference?: 1 | 2 | 3 | 4 | 5
}

// Study session types
export type SessionType = 'review' | 'learn' | 'practice'
export type FlashcardMode = 'front' | 'back' | 'cloze'
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5 // SM-2 algorithm quality ratings

// Learning levels
export type LearningLevel = 'beginner' | 'intermediate' | 'advanced'

// Word status for learning phases
export type WordStatus = 'new' | 'learning' | 'review'

// Learning phase steps (in minutes)
export const LEARNING_STEPS = [1, 10] // 1 minute, then 10 minutes
export const GRADUATION_INTERVAL = 1 // 1 day after graduating

// Enhanced flashcard types
export interface FlashcardWithWord {
  flashcard: Flashcard & {
    sentences: FlashcardSentence[]
  }
  word: Word
}

export interface FlashcardState {
  isFlipped: boolean
  currentSentenceIndex: number
  userInput: string
  isCorrect?: boolean
  showFeedback: boolean
  responseTime: number
}

export interface FlashcardAnswer {
  sentenceIndex: number
  userAnswer: string
  isCorrect: boolean
  responseTimeMs: number
}

// Component props
export interface FlashcardProps {
  word: Word
  flashcard: Flashcard
  onReview: (result: ReviewResult) => void
  onNext?: () => void
  onPrevious?: () => void
  showNavigation?: boolean
  autoFlip?: boolean
  className?: string
}

export interface ClozeTestProps {
  sentence: FlashcardSentence
  onAnswer: (answer: FlashcardAnswer) => void
  isRevealed?: boolean
  className?: string
}

export interface FlashcardImageProps {
  imageUrl?: string
  alt: string
  className?: string
  priority?: boolean
}

export interface ProgressStats {
  total_words: number
  words_learned: number
  current_streak: number
  longest_streak: number
  accuracy_rate: number
  total_study_time: number
  words_due_today: number
}

// AI Generation types
export interface AIGenerationRequest {
  word: string
  difficulty: number
  context?: string
}

export interface AIGenerationResponse {
  sentences: FlashcardSentence[]
  image_prompt?: string
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
}

export * from './database'
