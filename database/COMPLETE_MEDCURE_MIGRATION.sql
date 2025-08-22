-- =====================================================
-- MEDCURE COMPLETE SUPABASE MIGRATION SCRIPT
-- Full database setup for MedCure Pharmacy Management System
-- Version: 4.0.0 - Production Ready
-- Date: August 22, 2025
-- 
-- INCLUDES:
-- ✅ Core Tables & Schemas
-- ✅ Storage Buckets & Policies
-- ✅ Database Functions
-- ✅ Views & Indexes
-- ✅ Triggers & Automation
-- ✅ RLS (Row Level Security)
-- ✅ Permissions & Security
-- ✅ Default Settings
-- =====================================================

-- Start transaction for rollback capability
BEGIN;

-- =====================================================
-- SECTION 1: CORE TABLES CREATION
-- =====================================================

-- 1.1 Products Table (Matches your existing schema + adds missing columns)
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
    
    -- Archive functionality (existing)
    is_archived BOOLEAN DEFAULT FALSE,
    archived_date TIMESTAMP WITH TIME ZONE,
    archived_by VARCHAR,
    archive_reason TEXT,
    
    -- Timestamps (existing)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints (matching your existing ones)
    CONSTRAINT chk_positive_price CHECK (price >= 0::numeric),
    CONSTRAINT chk_positive_cost_price CHECK (cost_price >= 0::numeric),
    CONSTRAINT chk_positive_stock CHECK (stock >= 0),
    CONSTRAINT chk_positive_total_stock CHECK (total_stock >= 0),
    CONSTRAINT chk_positive_pieces CHECK (pieces_per_sheet > 0),
    CONSTRAINT chk_positive_sheets CHECK (sheets_per_box > 0)
);

-- Add missing columns to existing products table (if they don't exist)
DO $$ 
BEGIN
    -- Add generic_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'generic_name') THEN
        ALTER TABLE public.products ADD COLUMN generic_name VARCHAR;
    END IF;
    
    -- Add critical_level if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'critical_level') THEN
        ALTER TABLE public.products ADD COLUMN critical_level INTEGER DEFAULT 10;
    END IF;
    
    -- Add batch_number if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'batch_number') THEN
        ALTER TABLE public.products ADD COLUMN batch_number VARCHAR;
    END IF;
    
    -- Add reorder_level if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'reorder_level') THEN
        ALTER TABLE public.products ADD COLUMN reorder_level INTEGER DEFAULT 10;
    END IF;
END $$;

-- 1.2 Sales Table (Matches your existing schema + adds missing columns)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints (matching your existing ones)
    CONSTRAINT chk_positive_total CHECK (total >= 0::numeric),
    CONSTRAINT chk_positive_amount_paid CHECK (amount_paid >= 0::numeric),
    CONSTRAINT chk_valid_payment_method CHECK (payment_method::text = ANY (ARRAY['cash'::character varying, 'gcash'::character varying, 'card'::character varying, 'digital'::character varying]::text[])),
    CONSTRAINT chk_valid_status CHECK (status::text = ANY (ARRAY['completed'::character varying, 'cancelled'::character varying, 'refunded'::character varying]::text[]))
);

-- Add missing columns to existing sales table (if they don't exist)
DO $$ 
BEGIN
    -- Add receipt_number if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'receipt_number') THEN
        ALTER TABLE public.sales ADD COLUMN receipt_number VARCHAR;
    END IF;
    
    -- Add discount_amount if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'discount_amount') THEN
        ALTER TABLE public.sales ADD COLUMN discount_amount NUMERIC DEFAULT 0;
    END IF;
    
    -- Add tax_amount if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'tax_amount') THEN
        ALTER TABLE public.sales ADD COLUMN tax_amount NUMERIC DEFAULT 0;
    END IF;
    
    -- Update payment method constraint to include 'credit' if needed
    BEGIN
        ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS chk_valid_payment_method;
        ALTER TABLE public.sales ADD CONSTRAINT chk_valid_payment_method CHECK (payment_method::text = ANY (ARRAY['cash'::character varying, 'gcash'::character varying, 'card'::character varying, 'digital'::character varying, 'credit'::character varying]::text[]));
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if constraint doesn't exist
    END;
    
    -- Update status constraint to include 'pending' if needed
    BEGIN
        ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS chk_valid_status;
        ALTER TABLE public.sales ADD CONSTRAINT chk_valid_status CHECK (status::text = ANY (ARRAY['completed'::character varying, 'cancelled'::character varying, 'refunded'::character varying, 'pending'::character varying]::text[]));
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if constraint doesn't exist
    END;
