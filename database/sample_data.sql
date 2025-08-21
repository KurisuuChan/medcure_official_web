-- Comprehensive Sample Data for Dashboard Testing
-- Run this in your Supabase SQL Editor

-- 1. Ensure products table has the right structure and add sample products
INSERT INTO public.products (name, category, stock, total_stock, selling_price, cost_price, is_active, expiry_date, reorder_level)
VALUES 
  ('Paracetamol 500mg', 'Medicines', 100, 100, 15.00, 10.00, true, '2025-12-31', 20),
  ('Vitamin C 1000mg', 'Vitamins', 75, 75, 25.00, 18.00, true, '2025-10-15', 30),
  ('Cough Syrup', 'Medicines', 50, 50, 45.00, 30.00, true, '2025-09-30', 15),
  ('Bandages 10cm', 'Medical Supplies', 200, 200, 8.00, 5.00, true, NULL, 50),
  ('Digital Thermometer', 'Equipment', 25, 25, 150.00, 100.00, true, NULL, 10),
  ('Rubbing Alcohol 70%', 'Antiseptic', 80, 80, 12.00, 8.00, true, '2026-06-30', 25),
  ('Ibuprofen 400mg', 'Medicines', 5, 5, 20.00, 12.00, true, '2025-09-25', 20), -- Low stock
  ('Aspirin 325mg', 'Medicines', 3, 3, 18.00, 10.00, true, '2025-09-20', 15), -- Low stock & expiring
  ('Antacid Tablets', 'Medicines', 0, 0, 22.00, 15.00, true, '2025-11-15', 25), -- Out of stock
  ('Face Masks (Box)', 'PPE', 150, 150, 35.00, 25.00, true, NULL, 40)
ON CONFLICT (name) DO UPDATE SET
  stock = EXCLUDED.stock,
  total_stock = EXCLUDED.total_stock,
  selling_price = EXCLUDED.selling_price,
  cost_price = EXCLUDED.cost_price,
  is_active = EXCLUDED.is_active,
  expiry_date = EXCLUDED.expiry_date,
  reorder_level = EXCLUDED.reorder_level;

-- 2. Add recent sales transactions with proper timestamps
INSERT INTO public.sales (total, payment_method, created_at) 
VALUES 
  -- Today's sales
  (75.00, 'cash', NOW() - INTERVAL '30 minutes'),
  (120.00, 'card', NOW() - INTERVAL '1 hour'),
  (45.00, 'gcash', NOW() - INTERVAL '2 hours'),
  (95.00, 'cash', NOW() - INTERVAL '3 hours'),
  (65.00, 'card', NOW() - INTERVAL '4 hours'),
  
  -- Yesterday's sales
  (85.00, 'cash', NOW() - INTERVAL '1 day' - INTERVAL '2 hours'),
  (110.00, 'card', NOW() - INTERVAL '1 day' - INTERVAL '4 hours'),
  (55.00, 'gcash', NOW() - INTERVAL '1 day' - INTERVAL '6 hours'),
  
  -- This week's sales
  (140.00, 'cash', NOW() - INTERVAL '2 days'),
  (95.00, 'card', NOW() - INTERVAL '3 days'),
  (175.00, 'gcash', NOW() - INTERVAL '4 days'),
  (88.00, 'cash', NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- 3. Add sale items to link products with sales
-- Get the product IDs and recent sale IDs for linking
WITH recent_sales AS (
  SELECT id, total, created_at, ROW_NUMBER() OVER (ORDER BY created_at DESC) as sale_rank
  FROM public.sales 
  ORDER BY created_at DESC 
  LIMIT 12
),
available_products AS (
  SELECT id, name, selling_price, ROW_NUMBER() OVER (ORDER BY name) as product_rank
  FROM public.products
  WHERE is_active = true
  LIMIT 10
)
INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal)
SELECT 
  s.id as sale_id,
  p.id as product_id,
  CASE 
    WHEN s.sale_rank <= 4 THEN (s.sale_rank % 3) + 1  -- 1-3 items for recent sales
    ELSE 1  -- 1 item for older sales
  END as quantity,
  p.selling_price as unit_price,
  CASE 
    WHEN s.sale_rank <= 4 THEN ((s.sale_rank % 3) + 1) * p.selling_price
    ELSE p.selling_price
  END as subtotal
FROM recent_sales s
CROSS JOIN available_products p
WHERE 
  -- Distribute products across sales
  (s.sale_rank - 1) % 10 + 1 = p.product_rank
  OR (s.sale_rank <= 4 AND p.product_rank <= 3)  -- More variety for recent sales
ON CONFLICT DO NOTHING;

-- 4. Verify the data was inserted
SELECT 
  'Summary' as info,
  'Products' as table_name, 
  COUNT(*) as total_count,
  COUNT(CASE WHEN stock <= 10 THEN 1 END) as low_stock_count,
  COUNT(CASE WHEN expiry_date <= NOW() + INTERVAL '30 days' AND expiry_date IS NOT NULL THEN 1 END) as expiring_soon_count
FROM public.products WHERE is_active = true

UNION ALL

SELECT 
  'Summary' as info,
  'Sales' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_count,
  ROUND(COALESCE(SUM(total), 0))::INTEGER as total_revenue
FROM public.sales

UNION ALL

SELECT 
  'Summary' as info,
  'Sale Items' as table_name,
  COUNT(*) as total_count,
  COALESCE(SUM(quantity), 0)::INTEGER as total_quantity,
  COUNT(DISTINCT sale_id) as unique_sales
FROM public.sale_items;

-- 5. Show sample data for verification
SELECT '=== SAMPLE PRODUCTS ===' as section;
SELECT 
  p.id, 
  p.name, 
  p.category, 
  p.stock, 
  p.selling_price,
  CASE 
    WHEN p.stock <= 10 THEN '⚠️ LOW STOCK'
    WHEN p.stock = 0 THEN '❌ OUT OF STOCK'
    ELSE '✅ IN STOCK'
  END as status,
  CASE 
    WHEN p.expiry_date <= NOW() + INTERVAL '30 days' AND p.expiry_date IS NOT NULL 
    THEN '⚠️ EXPIRING SOON'
    ELSE '✅ GOOD'
  END as expiry_status
FROM public.products p
WHERE p.is_active = true
ORDER BY p.stock ASC, p.expiry_date ASC
LIMIT 10;

SELECT '=== SAMPLE SALES ===' as section;
SELECT 
  s.id,
  s.total,
  s.payment_method,
  s.created_at::timestamp::date as sale_date,
  s.created_at::time as sale_time,
  COUNT(si.id) as item_count
FROM public.sales s
LEFT JOIN public.sale_items si ON s.id = si.sale_id
GROUP BY s.id, s.total, s.payment_method, s.created_at
ORDER BY s.created_at DESC
LIMIT 15;

SELECT '=== TODAY\'S SALES SUMMARY ===' as section;
SELECT 
  COUNT(*) as today_transactions,
  COALESCE(SUM(total), 0) as today_revenue,
  COALESCE(AVG(total), 0) as avg_transaction,
  MIN(created_at)::time as first_sale,
  MAX(created_at)::time as last_sale
FROM public.sales 
WHERE created_at >= CURRENT_DATE;
