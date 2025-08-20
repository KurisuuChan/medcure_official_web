-- =====================================================
-- DYNAMIC THRESHOLD NOTIFICATION SYSTEM
-- Updates notification triggers to use configurable thresholds from settings
-- =====================================================

-- Check if app_settings table exists and create if necessary
CREATE TABLE IF NOT EXISTS public.app_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure app_settings table has the threshold settings
INSERT INTO public.app_settings (setting_key, setting_value, setting_type, description) VALUES
('low_stock_threshold', '3', 'number', 'Alert threshold for low stock items (recommended: 2-3 for small pharmacy)'),
('expiry_warning_days', '30', 'number', 'Days before expiry to show warning')
ON CONFLICT (setting_key) DO UPDATE SET
    description = EXCLUDED.description,
    setting_type = EXCLUDED.setting_type;

-- Updated trigger function with dynamic threshold
CREATE OR REPLACE FUNCTION public.check_low_stock_notification()
RETURNS TRIGGER AS $$
DECLARE
    stock_threshold INTEGER;
    setting_value TEXT;
BEGIN
    -- Get dynamic threshold from settings table
    SELECT setting_value INTO setting_value 
    FROM public.app_settings 
    WHERE setting_key = 'low_stock_threshold' 
    LIMIT 1;
    
    -- Use setting value or default to 3 for small pharmacies
    stock_threshold := COALESCE(setting_value::INTEGER, 3);
    
    -- Handle UPDATE operations (actual stock changes)
    IF TG_OP = 'UPDATE' THEN
        -- OUT OF STOCK: Stock went from having inventory to 0
        IF NEW.total_stock = 0 AND OLD.total_stock > 0 THEN
            PERFORM public.create_notification(
                'Out of Stock Alert',
                format('%s is now completely out of stock. Immediate restocking required!', NEW.name),
                'error',
                'inventory',
                4, -- Critical priority
                NULL, -- System-wide notification
                'product',
                NEW.id,
                jsonb_build_object(
                    'product_name', NEW.name,
                    'product_id', NEW.id,
                    'current_stock', NEW.total_stock,
                    'previous_stock', OLD.total_stock,
                    'threshold_used', stock_threshold,
                    'category', NEW.category,
                    'alert_type', 'out_of_stock'
                )
            );
        -- LOW STOCK: Stock went from above threshold to at/below threshold (but not 0)
        ELSIF NEW.total_stock <= stock_threshold AND NEW.total_stock > 0 AND OLD.total_stock > stock_threshold THEN
            PERFORM public.create_notification(
                'Low Stock Alert',
                format('%s is running low. Only %s units remaining.', NEW.name, NEW.total_stock),
                'warning',
                'inventory',
                CASE 
                    WHEN NEW.total_stock <= (stock_threshold / 2) THEN 3 -- High
                    ELSE 2 -- Medium
                END,
                NULL, -- System-wide notification
                'product',
                NEW.id,
                jsonb_build_object(
                    'product_name', NEW.name,
                    'product_id', NEW.id,
                    'current_stock', NEW.total_stock,
                    'previous_stock', OLD.total_stock,
                    'threshold_used', stock_threshold,
                    'category', NEW.category,
                    'alert_type', 'low_stock'
                )
            );
        END IF;
    END IF;
    
    -- Handle INSERT operations (CSV imports, new products)
    IF TG_OP = 'INSERT' THEN
        -- OUT OF STOCK: Adding a product with 0 stock (unusual but possible)
        IF NEW.total_stock = 0 THEN
            PERFORM public.create_notification(
                'Product Added - Out of Stock',
                format('%s was added to inventory but has 0 stock. Add initial inventory immediately.', NEW.name),
                'error',
                'inventory',
                4, -- Critical priority
                NULL,
                'product',
                NEW.id,
                jsonb_build_object(
                    'product_name', NEW.name,
                    'product_id', NEW.id,
                    'initial_stock', NEW.total_stock,
                    'threshold_used', stock_threshold,
                    'category', NEW.category,
                    'action', 'added_out_of_stock'
                )
            );
        -- LOW STOCK: Adding a product with stock below threshold
        ELSIF NEW.total_stock <= stock_threshold AND NEW.total_stock > 0 THEN
            PERFORM public.create_notification(
                'Product Added - Low Stock',
                format('%s was added with low initial stock (%s units). Consider increasing stock level.', NEW.name, NEW.total_stock),
                'warning',
                'inventory',
                2, -- Medium priority
                NULL,
                'product',
                NEW.id,
                jsonb_build_object(
                    'product_name', NEW.name,
                    'product_id', NEW.id,
                    'initial_stock', NEW.total_stock,
                    'threshold_used', stock_threshold,
                    'category', NEW.category,
                    'action', 'added_low_stock'
                )
            );
        -- GOOD STOCK: Adding a product with adequate stock
        ELSE
            PERFORM public.create_notification(
                'Product Added Successfully',
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
                    'threshold_used', stock_threshold,
                    'category', NEW.category,
                    'action', 'added_good_stock'
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated expiry notification function with dynamic days
CREATE OR REPLACE FUNCTION public.check_expiry_notification()
RETURNS TRIGGER AS $$
DECLARE
    days_until_expiry INTEGER;
    warning_days INTEGER;
    setting_value TEXT;
BEGIN
    -- Get dynamic expiry warning days from settings
    SELECT setting_value INTO setting_value 
    FROM public.app_settings 
    WHERE setting_key = 'expiry_warning_days' 
    LIMIT 1;
    
    -- Use setting value or default to 30 days
    warning_days := COALESCE(setting_value::INTEGER, 30);
    
    -- Check expiry date if it exists
    IF NEW.expiration_date IS NOT NULL THEN
        days_until_expiry := EXTRACT(days FROM (NEW.expiration_date - CURRENT_DATE));
        
        -- For UPDATE operations: Alert for products expiring within warning_days
        IF TG_OP = 'UPDATE' AND days_until_expiry <= warning_days AND days_until_expiry > 0 AND 
           (OLD.expiration_date IS NULL OR 
            EXTRACT(days FROM (OLD.expiration_date - CURRENT_DATE)) > warning_days) THEN
            
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
                    'days_until_expiry', days_until_expiry,
                    'warning_days_used', warning_days
                )
            );
        END IF;
        
        -- For INSERT operations: Only alert if product is added with very close expiry (7 days or less)
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
                    'warning_days_used', warning_days,
                    'action', 'new_product_near_expiry'
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update threshold and refresh all stakeholders
CREATE OR REPLACE FUNCTION public.update_stock_threshold(new_threshold INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate threshold
    IF new_threshold < 1 OR new_threshold > 100 THEN
        RAISE EXCEPTION 'Threshold must be between 1 and 100';
    END IF;
    
    -- Update the setting
    INSERT INTO public.app_settings (setting_key, setting_value, setting_type, description)
    VALUES ('low_stock_threshold', new_threshold::TEXT, 'number', 'Alert threshold for low stock items')
    ON CONFLICT (setting_key) 
    DO UPDATE SET 
        setting_value = new_threshold::TEXT,
        updated_at = NOW();
    
    -- Create notification about the change
    PERFORM public.create_notification(
        'Settings Updated',
        format('Low stock threshold updated to %s units. Future notifications will use this new threshold.', new_threshold),
        'info',
        'system',
        1,
        NULL,
        'setting',
        NULL,
        jsonb_build_object(
            'setting_key', 'low_stock_threshold',
            'new_value', new_threshold,
            'action', 'threshold_updated'
        )
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get current effective thresholds
CREATE OR REPLACE FUNCTION public.get_notification_thresholds()
RETURNS TABLE(
    low_stock_threshold INTEGER,
    expiry_warning_days INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT setting_value::INTEGER FROM public.app_settings WHERE setting_key = 'low_stock_threshold'), 3) as low_stock_threshold,
        COALESCE((SELECT setting_value::INTEGER FROM public.app_settings WHERE setting_key = 'expiry_warning_days'), 30) as expiry_warning_days,
        COALESCE((SELECT MAX(updated_at) FROM public.app_settings WHERE setting_key IN ('low_stock_threshold', 'expiry_warning_days')), NOW()) as last_updated;
END;
$$ LANGUAGE plpgsql;

-- Function to check and notify about all out-of-stock products
CREATE OR REPLACE FUNCTION public.check_all_out_of_stock_products()
RETURNS TABLE(
    product_count INTEGER,
    notification_count INTEGER
) AS $$
DECLARE
    product_record RECORD;
    notifications_created INTEGER := 0;
    products_found INTEGER := 0;
BEGIN
    -- Find all out-of-stock products that don't have recent notifications
    FOR product_record IN 
        SELECT p.id, p.name, p.category, p.total_stock
        FROM public.products p
        WHERE p.is_archived = false 
        AND p.total_stock = 0
        AND NOT EXISTS (
            SELECT 1 FROM public.notifications n
            WHERE n.related_entity_type = 'product' 
            AND n.related_entity_id = p.id
            AND n.category = 'inventory'
            AND n.type = 'error'
            AND (n.title LIKE 'Out of Stock%' OR n.message LIKE '%out of stock%')
            AND n.created_at > NOW() - INTERVAL '6 hours'
        )
    LOOP
        products_found := products_found + 1;
        
        -- Create out-of-stock notification
        PERFORM public.create_notification(
            'Out of Stock Alert',
            format('%s is completely out of stock. Immediate restocking required!', product_record.name),
            'error',
            'inventory',
            4, -- Critical priority
            NULL,
            'product',
            product_record.id,
            jsonb_build_object(
                'product_name', product_record.name,
                'product_id', product_record.id,
                'current_stock', product_record.total_stock,
                'category', product_record.category,
                'alert_type', 'out_of_stock_check',
                'scan_type', 'manual_check'
            )
        );
        
        notifications_created := notifications_created + 1;
    END LOOP;
    
    RETURN QUERY SELECT products_found, notifications_created;
END;
$$ LANGUAGE plpgsql;

-- Function to get inventory status summary
CREATE OR REPLACE FUNCTION public.get_inventory_status_summary()
RETURNS TABLE(
    total_products INTEGER,
    out_of_stock_count INTEGER,
    low_stock_count INTEGER,
    good_stock_count INTEGER,
    current_threshold INTEGER
) AS $$
DECLARE
    threshold_val INTEGER;
BEGIN
    -- Get current threshold
    SELECT COALESCE(
        (SELECT setting_value::INTEGER FROM public.app_settings WHERE setting_key = 'low_stock_threshold'), 
        3
    ) INTO threshold_val;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_products,
        COUNT(*) FILTER (WHERE total_stock = 0)::INTEGER as out_of_stock_count,
        COUNT(*) FILTER (WHERE total_stock > 0 AND total_stock <= threshold_val)::INTEGER as low_stock_count,
        COUNT(*) FILTER (WHERE total_stock > threshold_val)::INTEGER as good_stock_count,
        threshold_val as current_threshold
    FROM public.products 
    WHERE is_archived = false;
END;
$$ LANGUAGE plpgsql;

-- Recreate the triggers to use new functions
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_stock_threshold(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_thresholds() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_all_out_of_stock_products() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_status_summary() TO anon, authenticated;

-- Create success notification
DO $$
DECLARE
    current_threshold INTEGER;
BEGIN
    SELECT setting_value::INTEGER INTO current_threshold 
    FROM public.app_settings 
    WHERE setting_key = 'low_stock_threshold';
    
    RAISE NOTICE 'DYNAMIC THRESHOLD SYSTEM IMPLEMENTED SUCCESSFULLY!';
    RAISE NOTICE 'Current threshold: % units', COALESCE(current_threshold, 3);
    RAISE NOTICE 'System is now fully configurable via Settings page.';
END $$;
