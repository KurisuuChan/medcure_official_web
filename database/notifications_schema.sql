-- =====================================================
-- NOTIFICATION SYSTEM DATABASE SCHEMA
-- Complete notification backend for MedCure
-- =====================================================

BEGIN;

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    category VARCHAR(100) NOT NULL DEFAULT 'system', -- 'inventory', 'sales', 'system', 'reports', 'user'
    priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=critical
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system-wide notifications
    related_entity_type VARCHAR(100), -- 'product', 'sale', 'user', etc.
    related_entity_id BIGINT, -- ID of the related entity
    metadata JSONB DEFAULT '{}', -- Additional data like product info, sale details, etc.
    expires_at TIMESTAMP WITH TIME ZONE, -- For temporary notifications
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_notification_type CHECK (type IN ('info', 'success', 'warning', 'error')),
    CONSTRAINT chk_notification_priority CHECK (priority BETWEEN 1 AND 4)
);

-- 2. Create notification_settings table for user preferences
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, category)
);

-- 3. Create notification_templates table for reusable templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    title_template VARCHAR(255) NOT NULL,
    message_template TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    category VARCHAR(100) NOT NULL DEFAULT 'system',
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_is_archived ON public.notifications(is_archived);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON public.notifications(related_entity_type, related_entity_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_active ON public.notifications(is_archived, expires_at, created_at DESC) WHERE is_archived = FALSE;

-- 5. Create notification functions

-- Function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_title VARCHAR(255),
    p_message TEXT,
    p_type VARCHAR(50) DEFAULT 'info',
    p_category VARCHAR(100) DEFAULT 'system',
    p_priority INTEGER DEFAULT 1,
    p_user_id UUID DEFAULT NULL,
    p_related_entity_type VARCHAR(100) DEFAULT NULL,
    p_related_entity_id BIGINT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    notification_id BIGINT;
BEGIN
    INSERT INTO public.notifications (
        title, message, type, category, priority, user_id,
        related_entity_type, related_entity_id, metadata, expires_at
    ) VALUES (
        p_title, p_message, p_type, p_category, p_priority, p_user_id,
        p_related_entity_type, p_related_entity_id, p_metadata, p_expires_at
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification from template
CREATE OR REPLACE FUNCTION public.create_notification_from_template(
    template_name VARCHAR(255),
    template_data JSONB DEFAULT '{}',
    p_user_id UUID DEFAULT NULL,
    p_related_entity_type VARCHAR(100) DEFAULT NULL,
    p_related_entity_id BIGINT DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    template_record RECORD;
    final_title VARCHAR(255);
    final_message TEXT;
    notification_id BIGINT;
    key TEXT;
    value TEXT;
BEGIN
    -- Get template
    SELECT * INTO template_record
    FROM public.notification_templates 
    WHERE name = template_name AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template % not found or not active', template_name;
    END IF;
    
    -- Replace placeholders in title and message
    final_title := template_record.title_template;
    final_message := template_record.message_template;
    
    -- Replace placeholders with data from template_data
    FOR key, value IN SELECT * FROM jsonb_each_text(template_data)
    LOOP
        final_title := REPLACE(final_title, '{{' || key || '}}', value);
        final_message := REPLACE(final_message, '{{' || key || '}}', value);
    END LOOP;
    
    -- Create notification
    SELECT public.create_notification(
        final_title,
        final_message,
        template_record.type,
        template_record.category,
        template_record.priority,
        p_user_id,
        p_related_entity_type,
        p_related_entity_id,
        template_data,
        p_expires_at
    ) INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user notifications
CREATE OR REPLACE FUNCTION public.get_user_notifications(
    p_user_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_category VARCHAR(100) DEFAULT NULL,
    p_type VARCHAR(50) DEFAULT NULL,
    p_unread_only BOOLEAN DEFAULT FALSE,
    p_include_archived BOOLEAN DEFAULT FALSE
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
                EXTRACT(EPOCH FROM (NOW() - n.created_at))::INTEGER / 60 || 'm ago'
            WHEN EXTRACT(EPOCH FROM (NOW() - n.created_at)) < 86400 THEN 
                EXTRACT(EPOCH FROM (NOW() - n.created_at))::INTEGER / 3600 || 'h ago'
            ELSE 
                EXTRACT(EPOCH FROM (NOW() - n.created_at))::INTEGER / 86400 || 'd ago'
        END as time_ago
    FROM public.notifications n
    WHERE 
        (p_user_id IS NULL OR n.user_id = p_user_id OR n.user_id IS NULL) -- Include system-wide notifications
        AND (p_category IS NULL OR n.category = p_category)
        AND (p_type IS NULL OR n.type = p_type)
        AND (NOT p_unread_only OR n.is_read = FALSE)
        AND (p_include_archived OR n.is_archived = FALSE)
        AND (n.expires_at IS NULL OR n.expires_at > NOW())
    ORDER BY 
        n.priority DESC,
        n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notifications_read(
    notification_ids BIGINT[] DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    mark_all BOOLEAN DEFAULT FALSE
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    IF mark_all THEN
        UPDATE public.notifications 
        SET is_read = TRUE, updated_at = NOW()
        WHERE is_read = FALSE 
        AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
        GET DIAGNOSTICS updated_count = ROW_COUNT;
    ELSIF notification_ids IS NOT NULL THEN
        UPDATE public.notifications 
        SET is_read = TRUE, updated_at = NOW()
        WHERE id = ANY(notification_ids)
        AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
        GET DIAGNOSTICS updated_count = ROW_COUNT;
    END IF;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to archive notifications
CREATE OR REPLACE FUNCTION public.archive_notifications(
    notification_ids BIGINT[] DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    archive_all_read BOOLEAN DEFAULT FALSE
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    IF archive_all_read THEN
        UPDATE public.notifications 
        SET is_archived = TRUE, updated_at = NOW()
        WHERE is_read = TRUE AND is_archived = FALSE
        AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
        GET DIAGNOSTICS updated_count = ROW_COUNT;
    ELSIF notification_ids IS NOT NULL THEN
        UPDATE public.notifications 
        SET is_archived = TRUE, updated_at = NOW()
        WHERE id = ANY(notification_ids)
        AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
        GET DIAGNOSTICS updated_count = ROW_COUNT;
    END IF;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to delete notifications
CREATE OR REPLACE FUNCTION public.delete_notifications(
    notification_ids BIGINT[] DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    delete_archived BOOLEAN DEFAULT FALSE,
    older_than_days INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    IF delete_archived THEN
        DELETE FROM public.notifications 
        WHERE is_archived = TRUE
        AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
    ELSIF older_than_days IS NOT NULL THEN
        DELETE FROM public.notifications 
        WHERE created_at < NOW() - INTERVAL '1 day' * older_than_days
        AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
    ELSIF notification_ids IS NOT NULL THEN
        DELETE FROM public.notifications 
        WHERE id = ANY(notification_ids)
        AND (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL);
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
    END IF;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get notification statistics
CREATE OR REPLACE FUNCTION public.get_notification_stats(
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    total_count BIGINT,
    unread_count BIGINT,
    archived_count BIGINT,
    critical_count BIGINT,
    category_stats JSONB,
    type_stats JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE is_read = FALSE) as unread_count,
            COUNT(*) FILTER (WHERE is_archived = TRUE) as archived_count,
            COUNT(*) FILTER (WHERE priority = 4) as critical_count
        FROM public.notifications n
        WHERE 
            (p_user_id IS NULL OR n.user_id = p_user_id OR n.user_id IS NULL)
            AND (n.expires_at IS NULL OR n.expires_at > NOW())
    ),
    category_stats AS (
        SELECT jsonb_object_agg(category, count) as category_stats
        FROM (
            SELECT category, COUNT(*) as count
            FROM public.notifications n
            WHERE 
                (p_user_id IS NULL OR n.user_id = p_user_id OR n.user_id IS NULL)
                AND (n.expires_at IS NULL OR n.expires_at > NOW())
                AND is_archived = FALSE
            GROUP BY category
        ) t
    ),
    type_stats AS (
        SELECT jsonb_object_agg(type, count) as type_stats
        FROM (
            SELECT type, COUNT(*) as count
            FROM public.notifications n
            WHERE 
                (p_user_id IS NULL OR n.user_id = p_user_id OR n.user_id IS NULL)
                AND (n.expires_at IS NULL OR n.expires_at > NOW())
                AND is_archived = FALSE
            GROUP BY type
        ) t
    )
    SELECT 
        s.total_count,
        s.unread_count,
        s.archived_count,
        s.critical_count,
        COALESCE(cs.category_stats, '{}'::jsonb),
        COALESCE(ts.type_stats, '{}'::jsonb)
    FROM stats s, category_stats cs, type_stats ts;
END;
$$ LANGUAGE plpgsql;

-- 6. Triggers for automatic notifications

-- Trigger function for low stock alerts
CREATE OR REPLACE FUNCTION public.check_low_stock_notification()
RETURNS TRIGGER AS $$
DECLARE
    stock_threshold INTEGER := 10; -- Can be made configurable
BEGIN
    -- Check if stock is low and wasn't low before
    IF NEW.total_stock <= stock_threshold AND (OLD IS NULL OR OLD.total_stock > stock_threshold) THEN
        PERFORM public.create_notification(
            'Low Stock Alert',
            format('%s is running low. Only %s units remaining.', NEW.name, NEW.total_stock),
            'warning',
            'inventory',
            CASE 
                WHEN NEW.total_stock = 0 THEN 4 -- Critical
                WHEN NEW.total_stock <= 5 THEN 3 -- High
                ELSE 2 -- Medium
            END,
            NULL, -- System-wide notification
            'product',
            NEW.id,
            jsonb_build_object(
                'product_name', NEW.name,
                'product_id', NEW.id,
                'current_stock', NEW.total_stock,
                'category', NEW.category
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for expiry alerts
CREATE OR REPLACE FUNCTION public.check_expiry_notification()
RETURNS TRIGGER AS $$
DECLARE
    days_until_expiry INTEGER;
BEGIN
    -- Check expiry date if it exists
    IF NEW.expiration_date IS NOT NULL THEN
        days_until_expiry := EXTRACT(days FROM (NEW.expiration_date - CURRENT_DATE));
        
        -- Alert for products expiring within 30 days
        IF days_until_expiry <= 30 AND days_until_expiry > 0 AND 
           (OLD IS NULL OR OLD.expiration_date IS NULL OR 
            EXTRACT(days FROM (OLD.expiration_date - CURRENT_DATE)) > 30) THEN
            
            PERFORM public.create_notification(
                'Expiry Alert',
                format('%s expires in %s days. Consider promotional pricing.', NEW.name, days_until_expiry),
                CASE WHEN days_until_expiry <= 7 THEN 'error' ELSE 'warning' END,
                'inventory',
                CASE WHEN days_until_expiry <= 7 THEN 3 ELSE 2 END,
                NULL,
                'product',
                NEW.id,
                jsonb_build_object(
                    'product_name', NEW.name,
                    'product_id', NEW.id,
                    'expiration_date', NEW.expiration_date,
                    'days_until_expiry', days_until_expiry
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for successful sales
CREATE OR REPLACE FUNCTION public.create_sale_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for successful sale
    PERFORM public.create_notification(
        'Sale Completed',
        format('Transaction #%s completed successfully. Total: ₱%s', NEW.id, NEW.total),
        'success',
        'sales',
        1,
        NULL,
        'sale',
        NEW.id,
        jsonb_build_object(
            'sale_id', NEW.id,
            'total', NEW.total,
            'payment_method', NEW.payment_method
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_low_stock_notification ON public.products;
CREATE TRIGGER trigger_low_stock_notification
    AFTER INSERT OR UPDATE OF total_stock ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.check_low_stock_notification();

DROP TRIGGER IF EXISTS trigger_expiry_notification ON public.products;
CREATE TRIGGER trigger_expiry_notification
    AFTER INSERT OR UPDATE OF expiration_date ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.check_expiry_notification();

DROP TRIGGER IF EXISTS trigger_sale_notification ON public.sales;
CREATE TRIGGER trigger_sale_notification
    AFTER INSERT ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.create_sale_notification();

-- Update timestamp trigger
DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON public.notifications;
CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view own and system notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (user_id = auth.uid() OR user_id IS NULL);

-- Public access for demo (adjust as needed)
CREATE POLICY "Public can manage all notifications" ON public.notifications
    FOR ALL USING (true);

-- 8. Default notification templates
INSERT INTO public.notification_templates (name, title_template, message_template, type, category, priority) VALUES
('low_stock', 'Low Stock Alert', '{{product_name}} is running low. Only {{current_stock}} units remaining.', 'warning', 'inventory', 2),
('out_of_stock', 'Out of Stock', '{{product_name}} is now out of stock. Please reorder immediately.', 'error', 'inventory', 4),
('expiry_warning', 'Expiry Alert', '{{product_name}} expires in {{days_until_expiry}} days. Consider promotional pricing.', 'warning', 'inventory', 2),
('sale_completed', 'Sale Completed', 'Transaction #{{sale_id}} completed successfully. Total: ₱{{total}}', 'success', 'sales', 1),
('product_added', 'New Product Added', '{{product_name}} has been successfully added to inventory.', 'info', 'system', 1),
('backup_completed', 'Backup Completed', 'Daily database backup completed successfully.', 'success', 'system', 1),
('system_update', 'System Update', 'New features have been added to the system.', 'info', 'system', 1)
ON CONFLICT (name) DO NOTHING;

-- 9. Grant permissions
GRANT ALL ON public.notifications TO anon, authenticated;
GRANT ALL ON public.notification_settings TO anon, authenticated;
GRANT ALL ON public.notification_templates TO anon, authenticated;
GRANT ALL ON SEQUENCE notifications_id_seq TO anon, authenticated;
GRANT ALL ON SEQUENCE notification_settings_id_seq TO anon, authenticated;
GRANT ALL ON SEQUENCE notification_templates_id_seq TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_notification TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification_from_template TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notifications TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.archive_notifications TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_notifications TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_stats TO anon, authenticated;

-- 10. Cleanup function for old notifications (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete expired notifications
    DELETE FROM public.notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete read notifications older than 90 days
    DELETE FROM public.notifications 
    WHERE is_read = TRUE 
    AND created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'NOTIFICATION SYSTEM CREATED SUCCESSFULLY!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Features available:';
    RAISE NOTICE '✓ Complete notification management';
    RAISE NOTICE '✓ Automatic low stock alerts';
    RAISE NOTICE '✓ Expiry date warnings';
    RAISE NOTICE '✓ Sale completion notifications';
    RAISE NOTICE '✓ Template-based notifications';
    RAISE NOTICE '✓ User preferences and settings';
    RAISE NOTICE '✓ Notification statistics and analytics';
    RAISE NOTICE '✓ Automatic cleanup of old notifications';
    RAISE NOTICE '';
    RAISE NOTICE 'Your notification system is ready!';
    RAISE NOTICE '=================================================';
END $$;
