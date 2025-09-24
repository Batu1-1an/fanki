-- RFC: Optimize Review Query Performance
-- This migration creates database views and functions to eliminate heavy client-side processing
-- and provide accurate due word counts without limits or sampling bias.

-- 1. Create a materialized view for latest reviews per word
-- This eliminates the N+1 query problem where we fetch all reviews then group by word_id
CREATE OR REPLACE VIEW latest_reviews AS
SELECT DISTINCT ON (r.word_id) 
    r.*,
    w.user_id as word_user_id,
    w.status as word_status,
    w.desk_id
FROM reviews r
INNER JOIN words w ON r.word_id = w.id
ORDER BY r.word_id, r.reviewed_at DESC;

-- Create index to make the view performant
CREATE INDEX IF NOT EXISTS idx_latest_reviews_user_due 
ON reviews (word_id, user_id, due_date, reviewed_at DESC);

-- 2. Create function to get accurate due word counts without limits
-- This addresses the "systematically low counts" issue in getReviewStats()
CREATE OR REPLACE FUNCTION get_due_word_counts(p_user_id UUID, p_desk_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_due INTEGER,
    overdue INTEGER,
    due_today INTEGER,
    new_words INTEGER
) AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    today_end TIMESTAMPTZ := (today_date + INTERVAL '1 day - 1 microsecond');
BEGIN
    RETURN QUERY
    WITH word_status AS (
        SELECT 
            w.id,
            w.status,
            lr.due_date,
            CASE 
                WHEN w.status = 'new' OR lr.due_date IS NULL THEN 'new'
                WHEN lr.due_date::date < today_date THEN 'overdue' 
                WHEN lr.due_date::date = today_date THEN 'due_today'
                ELSE 'future'
            END as review_status
        FROM words w
        LEFT JOIN latest_reviews lr ON w.id = lr.word_id AND w.user_id = lr.user_id
        WHERE w.user_id = p_user_id
        AND (p_desk_id IS NULL OR w.desk_id = p_desk_id)
        AND w.status IN ('new', 'learning', 'review')
    ),
    counts AS (
        SELECT 
            COUNT(*) FILTER (WHERE review_status IN ('overdue', 'due_today', 'new')) as total_due,
            COUNT(*) FILTER (WHERE review_status = 'overdue') as overdue,
            COUNT(*) FILTER (WHERE review_status = 'due_today') as due_today,
            COUNT(*) FILTER (WHERE review_status = 'new') as new_words
        FROM word_status
    )
    SELECT 
        counts.total_due::INTEGER,
        counts.overdue::INTEGER, 
        counts.due_today::INTEGER,
        counts.new_words::INTEGER
    FROM counts;
END;
$$ LANGUAGE plpgsql;

-- 3. Create function to get due words with proper sorting and desk filtering
-- This eliminates heavy client-side processing and provides deterministic results
CREATE OR REPLACE FUNCTION get_due_words_optimized(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_sort_order TEXT DEFAULT 'recommended',
    p_desk_id UUID DEFAULT NULL
)
RETURNS TABLE (
    word_id UUID,
    word TEXT,
    definition TEXT,
    pronunciation TEXT,
    difficulty INTEGER,
    status TEXT,
    desk_id UUID,
    created_at TIMESTAMPTZ,
    ease_factor DECIMAL,
    interval_days INTEGER,
    repetitions INTEGER,
    due_date TIMESTAMPTZ,
    quality INTEGER,
    reviewed_at TIMESTAMPTZ
) AS $$
DECLARE
    today_end TIMESTAMPTZ := (CURRENT_DATE + INTERVAL '1 day - 1 microsecond');
BEGIN
    RETURN QUERY
    WITH due_words AS (
        SELECT 
            w.id as word_id,
            w.word,
            w.definition,
            w.pronunciation,
            w.difficulty,
            w.status,
            w.desk_id,
            w.created_at,
            lr.ease_factor,
            lr.interval_days,
            lr.repetitions,
            lr.due_date,
            lr.quality,
            lr.reviewed_at,
            CASE 
                WHEN w.status = 'new' OR lr.due_date IS NULL THEN 1
                WHEN lr.due_date <= today_end THEN 2
                ELSE 0
            END as priority_order,
            -- Add deterministic randomization using word_id for consistent results
            abs(('x' || substring(w.id::text, 1, 8))::bit(32)::int) % 1000000 as deterministic_random
        FROM words w
        LEFT JOIN latest_reviews lr ON w.id = lr.word_id AND w.user_id = lr.user_id
        WHERE w.user_id = p_user_id
        AND (p_desk_id IS NULL OR w.desk_id = p_desk_id)
        AND w.status IN ('new', 'learning', 'review')
        AND (
            w.status = 'new' OR 
            lr.due_date IS NULL OR
            lr.due_date <= today_end
        )
    )
    SELECT 
        dw.word_id,
        dw.word,
        dw.definition,
        dw.pronunciation,
        dw.difficulty,
        dw.status,
        dw.desk_id,
        dw.created_at,
        dw.ease_factor,
        dw.interval_days,
        dw.repetitions,
        dw.due_date,
        dw.quality,
        dw.reviewed_at
    FROM due_words dw
    ORDER BY 
        dw.priority_order DESC,
        CASE 
            WHEN p_sort_order = 'oldest' THEN dw.due_date
            ELSE NULL
        END ASC NULLS LAST,
        CASE 
            WHEN p_sort_order = 'easiest' THEN -COALESCE(dw.ease_factor, 2.5)
            WHEN p_sort_order = 'hardest' THEN COALESCE(dw.ease_factor, 2.5)
            WHEN p_sort_order = 'recommended' THEN dw.deterministic_random
            ELSE dw.deterministic_random
        END ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function for learning words with better performance
