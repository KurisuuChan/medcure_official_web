-- =====================================================
-- SIMPLE STOCK FIX - RUN THIS FIRST
-- =====================================================

-- Fix 1: Ensure all products have stock > 0
UPDATE public.products 
SET stock = 100, total_stock = 100 
WHERE stock IS NULL OR stock <= 0;

-- Fix 2: If you have specific products, update them individually
-- Replace 'Cetirizine 10mg Tablets' with your actual product name
UPDATE public.products 
SET stock = 100, total_stock = 100, pieces_per_sheet = 10, sheets_per_box = 10
WHERE name LIKE '%Cetirizine%';

-- Fix 3: Create a guaranteed working test product
DELETE FROM public.products WHERE name = 'Working Test Product';
INSERT INTO public.products (
    name, category, price, selling_price, cost_price,
    stock, total_stock, pieces_per_sheet, sheets_per_box,
    is_active, description
) VALUES (
    'Working Test Product',
    'Test',
    25.00, 25.00, 15.00,
    200, 200, 10, 10,
    true, 'This product should have stock'
);

-- Verify the fix
SELECT name, stock, total_stock, pieces_per_sheet, sheets_per_box 
FROM public.products 
WHERE stock > 0;

-- Check the enhanced view
SELECT name, stock, total_stock, stock_status 
FROM public.products_enhanced 
LIMIT 3;
