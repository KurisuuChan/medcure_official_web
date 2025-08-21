-- =====================================================
-- MEDCURE COMPLETE DATABASE MIGRATION - LATEST VERSION
-- Comprehensive SQL setup for MedCure Pharmacy Management System
-- Version: 3.0.0 - Production Ready
-- Date: August 21, 2025
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: CORE TABLES WITH ENHANCED FEATURES
-- =====================================================

-- 1.1 Products Table (Enhanced with Archive Support)
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Uncategorized',
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2),
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    total_stock INTEGER NOT NULL DEFAULT 0,
    pieces_per_sheet INTEGER NOT NULL DEFAULT 1,
    sheets_per_box INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    manufacturer VARCHAR(255),
    brand_name VARCHAR(255),
    supplier VARCHAR(255),
    barcode VARCHAR(100),
    expiration_date DATE,
    
    -- Archive functionality
    is_archived BOOLEAN DEFAULT FALSE,
    archived_date TIMESTAMP WITH TIME ZONE,
    archived_by VARCHAR(255),
    archive_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_positive_price CHECK (price >= 0),
    CONSTRAINT chk_positive_cost_price CHECK (cost_price >= 0),
    CONSTRAINT chk_positive_stock CHECK (stock >= 0),
    CONSTRAINT chk_positive_total_stock CHECK (total_stock >= 0),
    CONSTRAINT chk_positive_pieces CHECK (pieces_per_sheet > 0),
    CONSTRAINT chk_positive_sheets CHECK (sheets_per_box > 0)
);

-- 1.2 Sales Table (Enhanced with Payment Tracking)
CREATE TABLE IF NOT EXISTS public.sales (
    id BIGSERIAL PRIMARY KEY,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    amount_paid DECIMAL(10,2),
    change_amount DECIMAL(10,2) DEFAULT 0,
    cashier VARCHAR(255),
    customer VARCHAR(255),
    status VARCHAR(50) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_positive_total CHECK (total >= 0),
    CONSTRAINT chk_positive_amount_paid CHECK (amount_paid >= 0),
    CONSTRAINT chk_valid_payment_method CHECK (payment_method IN ('cash', 'gcash', 'card', 'digital')),
    CONSTRAINT chk_valid_status CHECK (status IN ('completed', 'cancelled', 'refunded'))
);

-- 1.3 Sale Items Table (Enhanced with Variant Support)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    variant_info JSONB DEFAULT '{}',
    discount_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_positive_quantity CHECK (quantity > 0),
    CONSTRAINT chk_positive_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_positive_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_positive_discount CHECK (discount_amount >= 0)
);

-- 1.4 App Settings Table (Business Configuration)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    category VARCHAR(100) DEFAULT 'general',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255),
    
    -- Constraints
    CONSTRAINT chk_valid_setting_type CHECK (setting_type IN ('text', 'number', 'boolean', 'json', 'date'))
);

-- 1.5 Notifications Table (Enhanced Real-time System)
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    category VARCHAR(100) NOT NULL DEFAULT 'system',
    priority INTEGER DEFAULT 1,
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    related_entity_type VARCHAR(100),
    related_entity_id BIGINT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_notification_type CHECK (type IN ('info', 'success', 'warning', 'error')),
    CONSTRAINT chk_notification_priority CHECK (priority BETWEEN 1 AND 4),
    CONSTRAINT chk_notification_category CHECK (category IN ('inventory', 'sales', 'system', 'reports', 'user', 'archive'))
);

-- 1.6 Activity Logs Table (Audit Trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT,
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_valid_action CHECK (action IN ('create', 'update', 'delete', 'archive', 'restore', 'sale', 'login', 'logout')),
    CONSTRAINT chk_valid_entity_type CHECK (entity_type IN ('product', 'sale', 'user', 'setting', 'notification'))
);

-- =====================================================
-- SECTION 2: ENHANCED INDEXES FOR PERFORMANCE
-- =====================================================

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON public.products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_total_stock ON public.products(total_stock);
CREATE INDEX IF NOT EXISTS idx_products_expiration ON public.products(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON public.products(manufacturer);
CREATE INDEX IF NOT EXISTS idx_products_archived_date ON public.products(archived_date) WHERE is_archived = true;

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_total ON public.sales(total);

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_created_at ON public.sale_items(created_at DESC);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority DESC);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON public.app_settings(category);
CREATE INDEX IF NOT EXISTS idx_app_settings_type ON public.app_settings(setting_type);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

-- =====================================================
-- SECTION 3: ENHANCED DATABASE FUNCTIONS
-- =====================================================

-- 3.1 Enhanced Stock Management Function
CREATE OR REPLACE FUNCTION public.decrement_stock(product_id BIGINT, decrement_amount INTEGER)
RETURNS public.products AS $$
DECLARE
    updated_product public.products;
BEGIN
    -- Check if product exists and is not archived
    SELECT * INTO updated_product FROM public.products 
    WHERE id = product_id AND is_archived = FALSE;
    
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
$$ LANGUAGE plpgsql;

