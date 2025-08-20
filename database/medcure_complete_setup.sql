-- =====================================================
-- MEDCURE COMPLETE DATABASE SETUP
-- Consolidated essential database schema and functions
-- Version: 2.1.0 - Final
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: CORE TABLES
-- =====================================================

-- 1.1 Products Table (Main inventory)
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
    expiration_date DATE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 Sales Table (Transaction records)
CREATE TABLE IF NOT EXISTS public.sales (
    id BIGSERIAL PRIMARY KEY,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 Sale Items Table (Items in each transaction)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    variant_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.4 App Settings Table (Business configuration)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.5 Notifications Table (Real-time notification system)
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

-- =====================================================
-- SECTION 2: INDEXES FOR PERFORMANCE
-- =====================================================

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON public.products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_total_stock ON public.products(total_stock);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- =====================================================
-- SECTION 3: ESSENTIAL FUNCTIONS
-- =====================================================

-- 3.1 Stock Management Function
CREATE OR REPLACE FUNCTION public.decrement_stock(product_id BIGINT, decrement_amount INTEGER)
RETURNS public.products AS $$
DECLARE
    updated_product public.products;
BEGIN
    UPDATE public.products 
    SET 
        stock = stock - decrement_amount,
        total_stock = total_stock - decrement_amount,
        updated_at = NOW()
    WHERE id = product_id AND stock >= decrement_amount
    RETURNING * INTO updated_product;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product ID %', product_id;
    END IF;

    RETURN updated_product;
END;
$$ LANGUAGE plpgsql;

-- 3.2 Bulk Stock Update Function
CREATE OR REPLACE FUNCTION public.bulk_update_stock(
    updates JSONB
)
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
    FOR update_record IN 
        SELECT 
            (value->>'id')::BIGINT as id,
            (value->>'new_stock')::INTEGER as new_stock
        FROM jsonb_array_elements(updates)
    LOOP
        BEGIN
            -- Get current product
            SELECT * INTO current_product
            FROM public.products 
            WHERE id = update_record.id AND is_archived = false;
            
            IF NOT FOUND THEN
                RETURN QUERY SELECT 
                    update_record.id,
                    'Product not found'::VARCHAR(255),
                    0,
                    update_record.new_stock,
                    false,
                    'Product not found or archived'::TEXT;
                CONTINUE;
            END IF;
            
            -- Update stock
            UPDATE public.products 
            SET 
                stock = update_record.new_stock,
                total_stock = update_record.new_stock,
                updated_at = NOW()
            WHERE id = update_record.id;
            
            -- Return success
            RETURN QUERY SELECT 
                current_product.id,
                current_product.name,
                current_product.total_stock,
                update_record.new_stock,
                true,
                'Success'::TEXT;
                
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 
                update_record.id,
                COALESCE(current_product.name, 'Unknown'::VARCHAR(255)),
                COALESCE(current_product.total_stock, 0),
                update_record.new_stock,
                false,
                SQLERRM::TEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3.3 Notification Creation Function
CREATE OR REPLACE FUNCTION public.create_notification(
    p_title VARCHAR(255),
    p_message TEXT,
    p_type VARCHAR(50) DEFAULT 'info',
    p_category VARCHAR(100) DEFAULT 'system',
    p_priority INTEGER DEFAULT 1,
    p_user_id UUID DEFAULT NULL,
    p_related_entity_type VARCHAR(100) DEFAULT NULL,
    p_related_entity_id BIGINT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS BIGINT AS $$
DECLARE
    notification_id BIGINT;
BEGIN
    INSERT INTO public.notifications (
        title, message, type, category, priority, user_id, 
        related_entity_type, related_entity_id, metadata
    ) VALUES (
        p_title, p_message, p_type, p_category, p_priority, p_user_id,
        p_related_entity_type, p_related_entity_id, p_metadata
    )
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- 3.4 Settings Management Functions
CREATE OR REPLACE FUNCTION public.get_app_settings()
RETURNS TABLE(
    setting_key VARCHAR,
    setting_value TEXT,
    setting_type VARCHAR,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.setting_key, s.setting_value, s.setting_type, s.description
    FROM public.app_settings s
    ORDER BY s.setting_key;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_app_setting(
    key_name VARCHAR,
    new_value TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.app_settings 
    SET setting_value = new_value, updated_at = NOW()
    WHERE setting_key = key_name;
    
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        INSERT INTO public.app_settings (setting_key, setting_value, updated_at)
        VALUES (key_name, new_value, NOW());
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 4: NOTIFICATION TRIGGERS
-- =====================================================

-- 4.1 Smart Stock Notification Trigger (3-unit threshold)
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

-- 4.2 Sale Notification Trigger
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

-- 4.3 Update Timestamp Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 5: CREATE TRIGGERS
-- =====================================================

-- Stock notification triggers
DROP TRIGGER IF EXISTS trigger_low_stock_notification ON public.products;
CREATE TRIGGER trigger_low_stock_notification
    AFTER INSERT OR UPDATE OF total_stock ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.check_low_stock_notification();

-- Sale notification trigger
DROP TRIGGER IF EXISTS trigger_sale_notification ON public.sales;
CREATE TRIGGER trigger_sale_notification
    AFTER INSERT ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.create_sale_notification();

-- Update timestamp triggers
DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_sales_updated_at ON public.sales;
CREATE TRIGGER trigger_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trigger_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- SECTION 6: ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed)
CREATE POLICY "Public can manage products" ON public.products FOR ALL USING (true);
CREATE POLICY "Public can manage sales" ON public.sales FOR ALL USING (true);
CREATE POLICY "Public can manage sale_items" ON public.sale_items FOR ALL USING (true);
CREATE POLICY "Public can manage settings" ON public.app_settings FOR ALL USING (true);
CREATE POLICY "Public can manage notifications" ON public.notifications FOR ALL USING (true);

-- =====================================================
-- SECTION 7: PERMISSIONS
-- =====================================================

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- SECTION 8: DEFAULT DATA
-- =====================================================

-- 8.1 Default settings
INSERT INTO public.app_settings (setting_key, setting_value, setting_type, description) VALUES
('business_name', 'MedCure Pharmacy', 'text', 'Business name shown in sidebar'),
('business_tagline', 'Your Trusted Healthcare Partner', 'text', 'Business tagline'),
('logo_url', '', 'text', 'Logo URL for sidebar'),
('primary_color', '#2563eb', 'color', 'Primary brand color'),
('app_version', '2.1.0', 'text', 'Application version'),
('currency_symbol', '₱', 'text', 'Currency symbol for pricing'),
('low_stock_threshold', '3', 'number', 'Alert threshold for low stock items (recommended: 2-3 for small pharmacy)'),
('expiry_warning_days', '30', 'number', 'Days before expiry to show warning')
ON CONFLICT (setting_key) DO NOTHING;

-- 8.2 Welcome notification
INSERT INTO public.notifications (title, message, type, category, priority, is_read, metadata) VALUES 
(
    'Welcome to MedCure!',
    'Your pharmacy management system is ready to use. Start by adding products to your inventory.',
    'info', 'system', 1, false, '{"source": "system_setup"}'
)
ON CONFLICT DO NOTHING;

COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'MEDCURE DATABASE SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Features implemented:';
    RAISE NOTICE '✓ Complete product inventory management';
    RAISE NOTICE '✓ Sales and transaction recording';
    RAISE NOTICE '✓ Smart notification system (3-unit threshold)';
    RAISE NOTICE '✓ Bulk stock update functionality';
    RAISE NOTICE '✓ Configurable business settings';
    RAISE NOTICE '✓ Real-time triggers and alerts';
    RAISE NOTICE '✓ Row Level Security enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'Your MedCure system is ready for use!';
    RAISE NOTICE '=================================================';
END $$;