END $$;

-- 1.3 Sale Items Table (Matches your existing schema exactly)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    variant_info JSONB DEFAULT '{}',
    discount_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints (matching your existing ones)
    CONSTRAINT chk_positive_quantity CHECK (quantity > 0),
    CONSTRAINT chk_positive_unit_price CHECK (unit_price >= 0::numeric),
    CONSTRAINT chk_positive_subtotal CHECK (subtotal >= 0::numeric),
    CONSTRAINT chk_positive_discount_amount CHECK (discount_amount >= 0::numeric)
);

-- Add missing columns to existing sale_items table (if they don't exist)
DO $$ 
BEGIN
    -- Add price field (for backward compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'price') THEN
        ALTER TABLE public.sale_items ADD COLUMN price NUMERIC;
    END IF;
    
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'updated_at') THEN
        ALTER TABLE public.sale_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add total_amount field (for backward compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'total_amount') THEN
        ALTER TABLE public.sale_items ADD COLUMN total_amount NUMERIC;
    END IF;
END $$;

-- 1.4 App Settings Table (Matches your existing schema + adds missing columns)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR DEFAULT 'text',
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    category VARCHAR DEFAULT 'general',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR,
    
    -- Constraints (adjusted to match your data)
    CONSTRAINT chk_valid_setting_type CHECK (setting_type::text = ANY (ARRAY['text'::character varying, 'number'::character varying, 'boolean'::character varying, 'json'::character varying, 'date'::character varying, 'url'::character varying, 'email'::character varying]::text[]))
);

-- Add missing columns to existing app_settings table (if they don't exist)
DO $$ 
BEGIN
    -- Add is_active if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'is_active') THEN
        ALTER TABLE public.app_settings ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add validation_rules if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'validation_rules') THEN
        ALTER TABLE public.app_settings ADD COLUMN validation_rules JSONB DEFAULT '{}';
    END IF;
    
    -- Add display_order if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'display_order') THEN
        ALTER TABLE public.app_settings ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
    
    -- Add created_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'created_at') THEN
        ALTER TABLE public.app_settings ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 1.5 Notifications Table (Matches your existing schema exactly)
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
    
    -- Constraints (matching your existing ones exactly)
    CONSTRAINT chk_notification_type CHECK (type::text = ANY (ARRAY['info'::character varying, 'success'::character varying, 'warning'::character varying, 'error'::character varying]::text[])),
    CONSTRAINT chk_notification_priority CHECK (priority >= 1 AND priority <= 4),
    CONSTRAINT chk_notification_category CHECK (category::text = ANY (ARRAY['inventory'::character varying, 'sales'::character varying, 'system'::character varying, 'reports'::character varying, 'user'::character varying, 'archive'::character varying]::text[]))
);

-- Add missing columns to existing notifications table (if they don't exist)
DO $$ 
BEGIN
    -- Add action_data if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'action_data') THEN
        ALTER TABLE public.notifications ADD COLUMN action_data JSONB DEFAULT '{}';
    END IF;
    
    -- Add auto_dismiss if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'auto_dismiss') THEN
        ALTER TABLE public.notifications ADD COLUMN auto_dismiss BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add source if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'source') THEN
        ALTER TABLE public.notifications ADD COLUMN source VARCHAR DEFAULT 'system';
    END IF;
    
    -- Update category constraint to add more options (if needed)
    BEGIN
        ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS chk_notification_category;
        ALTER TABLE public.notifications ADD CONSTRAINT chk_notification_category CHECK (category::text = ANY (ARRAY['inventory'::character varying, 'sales'::character varying, 'system'::character varying, 'reports'::character varying, 'user'::character varying, 'archive'::character varying, 'expiry'::character varying, 'stock'::character varying]::text[]));
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if constraint doesn't exist
    END;
