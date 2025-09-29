// Extended types for study sessions with status tracking
// This addresses the TypeScript errors for pause/resume functionality

import { Tables, TablesInsert, TablesUpdate } from './index'

export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned'

// Extended study session type - just use the base type directly since all fields are already in database
export type ExtendedStudySession = Tables<'study_sessions'>

// Extended insert type - just use the base type
export type ExtendedStudySessionInsert = TablesInsert<'study_sessions'>

// Extended update type - just use the base type
export type ExtendedStudySessionUpdate = TablesUpdate<'study_sessions'>
