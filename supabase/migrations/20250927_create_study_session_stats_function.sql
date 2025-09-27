-- Create optimized study session statistics function
CREATE OR REPLACE FUNCTION get_user_study_session_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_sessions int := 0;
    completed_sessions int := 0;
    total_time_minutes numeric := 0;
    average_accuracy numeric := 0;
    total_words_studied int := 0;
    current_streak int := 0;
    longest_streak int := 0;
    user_timezone text := 'UTC';
    
    -- Variables for streak calculation
    probe_date date;
    temp_streak int := 0;
    max_temp_streak int := 0;
    prev_date date;
    session_dates date[];
BEGIN
    -- Get user timezone (fallback to UTC)
    SELECT COALESCE(timezone, 'UTC') INTO user_timezone
    FROM profiles
    WHERE id = p_user_id;
    
    -- Get basic session statistics
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COALESCE(SUM(session_duration_seconds) / 60.0, 0) as time_minutes,
        COALESCE(AVG(accuracy_percentage) FILTER (WHERE status = 'completed' AND accuracy_percentage IS NOT NULL), 0) as avg_accuracy,
        COALESCE(SUM(words_studied), 0) as words_studied
    INTO total_sessions, completed_sessions, total_time_minutes, average_accuracy, total_words_studied
    FROM study_sessions
    WHERE user_id = p_user_id;
    
    -- Get unique completion dates for streak calculation (in user timezone)
    SELECT array_agg(DISTINCT completion_date ORDER BY completion_date)
    INTO session_dates
    FROM (
        SELECT (ended_at AT TIME ZONE user_timezone)::date as completion_date
        FROM study_sessions
        WHERE user_id = p_user_id 
        AND status = 'completed' 
        AND ended_at IS NOT NULL
    ) dates;
    
    -- Calculate current streak (consecutive days from today backwards)
    probe_date := (NOW() AT TIME ZONE user_timezone)::date;
    current_streak := 0;
    
    -- Check up to 365 days back for current streak
    FOR i IN 0..364 LOOP
        IF probe_date = ANY(session_dates) THEN
            current_streak := current_streak + 1;
            probe_date := probe_date - 1;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    -- Calculate longest streak
    longest_streak := 0;
    temp_streak := 0;
    prev_date := NULL;
    
    -- Iterate through all session dates to find longest consecutive sequence
    IF session_dates IS NOT NULL THEN
        FOREACH probe_date IN ARRAY session_dates LOOP
            IF prev_date IS NULL OR probe_date = prev_date + 1 THEN
                temp_streak := temp_streak + 1;
            ELSE
                temp_streak := 1;
            END IF;
            
            IF temp_streak > longest_streak THEN
                longest_streak := temp_streak;
            END IF;
            
            prev_date := probe_date;
        END LOOP;
    END IF;
    
    RETURN jsonb_build_object(
        'totalSessions', COALESCE(total_sessions, 0),
        'completedSessions', COALESCE(completed_sessions, 0),
        'totalTimeMinutes', ROUND(COALESCE(total_time_minutes, 0)),
        'averageAccuracy', ROUND(COALESCE(average_accuracy, 0)),
        'totalWordsStudied', COALESCE(total_words_studied, 0),
        'currentStreak', COALESCE(current_streak, 0),
        'longestStreak', COALESCE(longest_streak, 0)
    );
END;
$$;