END $$;

-- 1.6 Activity Logs Table (Matches your existing schema exactly)
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
    
    -- Constraints (matching your existing ones exactly)
    CONSTRAINT chk_valid_action CHECK (action::text = ANY (ARRAY['create'::character varying, 'update'::character varying, 'delete'::character varying, 'archive'::character varying, 'restore'::character varying, 'sale'::character varying, 'login'::character varying, 'logout'::character varying]::text[])),
    CONSTRAINT chk_valid_entity_type CHECK (entity_type::text = ANY (ARRAY['product'::character varying, 'sale'::character varying, 'user'::character varying, 'setting'::character varying, 'notification'::character varying]::text[]))
);

-- Add missing columns to existing activity_logs table (if they don't exist)
DO $$ 
BEGIN
    -- Add session_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'session_id') THEN
        ALTER TABLE public.activity_logs ADD COLUMN session_id VARCHAR;
    END IF;
    
    -- Add metadata if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'metadata') THEN
        ALTER TABLE public.activity_logs ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    -- Add description if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'description') THEN
        ALTER TABLE public.activity_logs ADD COLUMN description TEXT;
    END IF;
    
    -- Add severity if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_logs' AND column_name = 'severity') THEN
        ALTER TABLE public.activity_logs ADD COLUMN severity VARCHAR DEFAULT 'info';
    END IF;
    
    -- Update action constraint to add more options (if needed)
    BEGIN
        ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS chk_valid_action;
        ALTER TABLE public.activity_logs ADD CONSTRAINT chk_valid_action CHECK (action::text = ANY (ARRAY['create'::character varying, 'update'::character varying, 'delete'::character varying, 'archive'::character varying, 'restore'::character varying, 'sale'::character varying, 'login'::character varying, 'logout'::character varying, 'view'::character varying, 'export'::character varying]::text[]));
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if constraint doesn't exist
    END;
    
    -- Update entity_type constraint to add more options (if needed)
    BEGIN
        ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS chk_valid_entity_type;
        ALTER TABLE public.activity_logs ADD CONSTRAINT chk_valid_entity_type CHECK (entity_type::text = ANY (ARRAY['product'::character varying, 'sale'::character varying, 'user'::character varying, 'setting'::character varying, 'notification'::character varying, 'report'::character varying]::text[]));
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if constraint doesn't exist
    END;
END $$;

-- 1.7 User Profiles Table (Extended User Information)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    phone VARCHAR(20),
    address TEXT,
    profile_picture_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_valid_role CHECK (role IN ('admin', 'manager', 'cashier', 'user', 'viewer'))
);

-- 1.8 Inventory Adjustments Table (Stock Movement Tracking)
CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    adjustment_type VARCHAR(50) NOT NULL,
    quantity_change INTEGER NOT NULL,
    old_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT,
    reference_number VARCHAR(100),
    adjusted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    adjusted_by_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_valid_adjustment_type CHECK (adjustment_type IN ('increase', 'decrease', 'correction', 'damage', 'expiry', 'return', 'transfer'))
);

