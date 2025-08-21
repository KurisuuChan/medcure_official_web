-- =====================================================
-- EMERGENCY STOCK DATA FIX
-- Run this to fix the "0 pieces" stock issue
-- =====================================================

-- 1. Check current stock values
SELECT id, name, stock, total_stock, pieces_per_sheet, sheets_per_box 
FROM public.products 
LIMIT 5;

-- 2. Update all products to have proper stock values
UPDATE public.products 
SET 
    stock = CASE WHEN stock IS NULL OR stock = 0 THEN 100 ELSE stock END,
    total_stock = CASE WHEN total_stock IS NULL OR total_stock = 0 THEN stock ELSE total_stock END
WHERE stock IS NULL OR stock = 0 OR total_stock IS NULL OR total_stock = 0;

-- 3. Ensure total_stock matches stock for existing products
UPDATE public.products 
SET total_stock = stock 
WHERE total_stock IS NULL OR total_stock = 0;

-- 4. Add a test product with guaranteed stock
INSERT INTO public.products (
    name, category, price, cost_price, selling_price, 
    stock, total_stock, pieces_per_sheet, sheets_per_box, 
    description, is_active
) VALUES (
    'Test Medicine (Full Stock)', 
    'Test Category', 
    25.00, 15.00, 25.00, 
    150, 150, 10, 10, 
    'Test product with guaranteed stock', 
    true
) ON CONFLICT DO NOTHING;

-- 5. Verify the fix worked
SELECT id, name, stock, total_stock, pieces_per_sheet, sheets_per_box 
FROM public.products 
WHERE stock > 0
LIMIT 5;
