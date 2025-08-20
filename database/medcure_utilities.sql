-- =====================================================
-- MEDCURE UTILITY FUNCTIONS
-- Additional useful functions for advanced features
-- Version: 2.1.0 - Final
-- =====================================================

-- =====================================================
-- INVENTORY ANALYTICS FUNCTIONS
-- =====================================================

-- Get inventory status summary
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

-- Get sales analytics
CREATE OR REPLACE FUNCTION public.get_sales_analytics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_sales BIGINT,
    total_revenue DECIMAL(10,2),
    avg_transaction_value DECIMAL(10,2),
    top_selling_product VARCHAR(255),
    busiest_hour INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH sales_data AS (
        SELECT 
            s.id,
            s.total,
            s.created_at,
            EXTRACT(hour FROM s.created_at) as sale_hour
        FROM public.sales s
        WHERE s.created_at::date BETWEEN start_date AND end_date
    ),
    product_sales AS (
        SELECT 
            p.name,
            SUM(si.quantity) as total_sold
        FROM public.sale_items si
        JOIN public.products p ON si.product_id = p.id
        JOIN public.sales s ON si.sale_id = s.id
        WHERE s.created_at::date BETWEEN start_date AND end_date
        GROUP BY p.name
        ORDER BY total_sold DESC
        LIMIT 1
    ),
    hourly_sales AS (
        SELECT 
            sale_hour,
            COUNT(*) as sales_count
        FROM sales_data
        GROUP BY sale_hour
        ORDER BY sales_count DESC
        LIMIT 1
    )
    SELECT 
        COUNT(sd.id)::BIGINT,
        COALESCE(SUM(sd.total), 0)::DECIMAL(10,2),
        COALESCE(AVG(sd.total), 0)::DECIMAL(10,2),
        COALESCE(ps.name, 'No sales')::VARCHAR(255),
        COALESCE(hs.sale_hour, 0)::INTEGER
    FROM sales_data sd
    CROSS JOIN product_sales ps
    CROSS JOIN hourly_sales hs;
END;
$$ LANGUAGE plpgsql;

-- Check for out-of-stock products manually
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

-- =====================================================
-- NOTIFICATION MANAGEMENT FUNCTIONS
-- =====================================================

-- Mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notifications_read(notification_ids BIGINT[])
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications 
    SET is_read = true, updated_at = NOW()
    WHERE id = ANY(notification_ids) AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Archive old notifications
CREATE OR REPLACE FUNCTION public.archive_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    UPDATE public.notifications 
    SET is_archived = true, updated_at = NOW()
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old
    AND is_archived = false;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Get user notifications with filtering
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

-- =====================================================
-- SEARCH AND FILTER FUNCTIONS
-- =====================================================

-- Advanced product search
CREATE OR REPLACE FUNCTION public.search_products(
    search_term TEXT DEFAULT '',
    category_filter VARCHAR(100) DEFAULT NULL,
    stock_filter VARCHAR(20) DEFAULT NULL, -- 'low', 'out', 'good', 'all'
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
    id BIGINT,
    name VARCHAR(255),
    category VARCHAR(100),
    price DECIMAL(10,2),
    total_stock INTEGER,
    is_low_stock BOOLEAN,
    is_out_of_stock BOOLEAN
) AS $$
DECLARE
    threshold_val INTEGER := 3;
BEGIN
    -- Get current threshold
    SELECT COALESCE(
        (SELECT setting_value::INTEGER FROM public.app_settings WHERE setting_key = 'low_stock_threshold'), 
        3
    ) INTO threshold_val;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        p.total_stock,
        (p.total_stock > 0 AND p.total_stock <= threshold_val) as is_low_stock,
        (p.total_stock = 0) as is_out_of_stock
    FROM public.products p
    WHERE p.is_archived = false
    AND (search_term = '' OR p.name ILIKE '%' || search_term || '%' 
         OR p.category ILIKE '%' || search_term || '%'
         OR p.manufacturer ILIKE '%' || search_term || '%')
    AND (category_filter IS NULL OR p.category = category_filter)
    AND (stock_filter IS NULL OR 
         (stock_filter = 'low' AND p.total_stock > 0 AND p.total_stock <= threshold_val) OR
         (stock_filter = 'out' AND p.total_stock = 0) OR
         (stock_filter = 'good' AND p.total_stock > threshold_val) OR
         (stock_filter = 'all'))
    ORDER BY p.name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- REORDER SUGGESTIONS
-- =====================================================

