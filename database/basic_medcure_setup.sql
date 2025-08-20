-- =====================================================
-- MEDCURE BASIC SETUP SCRIPT
-- Minimal setup for quick deployment
-- Version: 2.1.0
-- =====================================================

BEGIN;

-- Core Tables Only
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

CREATE TABLE IF NOT EXISTS public.sales (
    id BIGSERIAL PRIMARY KEY,
    total DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.app_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Essential Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON public.products(is_archived);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);

-- Core Function for Sales
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

-- Settings Functions
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

-- Update Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS and Create Public Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage products" ON public.products FOR ALL USING (true);
CREATE POLICY "Public can manage sales" ON public.sales FOR ALL USING (true);
CREATE POLICY "Public can manage sale_items" ON public.sale_items FOR ALL USING (true);
CREATE POLICY "Public can manage settings" ON public.app_settings FOR ALL USING (true);

-- Grant Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Default Settings
INSERT INTO public.app_settings (setting_key, setting_value, setting_type, description) VALUES
('business_name', 'MedCure Pharmacy', 'text', 'Business name shown in sidebar'),
('business_tagline', 'Your Trusted Healthcare Partner', 'text', 'Business tagline'),
('logo_url', '', 'text', 'Logo URL for sidebar'),
('primary_color', '#2563eb', 'color', 'Primary brand color'),
('app_version', '2.1.0', 'text', 'Application version'),
('currency_symbol', '₱', 'text', 'Currency symbol for pricing')
ON CONFLICT (setting_key) DO NOTHING;

-- Sample Product
INSERT INTO public.products (
    name, category, price, selling_price, cost_price, stock, total_stock, 
    pieces_per_sheet, sheets_per_box, description, manufacturer
) VALUES 
(
    'Paracetamol 500mg', 'Pain Relief', 15.00, 20.00, 12.00, 100, 100,
    10, 10, 'Paracetamol tablets for fever and pain relief', 'Generic Pharma'
)
ON CONFLICT DO NOTHING;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'MEDCURE BASIC SETUP COMPLETED!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Essential features ready:';
    RAISE NOTICE '✓ Product Management';
    RAISE NOTICE '✓ Sales Processing';
    RAISE NOTICE '✓ Settings System';
    RAISE NOTICE '✓ Public Access Enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'Your basic MedCure system is ready!';
    RAISE NOTICE '=================================================';
END $$;
