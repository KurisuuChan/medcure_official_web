-- Quick Database Data Verification Script
-- Run this in your Supabase SQL Editor to check data

-- 1. Check products count and sample data
SELECT 
  'Products' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN stock > 0 THEN 1 END) as in_stock_count,
  COUNT(CASE WHEN stock <= 0 THEN 1 END) as out_of_stock_count
FROM public.products;

-- Sample products data
SELECT 
  id, 
  name, 
  category, 
  stock, 
  total_stock, 
  selling_price, 
  cost_price
FROM public.products 
LIMIT 5;

-- 2. Check sales count and sample data
SELECT 
  'Sales' as table_name,
  COUNT(*) as total_count,
  COALESCE(SUM(total), 0) as total_revenue,
  COALESCE(AVG(total), 0) as average_sale
FROM public.sales;

-- Sample sales data
SELECT 
  s.id,
  s.total,
  s.payment_method,
  s.created_at,
  COUNT(si.id) as item_count
FROM public.sales s
LEFT JOIN public.sale_items si ON s.id = si.sale_id
GROUP BY s.id, s.total, s.payment_method, s.created_at
ORDER BY s.created_at DESC
LIMIT 5;

-- 3. Check sale_items table
SELECT 
  'Sale Items' as table_name,
  COUNT(*) as total_count,
  COALESCE(SUM(quantity), 0) as total_quantity_sold,
  COALESCE(SUM(subtotal), 0) as total_subtotal
FROM public.sale_items;

-- 4. Check for missing columns (the ones we added in simple_sales_fix.sql)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('sales', 'sale_items') 
  AND table_schema = 'public'
  AND column_name IN ('created_at', 'updated_at')
ORDER BY table_name, column_name;

-- 5. Check products categories for report breakdown
SELECT 
  COALESCE(category, 'Uncategorized') as category,
  COUNT(*) as product_count,
  COALESCE(SUM(stock), 0) as total_stock,
  COALESCE(AVG(selling_price), 0) as avg_price
FROM public.products
GROUP BY category
ORDER BY product_count DESC;
