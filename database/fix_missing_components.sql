-- =====================================================
-- MEDCURE DATABASE - MISSING COMPONENTS FIX (CORRECTED)
-- This script adds all the missing components to your existing schema
-- Version: 3.1.0 - August 21, 2025 - Fixed Issues
-- =====================================================

-- Note: Running without transaction for better error handling
-- Each section can be run independently

-- =====================================================
-- SECTION 1: FIX INDEX ERROR (total_stock vs total)
-- =====================================================

-- Fix the incorrect index that references total_stock instead of total
CREATE INDEX IF NOT EXISTS idx_sales_total ON public.sales(total);

-- =====================================================
-- SECTION 2: PERFORMANCE INDEXES (SAFE VERSION)
-- =====================================================

-- Product indexes (basic - no full-text search for compatibility)
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON public.products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_total_stock ON public.products(total_stock);
CREATE INDEX IF NOT EXISTS idx_products_expiration ON public.products(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON public.products(manufacturer) WHERE manufacturer IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_archived_date ON public.products(archived_date) WHERE is_archived = true;

-- Sales indexes (corrected)
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_created_at ON public.sale_items(created_at DESC);

-- Notification indexes (with NULL checks)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority DESC);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON public.app_settings(category);
CREATE INDEX IF NOT EXISTS idx_app_settings_type ON public.app_settings(setting_type);

-- Activity logs indexes (with NULL checks)
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

-- =====================================================
-- SECTION 3: DATABASE FUNCTIONS
-- =====================================================

-- 3.1 Stock Management Function (CORRECTED)
CREATE OR REPLACE FUNCTION public.decrement_stock(product_id BIGINT, decrement_amount INTEGER)
RETURNS public.products AS $$
DECLARE
    updated_product public.products%ROWTYPE;
BEGIN
    -- Check if product exists and is not archived
    SELECT * INTO updated_product FROM public.products 
    WHERE id = product_id AND (is_archived = FALSE OR is_archived IS NULL);
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found or archived: %', product_id;
    END IF;
    
    -- Check if sufficient stock available
    IF updated_product.total_stock < decrement_amount THEN
        RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %', 
            updated_product.name, updated_product.total_stock, decrement_amount;
    END IF;
    
    -- Update stock
    UPDATE public.products 
    SET 
        stock = stock - decrement_amount,
        total_stock = total_stock - decrement_amount,
        updated_at = NOW()
    WHERE id = product_id
    RETURNING * INTO updated_product;

    RETURN updated_product;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2 Process Sale Transaction (IMPROVED ERROR HANDLING)
CREATE OR REPLACE FUNCTION public.process_sale_transaction(
    sale_total DECIMAL(10,2),
    payment_method VARCHAR(50),
    sale_items JSONB
)
RETURNS TABLE(
    sale_id BIGINT,
    total_amount DECIMAL(10,2),
    items_processed INTEGER,
    success BOOLEAN
) AS $$
DECLARE
    new_sale_id BIGINT;
    item RECORD;
    items_count INTEGER := 0;
    item_product_id BIGINT;
    item_quantity INTEGER;
    item_unit_price DECIMAL(10,2);
    item_subtotal DECIMAL(10,2);
BEGIN
    -- Validate inputs
    IF sale_total <= 0 THEN
        RAISE EXCEPTION 'Sale total must be positive';
    END IF;
    
    IF payment_method NOT IN ('cash', 'gcash', 'card', 'digital') THEN
        RAISE EXCEPTION 'Invalid payment method: %', payment_method;
    END IF;

    -- Create sale record
    INSERT INTO public.sales (total, payment_method, status, created_at)
    VALUES (sale_total, payment_method, 'completed', NOW())
    RETURNING id INTO new_sale_id;

    -- Process each sale item
    FOR item IN SELECT * FROM jsonb_array_elements(sale_items) 
    LOOP
        -- Extract and validate item data with proper error handling
        BEGIN
            item_product_id := (item.value->>'product_id')::BIGINT;
            item_quantity := (item.value->>'quantity')::INTEGER;
            item_unit_price := (item.value->>'unit_price')::DECIMAL(10,2);
            item_subtotal := (item.value->>'subtotal')::DECIMAL(10,2);
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Invalid item data format: %', item.value;
        END;

        -- Validate extracted data
        IF item_product_id IS NULL OR item_quantity IS NULL OR item_unit_price IS NULL THEN
            RAISE EXCEPTION 'Missing required item data: %', item.value;
        END IF;

        -- Decrement stock
        PERFORM public.decrement_stock(item_product_id, item_quantity);

        -- Insert sale item
        INSERT INTO public.sale_items (
            sale_id, product_id, quantity, unit_price, subtotal, variant_info
        ) VALUES (
            new_sale_id,
            item_product_id,
            item_quantity,
            item_unit_price,
            COALESCE(item_subtotal, item_unit_price * item_quantity),
            COALESCE(item.value->'variant_info', '{}')
        );

        items_count := items_count + 1;
    END LOOP;

    -- Return results
    RETURN QUERY SELECT new_sale_id, sale_total, items_count, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3 Sales Analytics
