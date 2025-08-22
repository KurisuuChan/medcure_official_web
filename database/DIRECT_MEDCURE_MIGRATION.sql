-- =====================================================
-- MEDCURE DIRECT MIGRATION SCRIPT
-- Clean SQL for immediate deployment
-- Version: 1.0.0 - Production Ready
-- Date: August 22, 2025
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CORE TABLES CREATION
-- =====================================================

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    name CHARACTER VARYING NOT NULL,
    category CHARACTER VARYING NOT NULL DEFAULT 'Uncategorized',
    price NUMERIC NOT NULL DEFAULT 0 CHECK (price >= 0::numeric),
    selling_price NUMERIC,
    cost_price NUMERIC NOT NULL DEFAULT 0 CHECK (cost_price >= 0::numeric),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    total_stock INTEGER NOT NULL DEFAULT 0 CHECK (total_stock >= 0),
    pieces_per_sheet INTEGER NOT NULL DEFAULT 1 CHECK (pieces_per_sheet > 0),
    sheets_per_box INTEGER NOT NULL DEFAULT 1 CHECK (sheets_per_box > 0),
    description TEXT,
    manufacturer CHARACTER VARYING,
    brand_name CHARACTER VARYING,
    supplier CHARACTER VARYING,
    barcode CHARACTER VARYING,
    batch_number CHARACTER VARYING,
    expiration_date DATE,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_date TIMESTAMP WITH TIME ZONE,
    archived_by CHARACTER VARYING,
    archive_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales Table
CREATE TABLE IF NOT EXISTS public.sales (
    id BIGSERIAL PRIMARY KEY,
    total NUMERIC NOT NULL CHECK (total >= 0::numeric),
    payment_method CHARACTER VARYING DEFAULT 'cash' CHECK (payment_method::text = ANY (ARRAY['cash'::character varying, 'gcash'::character varying, 'card'::character varying, 'digital'::character varying]::text[])),
    amount_paid NUMERIC CHECK (amount_paid >= 0::numeric),
    change_amount NUMERIC DEFAULT 0,
    cashier CHARACTER VARYING,
    customer CHARACTER VARYING,
    status CHARACTER VARYING DEFAULT 'completed' CHECK (status::text = ANY (ARRAY['completed'::character varying, 'cancelled'::character varying, 'refunded'::character varying]::text[])),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale Items Table
CREATE TABLE IF NOT EXISTS public.sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0::numeric),
    subtotal NUMERIC NOT NULL CHECK (subtotal >= 0::numeric),
    variant_info JSONB DEFAULT '{}'::jsonb,
    discount_amount NUMERIC DEFAULT 0 CHECK (discount_amount >= 0::numeric),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
    CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id)
);

-- App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key CHARACTER VARYING NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type CHARACTER VARYING DEFAULT 'text' CHECK (setting_type::text = ANY (ARRAY['text'::character varying, 'number'::character varying, 'boolean'::character varying, 'json'::character varying, 'date'::character varying]::text[])),
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    category CHARACTER VARYING DEFAULT 'general',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by CHARACTER VARYING
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    title CHARACTER VARYING NOT NULL,
    message TEXT NOT NULL,
    type CHARACTER VARYING NOT NULL DEFAULT 'info' CHECK (type::text = ANY (ARRAY['info'::character varying, 'success'::character varying, 'warning'::character varying, 'error'::character varying]::text[])),
    category CHARACTER VARYING NOT NULL DEFAULT 'system' CHECK (category::text = ANY (ARRAY['inventory'::character varying, 'sales'::character varying, 'system'::character varying, 'reports'::character varying, 'user'::character varying, 'archive'::character varying]::text[])),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 4),
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    user_id UUID,
    related_entity_type CHARACTER VARYING,
    related_entity_id BIGINT,
    metadata JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id BIGSERIAL PRIMARY KEY,
    action CHARACTER VARYING NOT NULL CHECK (action::text = ANY (ARRAY['create'::character varying, 'update'::character varying, 'delete'::character varying, 'archive'::character varying, 'restore'::character varying, 'sale'::character varying, 'login'::character varying, 'logout'::character varying]::text[])),
    entity_type CHARACTER VARYING NOT NULL CHECK (entity_type::text = ANY (ARRAY['product'::character varying, 'sale'::character varying, 'user'::character varying, 'setting'::character varying, 'notification'::character varying]::text[])),
    entity_id BIGINT,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    user_name CHARACTER VARYING,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON public.products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_total_stock ON public.products(total_stock);
