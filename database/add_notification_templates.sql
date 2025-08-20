-- =====================================================
-- Add Missing Notification Templates
-- Run this script to add the out_of_stock template
-- =====================================================

-- Insert the out_of_stock template
INSERT INTO public.notification_templates (
    name, 
    title_template, 
    message_template, 
    type, 
    category, 
    priority,
    is_active
) VALUES 
(
    'out_of_stock',
    'Out of Stock: {{product_name}}',
    '{{product_name}} is now out of stock. Please reorder immediately.',
    'error', 
    'inventory', 
    4,
    true
)
ON CONFLICT (name) DO UPDATE SET
    title_template = EXCLUDED.title_template,
    message_template = EXCLUDED.message_template,
    type = EXCLUDED.type,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Also add the product_added template
INSERT INTO public.notification_templates (
    name, 
    title_template, 
    message_template, 
    type, 
    category, 
    priority,
    is_active
) VALUES 
(
    'product_added',
    'New Product Added: {{product_name}}',
    'Product "{{product_name}}" has been successfully added to inventory.',
    'success', 
    'inventory', 
    1,
    true
)
ON CONFLICT (name) DO UPDATE SET
    title_template = EXCLUDED.title_template,
    message_template = EXCLUDED.message_template,
    type = EXCLUDED.type,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Create the trigger function for automatic stock notifications if it doesn't exist
CREATE OR REPLACE FUNCTION public.trigger_stock_notifications() RETURNS trigger AS $$
BEGIN
    -- Handle UPDATE operations (existing products)
    IF TG_OP = 'UPDATE' AND OLD.total_stock != NEW.total_stock AND NEW.is_archived = false THEN
        -- Check for out of stock (new stock is 0, old stock was > 0)
        IF NEW.total_stock = 0 AND OLD.total_stock > 0 THEN
            -- Only create out of stock notification if stock DECREASED to 0
            PERFORM public.create_notification_from_template(
                'out_of_stock',
                jsonb_build_object(
                    'product_name', NEW.name,
                    'entity_type', 'product',
                    'entity_id', NEW.id
                )
            );
        -- Check for low stock (new stock <= threshold, old stock was > threshold)
        ELSIF NEW.total_stock <= NEW.low_stock_threshold 
              AND NEW.total_stock > 0 
              AND OLD.total_stock > NEW.low_stock_threshold THEN
            -- Create low stock notification only when crossing threshold downward
            PERFORM public.create_notification_from_template(
                'low_stock_alert',
                jsonb_build_object(
                    'product_name', NEW.name,
                    'stock_level', NEW.total_stock,
                    'entity_type', 'product',
                    'entity_id', NEW.id
                )
            );
        END IF;
    END IF;
    
    -- Handle INSERT operations (new products) - CORRECTED LOGIC
    IF TG_OP = 'INSERT' AND NEW.is_archived = false THEN
        -- For NEW products, ONLY create "product_added" notification
        -- Do NOT create stock warnings for newly added products
        PERFORM public.create_notification_from_template(
            'product_added',
            jsonb_build_object(
                'product_name', NEW.name,
                'entity_type', 'product',
                'entity_id', NEW.id,
                'initial_stock', NEW.total_stock
            )
        );
        
        -- NOTE: We deliberately DO NOT create out_of_stock or low_stock notifications
        -- for newly inserted products, even if they have 0 stock.
        -- Stock warnings should only trigger when EXISTING products run low/out.
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_stock_notifications ON public.products;
CREATE TRIGGER trigger_stock_notifications
    AFTER INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_stock_notifications();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'NOTIFICATION TEMPLATES ADDED SUCCESSFULLY!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '✓ out_of_stock template created/updated';
    RAISE NOTICE '✓ product_added template created/updated';
    RAISE NOTICE '✓ Automatic stock notification trigger activated';
    RAISE NOTICE '';
    RAISE NOTICE 'Your products will now automatically generate:';
    RAISE NOTICE '- Out of stock alerts when stock reaches 0';
    RAISE NOTICE '- Low stock alerts when below threshold';
    RAISE NOTICE '- New product notifications when items are added';
    RAISE NOTICE '=================================================';
END $$;
