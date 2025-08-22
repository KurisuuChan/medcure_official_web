-- =====================================================
-- MEDCURE COMPLETE SUPABASE MIGRATION SCRIPT V5.0
-- Full database setup for MedCure Pharmacy Management System
-- Updated: August 23, 2025
-- 
-- INCLUDES:
-- ✅ Core Tables & Schemas with ALL missing columns
-- ✅ Storage Buckets & Policies
-- ✅ Database Functions
-- ✅ Views & Indexes
-- ✅ Triggers & Automation
-- ✅ RLS (Row Level Security)
-- ✅ Permissions & Security
-- ✅ Default Settings
-- ✅ Archive & Restore columns
-- ✅ All discovered missing fields
-- =====================================================

-- Start transaction for rollback capability
BEGIN;

-- =====================================================
-- SECTION 1: EXTENSIONS & SETUP
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- SECTION 2: CORE TABLES CREATION
-- =====================================================

-- 2.1 Products Table (Complete with ALL columns)
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    category VARCHAR NOT NULL DEFAULT 'Uncategorized',
    price NUMERIC NOT NULL DEFAULT 0,
    selling_price NUMERIC,
    cost_price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    total_stock INTEGER NOT NULL DEFAULT 0,
    pieces_per_sheet INTEGER NOT NULL DEFAULT 1,
    sheets_per_box INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    manufacturer VARCHAR,
    brand_name VARCHAR,
    supplier VARCHAR,
    barcode VARCHAR,
    expiration_date DATE,
    
    -- Missing columns that frontend expects
    generic_name VARCHAR,
    critical_level INTEGER DEFAULT 10,
    reorder_level INTEGER DEFAULT 10,
    batch_number VARCHAR,
    expiry_date DATE,
    
    -- Archive functionality (complete)
    is_archived BOOLEAN DEFAULT FALSE,
    archived_date TIMESTAMP WITH TIME ZONE,
    archived_by VARCHAR,
    archive_reason TEXT,
    
    -- Restore functionality (NEW)
    restored_date TIMESTAMP WITH TIME ZONE,
    restored_by VARCHAR,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_positive_price CHECK (price >= 0::numeric),
    CONSTRAINT chk_positive_cost_price CHECK (cost_price >= 0::numeric),
    CONSTRAINT chk_positive_stock CHECK (stock >= 0),
    CONSTRAINT chk_positive_total_stock CHECK (total_stock >= 0),
    CONSTRAINT chk_positive_pieces CHECK (pieces_per_sheet > 0),
    CONSTRAINT chk_positive_sheets CHECK (sheets_per_box > 0),
    CONSTRAINT chk_positive_critical_level CHECK (critical_level >= 0),
    CONSTRAINT chk_positive_reorder_level CHECK (reorder_level >= 0)
);

-- 2.2 Sales Table (Complete with ALL columns)
CREATE TABLE IF NOT EXISTS public.sales (
    id BIGSERIAL PRIMARY KEY,
    total NUMERIC NOT NULL,
    payment_method VARCHAR DEFAULT 'cash',
    amount_paid NUMERIC,
    change_amount NUMERIC DEFAULT 0,
    cashier VARCHAR,
    customer VARCHAR,
    status VARCHAR DEFAULT 'completed',
    notes TEXT,
    receipt_number VARCHAR,
    discount_amount NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_positive_total CHECK (total >= 0::numeric),
    CONSTRAINT chk_positive_amount_paid CHECK (amount_paid >= 0::numeric),
    CONSTRAINT chk_positive_discount CHECK (discount_amount >= 0::numeric),
    CONSTRAINT chk_positive_tax CHECK (tax_amount >= 0::numeric),
    CONSTRAINT chk_valid_payment_method CHECK (payment_method::text = ANY (ARRAY['cash'::character varying, 'gcash'::character varying, 'card'::character varying, 'digital'::character varying]::text[])),
    CONSTRAINT chk_valid_status CHECK (status::text = ANY (ARRAY['completed'::character varying, 'cancelled'::character varying, 'refunded'::character varying]::text[]))
);

-- 2.3 Sale Items Table (Complete)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    variant_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_positive_quantity CHECK (quantity > 0),
    CONSTRAINT chk_positive_unit_price CHECK (unit_price >= 0::numeric),
    CONSTRAINT chk_positive_subtotal CHECK (subtotal >= 0::numeric)
);

-- 2.4 App Settings Table (Complete)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category VARCHAR DEFAULT 'general',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.5 Notifications Table (Complete)
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR,
    message TEXT,
    type VARCHAR DEFAULT 'info',
    category VARCHAR DEFAULT 'system',
    priority INTEGER DEFAULT 1,
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    related_entity_type VARCHAR,
    related_entity_id BIGINT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_valid_type CHECK (type::text = ANY (ARRAY['info'::character varying, 'warning'::character varying, 'error'::character varying, 'success'::character varying]::text[])),
    CONSTRAINT chk_valid_priority CHECK (priority >= 1 AND priority <= 5)
);

