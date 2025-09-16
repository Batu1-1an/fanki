-- Add status tracking columns to study_sessions table
-- This migration addresses the pause/resume functionality bug

-- Add status column with proper constraints
ALTER TABLE study_sessions 
ADD COLUMN status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'paused', 'completed', 'abandoned'));

-- Add pause/resume timestamp columns
ALTER TABLE study_sessions 
ADD COLUMN paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN resumed_at TIMESTAMP WITH TIME ZONE;

-- Update existing sessions to have proper status based on ended_at
UPDATE study_sessions 
SET status = CASE 
    WHEN ended_at IS NOT NULL THEN 'completed'
    ELSE 'active'
END;

-- Add index for better query performance on status
CREATE INDEX idx_study_sessions_status ON study_sessions(user_id, status);
CREATE INDEX idx_study_sessions_active ON study_sessions(user_id) WHERE status IN ('active', 'paused');