CREATE OR REPLACE FUNCTION get_learning_words_optimized(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    word_id UUID,
    word TEXT,
    definition TEXT,
    pronunciation TEXT,
    difficulty INTEGER,
    status TEXT,
    desk_id UUID,
    created_at TIMESTAMPTZ,
    ease_factor DECIMAL,
    interval_days INTEGER,
    repetitions INTEGER,
    due_date TIMESTAMPTZ,
    quality INTEGER,
    reviewed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id as word_id,
        w.word,
        w.definition,
        w.pronunciation,
        w.difficulty,
        w.status,
        w.desk_id,
        w.created_at,
        lr.ease_factor,
        lr.interval_days,
        lr.repetitions,
        lr.due_date,
        lr.quality,
        lr.reviewed_at
    FROM words w
    INNER JOIN latest_reviews lr ON w.id = lr.word_id AND w.user_id = lr.user_id
    WHERE w.user_id = p_user_id
    AND w.status = 'learning'
    AND lr.due_date <= NOW()
    ORDER BY lr.due_date ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to invalidate queue cache when reviews are submitted
-- This addresses the cache invalidation issue in ReviewQueueManager
CREATE OR REPLACE FUNCTION notify_queue_cache_invalidation()
RETURNS TRIGGER AS $$
BEGIN
    -- Send a notification that can be listened to by the application
    PERFORM pg_notify('queue_cache_invalidation', json_build_object(
        'user_id', COALESCE(NEW.user_id, OLD.user_id),
        'action', TG_OP,
        'table', TG_TABLE_NAME,
        'timestamp', NOW()
    )::text);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to notify when reviews change
DROP TRIGGER IF EXISTS trigger_queue_cache_invalidation_reviews ON reviews;
CREATE TRIGGER trigger_queue_cache_invalidation_reviews
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION notify_queue_cache_invalidation();

DROP TRIGGER IF EXISTS trigger_queue_cache_invalidation_words ON words;
CREATE TRIGGER trigger_queue_cache_invalidation_words
    AFTER UPDATE ON words
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_queue_cache_invalidation();

-- 6. Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_words_user_status_desk 
ON words (user_id, status, desk_id) 
WHERE status IN ('new', 'learning', 'review');

CREATE INDEX IF NOT EXISTS idx_reviews_user_word_reviewed 
ON reviews (user_id, word_id, reviewed_at DESC);

-- 7. Create a function to get review statistics efficiently
CREATE OR REPLACE FUNCTION get_review_statistics(p_user_id UUID)
RETURNS TABLE (
    total_reviews BIGINT,
    todays_reviews BIGINT,
    words_due_today INTEGER,
    correct_reviews BIGINT,
    avg_ease_factor DECIMAL
) AS $$
DECLARE
    today_start TIMESTAMPTZ := CURRENT_DATE;
    today_end TIMESTAMPTZ := (CURRENT_DATE + INTERVAL '1 day - 1 microsecond');
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total_reviews,
            COUNT(*) FILTER (WHERE reviewed_at >= today_start AND reviewed_at <= today_end) as todays_reviews,
            COUNT(*) FILTER (WHERE quality >= 3) as correct_reviews,
            AVG(ease_factor) FILTER (WHERE ease_factor > 0) as avg_ease_factor
        FROM reviews
        WHERE user_id = p_user_id
    ),
    due_counts AS (
        SELECT total_due, due_today 
        FROM get_due_word_counts(p_user_id)
    )
    SELECT 
        stats.total_reviews,
        stats.todays_reviews,
        due_counts.due_today,
        stats.correct_reviews,
        COALESCE(stats.avg_ease_factor, 2.5)
    FROM stats, due_counts;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_due_word_counts(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_due_words_optimized(UUID, INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_learning_words_optimized(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_statistics(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_due_word_counts IS 'Returns accurate counts of due words without sampling bias';
COMMENT ON FUNCTION get_due_words_optimized IS 'Returns due words with proper sorting and desk filtering, eliminating client-side processing';
COMMENT ON FUNCTION get_learning_words_optimized IS 'Returns learning words due for review with optimized query';
COMMENT ON FUNCTION get_review_statistics IS 'Returns comprehensive review statistics with accurate due word counts';
COMMENT ON VIEW latest_reviews IS 'Optimized view showing the latest review for each word, eliminating N+1 queries';