-- 2.6 Activity Logs Table (Complete)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR,
    entity_type VARCHAR,
    entity_id BIGINT,
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name VARCHAR,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_valid_action CHECK (action::text = ANY (ARRAY['create'::character varying, 'update'::character varying, 'delete'::character varying, 'archive'::character varying, 'restore'::character varying, 'sale'::character varying, 'login'::character varying, 'logout'::character varying]::text[])),
    CONSTRAINT chk_valid_entity_type CHECK (entity_type::text = ANY (ARRAY['product'::character varying, 'sale'::character varying, 'user'::character varying, 'setting'::character varying, 'notification'::character varying]::text[]))
);

-- 2.7 Archive Logs Table (Optional for audit trail)
CREATE TABLE IF NOT EXISTS public.archive_logs (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR NOT NULL,
    item_id BIGINT,
    item_name VARCHAR,
    reason TEXT,
    archived_by VARCHAR,
    original_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 3: INDEXES FOR PERFORMANCE
-- =====================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_total_stock ON public.products(total_stock);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON public.products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_archived_date ON public.products(archived_date) WHERE archived_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_archived_by ON public.products(archived_by) WHERE archived_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_restored_date ON public.products(restored_date) WHERE restored_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_restored_by ON public.products(restored_by) WHERE restored_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_expiration_date ON public.products(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON public.products(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_batch_number ON public.products(batch_number) WHERE batch_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_critical_level ON public.products(critical_level);
CREATE INDEX IF NOT EXISTS idx_products_reorder_level ON public.products(reorder_level);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON public.products USING gin(to_tsvector('english', name));

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON public.sales(cashier) WHERE cashier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_receipt_number ON public.sales(receipt_number) WHERE receipt_number IS NOT NULL;

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_created_at ON public.sale_items(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_is_archived ON public.notifications(is_archived);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

-- App settings indexes
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON public.app_settings(category);
CREATE INDEX IF NOT EXISTS idx_app_settings_is_public ON public.app_settings(is_public);

-- Archive logs indexes
CREATE INDEX IF NOT EXISTS idx_archive_logs_created_at ON public.archive_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_logs_type ON public.archive_logs(type);
CREATE INDEX IF NOT EXISTS idx_archive_logs_item_id ON public.archive_logs(item_id) WHERE item_id IS NOT NULL;

-- =====================================================
-- SECTION 4: STORAGE BUCKETS SETUP
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('product-images', 'product-images', NULL, NOW(), NOW(), true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('receipts', 'receipts', NULL, NOW(), NOW(), false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('reports', 'reports', NULL, NOW(), NOW(), false, 52428800, ARRAY['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('backups', 'backups', NULL, NOW(), NOW(), false, 1073741824, ARRAY['application/json', 'text/plain', 'application/sql'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SECTION 5: STORAGE POLICIES
-- =====================================================

-- Product images policies
CREATE POLICY "Allow public read access to product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated users to upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update product images" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete product images" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Receipts policies
CREATE POLICY "Allow authenticated users full access to receipts" ON storage.objects
FOR ALL USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- Reports policies
CREATE POLICY "Allow authenticated users full access to reports" ON storage.objects
FOR ALL USING (bucket_id = 'reports' AND auth.role() = 'authenticated');

-- Backups policies
CREATE POLICY "Allow authenticated users full access to backups" ON storage.objects
FOR ALL USING (bucket_id = 'backups' AND auth.role() = 'authenticated');

-- =====================================================
-- SECTION 6: DATABASE FUNCTIONS
-- =====================================================

-- 6.1 Decrement Stock Function
CREATE OR REPLACE FUNCTION public.decrement_stock(
  product_id BIGINT,
  decrement_amount INTEGER
)
RETURNS public.products AS $$
DECLARE
  updated_product public.products;
BEGIN
  UPDATE public.products
  SET
    stock = stock - decrement_amount,
    total_stock = total_stock - decrement_amount,
    updated_at = NOW()
  WHERE id = product_id AND stock >= decrement_amount AND total_stock >= decrement_amount
  RETURNING * INTO updated_product;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product ID %', product_id;
  END IF;

  RETURN updated_product;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.2 Get Low Stock Products Function
CREATE OR REPLACE FUNCTION public.get_low_stock_products(threshold INTEGER DEFAULT 10)
RETURNS TABLE(
  id BIGINT,
  name VARCHAR,
  category VARCHAR,
  stock INTEGER,
  critical_level INTEGER,
  reorder_level INTEGER,
  price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.category, p.stock, p.critical_level, p.reorder_level, p.price
  FROM public.products p
  WHERE p.stock <= COALESCE(p.critical_level, threshold) 
    AND p.is_archived = false
  ORDER BY p.stock ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3 Safe Delete Archived Products Function (Updated)
CREATE OR REPLACE FUNCTION public.safe_delete_archived_products(product_ids BIGINT[])
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    pid BIGINT;
    deleted_count INTEGER := 0;
    skipped_count INTEGER := 0;
    skipped_list JSONB := '[]'::jsonb;
    product_record RECORD;
    has_sales BOOLEAN;
BEGIN
    -- Loop through each product ID
    FOREACH pid IN ARRAY product_ids
    LOOP
        -- Check if product exists and is archived
        SELECT p.* INTO product_record 
        FROM public.products p 
        WHERE p.id = pid AND p.is_archived = true;
        
        IF NOT FOUND THEN
            skipped_count := skipped_count + 1;
            skipped_list := skipped_list || jsonb_build_object(
                'id', pid,
                'reason', 'Product not found or not archived'
            );
            CONTINUE;
        END IF;
        
        -- Check if product has sales history
        SELECT EXISTS(
            SELECT 1 FROM public.sale_items si 
            WHERE si.product_id = product_record.id
        ) INTO has_sales;
        
        IF has_sales THEN
            skipped_count := skipped_count + 1;
            skipped_list := skipped_list || jsonb_build_object(
                'id', product_record.id,
                'name', product_record.name,
                'reason', 'Has sales history'
            );
        ELSE
            -- Safe to delete - no sales history
            DELETE FROM public.products WHERE id = product_record.id;
            deleted_count := deleted_count + 1;
        END IF;
    END LOOP;
    
    -- Return result as JSONB
    RETURN jsonb_build_object(
        'deleted_count', deleted_count,
        'skipped_count', skipped_count,
        'skipped_products', skipped_list,
        'success', (deleted_count > 0),
        'message', CASE 
            WHEN deleted_count > 0 AND skipped_count > 0 THEN 
                deleted_count || ' deleted, ' || skipped_count || ' skipped'
            WHEN deleted_count > 0 THEN 
                deleted_count || ' products deleted successfully'
            ELSE 
                skipped_count || ' products skipped (have sales history)'
        END
    );
END;
$$;

-- 6.4 Get App Settings Function
CREATE OR REPLACE FUNCTION public.get_app_setting(setting_key VARCHAR)
RETURNS TEXT AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT value INTO setting_value
  FROM public.app_settings
  WHERE key = setting_key;
  
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.5 Update App Setting Function
CREATE OR REPLACE FUNCTION public.update_app_setting(
  setting_key VARCHAR,
  setting_value TEXT,
  setting_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.app_settings (key, value, description, updated_at)
  VALUES (setting_key, setting_value, setting_description, NOW())
  ON CONFLICT (key) 
  DO UPDATE SET 
    value = EXCLUDED.value,
    description = COALESCE(EXCLUDED.description, app_settings.description),
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.6 Get Sales Analytics Function
CREATE OR REPLACE FUNCTION public.get_sales_analytics(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH sales_data AS (
    SELECT 
      DATE(created_at) as sale_date,
      COUNT(*) as transaction_count,
      SUM(total) as daily_revenue,
      AVG(total) as avg_transaction_value
    FROM public.sales
    WHERE DATE(created_at) BETWEEN start_date AND end_date
      AND status = 'completed'
    GROUP BY DATE(created_at)
  )
  SELECT jsonb_build_object(
    'total_revenue', COALESCE(SUM(daily_revenue), 0),
    'total_transactions', COALESCE(SUM(transaction_count), 0),
    'avg_transaction_value', COALESCE(AVG(avg_transaction_value), 0),
    'daily_data', COALESCE(jsonb_agg(
      jsonb_build_object(
        'date', sale_date,
        'revenue', daily_revenue,
        'transactions', transaction_count,
        'avg_value', avg_transaction_value
      )
    ), '[]'::jsonb)
  ) INTO result
  FROM sales_data;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 7: TRIGGERS
-- =====================================================

-- 7.1 Update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to relevant tables
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SECTION 8: ROW LEVEL SECURITY (RLS) 
-- =====================================================

-- Enable RLS on tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive_logs ENABLE ROW LEVEL SECURITY;

-- Products policies (public read, authenticated write)
CREATE POLICY "Enable read access for all users" ON public.products
FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.products
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.products
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.products
FOR DELETE USING (auth.role() = 'authenticated');

-- Sales policies (authenticated users only)
CREATE POLICY "Enable all access for authenticated users on sales" ON public.sales
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users on sale_items" ON public.sale_items
FOR ALL USING (auth.role() = 'authenticated');

-- Notifications policies (user-specific)
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Activity logs policies (authenticated read-only)
CREATE POLICY "Enable read access for authenticated users on activity_logs" ON public.activity_logs
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users on activity_logs" ON public.activity_logs
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- App settings policies (authenticated users)
CREATE POLICY "Enable read access for authenticated users on app_settings" ON public.app_settings
FOR SELECT USING (auth.role() = 'authenticated' OR is_public = true);

CREATE POLICY "Enable write access for authenticated users on app_settings" ON public.app_settings
FOR ALL USING (auth.role() = 'authenticated');

-- Archive logs policies (authenticated users)
CREATE POLICY "Enable all access for authenticated users on archive_logs" ON public.archive_logs
FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- SECTION 9: FUNCTION PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.decrement_stock(BIGINT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_low_stock_products(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_delete_archived_products(BIGINT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_app_setting(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_app_setting(VARCHAR, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sales_analytics(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- SECTION 10: DEFAULT DATA
-- =====================================================

-- Insert default app settings
INSERT INTO public.app_settings (key, value, description, category, is_public) VALUES
('store_name', 'MedCure Pharmacy', 'Name of the pharmacy/store', 'general', true),
('store_address', '123 Main Street, City, Country', 'Physical address of the store', 'general', true),
('store_phone', '+1234567890', 'Contact phone number', 'general', true),
('store_email', 'info@medcure.com', 'Contact email address', 'general', true),
('currency', 'PHP', 'Default currency code', 'general', true),
('tax_rate', '0.12', 'Default tax rate (VAT)', 'sales', false),
('receipt_header', 'Thank you for your purchase!', 'Header text for receipts', 'sales', false),
('receipt_footer', 'Please keep this receipt for your records.', 'Footer text for receipts', 'sales', false),
('low_stock_threshold', '10', 'Default low stock warning threshold', 'inventory', false),
('backup_frequency', 'daily', 'How often to create backups', 'system', false),
('notification_retention_days', '30', 'How long to keep notifications', 'system', false),
('session_timeout_minutes', '60', 'User session timeout in minutes', 'security', false)
ON CONFLICT (key) DO NOTHING;

-- Create a sample admin notification
INSERT INTO public.notifications (title, message, type, category, priority, is_read, created_at) VALUES
('Welcome to MedCure', 'Your pharmacy management system is now ready to use!', 'success', 'system', 1, false, NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- SECTION 11: VIEWS (OPTIONAL)
-- =====================================================

-- Products with calculated fields view
CREATE OR REPLACE VIEW public.products_enhanced AS
SELECT 
    p.*,
    (p.stock <= COALESCE(p.critical_level, 10)) as is_low_stock,
    (p.stock <= COALESCE(p.reorder_level, 5)) as needs_reorder,
    (p.expiration_date <= CURRENT_DATE + INTERVAL '30 days') as expires_soon,
    (p.expiry_date <= CURRENT_DATE + INTERVAL '30 days') as expiry_soon,
    CASE 
        WHEN p.stock = 0 THEN 'out_of_stock'
        WHEN p.stock <= COALESCE(p.critical_level, 10) THEN 'low_stock'
        WHEN p.stock <= COALESCE(p.reorder_level, 5) THEN 'reorder_needed'
        ELSE 'in_stock'
    END as stock_status
FROM public.products p;

-- Archived products view for easy access
CREATE OR REPLACE VIEW public.archived_products AS
SELECT * FROM public.products WHERE is_archived = true;

-- Sales summary view
CREATE OR REPLACE VIEW public.sales_summary AS
SELECT 
    s.*,
    COUNT(si.id) as item_count,
    ARRAY_AGG(
        jsonb_build_object(
            'product_name', p.name,
            'quantity', si.quantity,
            'unit_price', si.unit_price,
            'subtotal', si.subtotal
        )
    ) as items
FROM public.sales s
LEFT JOIN public.sale_items si ON s.id = si.sale_id
LEFT JOIN public.products p ON si.product_id = p.id
GROUP BY s.id;

-- Grant select permissions on views
GRANT SELECT ON public.products_enhanced TO authenticated;
GRANT SELECT ON public.archived_products TO authenticated;
GRANT SELECT ON public.sales_summary TO authenticated;

-- =====================================================
-- SECTION 12: FINAL CLEANUP & VALIDATION
-- =====================================================

-- Commit the transaction
COMMIT;

-- Success message
SELECT 
    'MedCure database migration completed successfully!' as status,
    'All tables, functions, triggers, policies, and storage buckets have been created.' as message,
    NOW() as completed_at;

-- =====================================================
-- MIGRATION VERIFICATION QUERIES (Optional)
-- =====================================================

-- Uncomment these to verify the migration
/*
-- Check tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Check storage buckets
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets;

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
*/
