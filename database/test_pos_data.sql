-- Test queries to verify POS data is working
-- Run these individually in Supabase SQL Editor to test

-- 1. Check if products table exists and has data
SELECT COUNT(*) as total_products FROM public.products;

-- 2. Check if products_enhanced view exists and works
SELECT COUNT(*) as enhanced_products FROM public.products_enhanced;

-- 3. Get sample of products data (with quantity modal fields)
SELECT id, name, category, price, selling_price, stock, total_stock, pieces_per_sheet, sheets_per_box, is_active 
FROM public.products 
LIMIT 5;

-- 4. Get sample of enhanced products data (with quantity modal fields)
SELECT id, name, category, price, selling_price, stock, total_stock, pieces_per_sheet, sheets_per_box, stock_status, expiry_status 
FROM public.products_enhanced 
LIMIT 5;

-- 5. Check active products only (what POS should see)
SELECT COUNT(*) as active_products 
FROM public.products 
WHERE is_active = true;

-- If any of these queries fail, you need to run the setup scripts first