-- Get smart reorder suggestions
CREATE OR REPLACE FUNCTION public.get_reorder_suggestions(
    days_to_analyze INTEGER DEFAULT 30,
    suggestion_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
    product_id BIGINT,
    product_name VARCHAR(255),
    current_stock INTEGER,
    avg_daily_sales DECIMAL(10,2),
    days_until_stockout INTEGER,
    suggested_reorder_quantity INTEGER,
    priority_score INTEGER,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH sales_analysis AS (
        SELECT 
            si.product_id,
            AVG(si.quantity::DECIMAL) as avg_daily_sales,
            COUNT(DISTINCT s.created_at::date) as selling_days
        FROM public.sale_items si
        JOIN public.sales s ON si.sale_id = s.id
        WHERE s.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_to_analyze
        GROUP BY si.product_id
        HAVING COUNT(DISTINCT s.created_at::date) >= 3 -- At least 3 days of sales
    ),
    stock_analysis AS (
        SELECT 
            p.id,
            p.name,
            p.total_stock,
            COALESCE(sa.avg_daily_sales, 0) as avg_daily_sales,
            CASE 
                WHEN COALESCE(sa.avg_daily_sales, 0) > 0 THEN 
                    (p.total_stock / sa.avg_daily_sales)::INTEGER
                ELSE 999
            END as days_until_stockout,
            CASE 
                WHEN COALESCE(sa.avg_daily_sales, 0) > 0 THEN 
                    GREATEST(
                        (sa.avg_daily_sales * 14)::INTEGER, -- 2 weeks supply
                        (p.total_stock * 2)::INTEGER, -- Double current stock
                        10 -- Minimum 10 units
                    )
                ELSE 10
            END as suggested_quantity,
            CASE 
                WHEN p.total_stock = 0 THEN 5 -- Critical
                WHEN p.total_stock <= 3 AND COALESCE(sa.avg_daily_sales, 0) > 1 THEN 4 -- High
                WHEN (p.total_stock / GREATEST(sa.avg_daily_sales, 1)) <= 7 THEN 3 -- Medium
                WHEN (p.total_stock / GREATEST(sa.avg_daily_sales, 1)) <= 14 THEN 2 -- Low
                ELSE 1 -- Info
            END as priority_score,
            CASE 
                WHEN p.total_stock = 0 THEN 'Out of stock - immediate reorder required'
                WHEN p.total_stock <= 3 THEN 'Low stock - reorder soon'
                WHEN COALESCE(sa.avg_daily_sales, 0) > 0 AND (p.total_stock / sa.avg_daily_sales) <= 7 THEN 
                    'Will run out in ' || (p.total_stock / sa.avg_daily_sales)::INTEGER || ' days'
                WHEN COALESCE(sa.avg_daily_sales, 0) > 1 THEN 'Fast-moving item - consider restocking'
                ELSE 'Slow-moving item - monitor closely'
            END as reason
        FROM public.products p
        LEFT JOIN sales_analysis sa ON p.id = sa.product_id
        WHERE p.is_archived = false
    )
    SELECT 
        sa.id,
        sa.name,
        sa.total_stock,
        sa.avg_daily_sales,
        sa.days_until_stockout,
        sa.suggested_quantity,
        sa.priority_score,
        sa.reason
    FROM stock_analysis sa
    WHERE sa.priority_score >= 2 -- Only show medium priority and above
    ORDER BY sa.priority_score DESC, sa.days_until_stockout ASC, sa.avg_daily_sales DESC
    LIMIT suggestion_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS FOR UTILITY FUNCTIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_inventory_status_summary() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sales_analytics(DATE, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_all_out_of_stock_products() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read(BIGINT[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.archive_old_notifications(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notifications(UUID, VARCHAR, BOOLEAN, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_products(TEXT, VARCHAR, VARCHAR, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_reorder_suggestions(INTEGER, INTEGER) TO anon, authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'MEDCURE UTILITY FUNCTIONS INSTALLED!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Additional features available:';
    RAISE NOTICE '✓ Inventory analytics and reporting';
    RAISE NOTICE '✓ Sales analytics with trends';
    RAISE NOTICE '✓ Advanced product search and filtering';
    RAISE NOTICE '✓ Smart reorder suggestions';
    RAISE NOTICE '✓ Notification management tools';
    RAISE NOTICE '✓ Out-of-stock detection and alerts';
    RAISE NOTICE '';
    RAISE NOTICE 'Your MedCure system now has advanced features!';
    RAISE NOTICE '=================================================';
END $$;
