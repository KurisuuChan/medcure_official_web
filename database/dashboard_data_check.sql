-- Quick Database Check for Dashboard Data
-- Run this in Supabase SQL Editor first

-- 1. Check table counts
SELECT 
  'products' as table_name, 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN stock > 0 THEN 1 END) as in_stock,
  COUNT(CASE WHEN stock <= 10 THEN 1 END) as low_stock
FROM public.products
WHERE is_active = true

UNION ALL

SELECT 
  'sales' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_sales,
  ROUND(COALESCE(SUM(total), 0)) as total_revenue
FROM public.sales

UNION ALL

SELECT 
  'sale_items' as table_name,
  COUNT(*) as total_rows,
  COALESCE(SUM(quantity), 0) as total_quantity,
  COUNT(DISTINCT sale_id) as unique_sales
FROM public.sale_items;

-- 2. Sample data for verification
SELECT 'PRODUCTS SAMPLE' as info;
SELECT id, name, category, stock, total_stock, selling_price 
FROM public.products 
WHERE is_active = true 
LIMIT 5;

SELECT 'SALES SAMPLE' as info;
SELECT id, total, payment_method, created_at::date as sale_date
FROM public.sales 
ORDER BY created_at DESC 
LIMIT 5;
