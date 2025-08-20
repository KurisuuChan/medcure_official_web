-- =====================================================
-- SIMPLE THRESHOLD FIX
-- Quick fix for notification threshold issues
-- =====================================================

-- Method 1: Check current table structure first
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_settings' 
AND table_schema = 'public';

-- Method 2: If app_settings table doesn't exist or has different structure
-- Just update the hardcoded threshold in the existing notification functions

-- Updated trigger function with configurable threshold (fallback to 3)
CREATE OR REPLACE FUNCTION public.check_low_stock_notification()
RETURNS TRIGGER AS $$
DECLARE
    stock_threshold INTEGER := 3; -- Default to 3 for small pharmacy
    setting_value TEXT;
BEGIN
    -- Try to get dynamic threshold from settings table if it exists
    BEGIN
        SELECT setting_value INTO setting_value 
        FROM public.app_settings 
        WHERE setting_key = 'low_stock_threshold' 
        LIMIT 1;
        
        stock_threshold := COALESCE(setting_value::INTEGER, 3);
    EXCEPTION 
        WHEN others THEN
            -- If app_settings doesn't exist or has different structure, use default
            stock_threshold := 3;
    END;
    
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

-- Recreate the trigger to use the new function
DROP TRIGGER IF EXISTS trigger_low_stock_notification ON public.products;
CREATE TRIGGER trigger_low_stock_notification
    AFTER INSERT OR UPDATE OF total_stock ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.check_low_stock_notification();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_low_stock_notification() TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'THRESHOLD FIX APPLIED! Now using 3-unit threshold instead of 10.';
    RAISE NOTICE 'This will fix the false out-of-stock notifications on CSV imports.';
END $$;
