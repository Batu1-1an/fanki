-- Create comprehensive dashboard data function
CREATE OR REPLACE FUNCTION get_comprehensive_dashboard_data(p_user_id uuid, p_desk_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    review_stats jsonb;
    queue_stats jsonb;
    word_stats jsonb;
    session_stats jsonb;
    onboarding_data jsonb;
    has_words boolean := false;
    has_preferences boolean := false;
    profile_data record;
BEGIN
    -- Get review statistics
    SELECT json_agg(json_build_object(
        'total_reviews', total_reviews,
        'todays_reviews', todays_reviews,
        'words_due_today', words_due_today,
        'correct_reviews', correct_reviews,
        'avg_ease_factor', avg_ease_factor
    )) INTO review_stats
    FROM get_review_statistics(p_user_id);
    
    -- Get queue statistics  
    SELECT get_user_queue_counts(p_desk_id) INTO queue_stats;
    
    -- Get word statistics
    SELECT get_user_word_stats(p_user_id) INTO word_stats;
    
    -- Get study session statistics
    SELECT get_user_study_session_stats(p_user_id) INTO session_stats;
    
    -- Get onboarding status
    SELECT COUNT(*) > 0 INTO has_words
    FROM words
    WHERE user_id = p_user_id;
    
    SELECT 
        COALESCE(learning_level IS NOT NULL AND target_language IS NOT NULL, false) as has_prefs,
        learning_level,
        target_language,
        daily_goal,
        preferences
    INTO profile_data
    FROM profiles
    WHERE id = p_user_id;
    
    has_preferences := COALESCE(profile_data.has_prefs, false);
    
    -- Build onboarding data
    onboarding_data := jsonb_build_object(
        'hasSetPreferences', has_preferences,
        'hasAddedFirstWord', has_words,
        'currentStep', CASE 
            WHEN has_preferences AND has_words THEN 'complete'
            WHEN NOT has_preferences THEN 'preferences'
            WHEN NOT has_words THEN 'first-word'
            ELSE 'complete'
        END,
        'profile', jsonb_build_object(
            'learning_level', profile_data.learning_level,
            'target_language', profile_data.target_language,
            'daily_goal', profile_data.daily_goal,
            'preferences', COALESCE(profile_data.preferences, '{}')
        )
    );
    
    RETURN jsonb_build_object(
        'reviewStats', review_stats->0,
        'queueStats', queue_stats,
        'wordStats', word_stats,
        'sessionStats', session_stats,
        'onboardingData', onboarding_data,
        'timestamp', extract(epoch from now())
    );
END;
$$;
