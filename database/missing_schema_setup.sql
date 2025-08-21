-- =====================================================
-- MEDCURE MISSING SCHEMA SETUP
-- Addresses missing tables, views, and functions
-- Run this after the main setup to fix console errors
-- =====================================================

-- Remove BEGIN/COMMIT for Supabase compatibility
-- BEGIN;

-- =====================================================
-- SECTION 1: MISSING TABLES AND VIEWS
-- =====================================================

-- Create products_enhanced view (referenced in productService.js)
DROP VIEW IF EXISTS public.products_enhanced;
CREATE VIEW public.products_enhanced AS
SELECT 
    p.*,
    CASE 
        WHEN p.stock <= 0 THEN 'Out of Stock'
        WHEN p.stock <= COALESCE(p.reorder_level, 10) THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status,
    p.stock as current_stock,
    p.stock as total_stock,
    CASE 
        WHEN p.expiry_date IS NULL THEN 'No Expiry Data'
        WHEN p.expiry_date <= CURRENT_DATE THEN 'Expired'
        WHEN p.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
        ELSE 'Good'
    END as expiry_status
FROM public.products p
WHERE p.is_archived = FALSE OR p.is_archived IS NULL;

-- Add missing columns to products table if they don't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing records to have is_active = true if null
UPDATE public.products SET is_active = TRUE WHERE is_active IS NULL;

-- Rename expiration_date to expiry_date for consistency
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'expiration_date'
        AND table_schema = 'public'
    ) THEN
        -- Copy data from expiration_date to expiry_date
        UPDATE public.products 
        SET expiry_date = expiration_date 
        WHERE expiry_date IS NULL AND expiration_date IS NOT NULL;
    END IF;
END $$;

-- =====================================================
-- SECTION 2: NOTIFICATIONS SYSTEM
-- =====================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    is_read BOOLEAN DEFAULT FALSE,
    user_id UUID, -- For user-specific notifications
    metadata JSONB, -- Additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_stats table for caching
CREATE TABLE IF NOT EXISTS public.notification_stats (
    id BIGSERIAL PRIMARY KEY,
    total_notifications INTEGER DEFAULT 0,
    unread_notifications INTEGER DEFAULT 0,
    high_priority_unread INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial stats record if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.notification_stats LIMIT 1) THEN
        INSERT INTO public.notification_stats (total_notifications, unread_notifications, high_priority_unread)
        VALUES (0, 0, 0);
    END IF;
END $$;

-- =====================================================
-- SECTION 3: SALES ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get sales analytics
CREATE OR REPLACE FUNCTION public.get_sales_analytics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_sales', COALESCE(SUM(s.total), 0),
        'total_transactions', COUNT(s.id),
        'average_transaction', COALESCE(AVG(s.total), 0),
        'sales_by_day', (
            SELECT json_agg(
                json_build_object(
                    'date', day_sales.sale_date,
                    'total', day_sales.daily_total,
                    'transactions', day_sales.transaction_count
                )
            )
            FROM (
                SELECT 
                    DATE(s.created_at) as sale_date,
                    SUM(s.total) as daily_total,
                    COUNT(s.id) as transaction_count
                FROM public.sales s
                WHERE DATE(s.created_at) BETWEEN start_date AND end_date
                GROUP BY DATE(s.created_at)
                ORDER BY DATE(s.created_at)
            ) day_sales
        ),
        'sales_by_category', (
            SELECT json_agg(
                json_build_object(
                    'category', cat_sales.category,
                    'total', cat_sales.category_total,
                    'items_sold', cat_sales.items_count
                )
            )
            FROM (
                SELECT 
                    p.category,
                    SUM(si.subtotal) as category_total,
                    SUM(si.quantity) as items_count
                FROM public.sale_items si
                JOIN public.sales s ON si.sale_id = s.id
                JOIN public.products p ON si.product_id = p.id
                WHERE DATE(s.created_at) BETWEEN start_date AND end_date
                GROUP BY p.category
                ORDER BY category_total DESC
            ) cat_sales
        ),
        'top_products', (
            SELECT json_agg(
                json_build_object(
                    'product_id', top_products.product_id,
                    'product_name', top_products.product_name,
                    'quantity_sold', top_products.quantity_sold,
                    'revenue', top_products.revenue
                )
            )
            FROM (
                SELECT 
                    p.id as product_id,
                    p.name as product_name,
                    SUM(si.quantity) as quantity_sold,
                    SUM(si.subtotal) as revenue
                FROM public.sale_items si
                JOIN public.sales s ON si.sale_id = s.id
                JOIN public.products p ON si.product_id = p.id
                WHERE DATE(s.created_at) BETWEEN start_date AND end_date
                GROUP BY p.id, p.name
                ORDER BY quantity_sold DESC
                LIMIT 10
            ) top_products
        )
    ) INTO result
    FROM public.sales s
    WHERE DATE(s.created_at) BETWEEN start_date AND end_date;
    
    RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 4: NOTIFICATION FUNCTIONS
