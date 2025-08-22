-- =====================================================
-- MedCure Pharmacy Management System
-- Complete Database Migration Script
-- Date: August 23, 2025
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. CORE TABLES
-- =====================================================

-- Products table (main inventory)
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand_name TEXT,
    manufacturer TEXT,
    generic_name TEXT,
    description TEXT,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    pieces_per_sheet INTEGER DEFAULT 1,
    sheets_per_box INTEGER DEFAULT 1,
    total_pieces_per_box INTEGER GENERATED ALWAYS AS (pieces_per_sheet * sheets_per_box) STORED,
    expiry_date DATE,
    batch_number TEXT,
    supplier TEXT,
    location TEXT,
    barcode TEXT,
    sku TEXT,
    packaging JSONB DEFAULT '{}',
    is_archived BOOLEAN DEFAULT FALSE,
    archive_reason TEXT,
    archived_by TEXT,
    archived_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table (transaction records)
CREATE TABLE IF NOT EXISTS public.sales (
    id BIGSERIAL PRIMARY KEY,
    total DECIMAL(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    change_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    customer_name TEXT,
    customer_contact TEXT,
    notes TEXT,
    cashier TEXT,
    is_voided BOOLEAN DEFAULT FALSE,
    void_reason TEXT,
    voided_by TEXT,
    voided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale items table (individual product sales)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    variant_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    category TEXT DEFAULT 'general',
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    user_id UUID REFERENCES auth.users(id),
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock movements table (inventory tracking)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES public.products(id),
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'expired', 'damaged')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    reference_type TEXT, -- 'sale', 'purchase', 'adjustment', etc.
    reference_id BIGINT,
    notes TEXT,
    performed_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    payment_terms TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    po_number TEXT UNIQUE NOT NULL,
    supplier_id BIGINT REFERENCES public.suppliers(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
    order_date DATE DEFAULT CURRENT_DATE,
    expected_date DATE,
    received_date DATE,
    total_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase order items table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id),
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    expiry_date DATE,
    batch_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id BIGSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category TEXT DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON public.products (manufacturer);
CREATE INDEX IF NOT EXISTS idx_products_archived ON public.products (is_archived);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products (stock);
CREATE INDEX IF NOT EXISTS idx_products_expiry ON public.products (expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING GIN (
    (name || ' ' || COALESCE(brand_name, '') || ' ' || COALESCE(manufacturer, '') || ' ' || COALESCE(category, '')) gin_trgm_ops
);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales (created_at);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON public.sales (payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_voided ON public.sales (is_voided);

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items (product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_created_at ON public.sale_items (created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications (type);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements (created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements (movement_type);

-- =====================================================
-- 3. ENHANCED VIEWS
-- =====================================================

-- Enhanced products view with calculated fields
CREATE OR REPLACE VIEW public.products_enhanced AS
SELECT 
    p.*,
    CASE 
        WHEN p.stock <= 0 THEN 'Out of Stock'
        WHEN p.stock <= p.reorder_level THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status,
    CASE 
        WHEN p.expiry_date IS NULL THEN 'No Expiry Data'
        WHEN p.expiry_date <= CURRENT_DATE THEN 'Expired'
        WHEN p.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
        ELSE 'Good'
    END as expiry_status,
    p.stock as current_stock,
    p.stock as total_stock,
    COALESCE(sales_data.total_sold, 0) as total_sold,
    COALESCE(sales_data.revenue, 0) as total_revenue,
    COALESCE(sales_data.last_sold, NULL) as last_sold_date
FROM public.products p
LEFT JOIN (
    SELECT 
        si.product_id,
        SUM(si.quantity) as total_sold,
        SUM(si.subtotal) as revenue,
        MAX(s.created_at) as last_sold
    FROM public.sale_items si
    JOIN public.sales s ON si.sale_id = s.id
    WHERE s.is_voided = FALSE
    GROUP BY si.product_id
) sales_data ON p.id = sales_data.product_id;

-- Sales summary view
CREATE OR REPLACE VIEW public.sales_summary AS
SELECT 
    s.*,
    COUNT(si.id) as item_count,
    SUM(si.quantity) as total_quantity,
    ARRAY_AGG(
        json_build_object(
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

-- =====================================================
-- 4. DATABASE FUNCTIONS
-- =====================================================

-- Function to get dashboard analytics
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics()
RETURNS JSON AS $$
DECLARE
    result JSON;
    today_revenue DECIMAL(10,2);
    today_transactions INTEGER;
    low_stock_count INTEGER;
    total_products INTEGER;
    recent_sales JSON;
    low_stock_products JSON;
BEGIN
    -- Get today's revenue
    SELECT COALESCE(SUM(total), 0) INTO today_revenue
    FROM public.sales 
    WHERE DATE(created_at) = CURRENT_DATE AND is_voided = FALSE;
    
    -- Get today's transaction count
    SELECT COUNT(*) INTO today_transactions
    FROM public.sales 
    WHERE DATE(created_at) = CURRENT_DATE AND is_voided = FALSE;
    
    -- Get low stock count
    SELECT COUNT(*) INTO low_stock_count
    FROM public.products 
    WHERE stock <= reorder_level AND is_archived = FALSE;
    
    -- Get total products
    SELECT COUNT(*) INTO total_products
    FROM public.products 
    WHERE is_archived = FALSE;
    
    -- Get recent sales (last 5)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', id,
            'total', total,
            'payment_method', payment_method,
            'created_at', created_at
        ) ORDER BY created_at DESC
    ), '[]'::JSON) INTO recent_sales
    FROM (
        SELECT * FROM public.sales 
        WHERE is_voided = FALSE 
        ORDER BY created_at DESC 
        LIMIT 5
    ) recent;
    
    -- Get low stock products
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'stock', stock,
            'reorder_level', reorder_level,
            'category', category
        ) ORDER BY stock ASC
    ), '[]'::JSON) INTO low_stock_products
    FROM (
        SELECT * FROM public.products 
        WHERE stock <= reorder_level AND is_archived = FALSE 
        ORDER BY stock ASC 
        LIMIT 10
    ) low_stock;
    
    -- Build result
    SELECT json_build_object(
        'today_revenue', today_revenue,
        'today_transactions', today_transactions,
        'low_stock_count', low_stock_count,
        'total_products', total_products,
        'recent_sales', recent_sales,
        'low_stock_products', low_stock_products,
        'generated_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for optimized product search
CREATE OR REPLACE FUNCTION public.search_products_optimized(
    search_query TEXT DEFAULT NULL,
    category_filter TEXT DEFAULT NULL,
    stock_status_filter TEXT DEFAULT NULL,
    price_min DECIMAL DEFAULT NULL,
    price_max DECIMAL DEFAULT NULL,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
    id INTEGER,
    name TEXT,
    category TEXT,
    brand_name TEXT,
    stock INTEGER,
    selling_price DECIMAL,
    stock_status TEXT,
    search_rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id::INTEGER,
        p.name,
        p.category,
        p.brand_name,
        p.stock,
        p.selling_price,
        CASE 
            WHEN p.stock <= 0 THEN 'Out of Stock'
            WHEN p.stock <= p.reorder_level THEN 'Low Stock'
            ELSE 'In Stock'
        END::TEXT as stock_status,
        CASE 
            WHEN search_query IS NOT NULL THEN
                similarity(p.name || ' ' || COALESCE(p.brand_name, '') || ' ' || COALESCE(p.manufacturer, ''), search_query)
            ELSE 0
        END as search_rank
    FROM public.products p
    WHERE 
        p.is_archived = FALSE
        AND (search_query IS NULL OR (
            p.name ILIKE '%' || search_query || '%' OR
            p.brand_name ILIKE '%' || search_query || '%' OR
            p.manufacturer ILIKE '%' || search_query || '%' OR
            p.category ILIKE '%' || search_query || '%'
        ))
        AND (category_filter IS NULL OR p.category = category_filter)
        AND (stock_status_filter IS NULL OR 
            CASE 
                WHEN stock_status_filter = 'Out of Stock' THEN p.stock <= 0
                WHEN stock_status_filter = 'Low Stock' THEN p.stock > 0 AND p.stock <= p.reorder_level
                WHEN stock_status_filter = 'In Stock' THEN p.stock > p.reorder_level
                ELSE TRUE
            END
        )
        AND (price_min IS NULL OR p.selling_price >= price_min)
        AND (price_max IS NULL OR p.selling_price <= price_max)
    ORDER BY 
        CASE WHEN search_query IS NOT NULL THEN search_rank ELSE 0 END DESC,
        p.name ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get sales analytics
CREATE OR REPLACE FUNCTION public.get_sales_analytics(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    total_sales DECIMAL(10,2);
    total_transactions INTEGER;
    avg_transaction DECIMAL(10,2);
    top_products JSON;
    sales_by_hour JSON;
    sales_by_category JSON;
BEGIN
    -- Set default dates if not provided
    IF start_date IS NULL THEN start_date := CURRENT_DATE - INTERVAL '30 days'; END IF;
    IF end_date IS NULL THEN end_date := CURRENT_DATE; END IF;
    
    -- Get total sales
    SELECT COALESCE(SUM(total), 0) INTO total_sales
    FROM public.sales 
    WHERE DATE(created_at) BETWEEN start_date AND end_date 
    AND is_voided = FALSE;
    
    -- Get transaction count
    SELECT COUNT(*) INTO total_transactions
    FROM public.sales 
    WHERE DATE(created_at) BETWEEN start_date AND end_date 
    AND is_voided = FALSE;
    
    -- Calculate average transaction
    avg_transaction := CASE WHEN total_transactions > 0 THEN total_sales / total_transactions ELSE 0 END;
    
    -- Get top products
    SELECT COALESCE(json_agg(
        json_build_object(
            'product_name', p.name,
            'quantity_sold', SUM(si.quantity),
            'revenue', SUM(si.subtotal),
            'category', p.category
        ) ORDER BY SUM(si.quantity) DESC
    ), '[]'::JSON) INTO top_products
    FROM public.sale_items si
    JOIN public.products p ON si.product_id = p.id
    JOIN public.sales s ON si.sale_id = s.id
    WHERE DATE(s.created_at) BETWEEN start_date AND end_date 
    AND s.is_voided = FALSE
    GROUP BY p.id, p.name, p.category
    LIMIT 10;
    
    -- Get sales by hour
    SELECT COALESCE(json_agg(
        json_build_object(
            'hour', hour_part,
            'sales', COALESCE(total_sales_hour, 0),
            'transactions', COALESCE(transaction_count, 0)
        ) ORDER BY hour_part
    ), '[]'::JSON) INTO sales_by_hour
    FROM (
        SELECT 
            generate_series(0, 23) as hour_part
    ) hours
    LEFT JOIN (
        SELECT 
            EXTRACT(HOUR FROM created_at) as hour_part,
            SUM(total) as total_sales_hour,
            COUNT(*) as transaction_count
        FROM public.sales
        WHERE DATE(created_at) BETWEEN start_date AND end_date 
        AND is_voided = FALSE
        GROUP BY EXTRACT(HOUR FROM created_at)
    ) sales_data USING (hour_part);
    
    -- Get sales by category
    SELECT COALESCE(json_agg(
        json_build_object(
            'category', p.category,
            'revenue', SUM(si.subtotal),
            'quantity', SUM(si.quantity)
        ) ORDER BY SUM(si.subtotal) DESC
    ), '[]'::JSON) INTO sales_by_category
    FROM public.sale_items si
    JOIN public.products p ON si.product_id = p.id
    JOIN public.sales s ON si.sale_id = s.id
    WHERE DATE(s.created_at) BETWEEN start_date AND end_date 
    AND s.is_voided = FALSE
    GROUP BY p.category;
    
    -- Build result
    SELECT json_build_object(
        'period', json_build_object(
            'start_date', start_date,
            'end_date', end_date
        ),
        'summary', json_build_object(
            'total_sales', total_sales,
            'total_transactions', total_transactions,
            'average_transaction', avg_transaction
        ),
        'top_products', top_products,
        'sales_by_hour', sales_by_hour,
        'sales_by_category', sales_by_category,
        'generated_at', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record stock movement
CREATE OR REPLACE FUNCTION public.record_stock_movement(
    p_product_id BIGINT,
    p_movement_type TEXT,
    p_quantity INTEGER,
    p_unit_cost DECIMAL DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL,
    p_reference_id BIGINT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_performed_by TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
    new_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT stock INTO current_stock FROM public.products WHERE id = p_product_id;
    
    IF current_stock IS NULL THEN
        RAISE EXCEPTION 'Product not found';
    END IF;
    
    -- Calculate new stock based on movement type
    CASE p_movement_type
        WHEN 'in' THEN new_stock := current_stock + p_quantity;
        WHEN 'out' THEN new_stock := current_stock - p_quantity;
        WHEN 'adjustment' THEN new_stock := p_quantity; -- Direct stock adjustment
        ELSE new_stock := current_stock - ABS(p_quantity); -- expired, damaged, etc.
    END CASE;
    
    -- Ensure stock doesn't go negative
    IF new_stock < 0 THEN new_stock := 0; END IF;
    
    -- Update product stock
    UPDATE public.products 
    SET stock = new_stock, updated_at = NOW() 
    WHERE id = p_product_id;
    
    -- Record the movement
    INSERT INTO public.stock_movements (
        product_id, movement_type, quantity, previous_stock, new_stock,
        unit_cost, reference_type, reference_id, notes, performed_by
    ) VALUES (
        p_product_id, p_movement_type, p_quantity, current_stock, new_stock,
        p_unit_cost, p_reference_type, p_reference_id, p_notes, p_performed_by
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. TRIGGERS AND AUTOMATION
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER sales_updated_at BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER notifications_updated_at BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically record stock movements for sales
CREATE OR REPLACE FUNCTION public.handle_sale_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Record stock movement for each sale item
    PERFORM public.record_stock_movement(
        NEW.product_id,
        'out',
        NEW.quantity,
        (SELECT cost_price FROM public.products WHERE id = NEW.product_id),
        'sale',
        NEW.sale_id,
        'Stock reduction from sale #' || NEW.sale_id,
        'system'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic stock movement on sales
CREATE TRIGGER sale_items_stock_movement AFTER INSERT ON public.sale_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_sale_stock_movement();

-- Function to create low stock notifications
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if stock fell to or below reorder level
    IF NEW.stock <= NEW.reorder_level AND OLD.stock > OLD.reorder_level THEN
        INSERT INTO public.notifications (
            title,
            message,
            type,
            category,
            priority,
            data
        ) VALUES (
            'Low Stock Alert',
            'Product "' || NEW.name || '" is running low on stock (' || NEW.stock || ' remaining)',
            'warning',
            'inventory',
            3,
            json_build_object(
                'product_id', NEW.id,
                'product_name', NEW.name,
                'current_stock', NEW.stock,
                'reorder_level', NEW.reorder_level
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for low stock notifications
CREATE TRIGGER products_low_stock_check AFTER UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.check_low_stock();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Notification policies (users can see global notifications or their own)
CREATE POLICY "Users can view relevant notifications" ON public.notifications
    FOR SELECT USING (
        user_id IS NULL OR 
        user_id = auth.uid() OR
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (
        user_id = auth.uid() OR
        auth.role() = 'service_role'
    );

-- Settings policies (only service role can modify)
CREATE POLICY "Anyone can view public settings" ON public.settings
    FOR SELECT USING (is_public = true OR auth.role() = 'service_role');

CREATE POLICY "Only service role can modify settings" ON public.settings
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 7. DEFAULT SETTINGS AND CONFIGURATION
-- =====================================================

-- Insert default settings
INSERT INTO public.settings (key, value, category, description, is_public) VALUES
('pharmacy_name', '"MedCure Pharmacy"', 'general', 'Pharmacy name for receipts and reports', true),
('currency', '"PHP"', 'general', 'Default currency symbol', true),
('tax_rate', '0.12', 'financial', 'Default tax rate (12%)', false),
('receipt_footer', '"Thank you for choosing MedCure Pharmacy!"', 'general', 'Receipt footer message', true),
('low_stock_threshold', '10', 'inventory', 'Default low stock threshold', false),
('backup_frequency', '"daily"', 'system', 'Automatic backup frequency', false),
('notification_retention_days', '30', 'system', 'Days to keep notifications', false)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 8. SAMPLE DATA INSERTION
-- =====================================================

-- Insert the pharmaceutical products from CSV
INSERT INTO public.products (
    name, category, selling_price, cost_price, stock, pieces_per_sheet, 
    sheets_per_box, description, manufacturer, brand_name, generic_name
) VALUES
('Solmux Carbocisteine 500mg', 'Respiratory', 9.50, 7.20, 180, 10, 10, 'For cough with phlegm', 'Unilab', 'Unilab', 'Carbocisteine'),
('Bioflu Tablet', 'Respiratory', 6.75, 5.10, 300, 10, 10, 'For flu and common cold symptoms', 'Unilab', 'Unilab', 'Bioflu'),
('Medicol Advance 400mg', 'Analgesic', 12.00, 9.50, 150, 10, 10, 'For strong pain relief', 'Unilab', 'Unilab', 'Ibuprofen'),
('Tuseran Forte', 'Respiratory', 8.25, 6.50, 220, 10, 10, 'For cough and cold', 'Unilab', 'Unilab', 'Dextromethorphan'),
('Enervon C Tablet', 'Supplement', 5.50, 4.20, 500, 10, 10, 'Multivitamins for energy and immunity', 'Unilab', 'Unilab', 'Multivitamins'),
('Myra E 400IU', 'Supplement', 14.00, 11.50, 180, 10, 10, 'Vitamin E supplement for skin health', 'Unilab', 'Unilab', 'Vitamin E'),
('Ceelin Plus Syrup 120ml', 'Supplement', 135.00, 110.00, 80, 1, 1, 'Vitamin C with Zinc for kids', 'Unilab', 'Unilab', 'Vitamin C'),
('Advil Softgel Capsule', 'Analgesic', 15.00, 12.00, 120, 10, 5, 'Fast-acting pain reliever', 'Pfizer', 'Pfizer', 'Ibuprofen'),
('Robitussin DM Syrup 60ml', 'Respiratory', 150.00, 125.00, 70, 1, 1, 'Cough suppressant and expectorant', 'Pfizer', 'Pfizer', 'Dextromethorphan'),
('Caltrate Plus Tablet', 'Supplement', 8.00, 6.50, 250, 10, 10, 'Calcium supplement with Vitamin D', 'Pfizer', 'Pfizer', 'Calcium'),
('Stresstabs Multivitamins', 'Supplement', 7.50, 6.00, 300, 10, 10, 'For stress and immunity', 'Pfizer', 'Pfizer', 'Multivitamins'),
('Ponstan 500mg', 'Analgesic', 25.00, 20.00, 100, 10, 10, 'For menstrual pain and other aches', 'Pfizer', 'Pfizer', 'Mefenamic Acid'),
('Mucosolvan 30mg', 'Respiratory', 11.00, 8.80, 160, 10, 10, 'Ambroxol for cough relief', 'Sanofi', 'Sanofi', 'Ambroxol'),
('Dulcolax Tablet', 'Digestive', 15.00, 12.50, 90, 10, 3, 'For constipation relief', 'Sanofi', 'Sanofi', 'Bisacodyl'),
('Essentiale Forte N', 'Digestive', 22.00, 18.00, 110, 10, 5, 'For liver health', 'Sanofi', 'Sanofi', 'Phospholipids'),
('Buscopan Venus', 'Analgesic', 18.00, 15.00, 130, 10, 10, 'For abdominal pain and cramps', 'Sanofi', 'Sanofi', 'Hyoscine'),
('Pharmaton Capsules', 'Supplement', 16.00, 13.50, 140, 10, 10, 'Multivitamins with Ginseng', 'Sanofi', 'Sanofi', 'Multivitamins'),
('Berocca Performance', 'Supplement', 20.00, 17.00, 150, 1, 15, 'Effervescent multivitamin for energy', 'Bayer', 'Bayer', 'B-Complex'),
('Saridon Triple Action', 'Analgesic', 5.00, 3.80, 400, 10, 10, 'For headache and pain relief', 'Bayer', 'Bayer', 'Paracetamol + Caffeine'),
('Canesten Cream 10g', 'Dermatological', 250.00, 210.00, 60, 1, 1, 'Antifungal cream', 'Bayer', 'Bayer', 'Clotrimazole'),
('Claritin 10mg', 'Antihistamine', 35.00, 28.00, 100, 10, 10, 'Non-drowsy allergy relief', 'Bayer', 'Bayer', 'Loratadine'),
('Restor-F', 'Supplement', 9.00, 7.20, 200, 10, 10, 'Iron supplement for anemia', 'Pascual Laboratories', 'Pascual', 'Iron'),
('Poten-Cee Forte 1000mg', 'Supplement', 10.00, 8.00, 300, 10, 10, 'High-dose Vitamin C', 'Pascual Laboratories', 'Pascual', 'Vitamin C'),
('OraCare Mouthwash 250ml', 'Dental', 120.00, 95.00, 90, 1, 1, 'Alcohol-free mouthwash', 'Pascual Laboratories', 'Pascual', 'Mouthwash'),
('Cataflam 50mg', 'Anti-inflammatory', 28.00, 22.50, 80, 10, 10, 'For pain and inflammation', 'Novartis', 'Novartis', 'Diclofenac'),
('Volfenac Gel 20g', 'Anti-inflammatory', 180.00, 150.00, 70, 1, 1, 'Topical pain relief gel', 'Novartis', 'Novartis', 'Diclofenac'),
('Diovan 80mg', 'Cardiovascular', 45.00, 38.00, 60, 10, 10, 'For hypertension', 'Novartis', 'Novartis', 'Valsartan'),
('Tempra Syrup 120ml', 'Analgesic', 110.00, 90.00, 100, 1, 1, 'Paracetamol for kids', 'United Laboratories', 'United Labs', 'Paracetamol'),
('Ambroxol 30mg Tablet', 'Respiratory', 7.50, 5.80, 250, 10, 10, 'Expectorant for cough', 'United Laboratories', 'United Labs', 'Ambroxol'),
('Loperamide 2mg Capsule', 'Digestive', 6.00, 4.50, 180, 10, 10, 'Anti-diarrhea medication', 'United Laboratories', 'United Labs', 'Loperamide'),
('Mefenamic Acid 500mg', 'Analgesic', 4.50, 3.20, 300, 10, 10, 'Generic pain reliever', 'United Laboratories', 'United Labs', 'Mefenamic Acid'),
('Naproxen Sodium 550mg', 'Anti-inflammatory', 15.00, 12.00, 100, 10, 10, 'For arthritis and pain', 'United Laboratories', 'United Labs', 'Naproxen'),
('RiteMed Paracetamol', 'Analgesic', 1.50, 1.00, 1000, 10, 10, 'Affordable generic paracetamol', 'RiteMed', 'RiteMed', 'Paracetamol'),
('RiteMed Ascorbic Acid', 'Supplement', 2.00, 1.50, 1200, 10, 10, 'Affordable Vitamin C', 'RiteMed', 'RiteMed', 'Vitamin C'),
('RiteMed Carbocisteine', 'Respiratory', 5.00, 3.80, 500, 10, 10, 'Affordable cough medicine', 'RiteMed', 'RiteMed', 'Carbocisteine')
ON CONFLICT DO NOTHING;

-- Create a sample supplier
INSERT INTO public.suppliers (name, contact_person, email, phone, address, city, country, payment_terms)
VALUES ('Medical Supplies Inc.', 'John Doe', 'john@medsupplies.com', '+63-123-456-7890', '123 Medical Ave', 'Manila', 'Philippines', 'Net 30')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. PERFORMANCE OPTIMIZATION
-- =====================================================

-- Update table statistics
ANALYZE public.products;
ANALYZE public.sales;
ANALYZE public.sale_items;
ANALYZE public.notifications;
ANALYZE public.stock_movements;

-- =====================================================
-- 10. FINAL VERIFICATION QUERIES
-- =====================================================

-- Verify installation
DO $$
DECLARE
    product_count INTEGER;
    function_count INTEGER;
    view_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count products
    SELECT COUNT(*) INTO product_count FROM public.products;
    
    -- Count custom functions
    SELECT COUNT(*) INTO function_count 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname LIKE 'get_%' OR p.proname LIKE 'search_%' OR p.proname LIKE 'record_%';
    
    -- Count views
    SELECT COUNT(*) INTO view_count 
    FROM pg_views 
    WHERE schemaname = 'public';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '=== MedCure Installation Summary ===';
    RAISE NOTICE 'Products loaded: %', product_count;
    RAISE NOTICE 'Custom functions: %', function_count;
    RAISE NOTICE 'Views created: %', view_count;
    RAISE NOTICE 'Indexes created: %', index_count;
    RAISE NOTICE 'Installation completed successfully!';
END $$;

-- =====================================================
-- END OF MIGRATION SCRIPT
-- =====================================================

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
-- GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
