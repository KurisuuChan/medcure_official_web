-- =====================================================
-- FIX NOTIFICATION TRIGGERS
-- Corrects the logic to prevent false notifications during CSV imports
-- =====================================================

-- Updated trigger function for low stock alerts
CREATE OR REPLACE FUNCTION public.check_low_stock_notification()
RETURNS TRIGGER AS $$
DECLARE
    stock_threshold INTEGER := 10; -- Can be made configurable
BEGIN
    -- Only trigger notifications for UPDATE operations where stock actually decreases
    -- This prevents false notifications during CSV imports (INSERT operations)
    IF TG_OP = 'UPDATE' AND NEW.total_stock <= stock_threshold AND OLD.total_stock > stock_threshold THEN
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
    
    -- For INSERT operations (CSV imports), only create "Product Added" notification for successful additions
    IF TG_OP = 'INSERT' THEN
        PERFORM public.create_notification(
            'Product Added',
            format('%s has been successfully added to inventory with %s units.', NEW.name, NEW.total_stock),
            'success',
            'inventory',
            1, -- Low priority
            NULL, -- System-wide notification
            'product',
            NEW.id,
            jsonb_build_object(
                'product_name', NEW.name,
                'product_id', NEW.id,
                'initial_stock', NEW.total_stock,
                'category', NEW.category,
                'action', 'added'
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated trigger function for expiry alerts (also fix similar logic)
CREATE OR REPLACE FUNCTION public.check_expiry_notification()
RETURNS TRIGGER AS $$
DECLARE
    days_until_expiry INTEGER;
BEGIN
    -- Only check expiry for UPDATE operations or INSERT with expiry dates far in future
    IF NEW.expiration_date IS NOT NULL THEN
        days_until_expiry := EXTRACT(days FROM (NEW.expiration_date - CURRENT_DATE));
        
        -- For UPDATE operations: Alert for products expiring within 30 days
        IF TG_OP = 'UPDATE' AND days_until_expiry <= 30 AND days_until_expiry > 0 AND 
           (OLD.expiration_date IS NULL OR 
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
        
        -- For INSERT operations: Only alert if product is added with imminent expiry (suspicious)
        IF TG_OP = 'INSERT' AND days_until_expiry <= 7 AND days_until_expiry > 0 THEN
            PERFORM public.create_notification(
                'Expiry Alert - New Product',
                format('Newly added product %s expires in %s days. Please verify expiry date.', NEW.name, days_until_expiry),
                'warning',
                'inventory',
                3,
                NULL,
                'product',
                NEW.id,
                jsonb_build_object(
                    'product_name', NEW.name,
                    'product_id', NEW.id,
                    'expiration_date', NEW.expiration_date,
                    'days_until_expiry', days_until_expiry,
                    'action', 'new_product_near_expiry'
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the triggers with the fixed functions
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

-- Update notification templates to include "Product Added" template if not exists
INSERT INTO public.notification_templates (name, title_template, message_template, type, category, priority) VALUES
('product_added', 'Product Added', '{{product_name}} has been successfully added to inventory with {{initial_stock}} units.', 'success', 'inventory', 1)
ON CONFLICT (name) DO UPDATE SET
    title_template = EXCLUDED.title_template,
    message_template = EXCLUDED.message_template,
    type = EXCLUDED.type,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'NOTIFICATION TRIGGER LOGIC FIXED!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '✓ CSV imports now show "Product Added" notifications';
    RAISE NOTICE '✓ Low stock alerts only trigger on actual stock decreases';
    RAISE NOTICE '✓ INSERT operations no longer trigger false low stock alerts';
    RAISE NOTICE '✓ Expiry notifications properly distinguish INSERT vs UPDATE';
    RAISE NOTICE '';
    RAISE NOTICE 'Your notification system is now working correctly!';
    RAISE NOTICE '=================================================';
END $$;