-- =====================================================

-- Function to get user notifications
CREATE OR REPLACE FUNCTION public.get_user_notifications(
    user_uuid UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
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
    ) INTO result
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
    
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Function to get notification stats
CREATE OR REPLACE FUNCTION public.get_notification_stats(
    user_uuid UUID DEFAULT NULL
)
RETURNS JSON AS $$
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
        last_updated = NOW();
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 5: UTILITY FUNCTIONS
-- =====================================================

-- Function to create automatic notifications for low stock
CREATE OR REPLACE FUNCTION public.create_low_stock_notifications()
RETURNS INTEGER AS $$
DECLARE
    product_record RECORD;
    notification_count INTEGER := 0;
BEGIN
    -- Create notifications for products with low stock
    FOR product_record IN
        SELECT id, name, stock, reorder_level
        FROM public.products
        WHERE is_active = TRUE
        AND stock <= COALESCE(reorder_level, 10)
        AND stock > 0
    LOOP
        -- Check if notification already exists for this product
        IF NOT EXISTS (
            SELECT 1 FROM public.notifications
            WHERE metadata->>'product_id' = product_record.id::text
            AND type = 'warning'
            AND title LIKE '%Low Stock%'
            AND created_at > CURRENT_DATE - INTERVAL '1 day'
        ) THEN
            INSERT INTO public.notifications (
                title,
                message,
                type,
                priority,
                metadata
            ) VALUES (
                'Low Stock Alert: ' || product_record.name,
                'Product ' || product_record.name || ' has only ' || product_record.stock || ' units left (reorder level: ' || COALESCE(product_record.reorder_level, 10) || ')',
                'warning',
                'high',
                json_build_object(
                    'product_id', product_record.id,
                    'current_stock', product_record.stock,
                    'reorder_level', COALESCE(product_record.reorder_level, 10),
                    'type', 'low_stock'
                )
            );
            notification_count := notification_count + 1;
        END IF;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create automatic notifications for expiring products
CREATE OR REPLACE FUNCTION public.create_expiry_notifications()
RETURNS INTEGER AS $$
DECLARE
    product_record RECORD;
    notification_count INTEGER := 0;
    days_until_expiry INTEGER;
BEGIN
    -- Create notifications for products expiring soon
    FOR product_record IN
        SELECT id, name, expiry_date
        FROM public.products
        WHERE is_active = TRUE
        AND expiry_date IS NOT NULL
        AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        AND expiry_date >= CURRENT_DATE
    LOOP
        days_until_expiry := (product_record.expiry_date - CURRENT_DATE)::INTEGER;
        
        -- Check if notification already exists for this product
        IF NOT EXISTS (
            SELECT 1 FROM public.notifications
            WHERE metadata->>'product_id' = product_record.id::text
            AND type = 'warning'
            AND title LIKE '%Expiring%'
            AND created_at > CURRENT_DATE - INTERVAL '1 day'
        ) THEN
            INSERT INTO public.notifications (
                title,
                message,
                type,
                priority,
                metadata
            ) VALUES (
                'Product Expiring: ' || product_record.name,
                'Product ' || product_record.name || ' will expire in ' || days_until_expiry || ' days (expires: ' || product_record.expiry_date || ')',
                'warning',
                CASE 
                    WHEN days_until_expiry <= 7 THEN 'urgent'
                    WHEN days_until_expiry <= 14 THEN 'high'
                    ELSE 'normal'
                END,
                json_build_object(
                    'product_id', product_record.id,
                    'expiry_date', product_record.expiry_date,
                    'days_until_expiry', days_until_expiry,
                    'type', 'expiring_soon'
                )
            );
            notification_count := notification_count + 1;
        END IF;
    END LOOP;
    
    RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 6: TRIGGERS AND AUTOMATION
-- =====================================================

-- Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION 7: PERMISSIONS AND SECURITY
-- =====================================================

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products_enhanced TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon, authenticated;
GRANT SELECT, UPDATE ON public.notification_stats TO anon, authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_sales_analytics(DATE, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notifications(UUID, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_stats(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_low_stock_notifications() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_expiry_notifications() TO anon, authenticated;

-- =====================================================
-- SECTION 8: SAMPLE DATA AND INITIAL SETUP
-- =====================================================

-- Create some sample notifications if none exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.notifications LIMIT 1) THEN
        INSERT INTO public.notifications (title, message, type, priority) 
        VALUES (
            'Welcome to MedCure!',
            'Your pharmacy management system is ready to use. Check the dashboard for an overview of your inventory and sales.',
            'info',
            'normal'
        );
    END IF;
END $$;

-- Update notification stats
SELECT public.get_notification_stats();

-- Remove COMMIT for Supabase compatibility
-- COMMIT;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Missing schema setup completed successfully!';
    RAISE NOTICE 'Created: products_enhanced view, notifications system, sales analytics functions';
    RAISE NOTICE 'Your application should now work without 404 errors.';
END $$;
