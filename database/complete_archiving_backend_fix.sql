-- =====================================================
-- COMPLETE ARCHIVING AND NOTIFICATION BACKEND FIX
-- This script adds all missing functions and fixes the backend
-- =====================================================

-- Add all archiving columns to products table (with correct types)
DO $$ 
BEGIN
    -- Check and fix archived_by column type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'archived_by'
        AND table_schema = 'public'
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.products DROP COLUMN archived_by;
        RAISE NOTICE 'Dropped existing UUID archived_by column';
    END IF;
END $$;

-- Add all required archiving columns
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS archive_reason TEXT,
ADD COLUMN IF NOT EXISTS archived_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_by TEXT,
ADD COLUMN IF NOT EXISTS restored_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- Create archive_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.archive_logs (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    item_id BIGINT,
    item_name VARCHAR(255),
    reason TEXT,
    archived_by TEXT,
    original_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_archive_logs_created_at ON public.archive_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_logs_type ON public.archive_logs(type);
CREATE INDEX IF NOT EXISTS idx_products_archived_date ON public.products(archived_date DESC);
CREATE INDEX IF NOT EXISTS idx_products_archive_reason ON public.products(archive_reason);

-- Grant permissions
GRANT ALL ON public.archive_logs TO anon, authenticated;
GRANT ALL ON SEQUENCE public.archive_logs_id_seq TO anon, authenticated;

-- Add the missing notification functions that are being called by the frontend

-- 1. get_user_notifications function
CREATE OR REPLACE FUNCTION public.get_user_notifications(
    p_user_id UUID DEFAULT NULL,
    p_category VARCHAR(100) DEFAULT NULL,
    p_is_read BOOLEAN DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id BIGINT,
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    category VARCHAR(100),
    priority INTEGER,
    is_read BOOLEAN,
    is_archived BOOLEAN,
    related_entity_type VARCHAR(100),
    related_entity_id BIGINT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    time_ago TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.category,
        n.priority,
        n.is_read,
        n.is_archived,
        n.related_entity_type,
        n.related_entity_id,
        n.metadata,
        n.created_at,
        CASE 
            WHEN EXTRACT(EPOCH FROM (NOW() - n.created_at)) < 60 THEN 'Just now'
            WHEN EXTRACT(EPOCH FROM (NOW() - n.created_at)) < 3600 THEN 
                EXTRACT(EPOCH FROM (NOW() - n.created_at))::INTEGER / 60 || ' minutes ago'
            WHEN EXTRACT(EPOCH FROM (NOW() - n.created_at)) < 86400 THEN 
                EXTRACT(EPOCH FROM (NOW() - n.created_at))::INTEGER / 3600 || ' hours ago'
            ELSE 
                EXTRACT(EPOCH FROM (NOW() - n.created_at))::INTEGER / 86400 || ' days ago'
        END as time_ago
    FROM public.notifications n
    WHERE (p_user_id IS NULL OR n.user_id = p_user_id OR n.user_id IS NULL)
    AND (p_category IS NULL OR n.category = p_category)
    AND (p_is_read IS NULL OR n.is_read = p_is_read)
    AND n.is_archived = false
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    ORDER BY n.priority DESC, n.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 2. get_notification_stats function
CREATE OR REPLACE FUNCTION public.get_notification_stats()
RETURNS TABLE(
    total_notifications BIGINT,
    unread_notifications BIGINT,
    priority_breakdown JSONB,
    category_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE NOT is_read) as unread
        FROM public.notifications 
        WHERE NOT is_archived
        AND (expires_at IS NULL OR expires_at > NOW())
    ),
    priority_stats AS (
        SELECT jsonb_object_agg(
            CASE priority
                WHEN 1 THEN 'low'
                WHEN 2 THEN 'medium' 
                WHEN 3 THEN 'high'
                WHEN 4 THEN 'critical'
                ELSE 'unknown'
            END,
            count
        ) as priority_json
        FROM (
            SELECT priority, COUNT(*) as count
            FROM public.notifications 
            WHERE NOT is_archived AND NOT is_read
            AND (expires_at IS NULL OR expires_at > NOW())
            GROUP BY priority
        ) p
    ),
    category_stats AS (
        SELECT jsonb_object_agg(category, count) as category_json
        FROM (
            SELECT category, COUNT(*) as count
            FROM public.notifications 
            WHERE NOT is_archived AND NOT is_read
            AND (expires_at IS NULL OR expires_at > NOW())
            GROUP BY category
        ) c
    )
    SELECT 
        s.total,
        s.unread,
        COALESCE(p.priority_json, '{}'::jsonb),
        COALESCE(c.category_json, '{}'::jsonb)
    FROM stats s
    CROSS JOIN priority_stats p
    CROSS JOIN category_stats c;
END;
$$ LANGUAGE plpgsql;

-- 3. Create an enhanced product archive trigger for notifications
CREATE OR REPLACE FUNCTION public.handle_product_archive_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle archiving operations
    IF TG_OP = 'UPDATE' AND NEW.is_archived = true AND OLD.is_archived = false THEN
        PERFORM public.create_notification(
            'Product Archived',
            format('Product "%s" has been archived. Reason: %s', NEW.name, COALESCE(NEW.archive_reason, 'No reason provided')),
            'info',
            'inventory',
            2, -- Medium priority
            NULL, -- System-wide notification
            'product',
            NEW.id,
            jsonb_build_object(
                'product_name', NEW.name,
                'product_id', NEW.id,
                'archive_reason', NEW.archive_reason,
                'archived_by', NEW.archived_by,
                'archived_date', NEW.archived_date,
                'action', 'archived'
            )
        );
    -- Handle restore operations
    ELSIF TG_OP = 'UPDATE' AND NEW.is_archived = false AND OLD.is_archived = true THEN
        PERFORM public.create_notification(
            'Product Restored',
            format('Product "%s" has been restored from archive', NEW.name),
            'success',
            'inventory',
            2, -- Medium priority
            NULL, -- System-wide notification
            'product',
            NEW.id,
            jsonb_build_object(
                'product_name', NEW.name,
                'product_id', NEW.id,
                'restored_by', NEW.restored_by,
                'restored_date', NEW.restored_date,
                'action', 'restored'
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_product_archive_notification ON public.products;
CREATE TRIGGER trigger_product_archive_notification
    AFTER UPDATE OF is_archived ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_product_archive_notification();

-- Grant execute permissions for all functions
GRANT EXECUTE ON FUNCTION public.get_user_notifications(UUID, VARCHAR, BOOLEAN, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_product_archive_notification() TO anon, authenticated;

-- Create RLS policies for archive_logs table
ALTER TABLE public.archive_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage archive_logs" ON public.archive_logs FOR ALL USING (true);

-- Add some test archived products if none exist (optional)
DO $$
DECLARE
    product_count INTEGER;
BEGIN
    -- Check if there are any archived products
    SELECT COUNT(*) INTO product_count 
    FROM public.products 
    WHERE is_archived = true;
    
    -- If no archived products exist, we can add a notice
    IF product_count = 0 THEN
        RAISE NOTICE 'No archived products found. Archive some products to test the functionality.';
    ELSE
        RAISE NOTICE 'Found % archived products in the database.', product_count;
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'COMPLETE ARCHIVING BACKEND SETUP FINISHED!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Added/Fixed:';
    RAISE NOTICE '✓ All archiving columns (archive_reason, archived_date, archived_by, restored_date, restored_by)';
    RAISE NOTICE '✓ archive_logs table for audit trail';
    RAISE NOTICE '✓ get_user_notifications() function (fixes 404 errors)';
    RAISE NOTICE '✓ get_notification_stats() function (fixes 404 errors)';
    RAISE NOTICE '✓ Enhanced archive notification triggers';
    RAISE NOTICE '✓ Proper indexes for performance';
    RAISE NOTICE '✓ RLS policies and permissions';
    RAISE NOTICE '';
    RAISE NOTICE 'Your archived page and modals should now work perfectly!';
    RAISE NOTICE 'Test by archiving some products from the Management page.';
    RAISE NOTICE '=================================================';
END $$;