-- =====================================================
-- SECTION 2: ENHANCED INDEXES FOR PERFORMANCE
-- =====================================================

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON public.products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_total_stock ON public.products(total_stock);
CREATE INDEX IF NOT EXISTS idx_products_expiration ON public.products(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON public.products(manufacturer) WHERE manufacturer IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_archived_date ON public.products(archived_date) WHERE is_archived = true;
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON public.products(total_stock) WHERE total_stock <= 10;
CREATE INDEX IF NOT EXISTS idx_products_critical_stock ON public.products(total_stock) WHERE total_stock <= 5;

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_total ON public.sales(total);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON public.sales(cashier) WHERE cashier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_receipt_number ON public.sales(receipt_number) WHERE receipt_number IS NOT NULL;

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_created_at ON public.sale_items(created_at DESC);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON public.app_settings(category);
CREATE INDEX IF NOT EXISTS idx_app_settings_type ON public.app_settings(setting_type);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(setting_key);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON public.user_profiles(last_login DESC);

-- Inventory adjustments indexes
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_id ON public.inventory_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_type ON public.inventory_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created_at ON public.inventory_adjustments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_adjusted_by ON public.inventory_adjustments(adjusted_by);

-- =====================================================
-- SECTION 3: STORAGE BUCKETS SETUP
-- =====================================================

-- 3.1 Create Storage Buckets
INSERT INTO storage.buckets (
    id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types
) VALUES 
-- Profile Pictures Bucket
('profiles', 'profiles', NULL, NOW(), NOW(), true, false, 5242880, 
 ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
 
-- Company/Business Logo Bucket
('logos', 'logos', NULL, NOW(), NOW(), true, false, 10485760, 
 ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']),
 
-- Branding Assets Bucket
('branding', 'branding', NULL, NOW(), NOW(), true, false, 20971520, 
 ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'application/pdf']),
 
-- Product Images Bucket
('products', 'products', NULL, NOW(), NOW(), true, false, 15728640, 
 ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
 
-- Documents/Reports Bucket
('documents', 'documents', NULL, NOW(), NOW(), false, false, 52428800, 
 ARRAY['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'])

ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW(),
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- SECTION 4: STORAGE POLICIES
-- =====================================================

-- 4.1 Profile Pictures Policies
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public read access for profile pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');

CREATE POLICY "Users can update their own profile pictures" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
    bucket_id = 'profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
FOR DELETE USING (
    bucket_id = 'profiles' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4.2 Logo Policies
CREATE POLICY "Authenticated users can upload logos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE POLICY "Public read access for logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can update logos" ON storage.objects
FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete logos" ON storage.objects
FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- 4.3 Branding Assets Policies
CREATE POLICY "Authenticated users can upload branding assets" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'branding' AND auth.role() = 'authenticated');

CREATE POLICY "Public read access for branding assets" ON storage.objects
FOR SELECT USING (bucket_id = 'branding');

CREATE POLICY "Authenticated users can update branding assets" ON storage.objects
FOR UPDATE USING (bucket_id = 'branding' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'branding' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete branding assets" ON storage.objects
FOR DELETE USING (bucket_id = 'branding' AND auth.role() = 'authenticated');

-- 4.4 Product Images Policies
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Public read access for product images" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can update product images" ON storage.objects
FOR UPDATE USING (bucket_id = 'products' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product images" ON storage.objects
FOR DELETE USING (bucket_id = 'products' AND auth.role() = 'authenticated');

-- 4.5 Documents Policies
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update documents" ON storage.objects
FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete documents" ON storage.objects
FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- =====================================================
-- SECTION 5: DATABASE FUNCTIONS
-- =====================================================

-- 5.1 Stock Management Function
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

    -- Log inventory adjustment
    INSERT INTO public.inventory_adjustments (
        product_id, adjustment_type, quantity_change, old_quantity, new_quantity, reason
    ) VALUES (
        product_id, 'decrease', -decrement_amount, 
        updated_product.total_stock + decrement_amount, updated_product.total_stock, 'Sale transaction'
    );

    RETURN updated_product;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 Process Sale Transaction (Atomic)
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
    
    IF payment_method NOT IN ('cash', 'gcash', 'card', 'digital', 'credit') THEN
        RAISE EXCEPTION 'Invalid payment method: %', payment_method;
    END IF;

    -- Create sale record
    INSERT INTO public.sales (total, payment_method, status, created_at)
    VALUES (sale_total, payment_method, 'completed', NOW())
    RETURNING id INTO new_sale_id;

    -- Process each sale item
    FOR item IN SELECT * FROM jsonb_array_elements(sale_items) 
    LOOP
        -- Extract and validate item data
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

-- 5.3 Get Sales Analytics
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
          AND s.status = 'completed'
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
          AND s.status = 'completed'
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4 Get Expiring Soon Products
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
    WHERE (p.is_archived = FALSE OR p.is_archived IS NULL)
      AND p.expiration_date IS NOT NULL
      AND p.expiration_date <= CURRENT_DATE + days_ahead
      AND p.total_stock > 0
    ORDER BY p.expiration_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5 Get User Notifications
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

-- 5.6 Get Notification Stats
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

-- 5.7 Bulk Stock Update
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
    old_stock_value INTEGER;
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
                old_stock_value := current_product.total_stock;
                
                -- Update stock
                UPDATE public.products 
                SET 
                    stock = new_stock_value,
                    total_stock = new_stock_value,
                    updated_at = NOW()
                WHERE id = current_product.id;
                
                -- Log inventory adjustment
                INSERT INTO public.inventory_adjustments (
                    product_id, adjustment_type, quantity_change, 
                    old_quantity, new_quantity, reason
                ) VALUES (
                    product_id_value, 'correction', 
                    new_stock_value - old_stock_value,
                    old_stock_value, new_stock_value, 
                    'Bulk stock update'
                );
                
                -- Return success result
                RETURN QUERY SELECT 
                    current_product.id,
                    current_product.name,
                    old_stock_value,
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

-- 5.8 Storage Helper Functions
CREATE OR REPLACE FUNCTION public.get_profile_picture_url(user_id UUID, filename TEXT DEFAULT 'avatar.jpg')
RETURNS TEXT AS $$
DECLARE
    bucket_url TEXT;
BEGIN
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM storage.objects 
                WHERE bucket_id = 'profiles' 
                AND name = user_id::text || '/' || filename
            )
            THEN '/storage/v1/object/public/profiles/' || user_id::text || '/' || filename
            ELSE '/storage/v1/object/public/profiles/default-avatar.jpg'
        END
    INTO bucket_url;
    
    RETURN bucket_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_logo_url(logo_type TEXT DEFAULT 'main-logo.png')
RETURNS TEXT AS $$
DECLARE
    bucket_url TEXT;
BEGIN
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM storage.objects 
                WHERE bucket_id = 'logos' 
                AND name = logo_type
            )
            THEN '/storage/v1/object/public/logos/' || logo_type
            ELSE '/storage/v1/object/public/logos/default-logo.png'
        END
    INTO bucket_url;
    
    RETURN bucket_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 6: ENHANCED VIEWS
-- =====================================================

-- 6.1 Products Enhanced View
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

-- 6.2 Sales with Items View
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

-- 6.3 Dashboard Summary View
CREATE OR REPLACE VIEW public.dashboard_summary AS
SELECT 
    'summary' as section,
    (SELECT COUNT(*) FROM public.products WHERE is_archived = FALSE OR is_archived IS NULL) as total_products,
    (SELECT COUNT(*) FROM public.products WHERE (is_archived = FALSE OR is_archived IS NULL) AND total_stock <= 10) as low_stock_count,
    (SELECT COUNT(*) FROM public.products WHERE (is_archived = FALSE OR is_archived IS NULL) AND total_stock <= 5) as critical_stock_count,
    (SELECT COUNT(*) FROM public.products WHERE (is_archived = FALSE OR is_archived IS NULL) AND expiration_date <= CURRENT_DATE + INTERVAL '30 days' AND expiration_date IS NOT NULL) as expiring_soon_count,
    (SELECT SUM(total) FROM public.sales WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed') as today_sales,
    (SELECT COUNT(*) FROM public.sales WHERE DATE(created_at) = CURRENT_DATE AND status = 'completed') as today_transactions;

-- =====================================================
-- SECTION 7: TRIGGERS AND AUTOMATION
-- =====================================================

-- 7.1 Update timestamp function
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

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7.2 Low stock notification trigger
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if stock is now low (<=10) and wasn't before
    IF (NEW.total_stock IS DISTINCT FROM OLD.total_stock) AND 
       NEW.total_stock <= 10 AND 
       (OLD.total_stock > 10 OR OLD.total_stock IS NULL) THEN
        
        BEGIN
            INSERT INTO public.notifications (
                title, message, type, category, priority, 
                related_entity_type, related_entity_id, metadata,
                created_at
            ) VALUES (
                'Low Stock Alert',
                format('Product "%s" is running low. Current stock: %s', NEW.name, NEW.total_stock),
                'warning',
                'stock',
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

-- 7.3 Expiry notification trigger
CREATE OR REPLACE FUNCTION public.check_product_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if expiration is approaching (within 30 days)
    IF NEW.expiration_date IS NOT NULL AND 
       NEW.expiration_date <= CURRENT_DATE + INTERVAL '30 days' AND
       NEW.expiration_date > CURRENT_DATE AND
       NEW.total_stock > 0 AND
       (OLD.expiration_date IS NULL OR OLD.expiration_date != NEW.expiration_date) THEN
        
        BEGIN
            INSERT INTO public.notifications (
                title, message, type, category, priority, 
                related_entity_type, related_entity_id, metadata,
                created_at
            ) VALUES (
                'Product Expiry Alert',
                format('Product "%s" is expiring on %s (%s days)', 
                    NEW.name, NEW.expiration_date, 
                    (NEW.expiration_date - CURRENT_DATE)::INTEGER),
                'warning',
                'expiry',
                CASE 
                    WHEN NEW.expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 3 -- High priority
                    WHEN NEW.expiration_date <= CURRENT_DATE + INTERVAL '15 days' THEN 2 -- Medium priority
                    ELSE 1 -- Low priority
                END,
                'product',
                NEW.id,
                jsonb_build_object(
                    'product_name', NEW.name,
                    'expiration_date', NEW.expiration_date,
                    'days_until_expiry', (NEW.expiration_date - CURRENT_DATE)::INTEGER,
                    'current_stock', NEW.total_stock
                ),
                NOW()
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to create expiry notification for product %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS expiry_notification ON public.products;
CREATE TRIGGER expiry_notification
    AFTER INSERT OR UPDATE OF expiration_date ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.check_product_expiry();

-- =====================================================
-- SECTION 8: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Activity logs policies
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- SECTION 9: DEFAULT SETTINGS AND DATA
-- =====================================================

-- 9.1 Default Application Settings
INSERT INTO public.app_settings (setting_key, setting_value, setting_type, description, category) VALUES
('business_name', 'MedCure Pharmacy', 'text', 'Business name for receipts and reports', 'business'),
('business_address', 'Your Business Address', 'text', 'Business address for receipts', 'business'),
('business_phone', '+1234567890', 'text', 'Business contact number', 'business'),
('business_email', 'contact@medcure.com', 'email', 'Business email address', 'business'),
('tax_rate', '12', 'number', 'Tax rate percentage', 'financial'),
('currency_symbol', '₱', 'text', 'Currency symbol', 'financial'),
('low_stock_threshold', '10', 'number', 'Alert threshold for low stock', 'inventory'),
('critical_stock_threshold', '5', 'number', 'Critical stock threshold', 'inventory'),
('auto_backup_enabled', 'true', 'boolean', 'Enable automatic database backups', 'system'),
('notification_retention_days', '30', 'number', 'Days to keep notifications', 'system'),
('company_logo_url', '', 'url', 'URL to company logo', 'branding'),
('company_banner_url', '', 'url', 'URL to company banner/background', 'branding'),
('company_favicon_url', '', 'url', 'URL to company favicon', 'branding'),
('brand_primary_color', '#1f2937', 'text', 'Primary brand color (hex)', 'branding'),
('brand_secondary_color', '#6b7280', 'text', 'Secondary brand color (hex)', 'branding'),
('brand_accent_color', '#3b82f6', 'text', 'Accent brand color (hex)', 'branding'),
('receipt_header', 'Thank you for your purchase!', 'text', 'Receipt header message', 'sales'),
('receipt_footer', 'Visit us again soon!', 'text', 'Receipt footer message', 'sales'),
('enable_barcode_scanning', 'true', 'boolean', 'Enable barcode scanning features', 'inventory'),
('default_payment_method', 'cash', 'text', 'Default payment method', 'sales'),
('enable_customer_accounts', 'false', 'boolean', 'Enable customer account features', 'sales'),
('backup_frequency', 'daily', 'text', 'Backup frequency (daily/weekly/monthly)', 'system'),
('timezone', 'Asia/Manila', 'text', 'System timezone', 'system')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- SECTION 10: PERMISSIONS AND SECURITY
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant read access to anon users for public data
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.app_settings TO anon;

-- Grant storage permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- =====================================================
-- SECTION 11: VERIFICATION AND TESTING
-- =====================================================

-- Commit the transaction
COMMIT;

-- Verification queries
SELECT 
    'Tables Created' as status,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'products', 'sales', 'sale_items', 'app_settings', 
    'notifications', 'activity_logs', 'user_profiles', 
    'inventory_adjustments'
  );

SELECT 
    'Functions Created' as status,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public';

SELECT 
    'Indexes Created' as status,
    COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';

SELECT 
    'Storage Buckets' as status,
    COUNT(*) as count
FROM storage.buckets 
WHERE id IN ('profiles', 'logos', 'branding', 'products', 'documents');

SELECT 
    'Storage Policies' as status,
    COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

SELECT 
    'App Settings' as status,
    COUNT(*) as count
FROM public.app_settings;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'MEDCURE MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Database components created:';
    RAISE NOTICE '✅ Core tables with constraints';
    RAISE NOTICE '✅ Performance indexes';
    RAISE NOTICE '✅ Storage buckets and policies';
    RAISE NOTICE '✅ Business logic functions';
    RAISE NOTICE '✅ Enhanced views';
    RAISE NOTICE '✅ Automated triggers';
    RAISE NOTICE '✅ Row Level Security (RLS)';
    RAISE NOTICE '✅ Default settings and data';
    RAISE NOTICE '✅ Proper permissions';
    RAISE NOTICE '';
    RAISE NOTICE 'Your MedCure system is ready to use!';
    RAISE NOTICE '===========================================';
END $$;

-- =====================================================
-- OPTIONAL: SAMPLE DATA (UNCOMMENT IF NEEDED)
-- =====================================================

/*
-- Sample Categories and Products
INSERT INTO public.products (name, category, price, cost_price, stock, total_stock, description, manufacturer) VALUES
('Paracetamol 500mg', 'Medicine', 2.50, 2.00, 100, 100, 'Pain reliever and fever reducer', 'Generic Pharma'),
('Amoxicillin 500mg', 'Antibiotic', 8.75, 7.00, 50, 50, 'Antibiotic for bacterial infections', 'MedLab Pharmaceuticals'),
('Vitamin C 500mg', 'Supplement', 1.75, 1.20, 200, 200, 'Vitamin C supplement for immunity', 'VitaHealth Solutions'),
('Ibuprofen 400mg', 'Medicine', 4.50, 3.20, 90, 90, 'Anti-inflammatory pain reliever', 'PainRelief Corp'),
('Cetirizine 10mg', 'Antihistamine', 3.25, 2.10, 120, 120, 'Allergy relief medication', 'AllerCare Inc')
ON CONFLICT DO NOTHING;

-- Sample Notifications
INSERT INTO public.notifications (title, message, type, category, priority, metadata) VALUES
('Welcome to MedCure', 'Your pharmacy management system is ready to use!', 'success', 'system', 1, '{"version": "4.0.0"}'),
('Low Stock Alert', 'Some products are running low on stock.', 'warning', 'inventory', 2, '{"products_count": 3}'),
('System Backup', 'Daily backup completed successfully.', 'info', 'system', 1, '{"backup_date": "2025-08-22"}')
ON CONFLICT DO NOTHING;
*/

-- =====================================================
-- END OF COMPLETE MIGRATION SCRIPT
-- =====================================================
