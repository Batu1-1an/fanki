export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      card_templates: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          label: string
          note_type_id: string
          ordinal: number
          slug: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          label: string
          note_type_id: string
          ordinal?: number
          slug: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          note_type_id?: string
          ordinal?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_templates_note_type_id_fkey"
            columns: ["note_type_id"]
            isOneToOne: false
            referencedRelation: "note_types"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          created_at: string
          due_date: string | null
          ease_factor: number
          id: string
          interval_days: number
          is_active: boolean
          is_suspended: boolean
          last_quality: number | null
          last_reviewed_at: string | null
          note_id: string
          position: number
          render_payload: Json
          repetitions: number
          template_id: string | null
          template_slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          ease_factor?: number
          id?: string
          interval_days?: number
          is_active?: boolean
          is_suspended?: boolean
          last_quality?: number | null
          last_reviewed_at?: string | null
          note_id: string
          position?: number
          render_payload?: Json
          repetitions?: number
          template_id?: string | null
          template_slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          ease_factor?: number
          id?: string
          interval_days?: number
          is_active?: boolean
          is_suspended?: boolean
          last_quality?: number | null
          last_reviewed_at?: string | null
          note_id?: string
          position?: number
          render_payload?: Json
          repetitions?: number
          template_id?: string | null
          template_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "card_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      desks: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          audio_url: string | null
          generated_at: string | null
          generation_version: number | null
          id: string
          image_description: string | null
          image_url: string | null
          is_active: boolean | null
          sentences: Json
          word_id: string
        }
        Insert: {
          audio_url?: string | null
          generated_at?: string | null
          generation_version?: number | null
          id?: string
          image_description?: string | null
          image_url?: string | null
          is_active?: boolean | null
          sentences?: Json
          word_id: string
        }
        Update: {
          audio_url?: string | null
          generated_at?: string | null
          generation_version?: number | null
          id?: string
          image_description?: string | null
          image_url?: string | null
          is_active?: boolean | null
          sentences?: Json
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      note_types: {
        Row: {
          created_at: string
          default_fields: Json
          default_options: Json
          description: string | null
          id: string
          label: string
          requires_typing: boolean
          slug: string
          supports_cloze: boolean
          supports_image_occlusion: boolean
          supports_reverse: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_fields?: Json
          default_options?: Json
          description?: string | null
          id?: string
          label: string
          requires_typing?: boolean
          slug: string
          supports_cloze?: boolean
          supports_image_occlusion?: boolean
          supports_reverse?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_fields?: Json
          default_options?: Json
          description?: string | null
          id?: string
          label?: string
          requires_typing?: boolean
          slug?: string
          supports_cloze?: boolean
          supports_image_occlusion?: boolean
          supports_reverse?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          created_at: string
          fields: Json
          id: string
          note_type_id: string
          tags: string[]
          updated_at: string
          user_id: string
          word_id: string | null
        }
        Insert: {
          created_at?: string
          fields?: Json
          id?: string
          note_type_id: string
          tags?: string[]
          updated_at?: string
          user_id: string
          word_id?: string | null
        }
        Update: {
          created_at?: string
          fields?: Json
          id?: string
          note_type_id?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
          word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_note_type_id_fkey"
            columns: ["note_type_id"]
            isOneToOne: false
            referencedRelation: "note_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          daily_goal: number | null
          full_name: string | null
          id: string
          learning_level: string | null
          preferences: Json | null
          target_language: string | null
          timezone: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          daily_goal?: number | null
          full_name?: string | null
          id: string
          learning_level?: string | null
          preferences?: Json | null
          target_language?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          daily_goal?: number | null
          full_name?: string | null
          id?: string
          learning_level?: string | null
          preferences?: Json | null
          target_language?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          card_id: string | null
          created_at: string | null
          due_date: string | null
          ease_factor: number | null
          flashcard_id: string | null
          id: string
          interval_days: number | null
          quality: number
          repetitions: number | null
          response_time_ms: number | null
          reviewed_at: string | null
          user_id: string
          word_id: string
        }
        Insert: {
          card_id?: string | null
          created_at?: string | null
          due_date?: string | null
          ease_factor?: number | null
          flashcard_id?: string | null
          id?: string
          interval_days?: number | null
          quality: number
          repetitions?: number | null
          response_time_ms?: number | null
          reviewed_at?: string | null
          user_id: string
          word_id: string
        }
        Update: {
          card_id?: string | null
          created_at?: string | null
          due_date?: string | null
          ease_factor?: number | null
          flashcard_id?: string | null
          id?: string
          interval_days?: number | null
          quality?: number
          repetitions?: number | null
          response_time_ms?: number | null
          reviewed_at?: string | null
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          accuracy_percentage: number | null
          created_at: string | null
          ended_at: string | null
          id: string
          paused_at: string | null
          resumed_at: string | null
          session_duration_seconds: number | null
          session_type: string | null
          status: string | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          words_correct: number | null
          words_studied: number | null
        }
        Insert: {
          accuracy_percentage?: number | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          paused_at?: string | null
          resumed_at?: string | null
          session_duration_seconds?: number | null
          session_type?: string | null
          status?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          words_correct?: number | null
          words_studied?: number | null
        }
        Update: {
          accuracy_percentage?: number | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          paused_at?: string | null
          resumed_at?: string | null
          session_duration_seconds?: number | null
          session_type?: string | null
          status?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          words_correct?: number | null
          words_studied?: number | null
        }
        Relationships: []
      }
      word_desks: {
        Row: {
          added_at: string | null
          desk_id: string
          id: string
          word_id: string
        }
        Insert: {
          added_at?: string | null
          desk_id: string
          id?: string
          word_id: string
        }
        Update: {
          added_at?: string | null
          desk_id?: string
          id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_desks_desk_id_fkey"
            columns: ["desk_id"]
            isOneToOne: false
            referencedRelation: "desks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_desks_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      words: {
        Row: {
          category: string | null
          created_at: string | null
          definition: string | null
          difficulty: number | null
          id: string
          language: string | null
          memory_hook: string | null
          pronunciation: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          word: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          definition?: string | null
          difficulty?: number | null
          id?: string
          language?: string | null
          memory_hook?: string | null
          pronunciation?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          word: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          definition?: string | null
          difficulty?: number | null
          id?: string
          language?: string | null
          memory_hook?: string | null
          pronunciation?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          word?: string
        }
        Relationships: []
      }
    }
    Views: {
      latest_reviews: {
        Row: {
          created_at: string | null
          due_date: string | null
          ease_factor: number | null
          flashcard_id: string | null
          id: string | null
          interval_days: number | null
          quality: number | null
          repetitions: number | null
          response_time_ms: number | null
          reviewed_at: string | null
          user_id: string | null
          word_id: string | null
          word_status: string | null
          word_user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      delete_word_and_dependents: {
        Args: {
          word_id_to_delete: string
        }
        Returns: undefined
      }
      get_comprehensive_dashboard_data: {
        Args: {
          p_desk_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      get_due_cards_optimized: {
        Args: {
          p_desk_id?: string
          p_limit?: number
          p_sort_order?: string
          p_user_id: string
        }
        Returns: {
          card_id: string
          created_at: string | null
          definition: string | null
          difficulty: number | null
          due_date: string | null
          ease_factor: number | null
          fields: Json
          interval_days: number | null
          last_quality: number | null
          last_reviewed_at: string | null
          note_id: string
          note_type_slug: string | null
          pronunciation: string | null
          render_payload: Json
          repetitions: number | null
          review_status: string | null
          status: string | null
          template_slug: string
          word: string
          word_id: string | null
        }[]
      }
      get_due_word_counts: {
        Args: {
          p_desk_id?: string
          p_user_id: string
        }
        Returns: {
          due_today: number
          new_words: number
          overdue: number
          total_due: number
        }[]
      }
      get_learning_cards_optimized: {
        Args: {
          p_limit?: number
          p_user_id: string
        }
        Returns: {
          card_id: string
          created_at: string | null
          definition: string | null
          difficulty: number | null
          due_date: string | null
          ease_factor: number | null
          fields: Json
          interval_days: number | null
          last_quality: number | null
          last_reviewed_at: string | null
          note_id: string
          note_type_slug: string | null
          pronunciation: string | null
          render_payload: Json
          repetitions: number | null
          template_slug: string
          word: string
          word_id: string | null
        }[]
      }
      get_review_statistics: {
        Args: {
          p_user_id: string
        }
        Returns: {
          avg_ease_factor: number
          correct_reviews: number
          todays_reviews: number
          total_reviews: number
          words_due_today: number
        }[]
      }
      get_user_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_queue_counts: {
        Args: {
          p_desk_id?: string
        }
        Returns: Json
      }
      get_user_study_session_stats: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
      get_user_word_stats: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
