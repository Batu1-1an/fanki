// Database type definitions
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          learning_level: 'beginner' | 'intermediate' | 'advanced'
          target_language: string
          daily_goal: number
          timezone: string
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          learning_level?: 'beginner' | 'intermediate' | 'advanced'
          target_language?: string
          daily_goal?: number
          timezone?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          learning_level?: 'beginner' | 'intermediate' | 'advanced'
          target_language?: string
          daily_goal?: number
          timezone?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      words: {
        Row: {
          id: string
          user_id: string
          word: string
          definition: string | null
          language: string
          difficulty: number
          category: string | null
          pronunciation: string | null
          status: 'new' | 'learning' | 'review'
          memory_hook: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word: string
          definition?: string | null
          language?: string
          difficulty?: number
          category?: string | null
          pronunciation?: string | null
          status?: 'new' | 'learning' | 'review'
          memory_hook?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word?: string
          definition?: string | null
          language?: string
          difficulty?: number
          category?: string | null
          pronunciation?: string | null
          status?: 'new' | 'learning' | 'review'
          memory_hook?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      desks: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string
          icon: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          color?: string
          icon?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      word_desks: {
        Row: {
          id: string
          word_id: string
          desk_id: string
          added_at: string
        }
        Insert: {
          id?: string
          word_id: string
          desk_id: string
          added_at?: string
        }
        Update: {
          id?: string
          word_id?: string
          desk_id?: string
          added_at?: string
        }
      }
      flashcards: {
        Row: {
          id: string
          word_id: string
          sentences: Json
          image_url: string | null
          audio_url: string | null
          generated_at: string
          generation_version: number
          is_active: boolean
        }
        Insert: {
          id?: string
          word_id: string
          sentences?: Json
          image_url?: string | null
          audio_url?: string | null
          generated_at?: string
          generation_version?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          word_id?: string
          sentences?: Json
          image_url?: string | null
          audio_url?: string | null
          generated_at?: string
          generation_version?: number
          is_active?: boolean
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          word_id: string
          flashcard_id: string | null
          quality: number
          ease_factor: number
          interval_days: number
          repetitions: number
          due_date: string
          reviewed_at: string
          response_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word_id: string
          flashcard_id?: string | null
          quality: number
          ease_factor?: number
          interval_days?: number
          repetitions?: number
          due_date?: string
          reviewed_at?: string
          response_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word_id?: string
          flashcard_id?: string | null
          quality?: number
          ease_factor?: number
          interval_days?: number
          repetitions?: number
          due_date?: string
          reviewed_at?: string
          response_time_ms?: number | null
          created_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: 'review' | 'learn' | 'practice'
          words_studied: number
          words_correct: number
          total_reviews: number
          session_duration_seconds: number
          accuracy_percentage: number | null
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_type?: 'review' | 'learn' | 'practice'
          words_studied?: number
          words_correct?: number
          total_reviews?: number
          session_duration_seconds?: number
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: 'review' | 'learn' | 'practice'
          words_studied?: number
          words_correct?: number
          total_reviews?: number
          session_duration_seconds?: number
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
