-- =====================================================
-- MEDCURE ARCHIVING FIX - Add Missing Columns
-- This script adds the missing archiving columns to fix the errors
-- =====================================================

-- Add missing archiving columns to products table (matching archiveService.js expectations)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS archive_reason TEXT,
ADD COLUMN IF NOT EXISTS archived_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_by TEXT,
ADD COLUMN IF NOT EXISTS restored_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- Add missing notification stats function
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

-- Grant permissions for the new function
GRANT EXECUTE ON FUNCTION public.get_notification_stats() TO anon, authenticated;

-- Create optional archive_logs table for audit trail (referenced by archiveService.js)
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

-- Create index for archive_logs
CREATE INDEX IF NOT EXISTS idx_archive_logs_created_at ON public.archive_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_logs_type ON public.archive_logs(type);

-- Grant permissions for archive_logs
GRANT ALL ON public.archive_logs TO anon, authenticated;
GRANT ALL ON SEQUENCE public.archive_logs_id_seq TO anon, authenticated;

-- Update products table trigger to handle archiving notifications
CREATE OR REPLACE FUNCTION public.check_product_archived_notification()
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
            NULL, -- System-wide notification since archived_by is now TEXT
            'product',
            NEW.id,
            jsonb_build_object(
                'product_name', NEW.name,
                'product_id', NEW.id,
                'archive_reason', NEW.archive_reason,
                'archived_by', NEW.archived_by,
                'action', 'archived'
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product archiving notifications
DROP TRIGGER IF EXISTS trigger_product_archived_notification ON public.products;
CREATE TRIGGER trigger_product_archived_notification
    AFTER UPDATE OF is_archived ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.check_product_archived_notification();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'ARCHIVING COLUMNS AND FUNCTIONS ADDED!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Fixed:';
    RAISE NOTICE '✓ Added archive_reason column to products';
    RAISE NOTICE '✓ Added archived_date column to products (matches code)';
    RAISE NOTICE '✓ Added archived_by column to products (TEXT type)';
    RAISE NOTICE '✓ Added restored_date column to products';
    RAISE NOTICE '✓ Added restored_by column to products';
    RAISE NOTICE '✓ Added get_notification_stats function';
    RAISE NOTICE '✓ Added product archiving notification trigger';
    RAISE NOTICE '';
    RAISE NOTICE 'Your archiving feature should now work!';
    RAISE NOTICE '=================================================';
END $$;