-- 3.2 Process Sale Transaction (Atomic)
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
        -- Validate item data
        IF (item.value->>'product_id')::BIGINT IS NULL OR 
           (item.value->>'quantity')::INTEGER IS NULL OR 
           (item.value->>'unit_price')::DECIMAL IS NULL THEN
            RAISE EXCEPTION 'Invalid item data: %', item.value;
        END IF;

        -- Decrement stock
        PERFORM public.decrement_stock(
            (item.value->>'product_id')::BIGINT, 
            (item.value->>'quantity')::INTEGER
        );

        -- Insert sale item
        INSERT INTO public.sale_items (
            sale_id, product_id, quantity, unit_price, subtotal, variant_info
        ) VALUES (
            new_sale_id,
            (item.value->>'product_id')::BIGINT,
            (item.value->>'quantity')::INTEGER,
            (item.value->>'unit_price')::DECIMAL,
            (item.value->>'subtotal')::DECIMAL,
            COALESCE(item.value->'variant_info', '{}')
        );

        items_count := items_count + 1;
    END LOOP;

    -- Return results
    RETURN QUERY SELECT new_sale_id, sale_total, items_count, TRUE;
END;
$$ LANGUAGE plpgsql;

-- 3.3 Get Sales Analytics
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

-- 3.4 Get Expiring Soon Products
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

-- 3.5 Bulk Stock Update Function
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
    current_product public.products;
BEGIN
    FOR update_record IN SELECT * FROM jsonb_array_elements(updates) 
    LOOP
        BEGIN
            -- Get current product
            SELECT * INTO current_product 
            FROM public.products 
            WHERE id = (update_record.value->>'product_id')::BIGINT
              AND is_archived = FALSE;
            
            IF FOUND THEN
                -- Update stock
                UPDATE public.products 
                SET 
                    stock = (update_record.value->>'new_stock')::INTEGER,
                    total_stock = (update_record.value->>'new_stock')::INTEGER,
                    updated_at = NOW()
                WHERE id = current_product.id;
                
                -- Return success result
                RETURN QUERY SELECT 
                    current_product.id,
                    current_product.name,
                    current_product.total_stock,
                    (update_record.value->>'new_stock')::INTEGER,
                    TRUE,
                    NULL::TEXT;
            ELSE
                -- Return error result
                RETURN QUERY SELECT 
                    (update_record.value->>'product_id')::BIGINT,
                    'Product not found'::VARCHAR(255),
                    0,
                    0,
                    FALSE,
                    'Product not found or archived'::TEXT;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Return error result
            RETURN QUERY SELECT 
                (update_record.value->>'product_id')::BIGINT,
                'Error'::VARCHAR(255),
                0,
                0,
                FALSE,
                SQLERRM::TEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 4: VIEWS FOR ENHANCED QUERIES
-- =====================================================

-- 4.1 Products Enhanced View
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
FROM public.products p;

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
-- SECTION 5: TRIGGERS FOR AUTOMATED TASKS
-- =====================================================

-- 5.1 Auto-update timestamps
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

-- 5.2 Auto-create low stock notifications
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if stock is now low (<=10) and wasn't before
    IF NEW.total_stock <= 10 AND (OLD.total_stock > 10 OR OLD.total_stock IS NULL) THEN
        INSERT INTO public.notifications (
            title, message, type, category, priority, 
            related_entity_type, related_entity_id, metadata
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
                'category', NEW.category
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS low_stock_notification ON public.products;
CREATE TRIGGER low_stock_notification
    AFTER UPDATE OF total_stock ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.check_low_stock();

-- =====================================================
-- SECTION 6: DEFAULT SETTINGS AND SAMPLE DATA
-- =====================================================

-- 6.1 Default Application Settings
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

-- 6.2 Sample Product Categories (Optional)
INSERT INTO public.products (name, category, price, cost_price, stock, total_stock, description) VALUES
('Sample Product 1', 'Medicine', 25.00, 20.00, 100, 100, 'Sample medicine product'),
('Sample Product 2', 'Vitamins', 15.50, 12.00, 50, 50, 'Sample vitamin product'),
('Sample Product 3', 'First Aid', 8.75, 6.50, 75, 75, 'Sample first aid product')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SECTION 7: SECURITY AND PERMISSIONS
-- =====================================================

-- Enable Row Level Security (if needed)
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant read access to anon users for public data
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.app_settings TO anon;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if all tables are created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('products', 'sales', 'sale_items', 'app_settings', 'notifications', 'activity_logs')
ORDER BY table_name;

-- Check if all functions are created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'decrement_stock', 
    'process_sale_transaction', 
    'get_sales_analytics', 
    'get_expiring_soon_products',
    'bulk_update_stock'
  )
ORDER BY routine_name;

-- Check sample data
SELECT 'Products Count' as table_name, COUNT(*) as record_count FROM public.products
UNION ALL
SELECT 'Settings Count', COUNT(*) FROM public.app_settings
UNION ALL
SELECT 'Sales Count', COUNT(*) FROM public.sales;

-- =====================================================
-- END OF MIGRATION SCRIPT
-- =====================================================
