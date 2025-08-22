-- SAFE Notification System Setup (OPTIONAL)
-- Only run this if you want to enhance your existing notifications table
-- This WILL NOT affect existing data or functions

-- Step 1: Check if notifications table exists (run this first)
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: If notifications table doesn't exist, create it safely
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    category TEXT NOT NULL DEFAULT 'system',
    priority INTEGER NOT NULL DEFAULT 1,
    user_id UUID,
    related_entity_type TEXT,
    related_entity_id INTEGER,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step 3: Add basic indexes ONLY if they don't exist
DO $$
BEGIN
    -- Check and create indexes safely
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_is_read') THEN
        CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_created_at') THEN
        CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_id') THEN
        CREATE INDEX idx_notifications_user_id ON public.notifications(user_id) WHERE user_id IS NOT NULL;
    END IF;
END
$$;

-- Step 4: Test the table works
INSERT INTO public.notifications (title, message, type, category)
VALUES ('Test Notification', 'System setup test - safe to delete', 'info', 'system')
RETURNING id, title, created_at;
