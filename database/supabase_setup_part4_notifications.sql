-- =====================================================
-- SUPABASE-COMPATIBLE SCHEMA SETUP - PART 4: NOTIFICATION FUNCTIONS
-- Run this after Part 3
-- =====================================================

-- Function to get user notifications
CREATE OR REPLACE FUNCTION public.get_user_notifications(
    user_uuid UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', n.id,
            'title', n.title,
            'message', n.message,
            'type', n.type,
            'priority', n.priority,
            'is_read', n.is_read,
            'metadata', n.metadata,
            'created_at', n.created_at,
            'updated_at', n.updated_at
        )
    ), '[]'::json) INTO result
    FROM (
        SELECT *
        FROM public.notifications n
        WHERE (user_uuid IS NULL OR n.user_id = user_uuid OR n.user_id IS NULL)
        ORDER BY 
            CASE n.priority
                WHEN 'urgent' THEN 1
                WHEN 'high' THEN 2
                WHEN 'normal' THEN 3
                WHEN 'low' THEN 4
                ELSE 5
            END,
            n.created_at DESC
        LIMIT limit_count
        OFFSET offset_count
    ) n;
    
    RETURN result;
END;
$$;

-- Function to get notification stats
CREATE OR REPLACE FUNCTION public.get_notification_stats(
    user_uuid UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    total_count INTEGER;
    unread_count INTEGER;
    high_priority_unread INTEGER;
    result JSON;
BEGIN
    -- Get total notifications
    SELECT COUNT(*) INTO total_count
    FROM public.notifications n
    WHERE (user_uuid IS NULL OR n.user_id = user_uuid OR n.user_id IS NULL);
    
    -- Get unread notifications
    SELECT COUNT(*) INTO unread_count
    FROM public.notifications n
    WHERE (user_uuid IS NULL OR n.user_id = user_uuid OR n.user_id IS NULL)
    AND n.is_read = FALSE;
    
    -- Get high priority unread notifications
    SELECT COUNT(*) INTO high_priority_unread
    FROM public.notifications n
    WHERE (user_uuid IS NULL OR n.user_id = user_uuid OR n.user_id IS NULL)
    AND n.is_read = FALSE
    AND n.priority IN ('high', 'urgent');
    
    -- Build result
    SELECT json_build_object(
        'total_notifications', total_count,
        'unread_notifications', unread_count,
        'high_priority_unread', high_priority_unread,
        'last_updated', NOW()
    ) INTO result;
    
    -- Update stats table
    UPDATE public.notification_stats 
    SET 
        total_notifications = total_count,
        unread_notifications = unread_count,
        high_priority_unread = high_priority_unread,
        last_updated = NOW()
    WHERE id = 1;
    
    RETURN result;
END;
$$;
