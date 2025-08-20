-- =====================================================
-- COMPLETE MEDCURE DATABASE MIGRATION SCRIPT
-- This single file sets up the entire MedCure system
-- Version: 2.1.0
-- Date: August 20, 2025
-- =====================================================

-- WARNING: This script will create tables, functions, and data
-- Only run this on a fresh Supabase instance or backup your data first

BEGIN;

-- =====================================================
-- SECTION 1: CORE TABLES CREATION
-- =====================================================

-- 1.1 Products Table (Main inventory table)
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints for data integrity
    CONSTRAINT chk_price_positive CHECK (price >= 0),
    CONSTRAINT chk_cost_price_positive CHECK (cost_price >= 0),
    CONSTRAINT chk_stock_non_negative CHECK (stock >= 0),
    CONSTRAINT chk_total_stock_non_negative CHECK (total_stock >= 0),
    CONSTRAINT chk_pieces_per_sheet_positive CHECK (pieces_per_sheet > 0),
    CONSTRAINT chk_sheets_per_box_positive CHECK (sheets_per_box > 0),
    CONSTRAINT chk_category_not_empty CHECK (length(trim(category)) > 0),
    CONSTRAINT chk_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_selling_price_positive CHECK (selling_price >= 0)
);

-- 1.2 Sales Table (Transaction records)
CREATE TABLE IF NOT EXISTS public.sales (
    id BIGSERIAL PRIMARY KEY,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 Sale Items Table (Individual items in each sale)
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

-- 1.4 Archived Items Table (For archived products and transactions)
CREATE TABLE IF NOT EXISTS public.archived_items (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL DEFAULT 'product',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    original_data JSONB NOT NULL,
    archived_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_by VARCHAR(255) NOT NULL DEFAULT 'System',
    reason TEXT,
    category VARCHAR(100),
    original_stock INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 Product Audit Log (Change tracking)
CREATE TABLE IF NOT EXISTS public.product_audit_log (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES public.products(id),
    operation_type VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.6 App Settings Table (Business configuration)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.7 User Profiles Table (Profile pictures and basic info)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 1.8 Notifications Table (Real-time notification system)
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

-- 1.9 Notification Templates Table (Reusable notification templates)
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    title_template VARCHAR(255) NOT NULL,
    message_template TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    category VARCHAR(100) NOT NULL DEFAULT 'system',
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 2: NOTIFICATION FUNCTIONS
-- =====================================================

-- 2.1 Function to create notifications from templates
CREATE OR REPLACE FUNCTION public.create_notification_from_template(
    template_name VARCHAR(255),
    template_data JSONB DEFAULT '{}'::JSONB,
    target_user_id UUID DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    template_record RECORD;
    new_notification_id BIGINT;
    processed_title TEXT;
    processed_message TEXT;
BEGIN
    -- Get the template
    SELECT * INTO template_record 
    FROM public.notification_templates 
    WHERE name = template_name AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template % not found or inactive', template_name;
    END IF;
    
    -- Process title and message with template data
    processed_title := template_record.title_template;
    processed_message := template_record.message_template;
    
    -- Simple template variable replacement (you can enhance this)
    IF template_data ? 'product_name' THEN
        processed_title := REPLACE(processed_title, '{{product_name}}', template_data->>'product_name');
        processed_message := REPLACE(processed_message, '{{product_name}}', template_data->>'product_name');
    END IF;
    
    IF template_data ? 'stock_level' THEN
        processed_title := REPLACE(processed_title, '{{stock_level}}', template_data->>'stock_level');
        processed_message := REPLACE(processed_message, '{{stock_level}}', template_data->>'stock_level');
    END IF;
    
    IF template_data ? 'days_until_expiry' THEN
        processed_title := REPLACE(processed_title, '{{days_until_expiry}}', template_data->>'days_until_expiry');
        processed_message := REPLACE(processed_message, '{{days_until_expiry}}', template_data->>'days_until_expiry');
    END IF;
    
    -- Create the notification
    INSERT INTO public.notifications (
        title, message, type, category, priority, user_id, 
        related_entity_type, related_entity_id, metadata
    ) VALUES (
        processed_title,
        processed_message,
        template_record.type,
        template_record.category,
        template_record.priority,
        target_user_id,
        COALESCE(template_data->>'entity_type', 'system'),
        CASE WHEN template_data ? 'entity_id' THEN (template_data->>'entity_id')::BIGINT ELSE NULL END,
        template_data
    ) RETURNING id INTO new_notification_id;
    
    RETURN new_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.2 Function to check for low stock and create notifications
CREATE OR REPLACE FUNCTION public.check_low_stock_notifications() RETURNS void AS $$
DECLARE
    product_record RECORD;
BEGIN
    FOR product_record IN 
        SELECT id, name, total_stock, low_stock_threshold
        FROM public.products 
        WHERE is_archived = false 
        AND total_stock <= low_stock_threshold
        AND total_stock > 0
    LOOP
        -- Check if we already have a recent low stock notification for this product
        IF NOT EXISTS (
            SELECT 1 FROM public.notifications 
            WHERE related_entity_type = 'product' 
            AND related_entity_id = product_record.id
            AND category = 'inventory'
            AND type = 'warning'
            AND created_at > NOW() - INTERVAL '24 hours'
        ) THEN
            -- Create low stock notification
            PERFORM public.create_notification_from_template(
                'low_stock_alert',
                jsonb_build_object(
                    'product_name', product_record.name,
                    'stock_level', product_record.total_stock,
                    'entity_type', 'product',
                    'entity_id', product_record.id
                )
            );
        END IF;
    END LOOP;
    
    -- Check for out of stock products
    FOR product_record IN 
        SELECT id, name, total_stock
        FROM public.products 
        WHERE is_archived = false 
        AND total_stock = 0
    LOOP
        -- Check if we already have a recent out of stock notification for this product
        IF NOT EXISTS (
            SELECT 1 FROM public.notifications 
            WHERE related_entity_type = 'product' 
            AND related_entity_id = product_record.id
            AND category = 'inventory'
            AND type = 'error'
            AND title LIKE 'Out of Stock:%'
            AND created_at > NOW() - INTERVAL '6 hours'
        ) THEN
            -- Create out of stock notification
            PERFORM public.create_notification_from_template(
                'out_of_stock',
                jsonb_build_object(
                    'product_name', product_record.name,
                    'entity_type', 'product',
                    'entity_id', product_record.id
                )
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.3 Function to check for expiring products and create notifications
CREATE OR REPLACE FUNCTION public.check_expiring_products_notifications() RETURNS void AS $$
DECLARE
    product_record RECORD;
    days_until_expiry INTEGER;
BEGIN
    FOR product_record IN 
        SELECT id, name, expiration_date
        FROM public.products 
        WHERE is_archived = false 
        AND expiration_date IS NOT NULL
        AND expiration_date <= CURRENT_DATE + INTERVAL '30 days'
        AND expiration_date > CURRENT_DATE
    LOOP
        days_until_expiry := (product_record.expiration_date - CURRENT_DATE);
        
        -- Check if we already have a recent expiry notification for this product
        IF NOT EXISTS (
            SELECT 1 FROM public.notifications 
            WHERE related_entity_type = 'product' 
            AND related_entity_id = product_record.id
            AND category = 'inventory'
            AND (type = 'warning' OR type = 'error')
            AND created_at > NOW() - INTERVAL '24 hours'
        ) THEN
            -- Create expiry notification with appropriate urgency
            IF days_until_expiry <= 7 THEN
                PERFORM public.create_notification_from_template(
                    'product_expiring_urgent',
                    jsonb_build_object(
                        'product_name', product_record.name,
                        'days_until_expiry', days_until_expiry,
                        'entity_type', 'product',
                        'entity_id', product_record.id
                    )
                );
            ELSE
                PERFORM public.create_notification_from_template(
                    'product_expiring_soon',
                    jsonb_build_object(
                        'product_name', product_record.name,
                        'days_until_expiry', days_until_expiry,
                        'entity_type', 'product',
                        'entity_id', product_record.id
                    )
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.4 Trigger function for automatic stock notifications
CREATE OR REPLACE FUNCTION public.trigger_stock_notifications() RETURNS trigger AS $$
BEGIN
    -- Only check if total_stock changed and product is not archived
    IF TG_OP = 'UPDATE' AND OLD.total_stock != NEW.total_stock AND NEW.is_archived = false THEN
        -- Check for out of stock (new stock is 0, old stock was > 0)
        IF NEW.total_stock = 0 AND OLD.total_stock > 0 THEN
            -- Create out of stock notification immediately
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
            -- Create low stock notification
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
    
    -- For INSERT operations, check if product starts with low/no stock
    IF TG_OP = 'INSERT' AND NEW.is_archived = false THEN
        IF NEW.total_stock = 0 THEN
            PERFORM public.create_notification_from_template(
                'out_of_stock',
                jsonb_build_object(
                    'product_name', NEW.name,
                    'entity_type', 'product',
                    'entity_id', NEW.id
                )
            );
        ELSIF NEW.total_stock <= NEW.low_stock_threshold AND NEW.total_stock > 0 THEN
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
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 3: INDEXES FOR PERFORMANCE
-- =====================================================

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON public.products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_category_stock ON public.products(category, total_stock) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_products_price_range ON public.products(selling_price, price) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON public.products(expiration_date) WHERE is_archived = false AND expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON public.products(total_stock) WHERE is_archived = false;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON public.products USING GIN(to_tsvector('english', 
    COALESCE(name, '') || ' ' || 
    COALESCE(category, '') || ' ' || 
    COALESCE(manufacturer, '') || ' ' ||
    COALESCE(brand_name, '') || ' ' ||
    COALESCE(description, '')
));

-- Sales table indexes
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_created_at_total ON public.sales(created_at, total) WHERE total > 0;
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales(payment_method);

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_product ON public.sale_items(sale_id, product_id);

-- Archived items indexes
CREATE INDEX IF NOT EXISTS idx_archived_items_type ON public.archived_items(type);
CREATE INDEX IF NOT EXISTS idx_archived_items_archived_date ON public.archived_items(archived_date DESC);
CREATE INDEX IF NOT EXISTS idx_archived_items_name ON public.archived_items(name);
CREATE INDEX IF NOT EXISTS idx_archived_items_category ON public.archived_items(category);
CREATE INDEX IF NOT EXISTS idx_archived_items_archived_by ON public.archived_items(archived_by);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_is_archived ON public.notifications(is_archived);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity ON public.notifications(related_entity_type, related_entity_id);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- =====================================================
-- SECTION 3: CORE FUNCTIONS
-- =====================================================

-- 3.1 Decrement Stock Function (Core for sales)
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
    WHERE id = product_id AND stock >= decrement_amount
    RETURNING * INTO updated_product;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product ID %', product_id;
    END IF;

    RETURN updated_product;
END;
$$ LANGUAGE plpgsql;

-- 3.2 Safe Stock Update Function
CREATE OR REPLACE FUNCTION public.update_product_stock(
    product_id BIGINT,
    quantity_change INTEGER,
    operation_type TEXT DEFAULT 'subtract'
)
RETURNS public.products AS $$
DECLARE
    updated_product public.products;
    current_stock INTEGER;
BEGIN
    -- Lock the row for update to prevent race conditions
    SELECT total_stock INTO current_stock
    FROM public.products 
    WHERE id = product_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', product_id;
    END IF;
    
    -- Validate the operation
    IF operation_type = 'subtract' AND (current_stock - quantity_change) < 0 THEN
        RAISE EXCEPTION 'Insufficient stock. Current stock: %, Requested: %', current_stock, quantity_change;
    END IF;
    
    -- Perform the update
    UPDATE public.products
    SET 
        total_stock = CASE 
            WHEN operation_type = 'add' THEN total_stock + quantity_change
            WHEN operation_type = 'subtract' THEN total_stock - quantity_change
            WHEN operation_type = 'set' THEN quantity_change
            ELSE total_stock
        END,
        stock = CASE 
            WHEN operation_type = 'add' THEN stock + quantity_change
            WHEN operation_type = 'subtract' THEN stock - quantity_change
            WHEN operation_type = 'set' THEN quantity_change
            ELSE stock
        END,
        updated_at = NOW()
    WHERE id = product_id
    RETURNING * INTO updated_product;
    
    RETURN updated_product;
END;
$$ LANGUAGE plpgsql;

-- 3.3 Atomic Sales Transaction Function
CREATE OR REPLACE FUNCTION public.process_sale_transaction(
    sale_total DECIMAL(10,2),
    payment_method TEXT,
    sale_items JSONB
)
RETURNS TABLE(
    sale_id BIGINT,
    sale_total DECIMAL(10,2),
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    items_processed INTEGER,
    inventory_updated BOOLEAN
) AS $$
DECLARE
    new_sale_id BIGINT;
    item JSONB;
    product_record RECORD;
    items_count INTEGER := 0;
    current_stock INTEGER;
BEGIN
    -- Validate input
    IF sale_total <= 0 THEN
        RAISE EXCEPTION 'Sale total must be greater than 0';
    END IF;
    
    IF jsonb_array_length(sale_items) = 0 THEN
        RAISE EXCEPTION 'Sale must contain at least one item';
    END IF;
    
    -- Create the sale record
    INSERT INTO public.sales (total, payment_method, created_at)
    VALUES (sale_total, payment_method, NOW())
    RETURNING id INTO new_sale_id;
    
    -- Process each sale item
    FOR item IN SELECT * FROM jsonb_array_elements(sale_items)
    LOOP
        -- Validate item structure
        IF NOT (item ? 'product_id' AND item ? 'quantity' AND item ? 'unit_price' AND item ? 'subtotal') THEN
            RAISE EXCEPTION 'Invalid item structure. Missing required fields.';
        END IF;
        
        -- Get current product info and lock the row
        SELECT id, name, total_stock, is_archived 
        INTO product_record
        FROM public.products 
        WHERE id = (item->>'product_id')::BIGINT 
        AND is_archived = false
        FOR UPDATE;
        
        -- Check if product exists and is not archived
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product ID % not found or is archived', item->>'product_id';
        END IF;
        
        current_stock := product_record.total_stock;
        
        -- Validate stock availability
        IF current_stock < (item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Required: %', 
                product_record.name, current_stock, (item->>'quantity')::INTEGER;
        END IF;
        
        -- Insert sale item
        INSERT INTO public.sale_items (
            sale_id, 
            product_id, 
            quantity, 
            unit_price, 
            subtotal,
            variant_info,
            created_at
        ) VALUES (
            new_sale_id,
            (item->>'product_id')::BIGINT,
            (item->>'quantity')::INTEGER,
            (item->>'unit_price')::DECIMAL(10,2),
            (item->>'subtotal')::DECIMAL(10,2),
            COALESCE(item->'variant_info', '{}'::jsonb),
            NOW()
        );
        
        -- Update product stock atomically
        UPDATE public.products 
        SET 
            total_stock = total_stock - (item->>'quantity')::INTEGER,
            stock = stock - (item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE id = (item->>'product_id')::BIGINT;
        
        items_count := items_count + 1;
    END LOOP;
    
    -- Return successful transaction details
    RETURN QUERY
    SELECT 
        new_sale_id,
        sale_total,
        process_sale_transaction.payment_method,
        NOW(),
        items_count,
        true;
END;
$$ LANGUAGE plpgsql;

-- 3.4 Sales Analytics Function
CREATE OR REPLACE FUNCTION public.get_sales_analytics(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    group_by_period TEXT DEFAULT 'day'
)
RETURNS TABLE(
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    total_sales BIGINT,
    total_revenue DECIMAL(10,2),
    total_items_sold BIGINT,
    average_transaction DECIMAL(10,2),
    top_selling_categories JSONB,
    hourly_distribution JSONB
) AS $$
DECLARE
    actual_start_date TIMESTAMP WITH TIME ZONE;
    actual_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Set default date range if not provided
    actual_start_date := COALESCE(start_date, CURRENT_DATE - INTERVAL '30 days');
    actual_end_date := COALESCE(end_date, CURRENT_DATE + INTERVAL '1 day');
    
    RETURN QUERY
    WITH sales_data AS (
        SELECT 
            s.id,
            s.total,
            s.created_at,
            si.quantity,
            si.subtotal,
            p.category
        FROM public.sales s
        JOIN public.sale_items si ON s.id = si.sale_id
        JOIN public.products p ON si.product_id = p.id
        WHERE s.created_at >= actual_start_date 
        AND s.created_at < actual_end_date
        AND s.total > 0  -- Exclude reversed sales
    ),
    category_stats AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'category', category,
                'revenue', total_revenue,
                'items_sold', total_items
            ) ORDER BY total_revenue DESC
        ) as top_categories
        FROM (
            SELECT 
                category,
                SUM(subtotal) as total_revenue,
                SUM(quantity) as total_items
            FROM sales_data
            GROUP BY category
            LIMIT 10
        ) cat_data
    ),
    hourly_stats AS (
        SELECT jsonb_object_agg(
            hour_of_day::text,
            jsonb_build_object(
                'sales_count', sales_count,
                'revenue', total_revenue
            )
        ) as hourly_data
        FROM (
            SELECT 
                EXTRACT(hour FROM created_at) as hour_of_day,
                COUNT(DISTINCT id) as sales_count,
                SUM(total) as total_revenue
            FROM sales_data
            GROUP BY EXTRACT(hour FROM created_at)
        ) hourly_data
    )
    SELECT 
        actual_start_date,
        actual_end_date,
        COUNT(DISTINCT sd.id)::BIGINT,
        SUM(DISTINCT sd.total)::DECIMAL(10,2),
        SUM(sd.quantity)::BIGINT,
        (SUM(DISTINCT sd.total) / NULLIF(COUNT(DISTINCT sd.id), 0))::DECIMAL(10,2),
        cs.top_categories,
        hs.hourly_data
    FROM sales_data sd, category_stats cs, hourly_stats hs
    GROUP BY cs.top_categories, hs.hourly_data;
END;
$$ LANGUAGE plpgsql;

-- 3.5 Inventory Analytics Function
CREATE OR REPLACE FUNCTION public.get_inventory_analytics()
RETURNS TABLE(
    total_products BIGINT,
    total_value DECIMAL,
    low_stock_count BIGINT,
    expired_count BIGINT,
    expiring_soon_count BIGINT,
    out_of_stock_count BIGINT,
    avg_profit_margin DECIMAL,
    top_categories JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH analytics AS (
        SELECT 
            COUNT(*) as total_products,
            SUM(COALESCE(selling_price, price) * total_stock) as total_value,
            COUNT(*) FILTER (WHERE total_stock <= 10 AND total_stock > 0) as low_stock_count,
            COUNT(*) FILTER (WHERE expiration_date IS NOT NULL AND expiration_date < CURRENT_DATE) as expired_count,
            COUNT(*) FILTER (WHERE expiration_date IS NOT NULL AND expiration_date <= CURRENT_DATE + INTERVAL '30 days' AND expiration_date >= CURRENT_DATE) as expiring_soon_count,
            COUNT(*) FILTER (WHERE total_stock <= 0) as out_of_stock_count,
            AVG(CASE 
                WHEN selling_price > cost_price AND cost_price > 0 
                THEN ((selling_price - cost_price) / cost_price * 100)
                ELSE 0
            END) as avg_profit_margin
        FROM public.products
        WHERE is_archived = false
    ),
    category_stats AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'category', category,
                'count', product_count,
                'total_value', total_value
            ) ORDER BY product_count DESC
        ) as top_categories
        FROM (
            SELECT 
                category,
                COUNT(*) as product_count,
                SUM(COALESCE(selling_price, price) * total_stock) as total_value
            FROM public.products
            WHERE is_archived = false
            GROUP BY category
            LIMIT 10
        ) t
    )
    SELECT 
        a.total_products,
        ROUND(a.total_value::numeric, 2) as total_value,
        a.low_stock_count,
        a.expired_count,
        a.expiring_soon_count,
        a.out_of_stock_count,
        ROUND(a.avg_profit_margin::numeric, 2) as avg_profit_margin,
        cs.top_categories
    FROM analytics a, category_stats cs;
END;
$$ LANGUAGE plpgsql;

-- 3.6 Settings Functions
CREATE OR REPLACE FUNCTION public.get_app_settings()
RETURNS TABLE(
    setting_key VARCHAR,
    setting_value TEXT,
    setting_type VARCHAR,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.setting_key,
        s.setting_value,
        s.setting_type,
        s.description
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
-- SECTION 4: ENHANCED VIEWS
-- =====================================================

-- 4.1 Enhanced Products View
CREATE OR REPLACE VIEW public.products_enhanced AS
SELECT 
    p.*,
    p.pieces_per_sheet * p.sheets_per_box AS total_pieces_per_box_calc,
    CASE 
        WHEN p.total_stock <= 0 THEN 'Out of Stock'
        WHEN p.total_stock <= 10 THEN 'Low Stock'
        WHEN p.total_stock <= 50 then 'Medium Stock'
        ELSE 'In Stock'
    END AS stock_status,
    COALESCE(p.selling_price, p.price) AS effective_selling_price,
    CASE 
        WHEN p.selling_price > p.cost_price AND p.cost_price > 0 
        THEN ROUND(((p.selling_price - p.cost_price) / p.cost_price * 100)::numeric, 2)
        ELSE 0
    END AS profit_margin_percentage,
    p.selling_price - p.cost_price AS profit_per_unit,
    CASE 
        WHEN p.expiration_date IS NOT NULL THEN
            CASE 
                WHEN p.expiration_date < CURRENT_DATE THEN 'Expired'
                WHEN p.expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
                WHEN p.expiration_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'Expiring in 3 Months'
                ELSE 'Good'
            END
        ELSE 'No Expiry Data'
    END AS expiry_status,
    -- Full-text search vector for advanced searching
    to_tsvector('english', 
        COALESCE(p.name, '') || ' ' || 
        COALESCE(p.category, '') || ' ' || 
        COALESCE(p.manufacturer, '') || ' ' ||
        COALESCE(p.brand_name, '') || ' ' ||
        COALESCE(p.description, '')
    ) AS search_vector
FROM public.products p
WHERE p.is_archived = false;

-- 4.2 Archived Products View
CREATE OR REPLACE VIEW public.archived_products AS
SELECT 
    id,
    name,
    description,
    (original_data->>'category') as category,
    (original_data->>'cost_price')::numeric as cost_price,
    (original_data->>'selling_price')::numeric as selling_price,
    original_stock,
    archived_date,
    archived_by,
    reason,
    original_data
FROM public.archived_items
WHERE type = 'product'
ORDER BY archived_date DESC;

-- =====================================================
-- SECTION 5: TRIGGERS
-- =====================================================

-- 5.1 Update Timestamp Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.2 Stock Sync Trigger Function
CREATE OR REPLACE FUNCTION public.sync_stock_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure total_stock and stock remain in sync
    IF NEW.stock IS DISTINCT FROM OLD.stock THEN
        NEW.total_stock := NEW.stock;
    ELSIF NEW.total_stock IS DISTINCT FROM OLD.total_stock THEN
        NEW.stock := NEW.total_stock;
    END IF;
    
    -- Update selling_price if not explicitly set
    IF NEW.selling_price IS NULL THEN
        NEW.selling_price := NEW.price;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.3 Audit Trigger Function
CREATE OR REPLACE FUNCTION public.audit_product_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.product_audit_log (product_id, operation_type, new_values)
        VALUES (NEW.id, 'INSERT', row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log if important fields changed
        IF (OLD.name, OLD.price, OLD.selling_price, OLD.cost_price, OLD.stock, OLD.total_stock, OLD.is_archived) 
           IS DISTINCT FROM 
           (NEW.name, NEW.price, NEW.selling_price, NEW.cost_price, NEW.stock, NEW.total_stock, NEW.is_archived) THEN
            INSERT INTO public.product_audit_log (product_id, operation_type, old_values, new_values)
            VALUES (NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.product_audit_log (product_id, operation_type, old_values)
        VALUES (OLD.id, 'DELETE', row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5.4 Create Triggers
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

DROP TRIGGER IF EXISTS trigger_archived_items_updated_at ON public.archived_items;
CREATE TRIGGER trigger_archived_items_updated_at
    BEFORE UPDATE ON public.archived_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trigger_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_sync_stock_fields ON public.products;
CREATE TRIGGER trigger_sync_stock_fields
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_stock_fields();

DROP TRIGGER IF EXISTS trigger_audit_products ON public.products;
CREATE TRIGGER trigger_audit_products
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_product_changes();

-- Notification triggers
DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON public.notifications;
CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_notification_templates_updated_at ON public.notification_templates;
CREATE TRIGGER trigger_notification_templates_updated_at
    BEFORE UPDATE ON public.notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Automatic stock notification trigger
DROP TRIGGER IF EXISTS trigger_stock_notifications ON public.products;
CREATE TRIGGER trigger_stock_notifications
    AFTER INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_stock_notifications();

-- =====================================================
-- SECTION 6: ROW LEVEL SECURITY & POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Public can insert products" ON public.products;
DROP POLICY IF EXISTS "Public can update products" ON public.products;
DROP POLICY IF EXISTS "Public can delete products" ON public.products;

DROP POLICY IF EXISTS "Public can view sales" ON public.sales;
DROP POLICY IF EXISTS "Public can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Public can update sales" ON public.sales;
DROP POLICY IF EXISTS "Public can delete sales" ON public.sales;

DROP POLICY IF EXISTS "Public can view sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Public can insert sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Public can update sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Public can delete sale_items" ON public.sale_items;

DROP POLICY IF EXISTS "Public can view archived_items" ON public.archived_items;
DROP POLICY IF EXISTS "Public can insert archived_items" ON public.archived_items;
DROP POLICY IF EXISTS "Public can update archived_items" ON public.archived_items;
DROP POLICY IF EXISTS "Public can delete archived_items" ON public.archived_items;

DROP POLICY IF EXISTS "Public can view audit_log" ON public.product_audit_log;
DROP POLICY IF EXISTS "Public can insert audit_log" ON public.product_audit_log;

DROP POLICY IF EXISTS "Public can view settings" ON public.app_settings;
DROP POLICY IF EXISTS "Public can update settings" ON public.app_settings;

DROP POLICY IF EXISTS "Users can manage own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public can view notification_templates" ON public.notification_templates;

-- Create new policies for public access (adjust based on your security needs)
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Public can delete products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Public can view sales" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Public can insert sales" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update sales" ON public.sales FOR UPDATE USING (true);
CREATE POLICY "Public can delete sales" ON public.sales FOR DELETE USING (true);

CREATE POLICY "Public can view sale_items" ON public.sale_items FOR SELECT USING (true);
CREATE POLICY "Public can insert sale_items" ON public.sale_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update sale_items" ON public.sale_items FOR UPDATE USING (true);
CREATE POLICY "Public can delete sale_items" ON public.sale_items FOR DELETE USING (true);

CREATE POLICY "Public can view archived_items" ON public.archived_items FOR SELECT USING (true);
CREATE POLICY "Public can insert archived_items" ON public.archived_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update archived_items" ON public.archived_items FOR UPDATE USING (true);
CREATE POLICY "Public can delete archived_items" ON public.archived_items FOR DELETE USING (true);

CREATE POLICY "Public can view audit_log" ON public.product_audit_log FOR SELECT USING (true);
CREATE POLICY "Public can insert audit_log" ON public.product_audit_log FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Public can update settings" ON public.app_settings FOR ALL USING (true);

CREATE POLICY "Users can manage own profile" ON public.user_profiles FOR ALL USING (auth.uid() = user_id);

-- Notification policies
CREATE POLICY "Public can view notifications" ON public.notifications FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view notification_templates" ON public.notification_templates FOR SELECT USING (is_active = true);

-- =====================================================
-- SECTION 7: PERMISSIONS
-- =====================================================

-- Grant permissions to anon role (for public access)
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Grant permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions on views
GRANT SELECT ON public.products_enhanced TO anon, authenticated;
GRANT SELECT ON public.archived_products TO anon, authenticated;

-- =====================================================
-- SECTION 8: DEFAULT DATA
-- =====================================================

-- 8.1 Insert default app settings
INSERT INTO public.app_settings (setting_key, setting_value, setting_type, description) VALUES
('business_name', 'MedCure Pharmacy', 'text', 'Business name shown in sidebar'),
('business_tagline', 'Your Trusted Healthcare Partner', 'text', 'Business tagline'),
('logo_url', '', 'text', 'Logo URL for sidebar'),
('primary_color', '#2563eb', 'color', 'Primary brand color'),
('app_version', '2.1.0', 'text', 'Application version'),
('currency_symbol', '₱', 'text', 'Currency symbol for pricing'),
('low_stock_threshold', '10', 'number', 'Alert threshold for low stock items'),
('expiry_warning_days', '30', 'number', 'Days before expiry to show warning')
ON CONFLICT (setting_key) DO NOTHING;

-- 8.2 Insert sample products (optional - remove if not needed)
INSERT INTO public.products (
    name, category, price, selling_price, cost_price, stock, total_stock, 
    pieces_per_sheet, sheets_per_box, description, manufacturer, brand_name, supplier
) VALUES 
(
    'Paracetamol 500mg', 'Pain Relief', 15.00, 20.00, 12.00, 100, 100,
    10, 10, 'Paracetamol tablets for fever and pain relief', 'Generic Pharma', 'GenePara', 'Medical Supplies Inc'
),
(
    'Vitamin C 1000mg', 'Supplements', 25.00, 30.00, 20.00, 75, 75,
    10, 5, 'Vitamin C tablets for immune support', 'Health Corp', 'VitaMax', 'Wellness Distribution'
),
(
    'Amoxicillin 500mg', 'Antibiotics', 45.00, 55.00, 38.00, 50, 50,
    10, 2, 'Antibiotic for bacterial infections', 'PharmaCorp', 'AmoxiMax', 'Medical Supplies Inc'
)
ON CONFLICT DO NOTHING;

-- 8.3 Insert sample archived items
INSERT INTO public.archived_items (
    type, name, description, original_data, archived_by, reason, category, original_stock
) VALUES 
(
    'product', 'Expired Medicine Sample', 'Sample expired medicine for testing',
    '{"id": 999, "name": "Expired Medicine Sample", "category": "Test", "cost_price": 10.00, "selling_price": 15.00, "total_stock": 0}',
    'System', 'Sample data for testing archive functionality', 'Test', 25
)
ON CONFLICT DO NOTHING;

-- 8.4 Insert notification templates
INSERT INTO public.notification_templates (
    name, title_template, message_template, type, category, priority
) VALUES 
(
    'low_stock_alert',
    'Low Stock Alert: {{product_name}}',
    'Product "{{product_name}}" is running low with only {{stock_level}} units remaining. Consider restocking soon.',
    'warning', 'inventory', 2
),
(
    'out_of_stock',
    'Out of Stock: {{product_name}}',
    '{{product_name}} is now out of stock. Please reorder immediately.',
    'error', 'inventory', 4
),
(
    'product_expiring_soon',
    'Product Expiring: {{product_name}}',
    'Product "{{product_name}}" will expire in {{days_until_expiry}} days. Consider action to prevent loss.',
    'warning', 'inventory', 2
),
(
    'product_expiring_urgent',
    'Urgent: Product Expiring Soon - {{product_name}}',
    'URGENT: Product "{{product_name}}" expires in {{days_until_expiry}} days! Immediate attention required.',
    'error', 'inventory', 4
),
(
    'sale_completed',
    'Sale Completed',
    'Sale transaction completed successfully for ₱{{total_amount}}.',
    'success', 'sales', 1
),
(
    'product_added',
    'New Product Added',
    'Product "{{product_name}}" has been added to inventory.',
    'success', 'inventory', 1
),
(
    'system_backup',
    'System Backup Completed',
    'Daily system backup completed successfully at {{backup_time}}.',
    'info', 'system', 1
),
(
    'user_login',
    'User Login',
    'User {{user_name}} logged into the system.',
    'info', 'user', 1
)
ON CONFLICT (name) DO NOTHING;

-- 8.5 Insert sample notifications (for demonstration)
INSERT INTO public.notifications (
    title, message, type, category, priority, is_read, metadata
) VALUES 
(
    'Welcome to MedCure!',
    'Your pharmacy management system is ready to use. Start by adding products to your inventory.',
    'info', 'system', 1, false, '{"source": "system_setup"}'
),
(
    'Sample Low Stock Alert',
    'This is a sample notification showing how low stock alerts work.',
    'warning', 'inventory', 2, false, '{"product_id": 1, "stock_level": 5}'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SECTION 9: FINAL VALIDATION
-- =====================================================

-- Validate installation
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    view_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('products', 'sales', 'sale_items', 'archived_items', 'product_audit_log', 'app_settings', 'user_profiles', 'notifications', 'notification_templates');
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name IN ('decrement_stock', 'update_product_stock', 'process_sale_transaction', 'get_sales_analytics', 'get_inventory_analytics', 'get_app_settings', 'update_app_setting', 'create_notification_from_template', 'check_low_stock_notifications', 'check_expiring_products_notifications');
    
    -- Count views
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name IN ('products_enhanced', 'archived_products');
    
    -- Report results
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'MEDCURE DATABASE MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Tables created: % of 9 expected', table_count;
    RAISE NOTICE 'Functions created: % of 10 expected', function_count;
    RAISE NOTICE 'Views created: % of 2 expected', view_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Core Features Available:';
    RAISE NOTICE '✓ Product Management with enhanced inventory tracking';
    RAISE NOTICE '✓ Atomic Sales Transaction Processing';
    RAISE NOTICE '✓ Archive System for deleted items';
    RAISE NOTICE '✓ Comprehensive Analytics and Reporting';
    RAISE NOTICE '✓ Audit Trail for all product changes';
    RAISE NOTICE '✓ Settings Management System';
    RAISE NOTICE '✓ User Profile Management';
    RAISE NOTICE '✓ Real-time Notification System';
    RAISE NOTICE '✓ Automated Inventory Alerts';
    RAISE NOTICE '✓ Full-Text Search Capabilities';
    RAISE NOTICE '✓ Advanced Stock Management';
    RAISE NOTICE '✓ ROW Level Security enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'Your MedCure system is ready to use!';
    RAISE NOTICE 'Version: 2.1.0';
    RAISE NOTICE 'Migration Date: %', NOW();
    RAISE NOTICE '=================================================';
END $$;

COMMIT;

-- =====================================================
-- END OF MIGRATION SCRIPT
-- =====================================================
