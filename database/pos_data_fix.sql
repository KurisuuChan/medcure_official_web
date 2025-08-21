-- =====================================================
-- COMPLETE POS DATA FIX SCRIPT
-- Run this to ensure POS gets all required data
-- =====================================================

-- 1. Ensure products table has all required columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS generic_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS critical_level INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS pieces_per_sheet INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS sheets_per_box INTEGER DEFAULT 1;

-- 2. Update existing records with defaults
UPDATE public.products SET is_active = TRUE WHERE is_active IS NULL;
UPDATE public.products SET critical_level = 10 WHERE critical_level IS NULL;
UPDATE public.products SET reorder_level = 10 WHERE reorder_level IS NULL;
UPDATE public.products SET pieces_per_sheet = 1 WHERE pieces_per_sheet IS NULL OR pieces_per_sheet <= 0;
UPDATE public.products SET sheets_per_box = 1 WHERE sheets_per_box IS NULL OR sheets_per_box <= 0;

-- 3. Ensure selling_price is set if missing
UPDATE public.products SET selling_price = price WHERE selling_price IS NULL OR selling_price = 0;

-- 4. Create products_enhanced view for POS
DROP VIEW IF EXISTS public.products_enhanced;
CREATE VIEW public.products_enhanced AS
SELECT 
    p.*,
    CASE 
        WHEN p.stock <= 0 THEN 'Out of Stock'
        WHEN p.stock <= COALESCE(p.reorder_level, 10) THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status,
    p.stock as current_stock,
    p.stock as total_stock,
    CASE 
        WHEN p.expiry_date IS NULL THEN 'No Expiry Data'
        WHEN p.expiry_date <= CURRENT_DATE THEN 'Expired'
        WHEN p.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
        ELSE 'Good'
    END as expiry_status
FROM public.products p
WHERE (p.is_archived = FALSE OR p.is_archived IS NULL)
AND (p.is_active = TRUE OR p.is_active IS NULL);

-- 5. Grant permissions
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.products_enhanced TO anon, authenticated;

-- 6. Add sample products if table is empty (with all required fields)
INSERT INTO public.products (name, category, price, cost_price, selling_price, stock, total_stock, description, is_active, pieces_per_sheet, sheets_per_box)
SELECT 
    'Sample Medicine A', 'Prescription Drugs', 50.00, 30.00, 50.00, 100, 100, 'Sample prescription medication', true, 10, 5
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);

INSERT INTO public.products (name, category, price, cost_price, selling_price, stock, total_stock, description, is_active, pieces_per_sheet, sheets_per_box)
SELECT 
    'Sample Medicine B', 'Over-the-Counter', 25.00, 15.00, 25.00, 50, 50, 'Sample OTC medication', true, 12, 4
WHERE (SELECT COUNT(*) FROM public.products) < 2;

INSERT INTO public.products (name, category, price, cost_price, selling_price, stock, total_stock, description, is_active, pieces_per_sheet, sheets_per_box)
SELECT 
    'Sample Vitamins', 'Supplements', 30.00, 20.00, 30.00, 75, 75, 'Sample vitamin supplement', true, 8, 6
WHERE (SELECT COUNT(*) FROM public.products) < 3;
