-- =====================================================
-- Simple Notification System (Without Templates)
-- Alternative approach if you don't want template complexity
-- =====================================================

-- Modified notification service functions for direct creation
CREATE OR REPLACE FUNCTION public.create_simple_notification(
    p_title TEXT,
    p_message TEXT,
    p_type VARCHAR(50) DEFAULT 'info',
    p_category VARCHAR(100) DEFAULT 'system',
    p_priority INTEGER DEFAULT 1,
    p_user_id UUID DEFAULT NULL,
    p_related_entity_type VARCHAR(100) DEFAULT NULL,
    p_related_entity_id BIGINT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS BIGINT AS $$
DECLARE
    notification_id BIGINT;
BEGIN
    INSERT INTO public.notifications (
        title, message, type, category, priority, user_id, 
        related_entity_type, related_entity_id, metadata
    ) VALUES (
        p_title, p_message, p_type, p_category, p_priority, p_user_id,
        p_related_entity_type, p_related_entity_id, p_metadata
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple trigger without templates
CREATE OR REPLACE FUNCTION public.simple_stock_notifications() RETURNS trigger AS $$
BEGIN
    -- Out of stock notification
    IF TG_OP = 'UPDATE' AND OLD.total_stock != NEW.total_stock AND NEW.is_archived = false THEN
        IF NEW.total_stock = 0 AND OLD.total_stock > 0 THEN
            PERFORM public.create_simple_notification(
                'Out of Stock: ' || NEW.name,
                NEW.name || ' is now out of stock. Please reorder immediately.',
                'error',
                'inventory',
                4,
                NULL,
                'product',
                NEW.id,
                jsonb_build_object('product_id', NEW.id, 'old_stock', OLD.total_stock)
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply simple trigger
DROP TRIGGER IF EXISTS trigger_simple_stock_notifications ON public.products;
CREATE TRIGGER trigger_simple_stock_notifications
    AFTER UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.simple_stock_notifications();

-- If you want to remove templates (CAREFUL - this will delete all templates!)
-- DROP TABLE IF EXISTS public.notification_templates CASCADE;
