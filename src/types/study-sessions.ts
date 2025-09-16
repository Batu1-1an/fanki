// Extended types for study sessions with status tracking
// This addresses the TypeScript errors for pause/resume functionality

import { Tables, TablesInsert, TablesUpdate } from './index'

export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned'

// Extended study session type with status tracking
export interface ExtendedStudySession extends Tables<'study_sessions'> {
  status: SessionStatus
  paused_at?: string
  resumed_at?: string
}

// Extended insert type with status
export interface ExtendedStudySessionInsert extends TablesInsert<'study_sessions'> {
  status?: SessionStatus
  paused_at?: string
  resumed_at?: string
}

// Extended update type with status
export interface ExtendedStudySessionUpdate extends TablesUpdate<'study_sessions'> {
  status?: SessionStatus
  paused_at?: string
  resumed_at?: string
}