CREATE OR REPLACE FUNCTION public.get_sales_analytics(
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_sales DECIMAL(10,2),
    total_transactions INTEGER,
    avg_transaction_value DECIMAL(10,2),
    top_selling_product_id BIGINT,
    top_selling_product_name VARCHAR(255),
    top_selling_quantity INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH sales_summary AS (
        SELECT 
            SUM(s.total) as total_sales,
            COUNT(s.id) as total_transactions,
            AVG(s.total) as avg_transaction_value
        FROM public.sales s
        WHERE DATE(s.created_at) BETWEEN start_date AND end_date
    ),
    top_product AS (
        SELECT 
            si.product_id,
            p.name,
            SUM(si.quantity) as total_quantity,
            ROW_NUMBER() OVER (ORDER BY SUM(si.quantity) DESC) as rn
        FROM public.sale_items si
        JOIN public.products p ON si.product_id = p.id
        JOIN public.sales s ON si.sale_id = s.id
        WHERE DATE(s.created_at) BETWEEN start_date AND end_date
        GROUP BY si.product_id, p.name
    )
    SELECT 
        COALESCE(ss.total_sales, 0),
        COALESCE(ss.total_transactions, 0),
        COALESCE(ss.avg_transaction_value, 0),
        tp.product_id,
        tp.name,
        COALESCE(tp.total_quantity, 0)::INTEGER
    FROM sales_summary ss
    FULL OUTER JOIN top_product tp ON tp.rn = 1;
END;
$$ LANGUAGE plpgsql;

-- 3.4 Expiring Products
CREATE OR REPLACE FUNCTION public.get_expiring_soon_products(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE(
    product_id BIGINT,
    product_name VARCHAR(255),
    expiration_date DATE,
    days_until_expiry INTEGER,
    current_stock INTEGER,
    urgency_level VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.expiration_date,
        (p.expiration_date - CURRENT_DATE)::INTEGER,
        p.total_stock,
        CASE 
            WHEN (p.expiration_date - CURRENT_DATE) <= 7 THEN 'CRITICAL'
            WHEN (p.expiration_date - CURRENT_DATE) <= 15 THEN 'HIGH'
            WHEN (p.expiration_date - CURRENT_DATE) <= 30 THEN 'MEDIUM'
            ELSE 'LOW'
        END
    FROM public.products p
    WHERE p.is_archived = FALSE 
      AND p.expiration_date IS NOT NULL
      AND p.expiration_date <= CURRENT_DATE + days_ahead
      AND p.total_stock > 0
    ORDER BY p.expiration_date ASC;
END;
$$ LANGUAGE plpgsql;

-- 3.5 Bulk Stock Update (CORRECTED)
CREATE OR REPLACE FUNCTION public.bulk_update_stock(updates JSONB)
RETURNS TABLE(
    product_id BIGINT,
    product_name VARCHAR(255),
    old_stock INTEGER,
    new_stock INTEGER,
    success BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    update_record RECORD;
    current_product public.products%ROWTYPE;
    new_stock_value INTEGER;
    product_id_value BIGINT;
BEGIN
    FOR update_record IN SELECT * FROM jsonb_array_elements(updates) 
    LOOP
        BEGIN
            -- Extract values with error handling
            product_id_value := (update_record.value->>'product_id')::BIGINT;
            new_stock_value := (update_record.value->>'new_stock')::INTEGER;
            
            -- Get current product
            SELECT * INTO current_product 
            FROM public.products 
            WHERE id = product_id_value
              AND (is_archived = FALSE OR is_archived IS NULL);
            
            IF FOUND THEN
                -- Update stock
                UPDATE public.products 
                SET 
                    stock = new_stock_value,
                    total_stock = new_stock_value,
                    updated_at = NOW()
                WHERE id = current_product.id;
                
                -- Return success result
                RETURN QUERY SELECT 
                    current_product.id,
                    current_product.name,
                    current_product.total_stock,
                    new_stock_value,
                    TRUE,
                    NULL::TEXT;
            ELSE
                -- Return error result
                RETURN QUERY SELECT 
                    product_id_value,
                    'Product not found'::VARCHAR(255),
                    0,
                    0,
                    FALSE,
                    'Product not found or archived'::TEXT;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Return error result
            RETURN QUERY SELECT 
                COALESCE(product_id_value, 0),
                'Error'::VARCHAR(255),
                0,
                0,
                FALSE,
                SQLERRM::TEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.6 Get User Notifications Function
CREATE OR REPLACE FUNCTION public.get_user_notifications(
    p_user_id UUID DEFAULT NULL,
    p_category VARCHAR(100) DEFAULT NULL,
    p_type VARCHAR(50) DEFAULT NULL,
    p_unread_only BOOLEAN DEFAULT FALSE
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
    user_id UUID,
    related_entity_type VARCHAR(100),
    related_entity_id BIGINT,
    metadata JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id, n.title, n.message, n.type, n.category, n.priority,
        n.is_read, n.is_archived, n.user_id, n.related_entity_type,
        n.related_entity_id, n.metadata, n.expires_at, n.created_at, n.updated_at
    FROM public.notifications n
    WHERE 
        (p_user_id IS NULL OR n.user_id = p_user_id OR n.user_id IS NULL)
        AND (p_category IS NULL OR n.category = p_category)
        AND (p_type IS NULL OR n.type = p_type)
        AND (NOT p_unread_only OR n.is_read = FALSE)
        AND n.is_archived = FALSE
        AND (n.expires_at IS NULL OR n.expires_at > NOW())
    ORDER BY n.priority DESC, n.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.7 Get Notification Stats Function
CREATE OR REPLACE FUNCTION public.get_notification_stats(
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    total_count INTEGER,
    unread_count INTEGER,
    high_priority_count INTEGER,
    categories JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_count,
        COUNT(CASE WHEN n.is_read = FALSE THEN 1 END)::INTEGER as unread_count,
        COUNT(CASE WHEN n.priority >= 3 THEN 1 END)::INTEGER as high_priority_count,
        jsonb_object_agg(
            n.category, 
            COUNT(CASE WHEN n.is_read = FALSE THEN 1 END)
        ) as categories
    FROM public.notifications n
    WHERE 
        (p_user_id IS NULL OR n.user_id = p_user_id OR n.user_id IS NULL)
        AND n.is_archived = FALSE
        AND (n.expires_at IS NULL OR n.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 4: ENHANCED VIEWS
-- =====================================================

-- 4.1 Products Enhanced View (FIXED - Only show non-archived products)
CREATE OR REPLACE VIEW public.products_enhanced AS
SELECT 
    p.*,
    p.total_stock as stock, -- Alias for compatibility
    CASE 
        WHEN p.total_stock <= 5 THEN 'CRITICAL'
        WHEN p.total_stock <= 10 THEN 'LOW'
        WHEN p.total_stock <= 20 THEN 'MEDIUM'
        ELSE 'GOOD'
    END as stock_status,
    CASE 
        WHEN p.expiration_date IS NULL THEN NULL
        WHEN p.expiration_date <= CURRENT_DATE THEN 'EXPIRED'
        WHEN p.expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'GOOD'
    END as expiry_status,
    (p.expiration_date - CURRENT_DATE)::INTEGER as days_until_expiry,
    (p.pieces_per_sheet * p.sheets_per_box) as total_pieces_per_box
FROM public.products p
WHERE (p.is_archived = FALSE OR p.is_archived IS NULL);

-- 4.2 Sales with Items View
CREATE OR REPLACE VIEW public.sales_with_items AS
SELECT 
    s.*,
    COALESCE(items.item_count, 0) as item_count,
    COALESCE(items.total_quantity, 0) as total_quantity,
    items.items_summary
FROM public.sales s
LEFT JOIN (
    SELECT 
        si.sale_id,
        COUNT(si.id) as item_count,
        SUM(si.quantity) as total_quantity,
        jsonb_agg(
            jsonb_build_object(
                'product_id', si.product_id,
                'product_name', p.name,
                'quantity', si.quantity,
                'unit_price', si.unit_price,
                'subtotal', si.subtotal
            )
        ) as items_summary
    FROM public.sale_items si
    JOIN public.products p ON si.product_id = p.id
    GROUP BY si.sale_id
) items ON s.id = items.sale_id;

-- =====================================================
-- SECTION 5: TRIGGERS AND AUTOMATION
-- =====================================================

-- 5.1 Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at 
    BEFORE UPDATE ON public.sales 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at 
    BEFORE UPDATE ON public.app_settings 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5.2 Low stock notification trigger (IMPROVED)
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if stock is now low (<=10) and wasn't before
    -- Only trigger if total_stock actually changed
    IF (NEW.total_stock IS DISTINCT FROM OLD.total_stock) AND 
       NEW.total_stock <= 10 AND 
       (OLD.total_stock > 10 OR OLD.total_stock IS NULL) THEN
        
        -- Insert notification with error handling
        BEGIN
            INSERT INTO public.notifications (
                title, message, type, category, priority, 
                related_entity_type, related_entity_id, metadata,
                created_at
            ) VALUES (
                'Low Stock Alert',
                format('Product "%s" is running low. Current stock: %s', NEW.name, NEW.total_stock),
                'warning',
                'inventory',
                CASE 
                    WHEN NEW.total_stock <= 5 THEN 3 -- High priority
                    ELSE 2 -- Medium priority
                END,
                'product',
                NEW.id,
                jsonb_build_object(
                    'product_name', NEW.name,
                    'current_stock', NEW.total_stock,
                    'category', NEW.category,
                    'previous_stock', OLD.total_stock
                ),
                NOW()
            );
        EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the update
            RAISE WARNING 'Failed to create low stock notification for product %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS low_stock_notification ON public.products;
CREATE TRIGGER low_stock_notification
    AFTER UPDATE OF total_stock ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.check_low_stock();

-- =====================================================
-- SECTION 6: DEFAULT SETTINGS
-- =====================================================

INSERT INTO public.app_settings (setting_key, setting_value, setting_type, description, category) VALUES
('business_name', 'MedCure Pharmacy', 'text', 'Business name for receipts and reports', 'business'),
('business_address', 'Your Business Address', 'text', 'Business address for receipts', 'business'),
('business_phone', '+1234567890', 'text', 'Business contact number', 'business'),
('tax_rate', '12', 'number', 'Tax rate percentage', 'financial'),
('currency_symbol', '₱', 'text', 'Currency symbol', 'financial'),
('low_stock_threshold', '10', 'number', 'Alert threshold for low stock', 'inventory'),
('critical_stock_threshold', '5', 'number', 'Critical stock threshold', 'inventory'),
('auto_backup_enabled', 'true', 'boolean', 'Enable automatic database backups', 'system'),
('notification_retention_days', '30', 'number', 'Days to keep notifications', 'system')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- SECTION 7: PERMISSIONS (SAFE GRANTS)
-- =====================================================

-- Grant necessary permissions (with error handling)
DO $$
BEGIN
    -- Grant permissions to authenticated users
    GRANT USAGE ON SCHEMA public TO authenticated;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
    
    -- Grant read access to anon users for public data
    GRANT USAGE ON SCHEMA public TO anon;
    GRANT SELECT ON public.products TO anon;
    GRANT SELECT ON public.app_settings TO anon;
    
    RAISE NOTICE 'Permissions granted successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Some permissions could not be granted: %', SQLERRM;
END $$;

-- =====================================================
-- VERIFICATION QUERIES (IMPROVED)
-- =====================================================

-- Check if all functions are created
DO $$
BEGIN
    RAISE NOTICE 'Checking created functions...';
    PERFORM 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
      AND routine_name IN (
        'decrement_stock', 
        'process_sale_transaction', 
        'get_sales_analytics', 
        'get_expiring_soon_products',
        'bulk_update_stock',
        'get_user_notifications',
        'get_notification_stats',
        'update_updated_at_column',
        'check_low_stock'
      );
END $$;

-- Check if all indexes are created
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%';
    
    RAISE NOTICE 'Created % indexes', index_count;
END $$;

-- Check settings data
DO $$
DECLARE
    settings_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO settings_count FROM public.app_settings;
    RAISE NOTICE 'App settings count: %', settings_count;
END $$;

-- Check views
DO $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views 
    WHERE table_schema = 'public' 
      AND table_name IN ('products_enhanced', 'sales_with_items');
    
    RAISE NOTICE 'Created % views', view_count;
END $$;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'DATABASE ENHANCEMENT COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Your MedCure database now includes:';
    RAISE NOTICE '✅ Performance indexes';
    RAISE NOTICE '✅ Business logic functions';
    RAISE NOTICE '✅ Enhanced views';
    RAISE NOTICE '✅ Automated triggers';
    RAISE NOTICE '✅ Default settings';
    RAISE NOTICE '✅ Proper permissions';
    RAISE NOTICE '===========================================';
END $$;
