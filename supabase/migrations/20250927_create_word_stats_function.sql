-- Create optimized word statistics function
CREATE OR REPLACE FUNCTION get_user_word_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_words int := 0;
    recent_count int := 0;
    difficulty_stats jsonb := '{}';
    category_stats jsonb := '{}';
    one_week_ago timestamptz := NOW() - INTERVAL '7 days';
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_words
    FROM words
    WHERE user_id = p_user_id;
    
    -- Get recent count (last 7 days)
    SELECT COUNT(*) INTO recent_count
    FROM words
    WHERE user_id = p_user_id
    AND created_at >= one_week_ago;
    
    -- Get difficulty breakdown
    SELECT jsonb_object_agg(difficulty::text, count)
    INTO difficulty_stats
    FROM (
        SELECT difficulty, COUNT(*) as count
        FROM words
        WHERE user_id = p_user_id
        GROUP BY difficulty
    ) difficulty_breakdown;
    
    -- Get category breakdown
    SELECT jsonb_object_agg(COALESCE(category, 'General'), count)
    INTO category_stats
    FROM (
        SELECT COALESCE(category, 'General') as category, COUNT(*) as count
        FROM words
        WHERE user_id = p_user_id
        GROUP BY COALESCE(category, 'General')
    ) category_breakdown;
    
    RETURN jsonb_build_object(
        'total', COALESCE(total_words, 0),
        'recentCount', COALESCE(recent_count, 0),
        'byDifficulty', COALESCE(difficulty_stats, '{}'),
        'byCategory', COALESCE(category_stats, '{}')
    );
END;
$$;