CREATE INDEX IF NOT EXISTS idx_products_expiration ON public.products(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode) WHERE barcode IS NOT NULL;

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_created_at ON public.sale_items(created_at DESC);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id) WHERE user_id IS NOT NULL;

-- =====================================================
-- 3. STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public, file_size_limit, allowed_mime_types) VALUES 
('profiles', 'profiles', NULL, NOW(), NOW(), true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
('logos', 'logos', NULL, NOW(), NOW(), true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
('products', 'products', NULL, NOW(), NOW(), true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
('documents', 'documents', NULL, NOW(), NOW(), false, 52428800, ARRAY['application/pdf', 'application/vnd.ms-excel', 'text/csv'])
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- =====================================================
-- 4. STORAGE POLICIES
-- =====================================================

-- Profile Pictures
CREATE POLICY "Public read access for profiles" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload profiles" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profiles' AND auth.role() = 'authenticated');

-- Logos
CREATE POLICY "Public read access for logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload logos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Products
CREATE POLICY "Public read access for products" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

-- Documents
CREATE POLICY "Authenticated users can access documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- =====================================================
-- 5. ESSENTIAL FUNCTIONS
-- =====================================================

-- Stock Management Function
CREATE OR REPLACE FUNCTION public.decrement_stock(product_id BIGINT, decrement_amount INTEGER)
RETURNS public.products AS $$
DECLARE
    updated_product public.products%ROWTYPE;
BEGIN
    SELECT * INTO updated_product FROM public.products 
    WHERE id = product_id AND (is_archived = FALSE OR is_archived IS NULL);
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found or archived: %', product_id;
    END IF;
    
    IF updated_product.total_stock < decrement_amount THEN
        RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %', 
            updated_product.name, updated_product.total_stock, decrement_amount;
    END IF;
    
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

-- Get Expiring Products
CREATE OR REPLACE FUNCTION public.get_expiring_soon_products(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE(
    product_id BIGINT,
    product_name CHARACTER VARYING,
    expiration_date DATE,
    days_until_expiry INTEGER,
    current_stock INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.expiration_date,
        (p.expiration_date - CURRENT_DATE)::INTEGER,
        p.total_stock
    FROM public.products p
    WHERE (p.is_archived = FALSE OR p.is_archived IS NULL)
      AND p.expiration_date IS NOT NULL
      AND p.expiration_date <= CURRENT_DATE + days_ahead
      AND p.total_stock > 0
    ORDER BY p.expiration_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at 
    BEFORE UPDATE ON public.sales 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at 
    BEFORE UPDATE ON public.app_settings 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 7. DEFAULT SETTINGS
-- =====================================================

INSERT INTO public.app_settings (setting_key, setting_value, setting_type, description, category) VALUES
('business_name', 'MedCure Pharmacy', 'text', 'Business name for receipts and reports', 'business'),
('business_address', 'Your Business Address', 'text', 'Business address for receipts', 'business'),
('business_phone', '+1234567890', 'text', 'Business contact number', 'business'),
('business_email', 'contact@medcure.com', 'text', 'Business email address', 'business'),
('tax_rate', '12', 'number', 'Tax rate percentage', 'business'),
('currency_symbol', '₱', 'text', 'Currency symbol', 'business'),
('low_stock_threshold', '10', 'number', 'Alert threshold for low stock', 'inventory'),
('critical_stock_threshold', '5', 'number', 'Critical stock threshold', 'inventory'),
('company_logo_url', '', 'text', 'URL to company logo', 'branding'),
('brand_primary_color', '#1f2937', 'text', 'Primary brand color (hex)', 'branding'),
('brand_secondary_color', '#6b7280', 'text', 'Secondary brand color (hex)', 'branding'),
('receipt_header', 'Thank you for your purchase!', 'text', 'Receipt header message', 'sales'),
('receipt_footer', 'Visit us again soon!', 'text', 'Receipt footer message', 'sales'),
('timezone', 'Asia/Manila', 'text', 'System timezone', 'system')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- 8. PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.app_settings TO anon;

COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'MedCure Database Migration Completed Successfully!' as status;
